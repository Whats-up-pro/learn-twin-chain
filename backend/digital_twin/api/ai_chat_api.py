"""
AI Chat API backed by the existing RAG pipeline
"""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Optional
from datetime import datetime
import logging

from ..models.user import User
from ..dependencies import get_current_user

# Import RAG system (shared with roadmap)
try:
    from rag.rag import LearnTwinRAGAgent
    RAG_AVAILABLE = True
except ImportError:
    RAG_AVAILABLE = False
    logging.warning("RAG system not available")

router = APIRouter()

_rag_agent: Optional["LearnTwinRAGAgent"] = None

def get_rag_agent() -> Optional["LearnTwinRAGAgent"]:
    global _rag_agent
    if not RAG_AVAILABLE:
        return None
    if _rag_agent is None:
        try:
            _rag_agent = LearnTwinRAGAgent(verbose=1)
        except Exception as e:
            logging.error(f"Failed to initialize RAG agent: {e}")
            return None
    return _rag_agent


class ChatMessage(BaseModel):
    role: str  # 'user' | 'assistant' | 'system'
    content: str


class ChatRequest(BaseModel):
    message: str
    history: Optional[List[ChatMessage]] = []
    context_type: Optional[str] = "chat"
    temperature: Optional[float] = 0.3
    max_tokens: Optional[int] = 1200


class ChatResponse(BaseModel):
    reply: str
    generated_at: str


@router.post("/chat", response_model=ChatResponse)
async def rag_chat(
    request: ChatRequest,
    current_user: User = Depends(get_current_user)
):
    """Chat using the backend RAG pipeline (no external Gemini quota dependency in FE)."""
    agent = get_rag_agent()
    if agent is None:
        raise HTTPException(status_code=503, detail="RAG agent not available on server")

    try:
        # Concatenate history into a lightweight prompt prefix
        history_text = "\n".join([
            f"{m.role.capitalize()}: {m.content}" for m in (request.history or [])[-10:]
        ])
        final_question = request.message if not history_text else f"{history_text}\nUser: {request.message}"

        answer = agent.query(
            question=final_question,
            context_type=request.context_type or "chat",
            max_tokens=request.max_tokens or 1200,
            temperature=request.temperature or 0.3
        )

        # Normalize different return shapes from agent
        answer_text = None
        if isinstance(answer, str):
            answer_text = answer
        elif isinstance(answer, dict):
            # Common shapes: {"answer": "..."} or {"text": "..."}
            answer_text = (
                answer.get("answer")
                or answer.get("text")
                or answer.get("reply")
                or answer.get("message")
            )
            # If it looks like an error payload, surface a clear message
            if not answer_text and (answer.get("error") or answer.get("success") is False):
                raise HTTPException(status_code=502, detail=str(answer.get("error") or "RAG chat failed"))
        if not answer_text:
            answer_text = "I'm sorry, I couldn't generate a response right now. Please try again."

        return ChatResponse(
            reply=answer_text,
            generated_at=datetime.utcnow().isoformat()
        )
    except Exception as e:
        logging.exception("RAG chat failed")
        raise HTTPException(status_code=500, detail=f"RAG chat error: {str(e)}")


