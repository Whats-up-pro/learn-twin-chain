import os
import json
import requests
import logging
from ..models.student_twin import StudentTwin
from .ipfs_service import IPFSService

logger = logging.getLogger(__name__)

class LearningService:
    """
    Service quản lý học tập cho học sinh.
    """
    def __init__(self):
        self.students = {}
        self.ipfs_service = IPFSService()
        self.load_students_from_files()

    def load_students_from_files(self):
        # Đường dẫn tới backend/data/digital_twins
        data_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', 'data', 'digital_twins'))
        if not os.path.isdir(data_dir):
            return
        for fname in os.listdir(data_dir):
            if fname.endswith('.json'):
                fpath = os.path.join(data_dir, fname)
                try:
                    with open(fpath, 'r', encoding='utf-8') as f:
                        data = json.load(f)
                        twin_id = data.get('twin_id')
                        if twin_id:
                            self.students[twin_id] = data
                except UnicodeDecodeError:
                    # Fallback to cp1252 if utf-8 fails
                    with open(fpath, 'r', encoding='cp1252') as f:
                        data = json.load(f)
                        twin_id = data.get('twin_id')
                        if twin_id:
                            self.students[twin_id] = data

    def reload_students(self):
        """Reload dữ liệu từ files"""
        self.students = {}
        self.load_students_from_files()

    def create_student_twin(self, twin_id: str, config: dict, profile: dict):
        twin = StudentTwin(twin_id, config, profile)
        self.students[twin_id] = twin
        return twin

    def get_student_twin(self, twin_id: str):
        # Try in-memory first
        twin = self.students.get(twin_id)
        if twin is not None:
            return twin
        
        # Attempt to lazily load from file if available
        try:
            data_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', 'data', 'digital_twins'))
            safe_filename = twin_id.replace(':', '_').replace('/', '_').replace('\\', '_')
            safe_filename = f"dt_{safe_filename}.json"
            fpath = os.path.join(data_dir, safe_filename)
            if os.path.isfile(fpath):
                try:
                    with open(fpath, 'r', encoding='utf-8') as f:
                        data = json.load(f)
                except UnicodeDecodeError:
                    with open(fpath, 'r', encoding='cp1252') as f:
                        data = json.load(f)
                if data and data.get('twin_id') == twin_id:
                    self.students[twin_id] = data
                    return data
        except Exception:
            pass
        
        # Try to fetch from IPFS if local file doesn't exist
        try:
            ipfs_data = self._fetch_twin_from_ipfs(twin_id)
            if ipfs_data:
                # Cache the IPFS data locally for future use
                self._save_twin_locally(twin_id, ipfs_data)
                self.students[twin_id] = ipfs_data
                return ipfs_data
        except Exception as e:
            logger.warning(f"Failed to fetch twin from IPFS: {e}")
        
        # As a last resort, reload all
        self.reload_students()
        return self.students.get(twin_id)

    def get_normalized_student_twin(self, twin_id: str):
        """Return a normalized twin dict regardless of upstream schema variations."""
        raw = self.get_student_twin(twin_id)
        if not raw:
            # Auto-create a minimal default twin so downstream AI features can work
            try:
                raw = self._create_default_twin(twin_id)
            except Exception:
                return None
        return self._normalize_twin_data(raw)

    def _normalize_twin_data(self, data: dict) -> dict:
        # Base structure
        normalized = {
            "twin_id": data.get("twin_id") or data.get("learnerDid"),
            "profile": data.get("profile", {}),
            "skills": {},
            "behavior": {
                "timeSpent": None,
                "quizAccuracy": None,
                "lastLlmSession": None,
                "preferredLearningStyle": None,
                "mostAskedTopics": []
            },
            "learning_progress": [],
            "completed_modules": [],
            "overall_progress": None
        }

        # Skills
        if "skills" in data and isinstance(data["skills"], dict):
            normalized["skills"] = data["skills"]
        else:
            prog_lang = data.get("skill_profile", {}).get("programming_languages", {})
            if isinstance(prog_lang, dict):
                normalized["skills"].update(prog_lang)

        # Behavior mapping
        behavior = data.get("behavior", {}) if isinstance(data.get("behavior"), dict) else {}
        inter = data.get("interaction_logs", {}) if isinstance(data.get("interaction_logs"), dict) else {}
        normalized["behavior"]["quizAccuracy"] = behavior.get("quizAccuracy")
        normalized["behavior"]["preferredLearningStyle"] = behavior.get("preferredLearningStyle") or inter.get("preferred_learning_style")
        normalized["behavior"]["lastLlmSession"] = behavior.get("lastLlmSession") or inter.get("last_llm_session")
        normalized["behavior"]["mostAskedTopics"] = behavior.get("mostAskedTopics") or inter.get("most_asked_topics") or []

        # Learning progress
        if isinstance(data.get("learning_progress"), list):
            normalized["learning_progress"] = data["learning_progress"]
        else:
            progress_map = data.get("learning_state", {}).get("progress", {})
            if isinstance(progress_map, dict):
                # Convert to list of entries
                normalized["learning_progress"] = [
                    {"module": k, "progress": v} for k, v in progress_map.items()
                ]
        # Completed modules
        ch = data.get("learning_state", {}).get("checkpoint_history", [])
        if isinstance(ch, list):
            normalized["completed_modules"] = [e.get("module") for e in ch if isinstance(e, dict) and e.get("module")]

        # Overall progress estimate
        try:
            values = []
            if isinstance(progress_map, dict):
                values += [v for v in progress_map.values() if isinstance(v, (int, float))]
            if isinstance(normalized["skills"], dict):
                values += [v for v in normalized["skills"].values() if isinstance(v, (int, float))]
            normalized["overall_progress"] = sum(values) / len(values) if values else 0.0
        except Exception:
            normalized["overall_progress"] = 0.0

        return normalized

    def list_student_twins(self):
        """Trả về danh sách tất cả student twins"""
        # Reload dữ liệu trước khi trả về để đảm bảo cập nhật
        self.reload_students()
        students_list = list(self.students.values())
        return {
            "total": len(students_list),
            "students": students_list
        }

    def update_student_twin(self, twin_id: str, updated_data: dict):
        """Cập nhật thông tin student twin"""
        if twin_id not in self.students:
            raise ValueError(f"Student twin {twin_id} not found")
        
        # Cập nhật trong memory
        self.students[twin_id] = updated_data
        
        # Cập nhật file - tạo tên file hợp lệ từ DID
        data_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', 'data', 'digital_twins'))
        
        # Tạo tên file hợp lệ với prefix 'dt_' và thay thế ký tự không hợp lệ
        safe_filename = twin_id.replace(':', '_').replace('/', '_').replace('\\', '_')
        safe_filename = f"dt_{safe_filename}"
        file_path = os.path.join(data_dir, f"{safe_filename}.json")
        
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(updated_data, f, indent=2, ensure_ascii=False)
        
        return updated_data

    def get_student_twin_file_path(self, twin_id: str) -> str:
        """Lấy đường dẫn file cho student twin"""
        data_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', 'data', 'digital_twins'))
        safe_filename = twin_id.replace(':', '_').replace('/', '_').replace('\\', '_')
        safe_filename = f"dt_{safe_filename}"
        return os.path.join(data_dir, f"{safe_filename}.json") 

    def _fetch_twin_from_ipfs(self, twin_id: str) -> dict:
        """Fetch digital twin data from IPFS using known CIDs or URL patterns."""
        try:
            # Known IPFS URLs for digital twins
            known_cids = {
                "did:learntwin:tranduongminhdai": "bafkreievnw5jwmwltmejd2u7chhdmk75ozkkkcjmy26amz33nsgxaxhzti",
                # Add more known CIDs as needed
            }
            
            # Try known CIDs first
            cid = known_cids.get(twin_id)
            if cid:
                logger.info(f"Fetching twin from IPFS CID: {cid}")
                return self._fetch_from_ipfs_cid(cid)
            
            # Try to extract CID from twin_id if it contains IPFS info
            # This could be extended to support more patterns
            if "ipfs" in twin_id.lower() or "bafkrei" in twin_id.lower():
                # Extract CID from various formats
                cid = self._extract_cid_from_string(twin_id)
                if cid:
                    logger.info(f"Extracted CID from twin_id: {cid}")
                    return self._fetch_from_ipfs_cid(cid)
            
            # Try common gateway URLs for this twin
            gateway_urls = [
                f"https://chocolate-recent-tahr-225.mypinata.cloud/ipfs/bafkreievnw5jwmwltmejd2u7chhdmk75ozkkkcjmy26amz33nsgxaxhzti",
                f"https://chocolate-recent-tahr-225.mypinata.cloud/ipfs/bafkreiafubyns6sno42blp6o6x6xxweuttk4x7czfzomvppz72kticrnri"
            ]
            
            for url in gateway_urls:
                try:
                    logger.info(f"Trying to fetch from gateway URL: {url}")
                    response = requests.get(url, timeout=30)
                    if response.status_code == 200:
                        data = response.json()
                        if data.get('twin_id') == twin_id or data.get('owner_did') == twin_id:
                            logger.info(f"Successfully fetched twin from IPFS gateway")
                            return data
                except Exception as e:
                    logger.debug(f"Failed to fetch from {url}: {e}")
                    continue
            
            return None
            
        except Exception as e:
            logger.error(f"Error fetching twin from IPFS: {e}")
            return None
    
    def _fetch_from_ipfs_cid(self, cid: str) -> dict:
        """Fetch data from IPFS using CID."""
        try:
            # Try multiple gateways
            gateways = [
                "https://chocolate-recent-tahr-225.mypinata.cloud/ipfs/",
                "https://gateway.pinata.cloud/ipfs/",
                "https://cloudflare-ipfs.com/ipfs/"
            ]
            
            for gateway in gateways:
                try:
                    url = f"{gateway}{cid}"
                    response = requests.get(url, timeout=30)
                    if response.status_code == 200:
                        data = response.json()
                        logger.info(f"Successfully fetched from {gateway}")
                        return data
                except Exception as e:
                    logger.debug(f"Failed to fetch from {gateway}: {e}")
                    continue
            
            return None
            
        except Exception as e:
            logger.error(f"Error fetching from IPFS CID {cid}: {e}")
            return None
    
    def _extract_cid_from_string(self, text: str) -> str:
        """Extract IPFS CID from various string formats."""
        import re
        
        # Pattern for IPFS CIDs (bafkrei...)
        cid_pattern = r'bafkrei[a-z0-9]{50}'
        match = re.search(cid_pattern, text)
        if match:
            return match.group(0)
        
        # Pattern for Qm... CIDs
        qm_pattern = r'Qm[a-zA-Z0-9]{44}'
        match = re.search(qm_pattern, text)
        if match:
            return match.group(0)
        
        return None
    
    def _save_twin_locally(self, twin_id: str, data: dict):
        """Save twin data locally for caching."""
        try:
            data_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', 'data', 'digital_twins'))
            os.makedirs(data_dir, exist_ok=True)
            
            file_path = self.get_student_twin_file_path(twin_id)
            with open(file_path, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=2, ensure_ascii=False)
            
            logger.info(f"Cached twin data locally: {file_path}")
            
        except Exception as e:
            logger.error(f"Failed to save twin locally: {e}")

    def _create_default_twin(self, twin_id: str) -> dict:
        """Create and persist a minimal default twin if none exists for the given twin_id."""
        data_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', 'data', 'digital_twins'))
        os.makedirs(data_dir, exist_ok=True)

        # Minimal but useful defaults for AI features
        default_twin = {
            "twin_id": twin_id,
            "profile": {
                "name": twin_id.split(':')[-1] if isinstance(twin_id, str) else "Learner",
                "program": "Computer Science"
            },
            "skills": {
                "python": 50,
                "javascript": 45
            },
            "behavior": {
                "timeSpent": 0,
                "quizAccuracy": 0.0,
                "lastLlmSession": None,
                "preferredLearningStyle": None,
                "mostAskedTopics": []
            },
            "learning_progress": [],
            "learning_state": {
                "progress": {},
                "checkpoint_history": []
            }
        }

        # Persist to disk and memory
        file_path = self.get_student_twin_file_path(twin_id)
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(default_twin, f, indent=2, ensure_ascii=False)
        self.students[twin_id] = default_twin
        return default_twin