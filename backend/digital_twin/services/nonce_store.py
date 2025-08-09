import time
from typing import Dict


class NonceStore:
    """In-memory store for challenge nonces with TTL and single-use semantics."""

    def __init__(self, default_ttl_seconds: int = 300):
        self._nonces: Dict[str, Dict[str, int]] = {}
        self._default_ttl = default_ttl_seconds

    def add_nonce(self, nonce: str, ttl_seconds: int = None) -> None:
        ttl = ttl_seconds if ttl_seconds is not None else self._default_ttl
        self._nonces[nonce] = {
            'created_at': int(time.time()),
            'ttl': int(ttl),
            'used': 0
        }

    def validate_and_consume(self, nonce: str) -> bool:
        info = self._nonces.get(nonce)
        now = int(time.time())
        if not info:
            return False
        # Expired
        if now - info['created_at'] > info['ttl']:
            # Remove expired
            try:
                del self._nonces[nonce]
            except Exception:
                pass
            return False
        # Already used
        if info['used']:
            return False
        # Mark as used
        info['used'] = 1
        return True


# Global singleton for app-wide usage
GLOBAL_NONCE_STORE = NonceStore()

