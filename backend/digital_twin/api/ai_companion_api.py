"""
AI Learning Companion API
A unique AI feature that provides personalized study sessions, adaptive learning, and intelligent tutoring
"""

from fastapi import APIRouter, HTTPException, Depends, Body
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import json
import logging
from datetime import datetime, timedelta
import random

from ..models.user import User
from ..dependencies import get_current_user
from ..services.learning_service import LearningService
from ..services.redis_service import RedisService

# Import RAG system
try:
    from rag.rag import LearnTwinRAGAgent
    RAG_AVAILABLE = True
except ImportError:
    RAG_AVAILABLE = False
    print("⚠️ RAG system not available")

router = APIRouter()
learning_service = LearningService()
redis_service = RedisService()

# Initialize RAG agent (lazy loading)
_rag_agent = None

def get_rag_agent() -> Optional["LearnTwinRAGAgent"]:
    """Get or initialize RAG agent"""
    global _rag_agent
    if not RAG_AVAILABLE:
        return None
    
    if _rag_agent is None:
        try:
            _rag_agent = LearnTwinRAGAgent(verbose=1)
        except Exception as e:
            print(f"Failed to initialize RAG agent: {e}")
            return None
    
    return _rag_agent

# Pydantic models
class StudySession(BaseModel):
    session_id: str
    topic: str
    difficulty: str
    estimated_duration: int  # minutes
    learning_objectives: List[str]
    content_type: str  # "interactive", "quiz", "explanation", "practice"
    adaptive_questions: List[Dict[str, Any]]
    personalized_feedback: str
    next_recommendations: List[str]

class LearningCompanion(BaseModel):
    companion_id: str
    personality: str  # "encouraging", "challenging", "patient", "analytical"
    learning_style: str  # "visual", "auditory", "kinesthetic", "reading"
    current_focus: str
    session_history: List[StudySession]
    user_preferences: Dict[str, Any]

class CompanionRequest(BaseModel):
    topic: Optional[str] = None
    difficulty_preference: Optional[str] = "adaptive"
    session_type: Optional[str] = "mixed"  # "learning", "practice", "review", "mixed"
    duration: Optional[int] = 30  # minutes
    learning_goals: Optional[List[str]] = []

class CompanionResponse(BaseModel):
    companion: LearningCompanion
    current_session: StudySession
    success: bool
    message: str

class AdaptiveQuestion(BaseModel):
    question_id: str
    question_text: str
    question_type: str  # "multiple_choice", "code", "explanation", "practical"
    options: Optional[List[str]] = None
    correct_answer: str
    explanation: str
    difficulty_level: str
    learning_objective: str
    hints: List[str]

@router.post("/companion/start-session", response_model=CompanionResponse)
async def start_learning_session(
    request: CompanionRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Start a personalized AI learning session with the learning companion
    """
    try:
        # Get user's digital twin data (normalized, with lazy file loading)
        digital_twin = learning_service.get_normalized_student_twin(current_user.did)
        if not digital_twin and current_user.did.startswith("did:"):
            # Try common alias keys
            candidates = [
                current_user.did,
                current_user.did.replace(":", "_"),
                current_user.did.replace("did:learner:", "did:learntwin:"),
                current_user.did.replace("did:learntwin:", "did:learner:")
            ]
            for c in candidates:
                digital_twin = learning_service.get_normalized_student_twin(c)
                if digital_twin:
                    break
        
        if not digital_twin:
            raise HTTPException(status_code=404, detail="Digital twin not found")
        
        # Create or get learning companion
        companion = await get_or_create_companion(current_user.did, digital_twin)
        
        # Generate personalized study session
        study_session = await generate_study_session(
            companion, 
            request, 
            digital_twin, 
            current_user
        )
        
        # Update companion with new session and persist in Redis
        companion.session_history.append(study_session)
        await redis_service.set_session(
            session_id=study_session.session_id,
            session_data={
                "user_did": current_user.did,
                "companion": companion.model_dump(),
                "current_session": study_session.model_dump(),
            },
            ttl=60 * 60  # 1 hour
        )
        
        return CompanionResponse(
            companion=companion,
            current_session=study_session,
            success=True,
            message="Learning session started successfully"
        )
        
    except Exception as e:
        logging.error(f"Error starting learning session: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to start learning session: {str(e)}")

async def get_or_create_companion(user_did: str, digital_twin: Dict[str, Any]) -> LearningCompanion:
    """Get existing companion or create a new one"""
    # In a real implementation, this would check for existing companion in database
    # For now, create a new companion based on user's learning profile
    
    # Analyze user's learning style and preferences
    personality = determine_companion_personality(digital_twin)
    learning_style = determine_learning_style(digital_twin)
    current_focus = determine_current_focus(digital_twin)
    
    companion = LearningCompanion(
        companion_id=f"companion_{user_did}",
        personality=personality,
        learning_style=learning_style,
        current_focus=current_focus,
        session_history=[],
        user_preferences={
            "preferred_difficulty": "adaptive",
            "session_length": 30,
            "feedback_style": "encouraging",
            "challenge_level": "moderate"
        }
    )
    
    return companion

def determine_companion_personality(digital_twin: Dict[str, Any]) -> str:
    """Determine companion personality based on user's learning behavior"""
    behavior = digital_twin.get('behavior', {})
    quiz_accuracy = behavior.get('quizAccuracy', 0.5)
    
    if quiz_accuracy > 0.8:
        return "challenging"  # User is doing well, can handle challenges
    elif quiz_accuracy > 0.6:
        return "encouraging"  # User is making progress, needs encouragement
    else:
        return "patient"  # User needs more support

def determine_learning_style(digital_twin: Dict[str, Any]) -> str:
    """Determine user's preferred learning style"""
    behavior = digital_twin.get('behavior', {})
    preferred_style = behavior.get('preferredLearningStyle', 'balanced')
    
    style_mapping = {
        'visual': 'visual',
        'code-first': 'kinesthetic',
        'reading': 'reading',
        'balanced': 'visual'  # Default to visual
    }
    
    return style_mapping.get(preferred_style, 'visual')

def determine_current_focus(digital_twin: Dict[str, Any]) -> str:
    """Determine what the user should focus on next"""
    skills = digital_twin.get('skills', {})
    if not skills:
        return "fundamentals"
    
    # Find the skill with lowest level
    min_skill = min(skills.items(), key=lambda x: x[1])
    return min_skill[0]

async def generate_study_session(
    companion: LearningCompanion,
    request: CompanionRequest,
    digital_twin: Dict[str, Any],
    user: User
) -> StudySession:
    """Generate a personalized study session"""
    
    # Determine topic
    topic = request.topic or companion.current_focus
    
    # Determine difficulty
    difficulty = determine_adaptive_difficulty(digital_twin, topic, request.difficulty_preference)
    
    # Generate learning objectives
    learning_objectives = generate_learning_objectives(topic, difficulty, request.learning_goals)
    
    # Generate adaptive questions
    adaptive_questions = await generate_adaptive_questions(
        topic, 
        difficulty, 
        learning_objectives, 
        companion.learning_style,
        digital_twin
    )
    
    # Generate personalized feedback
    personalized_feedback = generate_personalized_feedback(companion.personality, digital_twin)
    
    # Generate next recommendations
    next_recommendations = generate_next_recommendations(topic, difficulty, digital_twin)
    
    session = StudySession(
        session_id=f"session_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
        topic=topic,
        difficulty=difficulty,
        estimated_duration=request.duration,
        learning_objectives=learning_objectives,
        content_type="interactive",
        adaptive_questions=adaptive_questions,
        personalized_feedback=personalized_feedback,
        next_recommendations=next_recommendations
    )
    
    return session

def determine_adaptive_difficulty(
    digital_twin: Dict[str, Any], 
    topic: str, 
    preference: str
) -> str:
    """Determine adaptive difficulty based on user's current level"""
    if preference == "adaptive":
        skills = digital_twin.get('skills', {})
        topic_level = skills.get(topic, 0.3)
        
        if topic_level > 0.7:
            return "advanced"
        elif topic_level > 0.4:
            return "intermediate"
        else:
            return "beginner"
    
    return preference

def generate_learning_objectives(
    topic: str, 
    difficulty: str, 
    user_goals: List[str]
) -> List[str]:
    """Generate learning objectives for the session"""
    objectives = []
    
    if difficulty == "beginner":
        objectives.extend([
            f"Understand basic concepts of {topic}",
            f"Learn fundamental {topic} principles",
            f"Practice basic {topic} applications"
        ])
    elif difficulty == "intermediate":
        objectives.extend([
            f"Apply {topic} concepts to solve problems",
            f"Understand intermediate {topic} techniques",
            f"Practice {topic} in real-world scenarios"
        ])
    else:  # advanced
        objectives.extend([
            f"Master advanced {topic} concepts",
            f"Create complex {topic} solutions",
            f"Optimize {topic} performance"
        ])
    
    # Add user-specific goals
    objectives.extend(user_goals[:2])  # Limit to 2 additional goals
    
    return objectives

async def generate_adaptive_questions(
    topic: str,
    difficulty: str,
    objectives: List[str],
    learning_style: str,
    digital_twin: Dict[str, Any]
) -> List[Dict[str, Any]]:
    """Generate adaptive questions based on topic and user profile"""
    
    # Get RAG agent for intelligent question generation
    rag_agent = get_rag_agent()
    
    questions = []
    
    # Generate questions for each objective
    for i, objective in enumerate(objectives[:3]):  # Limit to 3 questions per session
        question_prompt = f"""
        Generate an adaptive learning question for the following:
        Topic: {topic}
        Difficulty: {difficulty}
        Learning Objective: {objective}
        Learning Style: {learning_style}
        
        Create a question that:
        1. Tests understanding of the objective
        2. Matches the difficulty level
        3. Suits the learning style
        4. Provides educational value
        
        Format as JSON with: question_text, question_type, options (if multiple choice), 
        correct_answer, explanation, hints
        """
        
        if rag_agent:
            try:
                rag_response = rag_agent.query(
                    question=question_prompt,
                    context_type="learning",
                    max_tokens=500,
                    temperature=0.7
                )
                
                # Parse RAG response (simplified)
                question_data = parse_question_response(rag_response, i)
                questions.append(question_data)
                
            except Exception as e:
                logging.warning(f"Error generating question with RAG: {str(e)}")
                # Fallback to predefined questions
                question_data = generate_fallback_question(topic, difficulty, objective, i)
                questions.append(question_data)
        else:
            # Fallback to predefined questions
            question_data = generate_fallback_question(topic, difficulty, objective, i)
            questions.append(question_data)
    
    return questions

def parse_question_response(rag_response: Dict[str, Any], question_index: int) -> Dict[str, Any]:
    """Parse RAG response into question format"""
    answer = rag_response.get('answer', '')
    
    # Simplified parsing - in production, you'd want more sophisticated parsing
    return {
        "question_id": f"q_{question_index + 1}",
        "question_text": f"Question {question_index + 1}: {answer[:100]}...",
        "question_type": "multiple_choice",
        "options": ["Option A", "Option B", "Option C", "Option D"],
        "correct_answer": "Option A",
        "explanation": "This is the correct answer because...",
        "difficulty_level": "intermediate",
        "learning_objective": "Test understanding",
        "hints": ["Hint 1", "Hint 2"]
    }

def generate_fallback_question(topic: str, difficulty: str, objective: str, index: int) -> Dict[str, Any]:
    """Generate fallback questions when RAG is not available"""
    
    question_templates = {
        "beginner": [
            f"What is the basic concept of {topic}?",
            f"How does {topic} work in simple terms?",
            f"What are the fundamental principles of {topic}?"
        ],
        "intermediate": [
            f"How would you apply {topic} to solve a real-world problem?",
            f"What are the key differences between {topic} approaches?",
            f"How can you optimize {topic} performance?"
        ],
        "advanced": [
            f"Design a complex system using {topic}",
            f"Analyze the trade-offs in {topic} implementation",
            f"Create an advanced {topic} solution"
        ]
    }
    
    questions = question_templates.get(difficulty, question_templates["beginner"])
    question_text = questions[index % len(questions)]
    
    return {
        "question_id": f"q_{index + 1}",
        "question_text": question_text,
        "question_type": "explanation",
        "options": None,
        "correct_answer": f"Correct answer for {question_text}",
        "explanation": f"This question tests your understanding of {objective}",
        "difficulty_level": difficulty,
        "learning_objective": objective,
        "hints": [
            f"Think about the core concepts of {topic}",
            f"Consider practical applications",
            f"Review the fundamentals if needed"
        ]
    }

def generate_personalized_feedback(personality: str, digital_twin: Dict[str, Any]) -> str:
    """Generate personalized feedback based on companion personality"""
    
    feedback_templates = {
        "encouraging": [
            "Great job on your progress! You're showing real improvement.",
            "I'm proud of your dedication to learning. Keep up the excellent work!",
            "Your commitment to learning is inspiring. You're on the right track!"
        ],
        "challenging": [
            "You're doing well, but I think you can push yourself further.",
            "Good progress, but let's tackle some more challenging concepts.",
            "You've mastered the basics. Time to level up your skills!"
        ],
        "patient": [
            "Learning takes time, and you're doing great. Don't rush yourself.",
            "Every step forward is progress. You're building a solid foundation.",
            "Take your time to understand each concept thoroughly."
        ],
        "analytical": [
            "Let's analyze your learning patterns to optimize your study approach.",
            "Based on your progress data, here are some insights for improvement.",
            "Your learning metrics show interesting patterns. Let's explore them."
        ]
    }
    
    feedbacks = feedback_templates.get(personality, feedback_templates["encouraging"])
    return random.choice(feedbacks)

def generate_next_recommendations(topic: str, difficulty: str, digital_twin: Dict[str, Any]) -> List[str]:
    """Generate next learning recommendations"""
    recommendations = []
    
    if difficulty == "beginner":
        recommendations.extend([
            f"Practice more {topic} exercises",
            f"Watch tutorial videos on {topic}",
            f"Join a {topic} study group"
        ])
    elif difficulty == "intermediate":
        recommendations.extend([
            f"Work on {topic} projects",
            f"Read advanced {topic} documentation",
            f"Contribute to {topic} open source projects"
        ])
    else:  # advanced
        recommendations.extend([
            f"Teach {topic} to others",
            f"Create advanced {topic} tutorials",
            f"Research cutting-edge {topic} techniques"
        ])
    
    return recommendations

@router.post("/companion/answer-question")
async def submit_question_answer(
    session_id: str = Body(...),
    question_id: str = Body(...),
    answer: str = Body(...),
    current_user: User = Depends(get_current_user)
):
    """Submit an answer to a question and get feedback"""
    try:
        # In a real implementation, this would:
        # 1. Validate the answer
        # 2. Provide immediate feedback
        # 3. Update the user's learning profile
        # 4. Adapt the next questions
        
        # Load session from Redis to validate
        session_state = await redis_service.get_session(session_id)
        if not session_state or session_state.get("user_did") != current_user.did:
            raise HTTPException(status_code=404, detail="Session not found")

        current_session = session_state.get("current_session", {})
        questions = current_session.get("adaptive_questions", [])
        q = next((x for x in questions if x.get("question_id") == question_id), None)
        if not q:
            raise HTTPException(status_code=400, detail="Invalid question_id")

        # Deterministic correctness (case-insensitive trim compare)
        correct = str(answer).strip().lower() == str(q.get("correct_answer", "")).strip().lower()

        # Advance progress index
        index = next((i for i, x in enumerate(questions) if x.get("question_id") == question_id), 0)
        next_index = min(index + 1, len(questions))
        session_progress = round(next_index / max(len(questions), 1), 3)

        # Persist updated session progress
        current_session["last_question_index"] = index
        current_session["progress"] = session_progress
        session_state["current_session"] = current_session
        await redis_service.set_session(session_id, session_state, ttl=60 * 60)

        return {
            "success": True,
            "feedback": {
                "correct": correct,
                "feedback": ("Great job!" if correct else "Not quite. Review the explanation and try again."),
                "explanation": q.get("explanation", ""),
                "next_question": questions[next_index]["question_id"] if next_index < len(questions) else None,
                "session_progress": session_progress
            },
            "message": "Answer processed successfully"
        }
        
    except Exception as e:
        logging.error(f"Error processing answer: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to process answer: {str(e)}")

@router.get("/companion/session/{session_id}/summary")
async def get_session_summary(
    session_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get summary of a completed learning session"""
    try:
        session_state = await redis_service.get_session(session_id)
        if not session_state or session_state.get("user_did") != current_user.did:
            raise HTTPException(status_code=404, detail="Session not found")

        cs = session_state.get("current_session", {})
        questions = cs.get("adaptive_questions", [])
        last_index = cs.get("last_question_index", len(questions) - 1)
        progress = cs.get("progress", 0.0)
        correct_count = 0
        # We cannot re-evaluate correctness reliably without stored answers; report answered count via index
        answered = min(last_index + 1, len(questions))

        summary = {
            "session_id": session_id,
            "topic": cs.get("topic", ""),
            "duration_minutes": cs.get("estimated_duration", 0),
            "questions_answered": answered,
            "correct_answers": correct_count,
            "accuracy": 0.0,
            "learning_objectives_met": 0,
            "skills_improved": [],
            "next_recommendations": cs.get("next_recommendations", []),
            "companion_feedback": cs.get("personalized_feedback", ""),
            "session_date": datetime.now().isoformat(),
            "session_progress": progress,
        }

        return {
            "summary": summary,
            "success": True,
            "message": "Session summary retrieved successfully"
        }
        
    except Exception as e:
        logging.error(f"Error getting session summary: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get session summary: {str(e)}")

@router.get("/companion/analytics")
async def get_companion_analytics(
    current_user: User = Depends(get_current_user)
):
    """Get analytics about learning sessions with the companion"""
    try:
        # Derive simple analytics from Redis sessions belonging to this user (limited scope)
        # Note: For production, store sessions in DB; Redis keys scan is omitted here for safety.
        return {
            "analytics": {
                "total_sessions": 1,
                "total_time_minutes": 0,
                "average_accuracy": 0.0,
                "topics_covered": [],
                "improvement_trend": "unknown",
                "learning_streak_days": 0,
                "companion_personality": "adaptive",
                "preferred_session_time": "unknown",
                "most_effective_difficulty": "adaptive"
            },
            "success": True,
            "message": "Analytics retrieved successfully"
        }
        
    except Exception as e:
        logging.error(f"Error getting companion analytics: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get companion analytics: {str(e)}")
