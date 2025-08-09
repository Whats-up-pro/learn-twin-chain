import os
import json
import time
import unittest
from pathlib import Path

# Ensure backend path
BACKEND_DIR = Path(__file__).resolve().parent.parent
import sys
if str(BACKEND_DIR) not in sys.path:
    sys.path.append(str(BACKEND_DIR))

from digital_twin.services.digital_twin_storage import save_digital_twin, load_digital_twin
from digital_twin.services.digital_twin_service import update_twin_and_pin_to_ipfs
from digital_twin.services.blockchain_service import BlockchainService
from digital_twin.services.ipfs_service import IPFSService


class TestDigitalTwinFlow(unittest.TestCase):
    def setUp(self):
        # Create a minimal DT
        self.did = "did:learntwin:teststudent001"
        self.twin = {
            "twin_id": self.did,
            "owner_did": self.did,
            "latest_cid": None,
            "profile": {
                "full_name": "Test Student",
                "birth_year": 2000,
                "institution": "UIT",
                "program": "CS",
                "enrollment_date": "2024-01-01"
            },
            "learning_state": {
                "current_modules": ["blockchain101"],
                "progress": {"blockchain101": 0.5},
                "checkpoint_history": []
            },
            "skill_profile": {
                "programming_languages": {"python": 0.6},
                "soft_skills": {"communication": 0.4}
            },
            "interaction_logs": {"most_asked_topics": ["zkp"], "preferred_learning_style": "code-first"}
        }
        save_digital_twin(self.did, self.twin)
        self.blockchain = BlockchainService()

    def test_ipfs_pin_and_local_save(self):
        twin = load_digital_twin(self.did)
        twin["learning_state"]["progress"]["blockchain101"] = 1.0
        # If IPFS is not configured, this may raise
        try:
            result = update_twin_and_pin_to_ipfs(twin)
        except Exception as e:
            ipfs = IPFSService()
            self.skipTest(f"IPFS not configured: {e}")
        self.assertEqual(result["status"], "success")
        self.assertIn("ipfs_cid", result)
        self.assertIn("version", result)

    def test_onchain_anchor_if_available(self):
        if not self.blockchain.is_available():
            self.skipTest("Blockchain not available in environment")
        twin = load_digital_twin(self.did)
        # Ensure a bump to force new pin
        twin["learning_state"]["progress"]["blockchain101"] = 1.0
        pin_res = update_twin_and_pin_to_ipfs(twin)
        pinned_payload = pin_res.get("pinned_payload") or twin
        version = pin_res.get("version", 1)
        anchor = self.blockchain.log_twin_update(self.did, version, pinned_payload, ipfs_cid=pin_res["ipfs_cid"])
        self.assertTrue(anchor.get("success"), msg=f"Anchor failed: {anchor}")
        self.assertIn("tx_hash", anchor)


if __name__ == "__main__":
    unittest.main()

