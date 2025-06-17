from datetime import datetime
from typing import Dict, List, Optional
from ..models.learning_models import (
    LearningActivity, LearningProgress, StudentProfile,
    LearningPath, LearningAnalytics, LearningStatus
)
from ..utils import Logger
from .core import DigitalTwin

class LearningDigitalTwin(DigitalTwin):
    def __init__(self, twin_id: str, student_profile: StudentProfile):
        super().__init__(twin_id, None)  # We'll set config later
        self.student_profile = student_profile
        self.current_path: Optional[LearningPath] = None
        self.analytics = LearningAnalytics(
            student_id=student_profile.id,
            path_id="",
            progress=[],
            completion_rate=0.0,
            average_score=0.0,
            time_spent=0,
            last_activity=datetime.now(),
            learning_patterns={},
            recommendations=[]
        )
        self.logger = Logger(f"LearningTwin_{twin_id}")

    def start_learning_path(self, path: LearningPath) -> bool:
        """Bắt đầu một lộ trình học tập mới"""
        if self.current_path:
            self.logger.warning(f"Student {self.student_profile.id} already has an active learning path")
            return False

        self.current_path = path
        self.analytics.path_id = path.id
        self.analytics.progress = []
        
        # Khởi tạo tiến độ cho tất cả các hoạt động
        for activity in path.activities:
            self.analytics.progress.append(
                LearningProgress(
                    activity_id=activity.id,
                    status=LearningStatus.NOT_STARTED
                )
            )
        
        self.logger.info(f"Started learning path {path.id} for student {self.student_profile.id}")
        return True

    def update_activity_progress(self, activity_id: str, status: LearningStatus,
                               score: Optional[float] = None,
                               feedback: Optional[str] = None) -> Optional[LearningProgress]:
        """Cập nhật tiến độ của một hoạt động học tập"""
        if not self.current_path:
            self.logger.error("No active learning path")
            return None

        # Tìm hoạt động trong lộ trình
        activity = next((a for a in self.current_path.activities if a.id == activity_id), None)
        if not activity:
            self.logger.error(f"Activity {activity_id} not found in current path")
            return None

        # Tìm và cập nhật tiến độ
        progress = next((p for p in self.analytics.progress if p.activity_id == activity_id), None)
        if not progress:
            self.logger.error(f"Progress for activity {activity_id} not found")
            return None

        # Cập nhật trạng thái
        progress.status = status
        if status == LearningStatus.IN_PROGRESS and not progress.start_time:
            progress.start_time = datetime.now()
        elif status in [LearningStatus.COMPLETED, LearningStatus.FAILED]:
            progress.completion_time = datetime.now()
            if score is not None:
                progress.score = score
            if feedback:
                progress.feedback = feedback
        progress.attempts += 1

        # Cập nhật analytics
        self._update_analytics()
        self.logger.info(f"Updated progress for activity {activity_id}")
        return progress

    def _update_analytics(self):
        """Cập nhật các chỉ số phân tích học tập"""
        if not self.current_path or not self.analytics.progress:
            return

        # Tính toán completion rate
        total_activities = len(self.current_path.activities)
        completed_activities = len([p for p in self.analytics.progress 
                                  if p.status == LearningStatus.COMPLETED])
        self.analytics.completion_rate = completed_activities / total_activities

        # Tính toán average score
        scores = [p.score for p in self.analytics.progress if p.score is not None]
        self.analytics.average_score = sum(scores) / len(scores) if scores else 0.0

        # Cập nhật time spent
        self.analytics.time_spent = sum(
            (p.completion_time - p.start_time).total_seconds() / 60
            for p in self.analytics.progress
            if p.start_time and p.completion_time
        )

        # Cập nhật last activity
        self.analytics.last_activity = datetime.now()

        # Phân tích mẫu học tập
        self._analyze_learning_patterns()

    def _analyze_learning_patterns(self):
        """Phân tích mẫu học tập và đưa ra đề xuất"""
        patterns = {
            "completion_speed": [],
            "score_trend": [],
            "difficulty_preference": {},
            "activity_type_preference": {}
        }

        # Phân tích tốc độ hoàn thành
        for progress in self.analytics.progress:
            if progress.start_time and progress.completion_time:
                duration = (progress.completion_time - progress.start_time).total_seconds() / 60
                patterns["completion_speed"].append(duration)

        # Phân tích xu hướng điểm số
        for progress in self.analytics.progress:
            if progress.score is not None:
                patterns["score_trend"].append(progress.score)

        # Phân tích sở thích về độ khó
        for progress in self.analytics.progress:
            activity = next((a for a in self.current_path.activities 
                           if a.id == progress.activity_id), None)
            if activity and progress.score is not None:
                if activity.difficulty not in patterns["difficulty_preference"]:
                    patterns["difficulty_preference"][activity.difficulty] = []
                patterns["difficulty_preference"][activity.difficulty].append(progress.score)

        # Phân tích sở thích về loại hoạt động
        for progress in self.analytics.progress:
            activity = next((a for a in self.current_path.activities 
                           if a.id == progress.activity_id), None)
            if activity and progress.score is not None:
                if activity.type not in patterns["activity_type_preference"]:
                    patterns["activity_type_preference"][activity.type] = []
                patterns["activity_type_preference"][activity.type].append(progress.score)

        self.analytics.learning_patterns = patterns
        self._generate_recommendations()

    def _generate_recommendations(self):
        """Tạo các đề xuất dựa trên phân tích mẫu học tập"""
        recommendations = []

        # Đề xuất dựa trên tốc độ hoàn thành
        if self.analytics.learning_patterns["completion_speed"]:
            avg_speed = sum(self.analytics.learning_patterns["completion_speed"]) / len(
                self.analytics.learning_patterns["completion_speed"])
            if avg_speed > 60:  # Nếu trung bình mất hơn 1 giờ cho mỗi hoạt động
                recommendations.append("Consider breaking down activities into smaller chunks")

        # Đề xuất dựa trên xu hướng điểm số
        if self.analytics.learning_patterns["score_trend"]:
            recent_scores = self.analytics.learning_patterns["score_trend"][-3:]
            if len(recent_scores) == 3 and all(s < 70 for s in recent_scores):
                recommendations.append("Consider reviewing previous concepts before moving forward")

        # Đề xuất dựa trên sở thích về độ khó
        difficulty_prefs = self.analytics.learning_patterns["difficulty_preference"]
        if difficulty_prefs:
            best_difficulty = max(difficulty_prefs.items(), 
                                key=lambda x: sum(x[1])/len(x[1]))[0]
            recommendations.append(f"Focus on activities with difficulty level {best_difficulty}")

        # Đề xuất dựa trên sở thích về loại hoạt động
        activity_prefs = self.analytics.learning_patterns["activity_type_preference"]
        if activity_prefs:
            best_activity = max(activity_prefs.items(), 
                              key=lambda x: sum(x[1])/len(x[1]))[0]
            recommendations.append(f"Engage more with {best_activity} type activities")

        self.analytics.recommendations = recommendations

    def get_learning_analytics(self) -> LearningAnalytics:
        """Lấy thông tin phân tích học tập"""
        return self.analytics

    def get_recommendations(self) -> List[str]:
        """Lấy danh sách đề xuất"""
        return self.analytics.recommendations 