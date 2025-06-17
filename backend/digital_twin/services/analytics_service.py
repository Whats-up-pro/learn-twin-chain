from ..analytics.learning_analytics import analyze_learning_progress

class AnalyticsService:
    """
    Service phân tích học tập.
    """
    def analyze(self, progress_data: list) -> dict:
        return analyze_learning_progress(progress_data) 