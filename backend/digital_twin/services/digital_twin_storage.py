import os
import json
from typing import Dict, Any

DT_STORAGE_DIR = os.path.join(os.path.dirname(__file__), '../../data/digital_twins')
os.makedirs(DT_STORAGE_DIR, exist_ok=True)

def safe_filename(twin_id: str) -> str:
    # Thay thế các ký tự không hợp lệ bằng dấu gạch dưới
    return "".join(c if c.isalnum() or c in "-_" else "_" for c in twin_id)

def save_digital_twin(twin_id: str, data: Dict[str, Any]):
    file_path = os.path.join(DT_STORAGE_DIR, f"dt_{safe_filename(twin_id)}.json")
    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

def load_digital_twin(twin_id: str) -> Dict[str, Any]:
    file_path = os.path.join(DT_STORAGE_DIR, f"dt_{safe_filename(twin_id)}.json")
    if not os.path.exists(file_path):
        return {}
    with open(file_path, 'r', encoding='utf-8') as f:
        return json.load(f)