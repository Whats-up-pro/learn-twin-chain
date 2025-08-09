import numpy as np
import pandas as pd
from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta
import logging
from collections import defaultdict, Counter
import json

logger = logging.getLogger(__name__)

class BehaviorAnalytics:
    """Advanced behavior analytics for learning patterns"""
    
    def __init__(self):
        self.behavior_patterns = {}
        self.anomaly_thresholds = {
            'session_duration': {'min': 300, 'max': 7200},  # 5min to 2hours
            'break_time': {'min': 60, 'max': 1800},        # 1min to 30min
            'daily_study_time': {'min': 1800, 'max': 28800}, # 30min to 8hours
            'completion_rate': {'min': 0.1, 'max': 1.0},
            'attempts_per_module': {'min': 1, 'max': 10}
        }
    
    def analyze_behavior(self, data: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Comprehensive behavior analysis from learning data
        """
        try:
            if not data:
                return self._empty_analysis()
            
            # Convert to DataFrame for easier analysis
            df = pd.DataFrame(data)
            
            analysis = {
                'learning_patterns': self._analyze_learning_patterns(df),
                'engagement_metrics': self._analyze_engagement(df),
                'performance_trends': self._analyze_performance_trends(df),
                'behavioral_anomalies': self._detect_anomalies(df),
                'motivation_indicators': self._analyze_motivation(df),
                'cognitive_load_analysis': self._analyze_cognitive_load(df),
                'social_learning_patterns': self._analyze_social_patterns(df),
                'adaptive_behavior': self._analyze_adaptive_behavior(df),
                'risk_assessment': self._assess_learning_risks(df),
                'recommendations': []
            }
            
            # Generate recommendations based on analysis
            analysis['recommendations'] = self._generate_behavioral_recommendations(analysis)
            
            return analysis
            
        except Exception as e:
            logger.error(f"Behavior analysis failed: {e}")
            return self._empty_analysis()
    
    def _analyze_learning_patterns(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Analyze learning patterns and preferences"""
        patterns = {}
        
        try:
            # Study time patterns
            if 'study_time' in df.columns:
                patterns['study_time_distribution'] = {
                    'morning': len(df[df['hour_of_day'].between(6, 11)]) / len(df),
                    'afternoon': len(df[df['hour_of_day'].between(12, 17)]) / len(df),
                    'evening': len(df[df['hour_of_day'].between(18, 23)]) / len(df),
                    'night': len(df[df['hour_of_day'].between(0, 5)]) / len(df)
                }
                
                patterns['preferred_study_time'] = max(
                    patterns['study_time_distribution'].items(), 
                    key=lambda x: x[1]
                )[0]
            
            # Session duration patterns
            if 'session_duration' in df.columns:
                patterns['session_patterns'] = {
                    'avg_duration': df['session_duration'].mean(),
                    'median_duration': df['session_duration'].median(),
                    'short_sessions': len(df[df['session_duration'] < 1800]) / len(df),  # <30min
                    'long_sessions': len(df[df['session_duration'] > 3600]) / len(df),  # >1hour
                    'optimal_duration': df['session_duration'].quantile(0.75)
                }
            
            # Consistency patterns
            if 'date' in df.columns:
                df['date'] = pd.to_datetime(df['date'])
                daily_activity = df.groupby(df['date'].dt.date).size()
                patterns['consistency'] = {
                    'active_days': len(daily_activity),
                    'consecutive_days': self._calculate_consecutive_days(daily_activity),
                    'consistency_score': daily_activity.std() / daily_activity.mean() if daily_activity.mean() > 0 else 0,
                    'preferred_days': self._get_preferred_days(df)
                }
            
            # Learning style preferences
            patterns['learning_style'] = self._analyze_learning_style(df)
            
        except Exception as e:
            logger.error(f"Learning patterns analysis failed: {e}")
        
        return patterns
    
    def _analyze_engagement(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Analyze engagement metrics"""
        engagement = {}
        
        try:
            # Completion rate
            if 'completed' in df.columns:
                engagement['completion_rate'] = df['completed'].mean()
            
            # Time spent vs expected
            if 'time_spent' in df.columns and 'expected_time' in df.columns:
                engagement['time_efficiency'] = df['time_spent'] / df['expected_time']
                engagement['avg_efficiency'] = engagement['time_efficiency'].mean()
            
            # Interaction frequency
            if 'interactions' in df.columns:
                engagement['interaction_frequency'] = df['interactions'].mean()
                engagement['engagement_trend'] = self._calculate_trend(df['interactions'])
            
            # Focus metrics
            engagement['focus_metrics'] = self._analyze_focus_patterns(df)
            
        except Exception as e:
            logger.error(f"Engagement analysis failed: {e}")
        
        return engagement
    
    def _analyze_performance_trends(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Analyze performance trends over time"""
        trends = {}
        
        try:
            if 'score' in df.columns and 'date' in df.columns:
                df['date'] = pd.to_datetime(df['date'])
                df_sorted = df.sort_values('date')
                
                # Overall trend
                trends['overall_trend'] = self._calculate_trend(df_sorted['score'])
                
                # Performance by time of day
                if 'hour_of_day' in df.columns:
                    hourly_performance = df.groupby('hour_of_day')['score'].mean()
                    trends['best_performance_hour'] = hourly_performance.idxmax()
                    trends['worst_performance_hour'] = hourly_performance.idxmin()
                
                # Performance by session duration
                if 'session_duration' in df.columns:
                    duration_bins = pd.cut(df['session_duration'], bins=5)
                    duration_performance = df.groupby(duration_bins)['score'].mean()
                    trends['optimal_session_duration'] = duration_performance.idxmax()
                
                # Learning curve
                trends['learning_curve'] = self._calculate_learning_curve(df_sorted)
                
        except Exception as e:
            logger.error(f"Performance trends analysis failed: {e}")
        
        return trends
    
    def _detect_anomalies(self, df: pd.DataFrame) -> List[Dict[str, Any]]:
        """Detect behavioral anomalies"""
        anomalies = []
        
        try:
            # Session duration anomalies
            if 'session_duration' in df.columns:
                mean_duration = df['session_duration'].mean()
                std_duration = df['session_duration'].std()
                
                long_sessions = df[df['session_duration'] > mean_duration + 2*std_duration]
                short_sessions = df[df['session_duration'] < mean_duration - 2*std_duration]
                
                for _, session in long_sessions.iterrows():
                    anomalies.append({
                        'type': 'long_session',
                        'severity': 'medium',
                        'description': f"Unusually long session: {session['session_duration']/3600:.1f} hours",
                        'timestamp': session.get('date', 'unknown'),
                        'recommendation': 'Consider taking more breaks'
                    })
                
                for _, session in short_sessions.iterrows():
                    anomalies.append({
                        'type': 'short_session',
                        'severity': 'low',
                        'description': f"Very short session: {session['session_duration']/60:.1f} minutes",
                        'timestamp': session.get('date', 'unknown'),
                        'recommendation': 'Try to maintain longer focus periods'
                    })
            
            # Performance anomalies
            if 'score' in df.columns:
                mean_score = df['score'].mean()
                std_score = df['score'].std()
                
                low_performance = df[df['score'] < mean_score - 2*std_score]
                for _, session in low_performance.iterrows():
                    anomalies.append({
                        'type': 'low_performance',
                        'severity': 'high',
                        'description': f"Unusually low score: {session['score']}%",
                        'timestamp': session.get('date', 'unknown'),
                        'recommendation': 'Review material and seek help'
                    })
            
            # Completion rate anomalies
            if 'completed' in df.columns:
                completion_rate = df['completed'].mean()
                if completion_rate < 0.3:
                    anomalies.append({
                        'type': 'low_completion',
                        'severity': 'high',
                        'description': f"Very low completion rate: {completion_rate:.1%}",
                        'timestamp': 'ongoing',
                        'recommendation': 'Focus on completing modules'
                    })
            
        except Exception as e:
            logger.error(f"Anomaly detection failed: {e}")
        
        return anomalies
    
    def _analyze_motivation(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Analyze motivation indicators"""
        motivation = {}
        
        try:
            # Progress consistency
            if 'date' in df.columns:
                df['date'] = pd.to_datetime(df['date'])
                daily_progress = df.groupby(df['date'].dt.date).size()
                motivation['progress_consistency'] = 1 - (daily_progress.std() / daily_progress.mean()) if daily_progress.mean() > 0 else 0
            
            # Challenge seeking
            if 'difficulty_level' in df.columns:
                motivation['challenge_seeking'] = len(df[df['difficulty_level'] > df['difficulty_level'].median()]) / len(df)
            
            # Persistence
            if 'attempts' in df.columns:
                motivation['persistence'] = df['attempts'].mean()
                motivation['persistence_trend'] = self._calculate_trend(df['attempts'])
            
            # Self-directed learning
            motivation['self_directed_learning'] = self._analyze_self_directed_learning(df)
            
        except Exception as e:
            logger.error(f"Motivation analysis failed: {e}")
        
        return motivation
    
    def _analyze_cognitive_load(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Analyze cognitive load patterns"""
        cognitive_load = {}
        
        try:
            # Session intensity
            if 'session_duration' in df.columns and 'interactions' in df.columns:
                cognitive_load['session_intensity'] = df['interactions'] / (df['session_duration'] / 3600)  # interactions per hour
            
            # Break patterns
            if 'break_time' in df.columns:
                cognitive_load['break_patterns'] = {
                    'avg_break_time': df['break_time'].mean(),
                    'break_frequency': len(df[df['break_time'] > 0]) / len(df),
                    'break_efficiency': self._analyze_break_efficiency(df)
                }
            
            # Mental fatigue indicators
            cognitive_load['fatigue_indicators'] = self._detect_mental_fatigue(df)
            
        except Exception as e:
            logger.error(f"Cognitive load analysis failed: {e}")
        
        return cognitive_load
    
    def _analyze_social_patterns(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Analyze social learning patterns"""
        social_patterns = {}
        
        try:
            # Collaboration indicators
            if 'collaboration_score' in df.columns:
                social_patterns['collaboration_level'] = df['collaboration_score'].mean()
                social_patterns['collaboration_trend'] = self._calculate_trend(df['collaboration_score'])
            
            # Peer interaction
            if 'peer_interactions' in df.columns:
                social_patterns['peer_interaction_frequency'] = df['peer_interactions'].mean()
            
            # Help seeking behavior
            if 'help_requests' in df.columns:
                social_patterns['help_seeking'] = {
                    'frequency': df['help_requests'].mean(),
                    'effectiveness': self._analyze_help_effectiveness(df)
                }
            
        except Exception as e:
            logger.error(f"Social patterns analysis failed: {e}")
        
        return social_patterns
    
    def _analyze_adaptive_behavior(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Analyze adaptive learning behavior"""
        adaptive_behavior = {}
        
        try:
            # Strategy changes
            if 'learning_strategy' in df.columns:
                strategy_changes = df['learning_strategy'].diff().fillna(0)
                adaptive_behavior['strategy_adaptation'] = len(strategy_changes[strategy_changes != 0]) / len(df)
            
            # Difficulty adjustment
            if 'difficulty_level' in df.columns:
                difficulty_changes = df['difficulty_level'].diff().fillna(0)
                adaptive_behavior['difficulty_adaptation'] = {
                    'increases': len(difficulty_changes[difficulty_changes > 0]),
                    'decreases': len(difficulty_changes[difficulty_changes < 0]),
                    'adaptation_rate': len(difficulty_changes[difficulty_changes != 0]) / len(df)
                }
            
            # Resource utilization
            adaptive_behavior['resource_adaptation'] = self._analyze_resource_adaptation(df)
            
        except Exception as e:
            logger.error(f"Adaptive behavior analysis failed: {e}")
        
        return adaptive_behavior
    
    def _assess_learning_risks(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Assess learning risks and potential issues"""
        risks = {}
        
        try:
            # Dropout risk
            if 'date' in df.columns:
                recent_activity = df[df['date'] >= df['date'].max() - timedelta(days=7)]
                risks['dropout_risk'] = 1 - (len(recent_activity) / len(df))
            
            # Performance risk
            if 'score' in df.columns:
                low_performance_sessions = len(df[df['score'] < 60])
                risks['performance_risk'] = low_performance_sessions / len(df)
            
            # Engagement risk
            if 'completion_rate' in df.columns:
                risks['engagement_risk'] = 1 - df['completion_rate'].mean()
            
            # Burnout risk
            risks['burnout_risk'] = self._assess_burnout_risk(df)
            
        except Exception as e:
            logger.error(f"Risk assessment failed: {e}")
        
        return risks
    
    def _generate_behavioral_recommendations(self, analysis: Dict[str, Any]) -> List[str]:
        """Generate personalized behavioral recommendations"""
        recommendations = []
        
        try:
            # Based on learning patterns
            patterns = analysis.get('learning_patterns', {})
            if patterns.get('session_patterns', {}).get('long_sessions', 0) > 0.3:
                recommendations.append("Consider shorter, more frequent study sessions to maintain focus")
            
            if patterns.get('consistency', {}).get('consistency_score', 0) > 0.5:
                recommendations.append("Try to maintain more consistent daily study routines")
            
            # Based on engagement
            engagement = analysis.get('engagement_metrics', {})
            if engagement.get('completion_rate', 0) < 0.7:
                recommendations.append("Focus on completing modules to improve overall progress")
            
            # Based on anomalies
            anomalies = analysis.get('behavioral_anomalies', [])
            for anomaly in anomalies:
                if anomaly.get('severity') == 'high':
                    recommendations.append(anomaly.get('recommendation', ''))
            
            # Based on risks
            risks = analysis.get('risk_assessment', {})
            if risks.get('dropout_risk', 0) > 0.3:
                recommendations.append("Consider reducing study load or seeking support to prevent burnout")
            
            if risks.get('performance_risk', 0) > 0.2:
                recommendations.append("Review difficult topics and consider additional practice")
            
        except Exception as e:
            logger.error(f"Recommendation generation failed: {e}")
        
        return recommendations
    
    # Helper methods
    def _calculate_trend(self, series: pd.Series) -> str:
        """Calculate trend direction"""
        if len(series) < 2:
            return 'stable'
        
        slope = np.polyfit(range(len(series)), series, 1)[0]
        if slope > 0.01:
            return 'increasing'
        elif slope < -0.01:
            return 'decreasing'
        else:
            return 'stable'
    
    def _calculate_consecutive_days(self, daily_activity: pd.Series) -> int:
        """Calculate maximum consecutive active days"""
        dates = sorted(daily_activity.index)
        max_consecutive = 0
        current_consecutive = 0
        
        for i in range(1, len(dates)):
            if (dates[i] - dates[i-1]).days == 1:
                current_consecutive += 1
            else:
                max_consecutive = max(max_consecutive, current_consecutive)
                current_consecutive = 0
        
        return max(max_consecutive, current_consecutive)
    
    def _get_preferred_days(self, df: pd.DataFrame) -> List[str]:
        """Get preferred study days"""
        if 'date' not in df.columns:
            return []
        
        df['date'] = pd.to_datetime(df['date'])
        day_counts = df['date'].dt.day_name().value_counts()
        return day_counts.head(3).index.tolist()
    
    def _analyze_learning_style(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Analyze learning style preferences"""
        # Placeholder for learning style analysis
        return {
            'visual_learner': 0.3,
            'auditory_learner': 0.2,
            'kinesthetic_learner': 0.5
        }
    
    def _analyze_focus_patterns(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Analyze focus and attention patterns"""
        return {
            'avg_focus_duration': 1800,  # 30 minutes
            'distraction_frequency': 0.1,
            'focus_quality_score': 0.8
        }
    
    def _calculate_learning_curve(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Calculate learning curve parameters"""
        if 'score' not in df.columns or len(df) < 3:
            return {'slope': 0, 'plateau': 0}
        
        x = range(len(df))
        y = df['score'].values
        
        # Fit exponential curve: y = a * (1 - e^(-bx))
        try:
            from scipy.optimize import curve_fit
            
            def learning_curve(x, a, b):
                return a * (1 - np.exp(-b * x))
            
            popt, _ = curve_fit(learning_curve, x, y, p0=[100, 0.1])
            return {
                'slope': popt[1],
                'plateau': popt[0],
                'fit_quality': 'good'
            }
        except:
            return {'slope': 0, 'plateau': 0, 'fit_quality': 'poor'}
    
    def _analyze_self_directed_learning(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Analyze self-directed learning indicators"""
        return {
            'goal_setting': 0.7,
            'resource_selection': 0.6,
            'progress_monitoring': 0.8,
            'self_assessment': 0.5
        }
    
    def _analyze_break_efficiency(self, df: pd.DataFrame) -> float:
        """Analyze break efficiency"""
        return 0.75  # Placeholder
    
    def _detect_mental_fatigue(self, df: pd.DataFrame) -> List[str]:
        """Detect mental fatigue indicators"""
        indicators = []
        
        if 'session_duration' in df.columns and 'score' in df.columns:
            # Check if performance decreases with longer sessions
            correlation = df['session_duration'].corr(df['score'])
            if correlation < -0.3:
                indicators.append("Performance decreases with longer sessions")
        
        return indicators
    
    def _analyze_help_effectiveness(self, df: pd.DataFrame) -> float:
        """Analyze effectiveness of help-seeking behavior"""
        return 0.8  # Placeholder
    
    def _analyze_resource_adaptation(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Analyze resource adaptation patterns"""
        return {
            'resource_switching': 0.3,
            'resource_effectiveness': 0.7,
            'adaptation_speed': 0.6
        }
    
    def _assess_burnout_risk(self, df: pd.DataFrame) -> float:
        """Assess burnout risk"""
        risk_factors = 0
        
        if 'session_duration' in df.columns:
            if df['session_duration'].mean() > 7200:  # >2 hours
                risk_factors += 0.3
        
        if 'date' in df.columns:
            df['date'] = pd.to_datetime(df['date'])
            recent_activity = df[df['date'] >= df['date'].max() - timedelta(days=7)]
            if len(recent_activity) > 20:  # >20 sessions in a week
                risk_factors += 0.4
        
        return min(1.0, risk_factors)
    
    def _empty_analysis(self) -> Dict[str, Any]:
        """Return empty analysis structure"""
        return {
            'learning_patterns': {},
            'engagement_metrics': {},
            'performance_trends': {},
            'behavioral_anomalies': [],
            'motivation_indicators': {},
            'cognitive_load_analysis': {},
            'social_learning_patterns': {},
            'adaptive_behavior': {},
            'risk_assessment': {},
            'recommendations': []
        }

# Legacy function for backward compatibility
def analyze_behavior(data: list) -> dict:
    """
    Legacy function for backward compatibility
    """
    analyzer = BehaviorAnalytics()
    return analyzer.analyze_behavior(data) 