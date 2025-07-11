import json
import jsonschema
from datetime import datetime
from typing import Dict, Any
import os
import requests
from dotenv import load_dotenv
from ..utils.date_utils import get_current_vietnam_time_iso

from ..services.digital_twin_storage import save_digital_twin, load_digital_twin

# Tải biến môi trường từ .env
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '../../.env'))

PINATA_API_KEY = os.getenv("PINATA_API_KEY")
PINATA_SECRET_API_KEY = os.getenv("PINATA_SECRET_API_KEY")
PINATA_API_URL = "https://api.pinata.cloud/pinning/pinJSONToIPFS"

# Load schema một lần khi khởi động
SCHEMA_PATH = os.path.join(os.path.dirname(__file__), '../learner_digital_twin.schema.json')
with open(SCHEMA_PATH, 'r', encoding='utf-8') as f:
    TWIN_SCHEMA = json.load(f)

def validate_twin_data(data: Dict[str, Any]):
    jsonschema.validate(instance=data, schema=TWIN_SCHEMA)

def _pin_json_to_ipfs(json_data: Dict[str, Any]) -> str:
    """Pins a JSON object to IPFS using Pinata and returns the CID."""
    if not PINATA_API_KEY or not PINATA_SECRET_API_KEY:
        raise ValueError("Pinata API keys are not configured in .env file.")

    headers = {
        "Content-Type": "application/json",
        "pinata_api_key": PINATA_API_KEY,
        "pinata_secret_api_key": PINATA_SECRET_API_KEY,
    }
    
    # Đồng bộ tên file: DigitalTwin_{student_id}_v{version}.json
    student_id = json_data.get('twin_id', 'unknown')
    version = json_data.get('version', 1)
    file_name = f"DigitalTwin_{student_id}_v{version}.json"

    body = {
        "pinataMetadata": {
            "name": file_name
        },
        "pinataContent": json_data
    }

    try:
        response = requests.post(PINATA_API_URL, json=body, headers=headers)
        response.raise_for_status()  # Ném lỗi nếu status code là 4xx hoặc 5xx
        return response.json()["IpfsHash"]
    except requests.exceptions.RequestException as e:
        print(f"Error pinning to IPFS: {e}")
        # Cân nhắc việc log lỗi chi tiết hơn ở đây
        raise

def update_twin_and_pin_to_ipfs(data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Updates a digital twin, pins the new state to IPFS, adds the new CID
    to the state, and then saves it locally.
    """
    # 1. Validate schema before doing anything
    validate_twin_data(data)
    twin_id = data['twin_id']
    
    # 2. Pin the current state (without the new CID yet) to IPFS
    print(f"Pinning data for {twin_id} to IPFS...")
    new_cid = _pin_json_to_ipfs(data)
    print(f"Successfully pinned. New CID: {new_cid}")

    # 3. Add the new CID to the data
    data['latest_cid'] = new_cid

    # 4. Save the final state (with the CID) locally
    ordered_data = {
        "twin_id": data.get("twin_id"),
        "owner_did": data.get("owner_did"),
        "latest_cid": new_cid,
        "profile": data.get("profile"),
        "learning_state": data.get("learning_state"),
        "skill_profile": data.get("skill_profile"),
        "interaction_logs": data.get("interaction_logs")
    }

    # 5. Save the final, ordered state locally
    print(f"Saving final state for {twin_id} with new CID...")
    save_digital_twin(twin_id, ordered_data)
    
    # 6. Return a success response
    return {
        "status": "success",
        "twin_id": twin_id,
        "updated_at": get_current_vietnam_time_iso(),
        "ipfs_cid": new_cid
    }

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
        "updated_at": get_current_vietnam_time_iso(),
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