import pytest
import uuid
import sys
import os

# Add backend to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../backend')))

from database import SessionLocal, init_db, Session, Message, Artifact, Transcript, TranscriptChunk

@pytest.fixture(scope="module")
def db():
    init_db()
    db_session = SessionLocal()
    yield db_session
    db_session.close()

def test_session_lifecycle(db):
    """Test creating, reading, and deleting a session."""
    session = Session(title="Test Session")
    db.add(session)
    db.commit()
    db.refresh(session)
    
    assert session.id is not None
    assert session.title == "Test Session"
    
    # Add message
    msg = Message(session_id=session.id, role="user", content="Hello Lenny AI")
    db.add(msg)
    db.commit()
    db.refresh(msg)
    
    assert msg.id is not None
    assert msg.session_id == session.id
    
    # Add artifact
    art = Artifact(message_id=msg.id, type="html", title="Test Artifact", content="<div>Test</div>")
    db.add(art)
    db.commit()
    db.refresh(art)
    
    assert art.id is not None
    assert art.message_id == msg.id
    
    # Cascade delete
    db.delete(session)
    db.commit()
    
    deleted_msg = db.query(Message).filter(Message.id == msg.id).first()
    assert deleted_msg is None

def test_transcript_schema(db):
    """Verify transcript and chunk relationships."""
    tr = Transcript(title="Brian Chesky", episode_number="12", guest="Brian Chesky")
    db.add(tr)
    db.commit()
    db.refresh(tr)
    
    chunk = TranscriptChunk(transcript_id=tr.id, content="Do things that don't scale")
    db.add(chunk)
    db.commit()
    db.refresh(chunk)
    
    assert chunk.transcript.title == "Brian Chesky"
    
    # Clean up
    db.delete(tr)
    db.commit()
