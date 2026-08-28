import os
import uuid
import threading
import logging
import time
from typing import List, Optional, Any
import json
from fastapi import FastAPI, Depends, HTTPException, status, Request
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session as DbSession
from sqlalchemy import text
from database import SessionLocal, init_db, Session, Message, Artifact, Transcript, TranscriptChunk
import agent
import ingest

logger = logging.getLogger("lenny.api")

app = FastAPI(
    title="The Lenny Growth Assistant API",
    description="Production-ready FastAPI backend for Lenny's Podcast Conversational Assistant with pgvector RAG, Ship 30 Skills, and Artifact generation.",
    version="2.0.0"
)

CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    logger.info(f"{request.method} {request.url.path} - {response.status_code} - {process_time:.4f}s")
    response.headers["X-Process-Time"] = str(process_time)
    return response

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.on_event("startup")
def startup_event():
    init_db()

# --- Health & Observability Endpoints ---

@app.get("/health", tags=["Observability"])
def health_check():
    """Basic service health check."""
    return {"status": "ok", "service": "lenny-growth-assistant", "version": "2.0.0"}

@app.get("/health/db", tags=["Observability"])
def db_health_check(db: DbSession = Depends(get_db)):
    """Validates PostgreSQL and pgvector connectivity and returns corpus statistics."""
    try:
        transcript_count = db.query(Transcript).count()
        chunk_count = db.query(TranscriptChunk).count()
        session_count = db.query(Session).count()
        return {
            "status": "healthy",
            "database": "postgresql+pgvector",
            "corpus": {
                "transcripts": transcript_count,
                "vector_chunks": chunk_count,
                "sessions": session_count
            }
        }
    except Exception as e:
        logger.error(f"Database health check failed: {e}")
        raise HTTPException(status_code=503, detail=f"Database unhealthy: {str(e)}")

@app.get("/health/llm", tags=["Observability"])
def llm_health_check():
    """Inspects local Ollama and Cloud Anthropic availability."""
    ollama_status = "unavailable"
    ollama_models = []
    
    try:
        import requests
        res = requests.get(f"{agent.OLLAMA_BASE_URL}/api/tags", timeout=3)
        if res.ok:
            ollama_status = "connected"
            ollama_models = [m["name"] for m in res.json().get("models", [])]
    except Exception:
        pass

    return {
        "local_provider": {
            "provider": "ollama",
            "status": ollama_status,
            "models": ollama_models,
            "base_url": agent.OLLAMA_BASE_URL
        },
        "cloud_providers": [
            {
                "provider": "anthropic",
                "configured": bool(agent.ANTHROPIC_API_KEY),
                "model": "claude-3-5-sonnet-20240620"
            },
            {
                "provider": "openai",
                "configured": bool(agent.OPENAI_API_KEY),
                "model": "gpt-4o"
            }
        ]
    }

class ModelsRequest(BaseModel):
    provider: str = Field(..., description="Provider: 'ollama', 'anthropic', or 'openai'")
    api_key: Optional[str] = Field(None, description="Optional dynamic API key")

@app.post("/models", tags=["Observability"])
def list_models(req: ModelsRequest):
    """Dynamically queries and returns available models for the given provider."""
    models = agent.get_available_models(req.provider, req.api_key)
    return {"provider": req.provider, "models": models}

# --- Request / Response Models ---

class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, description="User question or prompt")
    provider: str = Field("ollama", description="LLM provider: 'ollama', 'anthropic', or 'openai'")
    model: str = Field("llama3.2:1b", description="Model name for the selected provider")
    api_key: Optional[str] = Field(None, description="Optional dynamic API key for cloud providers")

class ArtifactOut(BaseModel):
    type: str
    title: str
    content: str

class ChatResponse(BaseModel):
    id: str
    message: str
    citations: List[Any] = Field(default_factory=list, description="Retrieved transcript sources and snippets")
    artifacts: List[ArtifactOut]
    trace: List[str] = Field(default_factory=list, description="RAG execution trace visualization")

class SessionCreate(BaseModel):
    title: Optional[str] = "New Chat"

class SessionUpdate(BaseModel):
    title: str

# --- Session Management Endpoints ---

@app.post("/sessions", tags=["Sessions"])
def create_session(payload: SessionCreate = SessionCreate(), db: DbSession = Depends(get_db)):
    """Creates a new independent conversation session."""
    db_session = Session(title=payload.title)
    db.add(db_session)
    db.commit()
    db.refresh(db_session)
    return {"id": db_session.id, "title": db_session.title, "created_at": db_session.created_at}

@app.get("/sessions", tags=["Sessions"])
def list_sessions(db: DbSession = Depends(get_db)):
    """Lists all conversation sessions ordered by most recent."""
    sessions = db.query(Session).order_by(Session.created_at.desc()).all()
    return [
        {
            "id": s.id,
            "title": s.title,
            "created_at": s.created_at,
            "message_count": len(s.messages)
        } 
        for s in sessions
    ]

@app.delete("/sessions/{session_id}", tags=["Sessions"])
def delete_session(session_id: uuid.UUID, db: DbSession = Depends(get_db)):
    """Deletes a conversation session and all its associated messages and artifacts."""
    s = db.query(Session).filter(Session.id == session_id).first()
    if not s:
        raise HTTPException(status_code=404, detail="Session not found")
    db.delete(s)
    db.commit()
    return {"status": "deleted", "id": session_id}

@app.patch("/sessions/{session_id}", tags=["Sessions"])
def rename_session(session_id: uuid.UUID, payload: SessionUpdate, db: DbSession = Depends(get_db)):
    """Renames an existing session."""
    s = db.query(Session).filter(Session.id == session_id).first()
    if not s:
        raise HTTPException(status_code=404, detail="Session not found")
    s.title = payload.title
    db.commit()
    return {"status": "updated", "id": session_id, "title": s.title}

@app.get("/sessions/{session_id}/messages", tags=["Messages"])
def get_messages(session_id: uuid.UUID, db: DbSession = Depends(get_db)):
    """Retrieves full conversation history for a session with embedded artifacts."""
    messages = db.query(Message).filter(Message.session_id == session_id).order_by(Message.created_at.asc()).all()
    result = []
    for m in messages:
        artifacts = [{"type": a.type, "content": a.content, "title": a.title} for a in m.artifacts]
        result.append({
            "id": str(m.id),
            "role": m.role,
            "content": m.content,
            "artifacts": artifacts
        })
from sqlalchemy import text, func
from datetime import datetime

class ArtifactUpdate(BaseModel):
    title: str

@app.get("/artifacts", tags=["Artifacts"])
def list_artifacts(
    session_id: Optional[uuid.UUID] = None, 
    type: Optional[str] = None, 
    search: Optional[str] = None, 
    db: DbSession = Depends(get_db)
):
    """
    Lists all saved artifacts across conversations with rich metadata,
    originating session info, word/character counts, and filenames.
    """
    query = db.query(Artifact).join(Message, Artifact.message_id == Message.id).join(Session, Message.session_id == Session.id)
    
    if session_id:
        query = query.filter(Message.session_id == session_id)
    if type and type.lower() != "all":
        query = query.filter(Artifact.type == type.lower())
    if search:
        search_fmt = f"%{search.strip().lower()}%"
        query = query.filter(
            (func.lower(Artifact.title).like(search_fmt)) | 
            (func.lower(Artifact.content).like(search_fmt)) |
            (func.lower(Session.title).like(search_fmt))
        )
        
    artifacts = query.order_by(Artifact.created_at.desc()).all()
    
    result = []
    for a in artifacts:
        msg = a.message
        sess = msg.session if msg else None
        ext = "html" if a.type == "html" else ("md" if a.type == "markdown" else (a.type or "txt"))
        clean_title = (a.title or "Artifact").strip()
        filename = f"{clean_title.lower().replace(' ', '_').replace('/', '_')}.{ext}"
        
        # Calculate summary description
        content_preview = (a.content or "")[:200].replace('\n', ' ').strip()
        
        result.append({
            "id": str(a.id),
            "message_id": str(a.message_id),
            "session_id": str(sess.id) if sess else None,
            "session_title": sess.title if sess else "Untitled Chat",
            "type": a.type,
            "title": clean_title,
            "filename": filename,
            "char_count": len(a.content) if a.content else 0,
            "word_count": len(a.content.split()) if a.content else 0,
            "description": content_preview,
            "created_at": a.created_at.isoformat() if a.created_at else datetime.utcnow().isoformat()
        })
    return result

@app.get("/artifacts/{artifact_id}", tags=["Artifacts"])
def get_artifact(artifact_id: uuid.UUID, db: DbSession = Depends(get_db)):
    """Retrieves full artifact content and metadata by ID."""
    a = db.query(Artifact).filter(Artifact.id == artifact_id).first()
    if not a:
        raise HTTPException(status_code=404, detail="Artifact not found")
    msg = a.message
    sess = msg.session if msg else None
    ext = "html" if a.type == "html" else ("md" if a.type == "markdown" else (a.type or "txt"))
    filename = f"{(a.title or 'artifact').lower().replace(' ', '_')}.{ext}"
    return {
        "id": str(a.id),
        "message_id": str(a.message_id),
        "session_id": str(sess.id) if sess else None,
        "session_title": sess.title if sess else "Untitled Chat",
        "type": a.type,
        "title": a.title,
        "filename": filename,
        "content": a.content,
        "char_count": len(a.content) if a.content else 0,
        "word_count": len(a.content.split()) if a.content else 0,
        "created_at": a.created_at.isoformat() if a.created_at else datetime.utcnow().isoformat()
    }

@app.patch("/artifacts/{artifact_id}", tags=["Artifacts"])
def rename_artifact(artifact_id: uuid.UUID, payload: ArtifactUpdate, db: DbSession = Depends(get_db)):
    """Renames an artifact title."""
    a = db.query(Artifact).filter(Artifact.id == artifact_id).first()
    if not a:
        raise HTTPException(status_code=404, detail="Artifact not found")
    a.title = payload.title
    db.commit()
    return {"status": "updated", "id": str(a.id), "title": a.title}

@app.delete("/artifacts/{artifact_id}", tags=["Artifacts"])
def delete_artifact(artifact_id: uuid.UUID, db: DbSession = Depends(get_db)):
    """Deletes an artifact by ID."""
    a = db.query(Artifact).filter(Artifact.id == artifact_id).first()
    if not a:
        raise HTTPException(status_code=404, detail="Artifact not found")
    db.delete(a)
    db.commit()
    return {"status": "deleted", "id": str(artifact_id)}

# --- Conversational RAG & Chat Endpoint ---

@app.post("/sessions/{session_id}/chat", tags=["Chat"])
def chat(session_id: uuid.UUID, req: ChatRequest, db: DbSession = Depends(get_db)):
    """
    Core conversational endpoint (Streaming).
    Performs retrieval over Lenny's podcast corpus, streams the agentic response,
    persists history, and extracts renderable artifacts.
    """
    def event_stream():
        try:
            # 1. DB Session setup
            db_session = db.query(Session).filter(Session.id == session_id).first()
            if not db_session:
                db_session = Session(id=session_id, title=req.message[:35] + ("..." if len(req.message) > 35 else ""))
                db.add(db_session)
                db.commit()
                db.refresh(db_session)
            elif db_session.title == "New Chat":
                db_session.title = req.message[:35] + ("..." if len(req.message) > 35 else "")
                db.commit()

            # 2. Save User Message
            user_msg = Message(session_id=session_id, role="user", content=req.message)
            db.add(user_msg)
            db.commit()

            final_data = None
            
            # 3. Stream Generator
            for chunk_data in agent.run_agent_stream(
                message=req.message,
                session_id=str(session_id),
                db=db,
                provider=req.provider,
                model=req.model,
                api_key=req.api_key
            ):
                yield f"data: {json.dumps(chunk_data)}\n\n"
                if chunk_data["type"] == "done":
                    final_data = chunk_data
                    
            # 4. Save Assistant Message & Artifacts when done
            if final_data:
                asst_msg = Message(session_id=session_id, role="assistant", content=final_data["text"])
                db.add(asst_msg)
                db.commit()
                db.refresh(asst_msg)
                
                if final_data.get("artifacts"):
                    for a in final_data["artifacts"]:
                        art = Artifact(
                            message_id=asst_msg.id,
                            type=a["type"],
                            title=a.get("title", "Artifact"),
                            content=a["content"]
                        )
                        db.add(art)
                    db.commit()

        except ValueError as ve:
            yield f"data: {json.dumps({'type': 'error', 'error': str(ve)})}\n\n"
        except RuntimeError as re:
            yield f"data: {json.dumps({'type': 'error', 'error': str(re)})}\n\n"
        except Exception as e:
            logger.error(f"Agent execution error: {e}", exc_info=True)
            yield f"data: {json.dumps({'type': 'error', 'error': f'Assistant error: {str(e)}'})}\n\n"

    return StreamingResponse(event_stream(), media_type="text/event-stream")

# --- Transcript Ingestion Trigger ---

@app.post("/ingestion/sync", tags=["Ingestion"])
def trigger_ingestion():
    """Triggers transcript ingestion in the background."""
    thread = threading.Thread(target=ingest.process_transcripts)
    thread.daemon = True
    thread.start()
    return {"status": "started", "message": "Transcript ingestion triggered in background thread"}
