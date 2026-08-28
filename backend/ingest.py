import os
import glob
import re
from database import SessionLocal, Transcript, TranscriptChunk, init_db
from sqlalchemy.orm import Session
import requests

OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://host.docker.internal:11434")

def chunk_text(text, max_words=500, overlap=100):
    words = text.split()
    chunks = []
    i = 0
    while i < len(words):
        chunk = " ".join(words[i:i + max_words])
        if chunk:
            chunks.append(chunk)
        i += max_words - overlap
    return chunks

def get_embedding_ollama(text):
    try:
        # We use nomic-embed-text for local embeddings. Must be pulled via `ollama pull nomic-embed-text`.
        response = requests.post(
            f"{OLLAMA_BASE_URL}/api/embeddings",
            json={"model": "nomic-embed-text", "prompt": text},
            timeout=10
        )
        response.raise_for_status()
        return response.json().get("embedding")
    except Exception as e:
        print(f"Failed to get embedding from Ollama: {e}")
        return None

def process_transcripts():
    init_db()
    db = SessionLocal()
    
    # Check multiple possible paths
    possible_paths = [
        "/app/ingestion/transcripts/episodes",
        "../ingestion/transcripts/episodes",
        "./ingestion/transcripts/episodes"
    ]
    
    transcript_dir = None
    for path in possible_paths:
        if os.path.exists(path):
            transcript_dir = path
            break
            
    if not transcript_dir:
        print("Transcript directory not found. Please ensure the submodule is cloned.")
        return

    print(f"Reading transcripts from {transcript_dir}...")
    files = glob.glob(os.path.join(transcript_dir, "**/*.md"), recursive=True)
    
    if not files:
        print("No markdown files found in transcript directory.")
        return

    for file_path in files:
        basename = os.path.basename(file_path)
        parent_dir = os.path.basename(os.path.dirname(file_path))
        if basename.lower() == "transcript.md" and parent_dir:
            title = parent_dir.replace("-", " ").title()
        else:
            title = basename.replace(".md", "").replace("-", " ").title()
            
        episode_number = None
        match = re.search(r"ep(\d+)", file_path.lower())
        if match:
            episode_number = match.group(1)
            
        with open(file_path, "r", encoding="utf-8") as f:
            content = f.read()
            
        existing = db.query(Transcript).filter(Transcript.title == title).first()
        if existing:
            print(f"Skipping {title}, already exists.")
            continue
            
        transcript = Transcript(
            episode_number=episode_number,
            title=title,
            guest="Unknown" # Can be extracted with LLM or more regex, but simple for now
        )
        db.add(transcript)
        db.commit()
        db.refresh(transcript)
        
        chunks = chunk_text(content)
        print(f"Created {len(chunks)} chunks for {title}.")
        
        for chunk in chunks:
            # Getting embeddings sequentially (slow, but fine for demo)
            embedding = get_embedding_ollama(chunk)
            if embedding:
                tc = TranscriptChunk(
                    transcript_id=transcript.id,
                    content=chunk,
                    embedding=embedding
                )
                db.add(tc)
            else:
                print("Failed to embed chunk, skipping.")
        
        db.commit()
        print(f"Finished {title}")

    print("Ingestion complete.")

if __name__ == "__main__":
    process_transcripts()
