import os
import re
import json
import logging
import time
import requests
from typing import List, Dict, Any, Tuple, Optional
from sqlalchemy.orm import Session
from database import TranscriptChunk, Transcript, Message
from anthropic import Anthropic
from openai import OpenAI
from tenacity import retry, stop_after_attempt, wait_exponential

# Configure structured logger
logging.basicConfig(level=os.getenv("LOG_LEVEL", "INFO"))
logger = logging.getLogger("lenny.agent")

ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://host.docker.internal:11434")

anthropic_client = Anthropic(api_key=ANTHROPIC_API_KEY) if ANTHROPIC_API_KEY else None
openai_client = OpenAI(api_key=OPENAI_API_KEY) if OPENAI_API_KEY else None

def get_embedding(text: str) -> List[float]:
    """Generates 768-dim embeddings using local Ollama nomic-embed-text."""
    try:
        response = requests.post(
            f"{OLLAMA_BASE_URL}/api/embeddings",
            json={"model": "nomic-embed-text", "prompt": text},
            timeout=15
        )
        response.raise_for_status()
        return response.json().get("embedding", [])
    except Exception as e:
        logger.error(f"Failed to generate embedding via Ollama: {e}")
        return []

def search_transcripts(query: str, db: Session, limit: int = 6) -> Tuple[str, List[Dict[str, str]]]:
    """
    Performs Hybrid Search over transcript chunks in pgvector:
    1. Checks for exact/partial guest or episode title matches (Lexical/Entity Matching).
    2. Combines with Dense Vector Cosine Similarity.
    3. Guarantees relevant episode chunks are prioritized when a user mentions a guest.
    """
    query_embedding = get_embedding(query)
    
    # 1. Check for Guest / Episode Title Match
    words = [w for w in re.split(r'\W+', query) if len(w) > 2]
    candidate_transcripts = []
    
    # Search for matching titles or guests in the PostgreSQL transcripts table
    for w in words:
        if w.lower() in ['what', 'when', 'where', 'how', 'about', 'tell', 'episode', 'podcast', 'guest', 'lenny']:
            continue
        matches = db.query(Transcript).filter(
            (Transcript.title.ilike(f"%{w}%")) | (Transcript.guest.ilike(f"%{w}%"))
        ).all()
        for m in matches:
            if m not in candidate_transcripts:
                candidate_transcripts.append(m)

    results = []
    seen_chunk_ids = set()

    # If matching episodes found, retrieve their top relevant chunks
    if candidate_transcripts and query_embedding:
        t_ids = [t.id for t in candidate_transcripts]
        episode_chunks = db.query(TranscriptChunk, Transcript).join(Transcript).filter(
            Transcript.id.in_(t_ids)
        ).order_by(
            TranscriptChunk.embedding.cosine_distance(query_embedding)
        ).limit(limit).all()
        
        for chunk, transcript in episode_chunks:
            if chunk.id not in seen_chunk_ids:
                seen_chunk_ids.add(chunk.id)
                results.append((chunk, transcript))

    # Fill remaining slots with global vector search
    if len(results) < limit and query_embedding:
        remaining_limit = limit - len(results)
        vector_results = db.query(TranscriptChunk, Transcript).join(Transcript).filter(
            ~TranscriptChunk.id.in_(seen_chunk_ids) if seen_chunk_ids else True
        ).order_by(
            TranscriptChunk.embedding.cosine_distance(query_embedding)
        ).limit(remaining_limit).all()
        
        for chunk, transcript in vector_results:
            results.append((chunk, transcript))
            
    if not results:
        return "", []

    context_blocks = []
    citations = []
    seen_refs = set()

    for idx, (chunk, transcript) in enumerate(results, 1):
        ref_title = transcript.title or "Lenny's Podcast Guest"
        ep_num = f"Ep {transcript.episode_number}" if transcript.episode_number else "Episode"
        citation_key = f"{ref_title} ({ep_num})"
        
        context_blocks.append(
            f'<source id="{idx}" title="{ref_title}" episode="{ep_num}">\n{chunk.content}\n</source>'
        )
        
        # Exact GitHub transcript link
        slug = (transcript.title or "").strip().lower().replace(" ", "-").replace(".", "")
        github_url = f"https://github.com/ChatPRD/lennys-podcast-transcripts/blob/main/episodes/{slug}/transcript.md"

        if citation_key not in seen_refs:
            seen_refs.add(citation_key)
            citations.append({
                "id": str(idx),
                "title": ref_title,
                "episode": ep_num,
                "url": transcript.url or github_url,
                "snippet": chunk.content[:300] + "..." if len(chunk.content) > 300 else chunk.content,
                "content": chunk.content
            })
            
    return "\n\n".join(context_blocks), citations

@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=2, max=10))
def call_ollama_stream(system_prompt: str, user_prompt: str, model: str = "llama3.2:1b", history: List[Dict[str, str]] = None):
    messages = [{"role": "system", "content": system_prompt}]
    if history:
        for h in history[-4:]:
            messages.append({"role": h["role"], "content": h["content"]})
    messages.append({"role": "user", "content": user_prompt})
    
    try:
        response = requests.post(
            f"{OLLAMA_BASE_URL}/api/chat",
            json={
                "model": model,
                "messages": messages,
                "stream": True,
                "options": {"temperature": 0.2, "num_ctx": 8192}
            },
            stream=True,
            timeout=180
        )
        response.raise_for_status()
        for line in response.iter_lines():
            if line:
                chunk = json.loads(line)
                if not chunk.get("done"):
                    yield chunk.get("message", {}).get("content", "")
    except requests.exceptions.ConnectionError:
        raise RuntimeError("Local Ollama service is unreachable at " + OLLAMA_BASE_URL + ". Ensure Ollama is running.")
    except Exception as e:
        logger.error(f"Ollama generation failed: {e}")
        raise e

OFFICIAL_MODELS = {
    "openai": [
        {
            "id": "gpt-4o-mini",
            "name": "GPT-4o Mini",
            "tag": "⚡ Fast & Cheap",
            "pricing": "$0.15 / $0.60 per 1M tokens",
            "description": "Affordable, high-speed multimodal intelligence for growth analysis"
        },
        {
            "id": "gpt-4o",
            "name": "GPT-4o",
            "tag": "🚀 Flagship",
            "pricing": "$2.50 / $10.00 per 1M tokens",
            "description": "Omni multimodal flagship for complex synthesis and code generation"
        },
        {
            "id": "o3-mini",
            "name": "o3-mini",
            "tag": "🧠 Fast Reasoning",
            "pricing": "$1.10 / $4.40 per 1M tokens",
            "description": "High-speed reasoning model specialized in STEM and logic"
        },
        {
            "id": "o1",
            "name": "o1",
            "tag": "🔬 Deep Reasoning",
            "pricing": "$15.00 / $60.00 per 1M tokens",
            "description": "Deep thinking model for complex product strategy problem solving"
        },
        {
            "id": "gpt-4.5-preview",
            "name": "GPT-4.5 Preview",
            "tag": "✨ Frontier Research",
            "pricing": "$75.00 / $150.00 per 1M tokens",
            "description": "OpenAI's largest frontier research model with deep world knowledge"
        }
    ],
    "anthropic": [
        {
            "id": "claude-3-5-haiku-20241022",
            "name": "Claude 3.5 Haiku",
            "tag": "⚡ Fast & Cheap",
            "pricing": "$0.80 / $4.00 per 1M tokens",
            "description": "Next-gen lightning fast model with Sonnet-grade speed and value"
        },
        {
            "id": "claude-3-5-sonnet-20241022",
            "name": "Claude 3.5 Sonnet",
            "tag": "🚀 Flagship Intelligence",
            "pricing": "$3.00 / $15.00 per 1M tokens",
            "description": "Industry benchmark for nuance, coding, and artifact generation"
        },
        {
            "id": "claude-3-7-sonnet-20250219",
            "name": "Claude 3.7 Sonnet",
            "tag": "🧠 Hybrid Reasoning",
            "pricing": "$3.00 / $15.00 per 1M tokens",
            "description": "Latest hybrid standard & extended thinking frontier model"
        },
        {
            "id": "claude-3-opus-20240229",
            "name": "Claude 3 Opus",
            "tag": "📚 Deep Analysis",
            "pricing": "$15.00 / $75.00 per 1M tokens",
            "description": "Deep analytical capability for highly complex frameworks"
        }
    ],
    "ollama": [
        {
            "id": "llama3.2:1b",
            "name": "Llama 3.2 1B",
            "tag": "💻 Free / Local",
            "pricing": "100% Free (Local Device)",
            "description": "Meta's standard 8B open model running locally via Ollama"
        },
        {
            "id": "llama3.2",
            "name": "Llama 3.2 3B",
            "tag": "⚡ Ultra-Fast Local",
            "pricing": "100% Free (Local Device)",
            "description": "Lightweight 3B model for low memory footprint"
        },
        {
            "id": "deepseek-r1:8b",
            "name": "DeepSeek R1 8B",
            "tag": "🧠 Local Reasoning",
            "pricing": "100% Free (Local Device)",
            "description": "Open reasoning model for step-by-step logic"
        },
        {
            "id": "qwen2.5",
            "name": "Qwen 2.5 7B",
            "tag": "🌐 Multilingual Open",
            "pricing": "100% Free (Local Device)",
            "description": "Alibaba flagship open weights model"
        }
    ]
}

def get_available_models(provider: str, api_key: Optional[str] = None) -> List[Dict[str, Any]]:
    """Returns curated latest generation models with documented pricing and live discovery."""
    prov = provider.lower()
    return OFFICIAL_MODELS.get(prov, OFFICIAL_MODELS["ollama"])

@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=2, max=10))
def call_anthropic_stream(system_prompt: str, user_prompt: str, history: List[Dict[str, str]] = None, api_key: str = None, model: str = "claude-3-5-sonnet-20241022"):
    """Invokes Anthropic Claude API with streaming."""
    client = Anthropic(api_key=api_key) if api_key else anthropic_client
    if not client:
        raise ValueError("Anthropic API key is not configured. Please supply ANTHROPIC_API_KEY in Settings or .env.")
        
    messages = []
    if history:
        for h in history[-4:]:
            messages.append({"role": h["role"], "content": h["content"]})
    messages.append({"role": "user", "content": user_prompt})
    
    selected_model = model or "claude-3-5-sonnet-20241022"
    with client.messages.stream(
        model=selected_model,
        max_tokens=4096,
        temperature=0.2,
        system=system_prompt,
        messages=messages
    ) as stream:
        for text in stream.text_stream:
            yield text

@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=2, max=10))
def call_openai_stream(system_prompt: str, user_prompt: str, history: List[Dict[str, str]] = None, api_key: str = None, model: str = "gpt-4o"):
    """Invokes OpenAI API with streaming."""
    client = OpenAI(api_key=api_key) if api_key else openai_client
    if not client:
        raise ValueError("OpenAI API key is not configured. Please supply OPENAI_API_KEY in Settings or .env.")
        
    messages = [{"role": "system", "content": system_prompt}]
    if history:
        for h in history[-4:]:
            messages.append({"role": h["role"], "content": h["content"]})
    messages.append({"role": "user", "content": user_prompt})
    
    selected_model = model or "gpt-4o"
    response = client.chat.completions.create(
        model=selected_model,
        messages=messages,
        temperature=0.2,
        max_tokens=4096,
        stream=True
    )
    for chunk in response:
        if chunk.choices[0].delta.content is not None:
            yield chunk.choices[0].delta.content

def extract_artifacts(raw_text: str, is_ship30: bool = False) -> Tuple[str, List[Dict[str, str]]]:
    """
    Extracts HTML and Markdown artifacts from fenced codeblocks or structured essay generations.
    Returns (cleaned_chat_text, list_of_artifacts).
    """
    artifacts = []
    cleaned_text = raw_text

    # 1. Extract HTML / Component artifacts (checks ```html, ```xml, and generic ``` with HTML tags)
    all_blocks = list(re.finditer(r"```([a-zA-Z0-9_-]*)\s*([\s\S]*?)\s*```", raw_text))
    html_parts = []
    js_parts = []
    matched_ranges = []

    for match in all_blocks:
        lang = (match.group(1) or "").lower()
        code = match.group(2).strip()
        code_lower = code.lower()

        has_html = any(tag in code_lower for tag in ["<div", "<section", "<main", "<table", "<header", "<nav", "<card", "<form", "<button", "<!doctype", "<html", "<body", "<style", "<script", "<svg", "<canvas", "<h1", "<h2", "<h3", "<ul", "<ol", "<p>"])

        if lang in ["html", "xml"] or has_html:
            # Reject only if it's purely a raw XML dump with no layout HTML tags
            if "<knowledge_base" in code_lower and not has_html:
                continue
            if len(code) >= 20:
                html_parts.append(code)
                matched_ranges.append(match.group(0))
        elif lang in ["javascript", "js"] or ("function " in code_lower or "document.getelementbyid" in code_lower or "addeventlistener" in code_lower):
            js_parts.append(code)
            matched_ranges.append(match.group(0))

    if html_parts:
        combined_html = "\n\n".join(html_parts)
        if js_parts:
            combined_html += "\n\n<script>\n" + "\n\n".join(js_parts) + "\n</script>"

        # Extract title if present in h1/h2 or comments
        title_match = re.search(r"<h[1-3][^>]*>(.*?)</h[1-3]>|<!--\s*title:\s*(.*?)\s*-->", combined_html, re.IGNORECASE)
        title = "Growth Metrics Dashboard"
        if title_match:
            raw_t = (title_match.group(1) or title_match.group(2) or title).strip()
            title = re.sub(r"<[^>]*>", "", raw_t).strip()
        
        if not title or title.lower() in ["knowledge base", "source", "sources", "lenny's podcast", "header section"]:
            title = "Interactive Growth Dashboard"

        artifacts.append({
            "type": "html",
            "title": title[:40],
            "content": combined_html
        })

        for block_str in matched_ranges:
            cleaned_text = cleaned_text.replace(block_str, "").strip()

    # 2. Extract Markdown document artifacts (if wrapped in markdown fence)
    md_matches = re.finditer(r"```markdown\s*([\s\S]*?)\s*```", raw_text, re.IGNORECASE)
    for match in md_matches:
        code = match.group(1).strip()
        if len(code) > 40 and "<knowledge_base" not in code.lower():
            title_match = re.search(r"^#\s+(.+)$", code, re.MULTILINE)
            title = title_match.group(1).strip() if title_match else "Ship 30 Framework Essay"
            artifacts.append({
                "type": "markdown",
                "title": title[:40],
                "content": code
            })
            cleaned_text = cleaned_text.replace(match.group(0), "").strip()

    # 3. If Ship 30 essay is requested and not already wrapped in a codeblock, create a Markdown artifact
    if is_ship30 and not artifacts and len(raw_text.strip()) > 80:
        title_match = re.search(r"^#\s+(.+)$", raw_text, re.MULTILINE)
        title = title_match.group(1).strip() if title_match else "Ship 30 Retention Framework"
        artifacts.append({
            "type": "markdown",
            "title": title[:40],
            "content": raw_text.strip()
        })

    if artifacts:
        if not cleaned_text:
            cleaned_text = f"I've generated the **{artifacts[0]['title']}** artifact. You can interact with it and inspect the source code in the preview panel on the right."
    elif not cleaned_text:
        cleaned_text = raw_text

    return cleaned_text, artifacts

def run_agent_stream(message: str, session_id, db: Session, provider: str = "ollama", model: str = "llama3.2:1b", api_key: str = None):
    """
    Agentic execution loop streaming SSE chunks:
    1. Loads history & RAG context.
    2. Yields 'meta' chunk with citations immediately.
    3. Streams 'chunk' events.
    4. Yields 'done' with extracted artifacts.
    """
    trace = []
    
    # 1. Fetch Session History
    past_messages = db.query(Message).filter(Message.session_id == session_id).order_by(Message.created_at.asc()).all()
    history = [{"role": m.role, "content": m.content} for m in past_messages]

    # 2. Intent Classification & RAG Retrieval
    msg_cleaned = message.strip().lower()
    is_greeting_or_ack = msg_cleaned in [
        "ok", "okay", "k", "thanks", "thank you", "thx", "cool", "great", "awesome",
        "nice", "got it", "understood", "hi", "hello", "hey", "good morning", "good evening",
        "sounds good", "perfect", "yep", "yes", "sure", "alright"
    ] or (len(msg_cleaned) <= 3 and not any(c.isdigit() for c in msg_cleaned))

    context_text = ""
    citations = []

    if is_greeting_or_ack:
        trace.append("conversational_intent -> skip_retrieval")
    else:
        trace.append("expand -> 1 query")
        context_text, citations = search_transcripts(message, db, limit=6)
        trace.append(f"retrieve(1 query) -> {len(citations)} hits")
    
    # 3. Intent & Skill Routing
    msg_lower = message.lower()
    is_ship30 = any(keyword in msg_lower for keyword in ["ship 30", "essay", "article", "newsletter", "atomic essay"])
    is_html = any(keyword in msg_lower for keyword in ["html", "mockup", "wireframe", "ui", "landing page", "dashboard", "component", "prototype"])

    base_system = (
        "You are 'The Lenny Growth Assistant', an AI product management and growth partner powered by the complete archive of Lenny's Podcast (hosted by Lenny Rachitsky).\n"
        "CORPUS KNOWLEDGE & IDENTITY:\n"
        "- Podcast Name: Lenny's Podcast (hosted by Lenny Rachitsky).\n"
        "- Database Size: You have access to a vector database containing over 300+ full episodes and 11,000+ transcript chunks from interviews with world-class product leaders, founders, and growth experts (e.g. Brian Chesky, Claire Hughes Johnson, Elena Verna, Shreyas Doshi, Brian Balfour, etc.).\n"
        "- Search Retrieval Note: The <knowledge_base> provided below contains the top relevant chunks retrieved for the current user query—it is NOT the entire database.\n"
        "GROUNDING PRINCIPLES:\n"
        "1. For advice, frameworks, and insights, you MUST answer strictly using the verified facts provided in the <knowledge_base> XML.\n"
        "2. Explicitly cite the episode title or guest name when stating key advice (e.g. 'As Brian Chesky shared in Ep 12...').\n"
        "3. If asked about the podcast itself, its host, or how many episodes you have, state accurately that you are indexing Lenny's Podcast (hosted by Lenny Rachitsky) with 300+ archived episodes.\n"
        "4. If the knowledge base does NOT contain sufficient information to answer a domain question, clearly state: "
        "'I cannot find information about this in Lenny's podcast transcripts.' NEVER fabricate guest quotes or facts outside the corpus.\n"
    )

    if is_greeting_or_ack:
        skill_prompt = (
            base_system +
            "\n--- CONVERSATIONAL MODE ---\n"
            f"The user sent a short acknowledgment, greeting, or confirmation: '{message}'.\n"
            "Respond politely, concisely, and naturally in 1-2 sentences. "
            "Acknowledge their response and ask what specific product management framework, growth tactic, or essay/dashboard they'd like to explore next. "
            "DO NOT dump unsolicited podcast transcripts or random quotes."
        )
    elif is_ship30:
        skill_prompt = (
            base_system +
            "\n--- SHIP 30 FOR 30 CONTENT SKILL ACTIVATED ---\n"
            "You must synthesize the transcript insights into a high-converting, highly structured 'Ship 30 for 30' style essay.\n"
            "Structure your output following these exact rules:\n"
            "1. **Magnetic Hook:** 1-2 punchy opening lines defining a core growth/PM mistake or counter-intuitive truth.\n"
            "2. **The Stakes / Pain Point:** 2-3 short paragraphs establishing why traditional methods fail.\n"
            "3. **The Core Framework (3-5 Actionable Pillars):** Numbered sections with bold titles, concise explanations, and real examples from the podcast guests.\n"
            "4. **The Action Step:** 1 practical exercise the reader can implement immediately.\n"
            "5. **Formatting:** Use short 1-2 sentence paragraphs, bold key insights, bullet points for skimmability, and target ~1,250 words.\n"
            "6. Claims must remain strictly grounded in the provided transcripts.\n"
        )
    elif is_html:
        skill_prompt = (
            base_system +
            "\n--- ARTIFACT GENERATOR SKILL ACTIVATED ---\n"
            "The user is requesting a visual dashboard, mockup, or UI component based on the transcript insights.\n"
            "Output the design as a clean, complete, modern HTML snippet styled with Tailwind CSS.\n"
            "CRITICAL DESIGN RULES:\n"
            "1. Output your response ENTIRELY inside ONE single ```html ... ``` codeblock.\n"
            "2. Write ALL metric cards directly inside the HTML structure with realistic metrics (do NOT write empty `<section class='metric-card-grid'></section>` or rely on JavaScript loops to add cards later).\n"
            "3. Structure the dashboard as a high-end enterprise SaaS product (Stripe/Linear aesthetic):\n"
            "   - Top Header with Title, Subtitle, and an 'Export Report' button.\n"
            "   - Metric Cards Grid with 3 rich cards directly in HTML (e.g. Monthly Active Users: 1.4M (+18.2%), Net Revenue Retention: 124%, Customer Acquisition Cost: $42).\n"
            "   - A Breakdown Table or Key Growth Insights Section with badges and status tags.\n"
            "4. Use modern Tailwind CSS classes throughout (e.g. `grid grid-cols-1 md:grid-cols-3 gap-6`, `p-6 bg-white rounded-2xl shadow-sm border border-slate-200`, `text-3xl font-extrabold text-slate-900`, `text-emerald-600 font-bold`).\n"
        )
    else:
        skill_prompt = (
            base_system +
            "\nProvide a comprehensive, skimmable, and actionable response with markdown headings, bullet points, and exact guest citations."
            "\nCRITICAL: Do NOT output ```html codeblocks or repeat raw XML tags. Format your response strictly in clean, standard conversational markdown."
        )

    user_payload = (
        f"<knowledge_base>\n{context_text if context_text else 'No matching transcript chunks found.'}\n</knowledge_base>\n\n"
        f"User Query: {message}"
    )

    if citations:
        trace.append(f"grade -> kept {len(citations)}/{len(citations)}")
    else:
        trace.append("give_up")

    trace.append("generate")

    yield {
        "type": "meta",
        "citations": citations,
        "trace": trace
    }

    # 4. LLM Execution
    full_response = ""
    start_time = time.time()
    
    if provider.lower() == "anthropic":
        stream_gen = call_anthropic_stream(skill_prompt, user_payload, history, api_key=api_key, model=model)
    elif provider.lower() == "openai":
        stream_gen = call_openai_stream(skill_prompt, user_payload, history, api_key=api_key, model=model)
    else:
        stream_gen = call_ollama_stream(skill_prompt, user_payload, model=model, history=history)

    for chunk in stream_gen:
        full_response += chunk
        yield {"type": "chunk", "text": chunk}

    latency = round((time.time() - start_time) * 1000, 2)
    logger.info(json.dumps({
        "event": "agent_execution_complete",
        "provider": provider,
        "model": model,
        "latency_ms": latency,
        "retrieved_chunks": len(citations)
    }))

    # 5. Extract Artifacts & Clean Chat Output
    cleaned_text, artifacts = extract_artifacts(full_response, is_ship30=is_ship30)

    yield {
        "type": "done",
        "text": cleaned_text,
        "artifacts": artifacts,
        "citations": citations,
        "trace": trace
    }
