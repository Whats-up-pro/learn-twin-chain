import os
import json
from fastapi import APIRouter, HTTPException, Body
from pydantic import BaseModel
from typing import Optional, Dict, Any
import google.generativeai as genai
from digital_twin.utils.logger import Logger

logger = Logger("gemini_api")

# Initialize Gemini API
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GEMINI_MODEL_NAME = "gemini-2.0-flash-exp"

if not GEMINI_API_KEY:
    logger.warning("GEMINI_API_KEY not found in environment variables")
    genai.configure(api_key="dummy_key")  # Will fail gracefully
else:
    genai.configure(api_key=GEMINI_API_KEY)

router = APIRouter()

# In-memory storage for chat sessions (in production, use Redis or database)
chat_sessions = {}

class ChatMessage(BaseModel):
    message: str
    context: Optional[str] = None

class SessionRequest(BaseModel):
    digitalTwin: Optional[Dict[str, Any]] = None
    context: Optional[str] = None

class ChatRequest(BaseModel):
    message: str
    context: Optional[str] = None

def get_system_instruction(digital_twin: Optional[Dict[str, Any]] = None) -> str:
    """Generate system instruction based on digital twin data"""
    instruction = f"""You are {GEMINI_MODEL_NAME}, a friendly and helpful AI Tutor for a student learning Python.
Be encouraging and clear in your explanations.
The student is currently working on Python programming.
Always respond in Markdown format.
If you provide code examples, use Python and wrap them in markdown code blocks.
If asked about topics outside of Python learning, politely steer the conversation back."""

    if digital_twin:
        # Add digital twin context
        if "knowledge" in digital_twin:
            instruction += "\n\nThe student's current progress is as follows:"
            for topic, progress in digital_twin["knowledge"].items():
                if progress > 0:
                    instruction += f"\n- {topic}: {(progress * 100):.0f}% understood."
        
        if "behavior" in digital_twin:
            behavior = digital_twin["behavior"]
            if behavior.get("mostAskedTopics"):
                topics = ", ".join(behavior["mostAskedTopics"])
                instruction += f"\nThey have recently asked about: {topics}."
            
            if behavior.get("preferredLearningStyle"):
                style = behavior["preferredLearningStyle"]
                instruction += f"\nTheir preferred learning style seems to be: {style}. Tailor explanations accordingly if possible."

    return instruction

@router.post("/gemini/start-session")
async def start_chat_session(request: SessionRequest):
    """Start a new chat session with Gemini"""
    try:
        session_id = f"session-{len(chat_sessions) + 1}-{int(os.urandom(4).hex(), 16)}"
        
        # Initialize chat model
        if not GEMINI_API_KEY:
            raise HTTPException(status_code=500, detail="Gemini API key not configured")
        
        # Create system instruction
        system_instruction = get_system_instruction(request.digitalTwin)
        
        # Create model with system instruction
        generation_config = genai.types.GenerationConfig(
            temperature=0.7,
            top_p=0.8,
            top_k=40,
            max_output_tokens=2048,
        )
        
        model = genai.GenerativeModel(
            model_name=GEMINI_MODEL_NAME,
            generation_config=generation_config,
            system_instruction=system_instruction
        )
        
        # Initialize chat
        chat = model.start_chat()
        
        # Store session
        chat_sessions[session_id] = {
            "chat": chat,
            "digital_twin": request.digitalTwin,
            "context": request.context
        }
        
        logger.info(f"Started new chat session: {session_id}")
        
        return {
            "sessionId": session_id,
            "message": "Chat session started successfully"
        }
        
    except Exception as e:
        logger.error(f"Error starting chat session: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to start chat session: {str(e)}")

@router.post("/gemini/chat")
async def send_message(request: ChatRequest):
    """Send a message to Gemini and get response"""
    try:
        if not GEMINI_API_KEY:
            raise HTTPException(status_code=500, detail="Gemini API key not configured")
        
        # For simplicity, we'll create a new chat for each message
        # In a production system, you'd want to maintain session state
        system_instruction = get_system_instruction()
        
        # Create model with system instruction
        generation_config = genai.types.GenerationConfig(
            temperature=0.7,
            top_p=0.8,
            top_k=40,
            max_output_tokens=2048,
        )
        
        model = genai.GenerativeModel(
            model_name=GEMINI_MODEL_NAME,
            generation_config=generation_config,
            system_instruction=system_instruction
        )
        
        # Initialize chat
        chat = model.start_chat()
        
        # Send user message
        response = chat.send_message(request.message)
        
        # Extract response text
        response_text = response.text if response.text else "Sorry, I couldn't generate a response."
        
        logger.info(f"Generated response for message: {request.message[:50]}...")
        
        return {
            "response": response_text,
            "message": "Message processed successfully"
        }
        
    except Exception as e:
        logger.error(f"Error in chat endpoint: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to process message: {str(e)}")

@router.post("/gemini/chat-with-session")
async def send_message_with_session(session_id: str, request: ChatRequest):
    """Send a message to an existing chat session"""
    try:
        if session_id not in chat_sessions:
            raise HTTPException(status_code=404, detail="Session not found")
        
        session = chat_sessions[session_id]
        chat = session["chat"]
        
        # Send message to existing chat
        response = chat.send_message(request.message)
        
        # Extract response text
        response_text = response.text if response.text else "Sorry, I couldn't generate a response."
        
        logger.info(f"Generated response for session {session_id}: {request.message[:50]}...")
        
        return {
            "response": response_text,
            "sessionId": session_id,
            "message": "Message processed successfully"
        }
        
    except Exception as e:
        logger.error(f"Error in chat with session endpoint: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to process message: {str(e)}")

@router.delete("/gemini/session/{session_id}")
async def end_session(session_id: str):
    """End a chat session"""
    try:
        if session_id in chat_sessions:
            del chat_sessions[session_id]
            logger.info(f"Ended chat session: {session_id}")
            return {"message": "Session ended successfully"}
        else:
            raise HTTPException(status_code=404, detail="Session not found")
            
    except Exception as e:
        logger.error(f"Error ending session: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to end session: {str(e)}")

@router.get("/gemini/health")
async def gemini_health():
    """Check if Gemini API is available"""
    try:
        if not GEMINI_API_KEY:
            return {
                "status": "unavailable",
                "message": "Gemini API key not configured"
            }
        
        # Test with a simple request
        model = genai.GenerativeModel(GEMINI_MODEL_NAME)
        response = model.generate_content("Hello")
        
        return {
            "status": "healthy",
            "message": "Gemini API is working",
            "model": GEMINI_MODEL_NAME
        }
        
    except Exception as e:
        logger.error(f"Gemini health check failed: {str(e)}")
        return {
            "status": "unhealthy",
            "message": f"Gemini API error: {str(e)}"
        } 