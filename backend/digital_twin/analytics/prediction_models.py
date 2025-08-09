import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.linear_model import LinearRegression
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error, r2_score
import joblib
import os
from pathlib import Path
from typing import Dict, List, Any, Optional
import logging

logger = logging.getLogger(__name__)

class LearningOutcomePredictor:
    """Advanced ML model for predicting learning outcomes"""
    
    def __init__(self):
        self.models = {
            'random_forest': RandomForestRegressor(n_estimators=100, random_state=42),
            'gradient_boosting': GradientBoostingRegressor(n_estimators=100, random_state=42),
            'linear_regression': LinearRegression()
        }
        self.scaler = StandardScaler()
        self.is_trained = False
        self.model_path = Path(__file__).parent.parent / "models" / "learning_predictor.pkl"
        self.scaler_path = Path(__file__).parent.parent / "models" / "scaler.pkl"
        
        # Load pre-trained models if available
        self._load_models()
    
    def _load_models(self):
        """Load pre-trained models from disk"""
        try:
            if self.model_path.exists() and self.scaler_path.exists():
                self.models = joblib.load(self.model_path)
                self.scaler = joblib.load(self.scaler_path)
                self.is_trained = True
                logger.info("Pre-trained models loaded successfully")
        except Exception as e:
            logger.warning(f"Could not load pre-trained models: {e}")
    
    def _save_models(self):
        """Save trained models to disk"""
        try:
            self.model_path.parent.mkdir(parents=True, exist_ok=True)
            joblib.dump(self.models, self.model_path)
            joblib.dump(self.scaler, self.scaler_path)
            logger.info("Models saved successfully")
        except Exception as e:
            logger.error(f"Could not save models: {e}")
    
    def _extract_features(self, data: Dict[str, Any]) -> np.ndarray:
        """Extract features from learning data"""
        features = []
        
        # Learning behavior features
        features.extend([
            data.get('study_time_hours', 0),
            data.get('completion_rate', 0),
            data.get('average_score', 0),
            data.get('attempts_per_module', 1),
            data.get('modules_completed', 0),
            data.get('days_since_start', 0),
            data.get('active_days_per_week', 0),
            data.get('session_duration_avg', 0),
            data.get('break_time_ratio', 0),
            data.get('difficulty_preference', 0.5),
            data.get('learning_style_score', 0.5),
            data.get('motivation_level', 0.5),
            data.get('prior_knowledge', 0),
            data.get('cognitive_load_score', 0.5),
            data.get('engagement_level', 0.5)
        ])
        
        # Skill-specific features
        skill_features = data.get('skill_progress', {})
        for skill in ['programming', 'mathematics', 'communication', 'problem_solving']:
            features.append(skill_features.get(skill, 0))
        
        # Behavioral patterns
        behavior = data.get('behavior_patterns', {})
        features.extend([
            behavior.get('consistency_score', 0.5),
            behavior.get('persistence_score', 0.5),
            behavior.get('adaptability_score', 0.5),
            behavior.get('collaboration_score', 0.5)
        ])
        
        return np.array(features).reshape(1, -1)
    
    def train_model(self, training_data: List[Dict[str, Any]], target_scores: List[float]):
        """Train the prediction model with real data"""
        try:
            # Extract features
            X = np.array([self._extract_features(data).flatten() for data in training_data])
            y = np.array(target_scores)
            
            # Split data
            X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
            
            # Scale features
            X_train_scaled = self.scaler.fit_transform(X_train)
            X_test_scaled = self.scaler.transform(X_test)
            
            # Train models
            best_model = None
            best_score = -1
            
            for name, model in self.models.items():
                model.fit(X_train_scaled, y_train)
                y_pred = model.predict(X_test_scaled)
                score = r2_score(y_test, y_pred)
                
                logger.info(f"{name} R² score: {score:.4f}")
                
                if score > best_score:
                    best_score = score
                    best_model = name
            
            self.is_trained = True
            self._save_models()
            
            logger.info(f"Best model: {best_model} with R² score: {best_score:.4f}")
            return best_score
            
        except Exception as e:
            logger.error(f"Training failed: {e}")
            return None
    
    def predict_learning_outcome(self, features: Dict[str, Any]) -> Dict[str, Any]:
        """Predict learning outcome with confidence intervals"""
        try:
            if not self.is_trained:
                # Use fallback prediction based on simple heuristics
                return self._fallback_prediction(features)
            
            # Extract features
            X = self._extract_features(features)
            X_scaled = self.scaler.transform(X)
            
            # Get predictions from all models
            predictions = {}
            for name, model in self.models.items():
                pred = model.predict(X_scaled)[0]
                predictions[name] = max(0, min(100, pred))  # Clamp between 0-100
            
            # Ensemble prediction (weighted average)
            weights = {'random_forest': 0.4, 'gradient_boosting': 0.4, 'linear_regression': 0.2}
            ensemble_pred = sum(predictions[name] * weights[name] for name in predictions)
            
            # Calculate confidence based on model agreement
            variance = np.var(list(predictions.values()))
            confidence = max(0.5, 1 - variance / 100)
            
            return {
                'predicted_score': round(ensemble_pred, 2),
                'confidence': round(confidence, 3),
                'model_predictions': predictions,
                'recommendations': self._generate_recommendations(features, ensemble_pred),
                'risk_factors': self._identify_risk_factors(features),
                'improvement_potential': self._calculate_improvement_potential(features, ensemble_pred)
            }
            
        except Exception as e:
            logger.error(f"Prediction failed: {e}")
            return self._fallback_prediction(features)
    
    def _fallback_prediction(self, features: Dict[str, Any]) -> Dict[str, Any]:
        """Fallback prediction using simple heuristics"""
        score = 50  # Base score
        
        # Adjust based on key factors
        if features.get('completion_rate', 0) > 0.8:
            score += 20
        if features.get('average_score', 0) > 80:
            score += 15
        if features.get('study_time_hours', 0) > 10:
            score += 10
        if features.get('modules_completed', 0) > 5:
            score += 5
        
        return {
            'predicted_score': min(100, score),
            'confidence': 0.6,
            'model_predictions': {'fallback': score},
            'recommendations': self._generate_recommendations(features, score),
            'risk_factors': self._identify_risk_factors(features),
            'improvement_potential': self._calculate_improvement_potential(features, score)
        }
    
    def _generate_recommendations(self, features: Dict[str, Any], predicted_score: float) -> List[str]:
        """Generate personalized learning recommendations"""
        recommendations = []
        
        if features.get('completion_rate', 0) < 0.7:
            recommendations.append("Focus on completing more modules to improve overall progress")
        
        if features.get('average_score', 0) < 75:
            recommendations.append("Consider reviewing difficult topics and seeking additional help")
        
        if features.get('study_time_hours', 0) < 5:
            recommendations.append("Increase study time to at least 5 hours per week")
        
        if features.get('attempts_per_module', 1) > 3:
            recommendations.append("Try to reduce the number of attempts by preparing better before assessments")
        
        if features.get('active_days_per_week', 0) < 3:
            recommendations.append("Study more consistently throughout the week")
        
        if predicted_score < 70:
            recommendations.append("Consider taking a diagnostic assessment to identify knowledge gaps")
        
        return recommendations
    
    def _identify_risk_factors(self, features: Dict[str, Any]) -> List[str]:
        """Identify potential risk factors for learning success"""
        risks = []
        
        if features.get('completion_rate', 0) < 0.5:
            risks.append("Low completion rate indicates potential disengagement")
        
        if features.get('average_score', 0) < 60:
            risks.append("Low average score suggests knowledge gaps")
        
        if features.get('study_time_hours', 0) < 2:
            risks.append("Insufficient study time may lead to poor performance")
        
        if features.get('attempts_per_module', 1) > 5:
            risks.append("High number of attempts suggests difficulty with material")
        
        return risks
    
    def _calculate_improvement_potential(self, features: Dict[str, Any], current_score: float) -> Dict[str, Any]:
        """Calculate potential for improvement in different areas"""
        potential = {
            'overall_potential': 100 - current_score,
            'study_time_impact': 0,
            'completion_rate_impact': 0,
            'skill_development_impact': 0
        }
        
        # Calculate impact of improving study time
        if features.get('study_time_hours', 0) < 10:
            potential['study_time_impact'] = min(15, 10 - features.get('study_time_hours', 0))
        
        # Calculate impact of improving completion rate
        completion_rate = features.get('completion_rate', 0)
        if completion_rate < 0.9:
            potential['completion_rate_impact'] = (0.9 - completion_rate) * 20
        
        # Calculate impact of skill development
        skill_progress = features.get('skill_progress', {})
        avg_skill = sum(skill_progress.values()) / len(skill_progress) if skill_progress else 0
        if avg_skill < 0.8:
            potential['skill_development_impact'] = (0.8 - avg_skill) * 25
        
        return potential

def predict_learning_outcome(features: dict) -> float:
    """
    Legacy function for backward compatibility
    """
    predictor = LearningOutcomePredictor()
    result = predictor.predict_learning_outcome(features)
    return result['predicted_score']

def predict_course_completion_probability(student_data: dict) -> float:
    """
    Predict probability of course completion
    """
    try:
        # Extract key completion indicators
        completion_rate = student_data.get('completion_rate', 0)
        study_consistency = student_data.get('active_days_per_week', 0) / 7
        performance_trend = student_data.get('average_score', 0) / 100
        engagement_level = student_data.get('engagement_level', 0.5)
        
        # Weighted probability calculation
        probability = (
            completion_rate * 0.4 +
            study_consistency * 0.3 +
            performance_trend * 0.2 +
            engagement_level * 0.1
        )
        
        return min(1.0, max(0.0, probability))
        
    except Exception as e:
        logger.error(f"Completion probability prediction failed: {e}")
        return 0.5

def predict_optimal_learning_path(student_profile: dict, available_modules: list) -> list:
    """
    Predict optimal learning path for a student
    """
    try:
        # Extract student characteristics
        learning_style = student_profile.get('learning_style', 'balanced')
        prior_knowledge = student_profile.get('prior_knowledge', 0)
        preferred_difficulty = student_profile.get('difficulty_preference', 0.5)
        
        # Score modules based on fit
        scored_modules = []
        for module in available_modules:
            score = 0
            
            # Difficulty match
            module_difficulty = module.get('difficulty', 0.5)
            difficulty_match = 1 - abs(module_difficulty - preferred_difficulty)
            score += difficulty_match * 0.3
            
            # Prerequisites match
            if module.get('prerequisites', []) and prior_knowledge >= 0.7:
                score += 0.2
            
            # Learning style match
            if learning_style in module.get('learning_styles', []):
                score += 0.3
            
            # Popularity/rating
            score += module.get('rating', 0.5) * 0.2
            
            scored_modules.append((module, score))
        
        # Sort by score and return top modules
        scored_modules.sort(key=lambda x: x[1], reverse=True)
        return [module for module, score in scored_modules[:5]]
        
    except Exception as e:
        logger.error(f"Learning path prediction failed: {e}")
        return available_modules[:5]  # Return first 5 modules as fallback 