import os
import uuid
from datetime import datetime
from sqlalchemy import Column, String, Text, Integer, DateTime, ForeignKey, create_engine
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import declarative_base, relationship, sessionmaker
from pgvector.sqlalchemy import Vector
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/lennyapp")
if DATABASE_URL.startswith("postgresql://"):
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+psycopg://", 1)

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

class Session(Base):
    __tablename__ = "sessions"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String, default="New Chat")
    created_at = Column(DateTime, default=datetime.utcnow)

    messages = relationship("Message", back_populates="session", cascade="all, delete-orphan")

class Message(Base):
    __tablename__ = "messages"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_id = Column(UUID(as_uuid=True), ForeignKey("sessions.id"))
    role = Column(String)  # 'user' or 'assistant'
    content = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)

    session = relationship("Session", back_populates="messages")
    artifacts = relationship("Artifact", back_populates="message", cascade="all, delete-orphan")

class Artifact(Base):
    __tablename__ = "artifacts"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    message_id = Column(UUID(as_uuid=True), ForeignKey("messages.id"))
    type = Column(String) # 'html' or 'markdown'
    title = Column(String)
    content = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)

    message = relationship("Message", back_populates="artifacts")

class Transcript(Base):
    __tablename__ = "transcripts"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    episode_number = Column(String)
    title = Column(String)
    guest = Column(String, nullable=True)
    url = Column(String, nullable=True)

    chunks = relationship("TranscriptChunk", back_populates="transcript", cascade="all, delete-orphan")

class TranscriptChunk(Base):
    __tablename__ = "transcript_chunks"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    transcript_id = Column(UUID(as_uuid=True), ForeignKey("transcripts.id"))
    content = Column(Text)
    # Using nomic-embed-text for local demo which outputs 768 dimensions. 
    # Can be adjusted to 1536 for OpenAI if needed, but 768 is safer for local requirements.
    embedding = Column(Vector(768))

    transcript = relationship("Transcript", back_populates="chunks")

def init_db():
    with engine.connect() as conn:
        from sqlalchemy import text
        conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector;"))
        conn.commit()
    Base.metadata.create_all(bind=engine)

