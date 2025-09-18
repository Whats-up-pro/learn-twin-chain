"""
AI Digital Twin Analysis API
Provides intelligent analysis of user's digital twin data with insights and recommendations
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import json
import logging
from datetime import datetime, timedelta
import statistics

from ..models.user import User
from ..dependencies import get_current_user
from ..services.learning_service import LearningService
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
class SkillAnalysis(BaseModel):
    skill_name: str
    current_level: float  # 0-1
    improvement_rate: float  # Rate of improvement over time
    strength_areas: List[str]
    improvement_areas: List[str]
    recommended_actions: List[str]

class LearningPattern(BaseModel):
    pattern_type: str  # "consistent", "burst", "sporadic", "declining"
    description: str
    frequency: str  # "daily", "weekly", "monthly"
    peak_hours: List[int]  # Hours of day when most active
    preferred_difficulty: str
    completion_rate: float

class ProgressInsight(BaseModel):
    insight_type: str  # "achievement", "warning", "recommendation", "trend"
    title: str
    description: str
    impact: str  # "high", "medium", "low"
    actionable: bool
    suggested_actions: List[str]

class DigitalTwinAnalysis(BaseModel):
    user_did: str
    analysis_date: str
    overall_progress: float  # 0-1
    skill_analyses: List[SkillAnalysis]
    learning_patterns: List[LearningPattern]
    insights: List[ProgressInsight]
    recommendations: List[str]
    future_predictions: Dict[str, Any]
    comparison_with_peers: Dict[str, Any]

class AnalysisResponse(BaseModel):
    analysis: DigitalTwinAnalysis
    success: bool
    message: str

@router.get("/analysis/comprehensive", response_model=AnalysisResponse)
async def get_comprehensive_analysis(
    current_user: User = Depends(get_current_user)
):
    """
    Get comprehensive AI analysis of user's digital twin data
    """
    try:
        # Get user's digital twin data; accept both DID and twin_id patterns
        did = current_user.did
        # Use normalized accessor
        digital_twin = learning_service.get_normalized_student_twin(did)
        if not digital_twin and did.startswith("did:"):
            # Try common alias keys
            candidates = [
                did,
                did.replace(":", "_"),
                did.replace("did:learner:", "did:learntwin:"),
                did.replace("did:learntwin:", "did:learner:")
            ]
            for c in candidates:
                digital_twin = learning_service.get_normalized_student_twin(c)
                if digital_twin:
                    break
        
        if not digital_twin:
            raise HTTPException(status_code=404, detail="Digital twin not found")
        
        # Perform comprehensive analysis
        analysis = await perform_comprehensive_analysis(digital_twin, current_user)
        
        return AnalysisResponse(
            analysis=analysis,
            success=True,
            message="Comprehensive analysis completed successfully"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error performing comprehensive analysis: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to perform analysis")

async def perform_comprehensive_analysis(digital_twin: Dict[str, Any], user: User) -> DigitalTwinAnalysis:
    """Perform comprehensive analysis of digital twin data"""
    
    # Analyze skills
    skill_analyses = analyze_skills(digital_twin)
    
    # Analyze learning patterns
    learning_patterns = analyze_learning_patterns(digital_twin)
    
    # Generate insights
    insights = generate_insights(digital_twin, skill_analyses, learning_patterns)
    
    # Generate recommendations
    recommendations = generate_recommendations(digital_twin, insights)
    
    # Make future predictions
    future_predictions = make_future_predictions(digital_twin, skill_analyses)
    
    # Compare with peers using real DigitalTwin docs if available
    peer_comparison = await compare_with_peers(digital_twin, user)
    
    # Calculate overall progress
    overall_progress = calculate_overall_progress(digital_twin)
    
    return DigitalTwinAnalysis(
        user_did=user.did,
        analysis_date=datetime.now().isoformat(),
        overall_progress=overall_progress,
        skill_analyses=skill_analyses,
        learning_patterns=learning_patterns,
        insights=insights,
        recommendations=recommendations,
        future_predictions=future_predictions,
        comparison_with_peers=peer_comparison
    )

def analyze_skills(digital_twin: Dict[str, Any]) -> List[SkillAnalysis]:
    """Analyze user's skills and progress"""
    skills_data = digital_twin.get('skills', {})
    learning_progress = digital_twin.get('learning_progress', [])
    
    skill_analyses = []
    
    # Analyze each skill
    for skill_name, current_level in skills_data.items():
        # Calculate improvement rate (mock calculation)
        improvement_rate = calculate_improvement_rate(skill_name, learning_progress)
        
        # Determine strength and improvement areas
        strength_areas, improvement_areas = categorize_skill_areas(skill_name, current_level)
        
        # Generate recommended actions
        recommended_actions = generate_skill_recommendations(skill_name, current_level, improvement_rate)
        
        skill_analysis = SkillAnalysis(
            skill_name=skill_name,
            current_level=current_level,
            improvement_rate=improvement_rate,
            strength_areas=strength_areas,
            improvement_areas=improvement_areas,
            recommended_actions=recommended_actions
        )
        
        skill_analyses.append(skill_analysis)
    
    return skill_analyses

def calculate_improvement_rate(skill_name: str, learning_progress: List[Dict[str, Any]]) -> float:
    """Calculate improvement rate for a skill"""
    # Mock calculation - in real implementation, analyze historical data
    if skill_name.lower() in ['python', 'programming']:
        return 0.15  # 15% improvement per month
    elif skill_name.lower() in ['problem solving', 'logical thinking']:
        return 0.08  # 8% improvement per month
    else:
        return 0.10  # 10% improvement per month

def categorize_skill_areas(skill_name: str, current_level: float) -> tuple[List[str], List[str]]:
    """Categorize skill areas into strengths and improvement areas"""
    if current_level >= 0.7:
        strength_areas = [f"Strong foundation in {skill_name}", "Consistent performance"]
        improvement_areas = [f"Advanced {skill_name} concepts", "Real-world applications"]
    elif current_level >= 0.4:
        strength_areas = [f"Basic understanding of {skill_name}"]
        improvement_areas = [f"Intermediate {skill_name} skills", "Practice and application"]
    else:
        strength_areas = []
        improvement_areas = [f"Fundamental {skill_name} concepts", "Basic practice"]
    
    return strength_areas, improvement_areas

def generate_skill_recommendations(skill_name: str, current_level: float, improvement_rate: float) -> List[str]:
    """Generate recommendations for skill improvement"""
    recommendations = []
    
    if current_level < 0.3:
        recommendations.extend([
            f"Start with beginner {skill_name} tutorials",
            "Focus on fundamentals and basic concepts",
            "Practice daily for 30 minutes"
        ])
    elif current_level < 0.6:
        recommendations.extend([
            f"Move to intermediate {skill_name} topics",
            "Work on practical projects",
            "Join study groups or forums"
        ])
    else:
        recommendations.extend([
            f"Explore advanced {skill_name} concepts",
            "Contribute to open source projects",
            "Mentor other learners"
        ])
    
    if improvement_rate < 0.05:
        recommendations.append("Consider changing learning approach or resources")
    
    return recommendations

def analyze_learning_patterns(digital_twin: Dict[str, Any]) -> List[LearningPattern]:
    """Analyze user's learning patterns"""
    patterns = []
    
    # Analyze learning behavior
    behavior = digital_twin.get('behavior', {})
    time_spent = behavior.get('timeSpent', '0h 0m')
    quiz_accuracy = behavior.get('quizAccuracy', 0.0)
    
    # Determine pattern type
    if quiz_accuracy > 0.8:
        pattern_type = "consistent"
        description = "You show consistent learning patterns with high accuracy"
    elif quiz_accuracy > 0.6:
        pattern_type = "burst"
        description = "You learn in focused bursts with good results"
    else:
        pattern_type = "sporadic"
        description = "Your learning is sporadic - consider more structured approach"
    
    # Analyze frequency (mock data)
    frequency = "weekly"  # Would be calculated from actual data
    
    # Peak hours (mock data)
    peak_hours = [9, 10, 14, 15, 20, 21]  # Would be calculated from actual data
    
    # Preferred difficulty
    preferred_difficulty = "intermediate"  # Would be calculated from actual data
    
    # Completion rate
    completion_rate = min(quiz_accuracy + 0.1, 1.0)  # Mock calculation
    
    pattern = LearningPattern(
        pattern_type=pattern_type,
        description=description,
        frequency=frequency,
        peak_hours=peak_hours,
        preferred_difficulty=preferred_difficulty,
        completion_rate=completion_rate
    )
    
    patterns.append(pattern)
    
    return patterns

def generate_insights(digital_twin: Dict[str, Any], skill_analyses: List[SkillAnalysis], learning_patterns: List[LearningPattern]) -> List[ProgressInsight]:
    """Generate insights from analysis"""
    insights = []
    
    # Overall progress insight
    overall_progress = calculate_overall_progress(digital_twin)
    if overall_progress > 0.7:
        insights.append(ProgressInsight(
            insight_type="achievement",
            title="Excellent Progress!",
            description="You're making great progress in your learning journey",
            impact="high",
            actionable=True,
            suggested_actions=["Continue current learning approach", "Consider advanced topics"]
        ))
    elif overall_progress < 0.3:
        insights.append(ProgressInsight(
            insight_type="warning",
            title="Learning Momentum Needed",
            description="Your progress is slower than expected",
            impact="high",
            actionable=True,
            suggested_actions=["Increase study frequency", "Seek additional help", "Review learning goals"]
        ))
    
    # Skill-specific insights
    for skill_analysis in skill_analyses:
        if skill_analysis.current_level > 0.8:
            insights.append(ProgressInsight(
                insight_type="achievement",
                title=f"Mastery in {skill_analysis.skill_name}",
                description=f"You've achieved mastery level in {skill_analysis.skill_name}",
                impact="medium",
                actionable=True,
                suggested_actions=[f"Teach others {skill_analysis.skill_name}", "Explore advanced applications"]
            ))
        elif skill_analysis.improvement_rate < 0.05:
            insights.append(ProgressInsight(
                insight_type="warning",
                title=f"Slow Progress in {skill_analysis.skill_name}",
                description=f"Your progress in {skill_analysis.skill_name} has slowed down",
                impact="medium",
                actionable=True,
                suggested_actions=skill_analysis.recommended_actions
            ))
    
    # Learning pattern insights
    for pattern in learning_patterns:
        if pattern.pattern_type == "sporadic":
            insights.append(ProgressInsight(
                insight_type="recommendation",
                title="Improve Learning Consistency",
                description="Your learning pattern is sporadic. More consistent practice would help",
                impact="high",
                actionable=True,
                suggested_actions=["Set daily learning goals", "Use learning reminders", "Join study groups"]
            ))
    
    return insights

def generate_recommendations(digital_twin: Dict[str, Any], insights: List[ProgressInsight]) -> List[str]:
    """Generate actionable recommendations"""
    recommendations = []
    
    # Extract recommendations from insights
    for insight in insights:
        if insight.actionable:
            recommendations.extend(insight.suggested_actions)
    
    # Add general recommendations
    overall_progress = calculate_overall_progress(digital_twin)
    
    if overall_progress < 0.5:
        recommendations.extend([
            "Focus on one skill at a time for better results",
            "Set smaller, achievable goals",
            "Track your progress daily"
        ])
    else:
        recommendations.extend([
            "Explore interdisciplinary connections",
            "Consider teaching others what you've learned",
            "Set stretch goals for continued growth"
        ])
    
    # Remove duplicates and return
    return list(set(recommendations))

def make_future_predictions(digital_twin: Dict[str, Any], skill_analyses: List[SkillAnalysis]) -> Dict[str, Any]:
    """Make predictions about future learning outcomes"""
    predictions = {}
    
    # Predict skill levels in 3 months
    skill_predictions = {}
    for skill_analysis in skill_analyses:
        current_level = skill_analysis.current_level
        improvement_rate = skill_analysis.improvement_rate
        
        # Project 3 months ahead
        predicted_level = min(current_level + (improvement_rate * 3), 1.0)
        skill_predictions[skill_analysis.skill_name] = {
            "current": current_level,
            "predicted_3_months": predicted_level,
            "improvement_potential": predicted_level - current_level
        }
    
    predictions["skill_predictions"] = skill_predictions
    
    # Predict overall progress
    current_progress = calculate_overall_progress(digital_twin)
    predicted_progress = min(current_progress + 0.2, 1.0)  # Assume 20% improvement in 3 months
    
    predictions["overall_progress"] = {
        "current": current_progress,
        "predicted_3_months": predicted_progress,
        "confidence": 0.75  # 75% confidence in prediction
    }
    
    # Predict learning milestones
    predictions["milestones"] = [
        {
            "milestone": "Complete first project",
            "estimated_date": "2 weeks",
            "probability": 0.8
        },
        {
            "milestone": "Achieve intermediate level",
            "estimated_date": "2 months",
            "probability": 0.6
        },
        {
            "milestone": "Ready for advanced topics",
            "estimated_date": "4 months",
            "probability": 0.4
        }
    ]
    
    return predictions

async def compare_with_peers(digital_twin: Dict[str, Any], user: User) -> Dict[str, Any]:
    """Compare user's progress with peers using DigitalTwin collection."""
    try:
        user_progress = calculate_overall_progress(digital_twin)
        peers = await DigitalTwin.find(DigitalTwin.owner_did != user.did).limit(100).to_list()
        peer_values: List[float] = []
        for peer in peers:
            profile = getattr(peer, "profile", {}) or {}
            skills = profile.get("skills", {})
            if skills:
                vals = list(skills.values())
                if vals:
                    peer_values.append(sum(vals) / len(vals))
        peer_average = (sum(peer_values) / len(peer_values)) if peer_values else 0.0
        better = sum(1 for v in peer_values if v < user_progress)
        percentile = int(100 * (better / max(len(peer_values), 1)))
        learning_speed = "Above average" if user_progress >= peer_average else "Below average"
        completion_rate = "Above average" if percentile >= 50 else "Below average"
        return {
            "percentile": percentile,
            "peer_average": round(peer_average, 2),
            "above_average": user_progress >= peer_average,
            "comparison_metrics": {
                "learning_speed": learning_speed,
                "consistency": "Average",
                "completion_rate": completion_rate
            }
        }
    except Exception:
        overall_progress = calculate_overall_progress(digital_twin)
        return {
            "percentile": int(overall_progress * 100),
            "peer_average": 0.5,
            "above_average": overall_progress >= 0.5,
            "comparison_metrics": {
                "learning_speed": "Average",
                "consistency": "Average",
                "completion_rate": "Average"
            }
        }

def calculate_overall_progress(digital_twin: Dict[str, Any]) -> float:
    """Calculate overall learning progress"""
    skills = digital_twin.get('skills', {})
    if not skills:
        return 0.0
    
    # Calculate average skill level
    skill_values = list(skills.values())
    if skill_values:
        return statistics.mean(skill_values)
    
    return 0.0

@router.get("/analysis/skills")
async def get_skill_analysis(
    current_user: User = Depends(get_current_user)
):
    """Get detailed skill analysis"""
    try:
        digital_twin = learning_service.get_student_twin(current_user.did)
        if not digital_twin:
            raise HTTPException(status_code=404, detail="Digital twin not found")
        
        skill_analyses = analyze_skills(digital_twin)
        
        return {
            "skills": skill_analyses,
            "success": True,
            "message": "Skill analysis completed"
        }
        
    except Exception as e:
        logging.error(f"Error analyzing skills: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to analyze skills: {str(e)}")

@router.get("/analysis/patterns")
async def get_learning_patterns(
    current_user: User = Depends(get_current_user)
):
    """Get learning pattern analysis"""
    try:
        digital_twin = learning_service.get_student_twin(current_user.did)
        if not digital_twin:
            raise HTTPException(status_code=404, detail="Digital twin not found")
        
        patterns = analyze_learning_patterns(digital_twin)
        
        return {
            "patterns": patterns,
            "success": True,
            "message": "Learning pattern analysis completed"
        }
        
    except Exception as e:
        logging.error(f"Error analyzing learning patterns: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to analyze learning patterns: {str(e)}")

@router.get("/analysis/insights")
async def get_insights(
    current_user: User = Depends(get_current_user)
):
    """Get learning insights and recommendations"""
    try:
        digital_twin = learning_service.get_student_twin(current_user.did)
        if not digital_twin:
            raise HTTPException(status_code=404, detail="Digital twin not found")
        
        skill_analyses = analyze_skills(digital_twin)
        learning_patterns = analyze_learning_patterns(digital_twin)
        insights = generate_insights(digital_twin, skill_analyses, learning_patterns)
        recommendations = generate_recommendations(digital_twin, insights)
        
        return {
            "insights": insights,
            "recommendations": recommendations,
            "success": True,
            "message": "Insights generated successfully"
        }
        
    except Exception as e:
        logging.error(f"Error generating insights: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to generate insights: {str(e)}")
