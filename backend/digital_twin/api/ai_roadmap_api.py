"""
AI Roadmap Recommendation API
Provides intelligent learning roadmaps based on user program and digital twin data
"""

from fastapi import APIRouter, HTTPException, Depends, Body
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import json
import logging
from datetime import datetime

from ..models.user import User
from ..dependencies import get_current_user
from ..services.learning_service import LearningService
from ..services.course_service import CourseService
from ..models.course import Course
from ..models.digital_twin import DigitalTwin

# Import RAG system
try:
    from rag.rag import LearnTwinRAGAgent
    RAG_AVAILABLE = True
except ImportError:
    RAG_AVAILABLE = False
    print("⚠️ RAG system not available")

router = APIRouter()
learning_service = LearningService()
course_service = CourseService()

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
class RoadmapCheckpoint(BaseModel):
    id: str
    title: str
    completed: bool = False

class RoadmapStep(BaseModel):
    id: str
    title: str
    description: str
    type: str  # "skill", "course", "technology", "certification"
    difficulty: str  # "beginner", "intermediate", "advanced"
    estimated_hours: int
    prerequisites: List[str]
    resources: List[Dict[str, str]]
    is_available: bool
    course_id: Optional[str] = None
    status: str = "pending"  # "pending", "in_progress", "completed"
    checkpoints: List[RoadmapCheckpoint] = []

class LearningRoadmap(BaseModel):
    roadmap_id: str
    program: str
    total_steps: int
    estimated_total_hours: int
    difficulty_progression: List[str]
    steps: List[RoadmapStep]
    generated_at: str
    personalized_for: str

class RoadmapRequest(BaseModel):
    program: Optional[str] = None
    current_level: Optional[str] = "beginner"
    focus_areas: Optional[List[str]] = []
    time_commitment: Optional[str] = "moderate"  # "light", "moderate", "intensive"

class RoadmapResponse(BaseModel):
    roadmap: LearningRoadmap
    success: bool
    message: str

@router.post("/roadmap/generate", response_model=RoadmapResponse)
async def generate_learning_roadmap(
    request: RoadmapRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Generate a personalized learning roadmap based on user's program and digital twin data
    """
    try:
        # Get user's program from profile or request
        user_program = request.program or current_user.program or "Computer Science"
        
        # Get user's digital twin data
        digital_twin = learning_service.get_student_twin(current_user.did)
        
        # Get RAG agent
        rag_agent = get_rag_agent()
        
        # Generate roadmap using RAG (strict JSON output)
        schema_block = (
            '{\n'
            '  "program": string,\n'
            '  "difficulty_progression": ["beginner"|"intermediate"|"advanced", ...],\n'
            '  "steps": [\n'
            '    {\n'
            '      "id": string,\n'
            '      "title": string,\n'
            '      "description": string,\n'
            '      "type": "skill"|"course"|"technology"|"certification",\n'
            '      "difficulty": "beginner"|"intermediate"|"advanced",\n'
            '      "estimated_hours": number,\n'
            '      "prerequisites": [string, ...],\n'
            '      "resources": [{"type": string, "title": string, "url": string}],\n'
            '      "is_available": boolean,\n'
            '      "course_id": string|null,\n'
            '      "status": "pending"|"in_progress"|"completed",\n'
            '      "checkpoints": [{"id": string, "title": string, "completed": boolean}]\n'
            '    }\n'
            '  ]\n'
            '}'
        )

        roadmap_prompt = (
            f"""
        Generate a comprehensive learning roadmap for a student studying {user_program}.
        
        Student Context:
        - Program: {user_program}
        - Current Level: {request.current_level}
        - Focus Areas: {', '.join(request.focus_areas) if request.focus_areas else 'General'}
        - Time Commitment: {request.time_commitment}
        
        Digital Twin Data:
        - Completed Modules: {digital_twin.get('completed_modules', []) if digital_twin else []}
        - Current Skills: {digital_twin.get('skills', {}) if digital_twin else {}}
        - Learning Progress: {digital_twin.get('learning_progress', []) if digital_twin else []}
        
        IMPORTANT: Return STRICT JSON only. No markdown, no commentary. It must be valid for json.loads.
        Exact schema:
        """
            + schema_block
        )
        
        if rag_agent:
            rag_response = rag_agent.query(
                question=roadmap_prompt,
                context_type="learning",
                max_tokens=3000,
                temperature=0.3
            )
            
            # Parse RAG response and create roadmap
            roadmap_data = parse_rag_roadmap_response(rag_response, user_program, current_user.did)
        else:
            # Fallback to predefined roadmap
            roadmap_data = generate_fallback_roadmap(user_program, current_user.did)
        
        # Enhance with available courses
        roadmap_data = await enhance_roadmap_with_courses(roadmap_data, current_user.did)
        
        return RoadmapResponse(
            roadmap=roadmap_data,
            success=True,
            message=f"Roadmap generated successfully for {user_program}"
        )
        
    except Exception as e:
        logging.error(f"Error generating roadmap: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to generate roadmap: {str(e)}")

def parse_rag_roadmap_response(rag_response: Dict[str, Any], program: str, user_did: str) -> LearningRoadmap:
    """Parse RAG response into structured roadmap. Expects strict JSON in answer."""
    try:
        # Accept multiple shapes from agent: str, dict with 'answer' or 'text'
        if isinstance(rag_response, str):
            raw = rag_response.strip()
        elif isinstance(rag_response, dict):
            raw = (rag_response.get("answer") or rag_response.get("text") or "").strip()
        else:
            raw = ""

        # Best-effort extraction of JSON from possible LLM wrappers
        raw = extract_json_string(raw)

        data = json.loads(raw)

        steps: List[RoadmapStep] = []
        for idx, s in enumerate(data.get("steps", []), start=1):
            cps_raw = s.get("checkpoints", [])
            checkpoints: List[RoadmapCheckpoint] = []
            if isinstance(cps_raw, list) and cps_raw:
                for j, cp in enumerate(cps_raw, start=1):
                    checkpoints.append(RoadmapCheckpoint(
                        id=str(cp.get("id") or f"cp_{idx}_{j}"),
                        title=str(cp.get("title") or f"Checkpoint {j}"),
                        completed=bool(cp.get("completed", False))
                    ))
            else:
                # Auto-generate 3 checkpoints if none provided
                for j in range(1, 4):
                    checkpoints.append(RoadmapCheckpoint(
                        id=f"cp_{idx}_{j}",
                        title=f"Milestone {j} for {s.get('title', f'Step {idx}')}",
                        completed=False
                    ))
            steps.append(
                RoadmapStep(
                    id=s.get("id") or f"step_{idx}",
                    title=s["title"],
                    description=s.get("description", ""),
                    type=s.get("type", "skill"),
                    difficulty=s.get("difficulty", "intermediate"),
                    estimated_hours=int(s.get("estimated_hours", 20)),
                    prerequisites=list(s.get("prerequisites", [])),
                    resources=list(s.get("resources", [])),
                    is_available=bool(s.get("is_available", False)),
                    course_id=s.get("course_id"),
                    status=s.get("status", "pending"),
                    checkpoints=checkpoints,
                )
            )

        if not steps:
            return generate_fallback_roadmap(program, user_did)

        roadmap_id = f"rm_{program.lower().replace(' ', '_')}_{user_did.split(':')[-1]}"
        return LearningRoadmap(
            roadmap_id=roadmap_id,
            program=data.get("program", program),
            total_steps=len(steps),
            estimated_total_hours=sum(step.estimated_hours for step in steps),
            difficulty_progression=data.get("difficulty_progression", ["beginner", "intermediate", "advanced"]),
            steps=steps,
            generated_at=datetime.now().isoformat(),
            personalized_for=user_did,
        )
    except Exception as e:
        logging.error(f"Error parsing RAG response as JSON: {e}")
        return generate_fallback_roadmap(program, user_did)

def extract_json_string(text: str) -> str:
    """Best-effort extraction of a top-level JSON object from LLM output."""
    if not text:
        return text
    t = text.strip()
    # Strip code fences if present
    if t.startswith("```"):
        # remove leading/trailing fences
        t = t.strip('`')
        # drop optional language tag on first line
        first_newline = t.find("\n")
        if first_newline != -1:
            first_line = t[:first_newline].strip().lower()
            if first_line in ("json", "javascript", "ts", "python"):
                t = t[first_newline+1:]
    # If string is valid JSON already
    try:
        json.loads(t)
        return t
    except Exception:
        pass
    # Attempt bracket matching to find the first complete JSON object
    start = t.find('{')
    if start == -1:
        return t
    depth = 0
    for i in range(start, len(t)):
        if t[i] == '{':
            depth += 1
        elif t[i] == '}':
            depth -= 1
            if depth == 0:
                candidate = t[start:i+1]
                try:
                    json.loads(candidate)
                    return candidate
                except Exception:
                    break
    # As last resort return original (caller will fallback)
    return t

def create_default_roadmap_steps(program: str) -> List[RoadmapStep]:
    """Create default roadmap steps based on program"""
    program_roadmaps = {
        "Computer Science": [
            RoadmapStep(
                id="cs_1",
                title="Programming Fundamentals",
                description="Learn basic programming concepts with Python",
                type="skill",
                difficulty="beginner",
                estimated_hours=40,
                prerequisites=[],
                resources=[
                    {"type": "course", "title": "Python Basics", "url": "#"},
                    {"type": "book", "title": "Python Crash Course", "url": "#"}
                ],
                is_available=True,
                checkpoints=[
                    RoadmapCheckpoint(id="cp_cs1_1", title="Variables & Types"),
                    RoadmapCheckpoint(id="cp_cs1_2", title="Control Flow"),
                    RoadmapCheckpoint(id="cp_cs1_3", title="Functions & Modules"),
                ]
            ),
            RoadmapStep(
                id="cs_2",
                title="Data Structures & Algorithms",
                description="Master fundamental data structures and algorithms",
                type="skill",
                difficulty="intermediate",
                estimated_hours=60,
                prerequisites=["cs_1"],
                resources=[
                    {"type": "course", "title": "DSA Masterclass", "url": "#"},
                    {"type": "platform", "title": "LeetCode", "url": "#"}
                ],
                is_available=True,
                checkpoints=[
                    RoadmapCheckpoint(id="cp_cs2_1", title="Arrays & Linked Lists"),
                    RoadmapCheckpoint(id="cp_cs2_2", title="Trees & Graphs"),
                    RoadmapCheckpoint(id="cp_cs2_3", title="Sorting & Searching"),
                ]
            ),
            RoadmapStep(
                id="cs_3",
                title="Web Development",
                description="Build full-stack web applications",
                type="skill",
                difficulty="intermediate",
                estimated_hours=80,
                prerequisites=["cs_1"],
                resources=[
                    {"type": "course", "title": "Full Stack Development", "url": "#"},
                    {"type": "framework", "title": "React & Node.js", "url": "#"}
                ],
                is_available=True,
                checkpoints=[
                    RoadmapCheckpoint(id="cp_cs3_1", title="Frontend Basics"),
                    RoadmapCheckpoint(id="cp_cs3_2", title="Backend APIs"),
                    RoadmapCheckpoint(id="cp_cs3_3", title="Deployment"),
                ]
            )
        ] + [
            # Extend roadmap with additional steps to make it longer
            RoadmapStep(
                id="cs_4",
                title="Databases & ORMs",
                description="Learn SQL/NoSQL and ORM usage",
                type="skill",
                difficulty="intermediate",
                estimated_hours=40,
                prerequisites=["cs_1"],
                resources=[],
                is_available=False,
                checkpoints=[
                    RoadmapCheckpoint(id="cp_cs4_1", title="Relational Modeling"),
                    RoadmapCheckpoint(id="cp_cs4_2", title="Joins & Transactions"),
                    RoadmapCheckpoint(id="cp_cs4_3", title="ORM Basics"),
                ]
            ),
            RoadmapStep(
                id="cs_5",
                title="Cloud & DevOps Basics",
                description="Containerization and CI/CD fundamentals",
                type="technology",
                difficulty="intermediate",
                estimated_hours=50,
                prerequisites=["cs_3"],
                resources=[],
                is_available=False,
                checkpoints=[
                    RoadmapCheckpoint(id="cp_cs5_1", title="Docker Fundamentals"),
                    RoadmapCheckpoint(id="cp_cs5_2", title="CI/CD Pipelines"),
                    RoadmapCheckpoint(id="cp_cs5_3", title="Basic Cloud Deployments"),
                ]
            ),
        ],
        "Cyber Security": [
            RoadmapStep(
                id="cyber_1",
                title="Network Security Fundamentals",
                description="Understand network protocols and security principles",
                type="skill",
                difficulty="beginner",
                estimated_hours=30,
                prerequisites=[],
                resources=[
                    {"type": "course", "title": "Network Security Basics", "url": "#"},
                    {"type": "certification", "title": "CompTIA Security+", "url": "#"}
                ],
                is_available=True,
                checkpoints=[
                    RoadmapCheckpoint(id="cp_cy1_1", title="OSI & TCP/IP"),
                    RoadmapCheckpoint(id="cp_cy1_2", title="Firewalls & ACLs"),
                    RoadmapCheckpoint(id="cp_cy1_3", title="VPN & Tunneling"),
                ]
            ),
            RoadmapStep(
                id="cyber_2",
                title="Ethical Hacking",
                description="Learn penetration testing and vulnerability assessment",
                type="skill",
                difficulty="intermediate",
                estimated_hours=50,
                prerequisites=["cyber_1"],
                resources=[
                    {"type": "course", "title": "Ethical Hacking Course", "url": "#"},
                    {"type": "platform", "title": "TryHackMe", "url": "#"}
                ],
                is_available=True,
                checkpoints=[
                    RoadmapCheckpoint(id="cp_cy2_1", title="Recon & Scanning"),
                    RoadmapCheckpoint(id="cp_cy2_2", title="Exploitation"),
                    RoadmapCheckpoint(id="cp_cy2_3", title="Reporting"),
                ]
            ),
            RoadmapStep(
                id="cyber_3",
                title="Security Operations",
                description="Master SIEM, incident response, and threat hunting",
                type="skill",
                difficulty="advanced",
                estimated_hours=70,
                prerequisites=["cyber_1", "cyber_2"],
                resources=[
                    {"type": "course", "title": "SOC Analyst Training", "url": "#"},
                    {"type": "certification", "title": "CISSP", "url": "#"}
                ],
                is_available=True,
                checkpoints=[
                    RoadmapCheckpoint(id="cp_cy3_1", title="SIEM Basics"),
                    RoadmapCheckpoint(id="cp_cy3_2", title="IR Playbooks"),
                    RoadmapCheckpoint(id="cp_cy3_3", title="Threat Hunting"),
                ]
            )
        ]
    }
    
    steps = program_roadmaps.get(program, program_roadmaps["Computer Science"])
    # Ensure at least 6 steps
    if len(steps) < 6:
        extra_needed = 6 - len(steps)
        for i in range(extra_needed):
            steps.append(RoadmapStep(
                id=f"{program.lower().split()[0]}_extra_{i+1}",
                title="Capstone Project",
                description="Build a capstone project to consolidate knowledge",
                type="course",
                difficulty="advanced",
                estimated_hours=60,
                prerequisites=[steps[-1].id] if steps else [],
                resources=[],
                is_available=False,
                checkpoints=[
                    RoadmapCheckpoint(id=f"cp_extra_{i+1}_1", title="Plan & Design"),
                    RoadmapCheckpoint(id=f"cp_extra_{i+1}_2", title="Implement MVP"),
                    RoadmapCheckpoint(id=f"cp_extra_{i+1}_3", title="Polish & Deploy"),
                ]
            ))
    return steps

def generate_fallback_roadmap(program: str, user_did: str) -> LearningRoadmap:
    """Generate a fallback roadmap when RAG is not available"""
    steps = create_default_roadmap_steps(program)
    
    roadmap_id = f"rm_{program.lower().replace(' ', '_')}_{user_did.split(':')[-1]}"
    return LearningRoadmap(
        roadmap_id=roadmap_id,
        program=program,
        total_steps=len(steps),
        estimated_total_hours=sum(step.estimated_hours for step in steps),
        difficulty_progression=["beginner", "intermediate", "advanced"],
        steps=steps,
        generated_at=datetime.now().isoformat(),
        personalized_for=user_did
    )

async def enhance_roadmap_with_courses(roadmap: LearningRoadmap, user_did: str) -> LearningRoadmap:
    """Enhance roadmap with available courses from the platform by querying real Course docs."""
    try:
        for step in roadmap.steps:
            # Only try to map courses for relevant steps
            if step.type in {"course", "skill", "technology"}:
                query_terms = [step.title] + step.prerequisites
                matched_course: Optional[Course] = None

                for term in query_terms:
                    term = term.strip()
                    if not term:
                        continue
                    try:
                        # Find by title contains (case-insensitive) or metadata tags
                        candidates = await Course.find(
                            (Course.title.regex(term, ignore_case=True)) |
                            (Course.description.regex(term, ignore_case=True)) |
                            (Course.metadata.tags.any(term))
                        ).limit(1).to_list()

                        if candidates:
                            matched_course = candidates[0]
                            break
                    except Exception as qe:
                        logging.debug(f"Course query failed for term '{term}': {qe}")

                if matched_course:
                    step.course_id = matched_course.course_id
                    step.is_available = matched_course.is_public and matched_course.status in {"published", "review"}
                    # Ensure a resource link exists
                    step.resources = step.resources or []
                    step.resources.append({
                        "type": "course",
                        "title": matched_course.title,
                        "url": f"/course/{matched_course.course_id}"
                    })
                else:
                    # No match found – mark as not available but keep resources
                    step.is_available = False
                    step.resources = step.resources or []
                    if not any(r.get("type") == "note" for r in step.resources):
                        step.resources.append({
                            "type": "note",
                            "title": "Course available soon (AI-generated recommendation)",
                            "url": ""
                        })
        return roadmap
    except Exception as e:
        logging.error(f"Error enhancing roadmap with courses: {str(e)}")
        return roadmap

@router.get("/roadmap/{roadmap_id}/progress")
async def get_roadmap_progress(
    roadmap_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get progress derived from Digital Twin skills vs step difficulty thresholds."""
    try:
        # Load user's digital twin
        twin_doc = await DigitalTwin.find_one(DigitalTwin.owner_did == current_user.did)
        skills: Dict[str, float] = {}
        if twin_doc and hasattr(twin_doc, "profile"):
            # Profile may not contain skills; aggregate from learning_progress if needed
            skills = (twin_doc.profile or {}).get("skills", {})

        # Difficulty thresholds
        thresholds = {"beginner": 0.33, "intermediate": 0.66, "advanced": 0.85}

        # We cannot reconstruct the exact roadmap by id without storage.
        # Progress is estimated: count skills meeting difficulty labels in their names.
        # If no skills are present, progress is zero.
        total_steps = max(len(skills), 1)
        completed_steps = 0
        for _, level in skills.items():
            if level >= thresholds["advanced"]:
                completed_steps += 1
            elif level >= thresholds["intermediate"]:
                completed_steps += 1
            elif level >= thresholds["beginner"]:
                completed_steps += 1

        progress_percentage = round((completed_steps / total_steps) * 100, 2) if total_steps else 0.0

        return {
            "roadmap_id": roadmap_id,
            "user_did": current_user.did,
            "completed_steps": completed_steps,
            "total_steps": total_steps,
            "progress_percentage": progress_percentage,
            "last_updated": datetime.now().isoformat()
        }
    except Exception as e:
        logging.error(f"Error getting roadmap progress: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get roadmap progress: {str(e)}")

@router.post("/roadmap/{roadmap_id}/step/{step_id}/complete")
async def mark_roadmap_step_complete(
    roadmap_id: str,
    step_id: str,
    current_user: User = Depends(get_current_user)
):
    """Mark a roadmap step as completed"""
    try:
        # Update user's digital twin with completed step
        # This would integrate with your digital twin update system
        
        return {
            "success": True,
            "message": f"Step {step_id} marked as completed",
            "roadmap_id": roadmap_id,
            "step_id": step_id,
            "completed_at": datetime.now().isoformat()
        }
        
    except Exception as e:
        logging.error(f"Error marking step complete: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to mark step complete: {str(e)}")
