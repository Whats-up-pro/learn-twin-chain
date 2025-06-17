import json
import jsonschema
from datetime import datetime
from typing import Dict, Any
from ..services.digital_twin_storage import save_digital_twin, load_digital_twin

# Load schema một lần khi khởi động
import os
SCHEMA_PATH = os.path.join(os.path.dirname(__file__), '../learner_digital_twin.schema.json')
with open(SCHEMA_PATH, 'r', encoding='utf-8') as f:
    TWIN_SCHEMA = json.load(f)

def validate_twin_data(data: Dict[str, Any]):
    jsonschema.validate(instance=data, schema=TWIN_SCHEMA)

def update_digital_twin(data: Dict[str, Any]) -> Dict[str, Any]:
    # Validate schema
    validate_twin_data(data)
    twin_id = data['twin_id']
    # Lưu trạng thái mới
    save_digital_twin(twin_id, data)
    # Phân tích và đề xuất
    analytics = analyze_twin(data)
    recommendations = generate_recommendations(data, analytics)
    return {
        "status": "success",
        "twin_id": twin_id,
        "updated_at": datetime.utcnow().isoformat(),
        "analytics": analytics,
        "recommendations": recommendations
    }

def analyze_twin(data: Dict[str, Any]) -> Dict[str, Any]:
    # Phân tích tiến độ, kỹ năng, hành vi, checkpoint
    learning_state = data.get('learning_state', {})
    skill_profile = data.get('skill_profile', {})
    interaction_logs = data.get('interaction_logs', {})
    analytics = {}
    # Tiến độ trung bình
    progress = learning_state.get('progress', {})
    if progress:
        analytics['avg_progress'] = sum(progress.values()) / len(progress)
    # Số module đã hoàn thành
    checkpoint_history = learning_state.get('checkpoint_history', [])
    analytics['modules_completed'] = len([c for c in checkpoint_history if c.get('completed_at')])
    # Kỹ năng mạnh nhất
    pl = skill_profile.get('programming_languages', {})
    if pl:
        analytics['best_language'] = max(pl, key=pl.get)
    ss = skill_profile.get('soft_skills', {})
    if ss:
        analytics['best_soft_skill'] = max(ss, key=ss.get)
    # Chủ đề hỏi nhiều nhất
    topics = interaction_logs.get('most_asked_topics', [])
    if topics:
        analytics['most_asked_topic'] = max(set(topics), key=topics.count)
    return analytics

def generate_recommendations(data: Dict[str, Any], analytics: Dict[str, Any]) -> list:
    recs = []
    # Đề xuất học lại module chưa hoàn thành
    learning_state = data.get('learning_state', {})
    progress = learning_state.get('progress', {})
    for module, prog in progress.items():
        if prog < 1.0:
            recs.append(f"Hãy hoàn thành module '{module}' (tiến độ: {prog*100:.0f}%)")
    # Đề xuất phát triển kỹ năng mạnh
    if 'best_language' in analytics:
        recs.append(f"Phát triển thêm kỹ năng về {analytics['best_language']}")
    if 'best_soft_skill' in analytics:
        recs.append(f"Rèn luyện kỹ năng mềm: {analytics['best_soft_skill']}")
    # Đề xuất theo chủ đề hỏi nhiều
    if 'most_asked_topic' in analytics:
        recs.append(f"Ôn tập chủ đề: {analytics['most_asked_topic']}")
    # Đề xuất học theo phong cách
    pls = data.get('interaction_logs', {}).get('preferred_learning_style')
    if pls:
        recs.append(f"Bạn nên tiếp tục học theo phong cách '{pls}'")
    return recs 