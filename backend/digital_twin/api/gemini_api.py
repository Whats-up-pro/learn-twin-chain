from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
import logging
import asyncio
import uuid

# Configure logging with a clear format
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger(__name__)

router = APIRouter()

class ChatRequest(BaseModel):
    message: str
    context: Optional[str] = None

class ChatResponse(BaseModel):
    response: str

class SessionRequest(BaseModel):
    digitalTwin: Optional[dict] = None
    context: Optional[str] = None

class SessionResponse(BaseModel):
    sessionId: str

async def _generate_mock_response(message: str) -> str:
    """
    Generate a mock response (placeholder) instead of calling Google GenAI.
    Split into a separate function for easy future replacement.
    """
    base_response = (
        f"I understand you're asking about: '{message}'. "
        "As an AI tutor, I'm here to help you learn Python! "
        "Here's a helpful response about your question."
    )
    if "python" in message.lower():
        base_response += "\n\n```python\n# Example Python code\nprint('Hello, Python learner!')\n```"
    return base_response

@router.post("/chat", response_model=ChatResponse)
async def chat_with_gemini(request: ChatRequest):
    """
    Chat endpoint for Gemini AI (mock response for now).
    """
    try:
        logger.debug(f"Received chat request: {request.dict()}")
        # Use timeout to prevent hanging if processing takes too long
        try:
            async with asyncio.timeout(5):  # 5-second timeout
                response_text = await _generate_mock_response(request.message)
        except asyncio.TimeoutError:
            logger.warning("Chat processing timed out.")
            raise HTTPException(status_code=504, detail="Chat processing timed out.")

        logger.info(f"Chat request processed: {request.message[:50]}...")
        return ChatResponse(response=response_text)

    except HTTPException:
        raise
    except Exception:
        logger.exception("Unexpected error in chat endpoint.")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.post("/start-session", response_model=SessionResponse)
async def start_chat_session(request: SessionRequest):
    """
    Start a new chat session with Gemini AI (mock implementation).
    """
    try:
        logger.debug(f"Start session request: {request.dict()}")
        # Use uuid4 for session IDs to avoid collisions
        session_id = f"session-{uuid.uuid4().hex[:12]}"

        logger.info(f"Started new chat session: {session_id}")
        return SessionResponse(sessionId=session_id)

    except Exception:
        logger.exception("Unexpected error when starting session.")
        raise HTTPException(status_code=500, detail="Internal server error")
