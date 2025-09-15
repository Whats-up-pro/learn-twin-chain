# backend/digital_twin/api/rag_api.py
import os
import sys
from pathlib import Path
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from pydantic import BaseModel

# === Cho phép import backend/rag/rag.py ===
# File này nằm ở: backend/digital_twin/api/rag_api.py
# parents[0] -> api, [1] -> digital_twin, [2] -> backend
BACKEND_DIR = Path(__file__).resolve().parents[2]
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

# Class RAG của bạn ở backend/rag/rag.py
from rag.rag import LearnTwinRAGAgent  # chỉnh nếu tên file/class khác

router = APIRouter(prefix="/rag", tags=["rag"])

# --- Lazy singleton ---
_AGENT: Optional[LearnTwinRAGAgent] = None
def get_agent() -> LearnTwinRAGAgent:
    global _AGENT
    if _AGENT is None:
        _AGENT = LearnTwinRAGAgent(
            collection_name=os.getenv("MILVUS_COLLECTION", "learntwinchain"),
            embedding_model=os.getenv("EMBED_MODEL", "BAAI/bge-large-en-v1.5"),
            verbose=1,
        )
    return _AGENT

# --- Schemas ---
class RagChatReq(BaseModel):
    query: str
    digital_twin: Dict[str, Any] = {}
    context_type: str = "learning"   # learning | exercise | assessment | general
    top_k: int = 5
    max_tokens: int = 2048
    temperature: float = 0.1

# --- Endpoints ---
@router.post("/chat")
async def rag_chat(req: RagChatReq):
    agent = get_agent()
    res = agent.query(
        question=req.query,
        context_type=req.context_type,
        max_tokens=req.max_tokens,
        temperature=req.temperature,
        top_k=req.top_k,
    )
    if not res.get("success"):
        raise HTTPException(status_code=400, detail=res.get("error", "RAG query failed"))

    contexts: List[Dict[str, Any]] = []
    for d in res.get("source_documents", []):
        contexts.append({
            "text": d.get("content", ""),
            "source": d.get("source") or (d.get("metadata") or {}).get("source"),
            "score": None
        })

    return {"answer": res.get("answer", ""), "contexts": contexts}

@router.get("/stats")
async def rag_stats():
    agent = get_agent()
    return agent.get_knowledge_base_stats()

@router.get("/search")
async def rag_search(query: str, k: int = 10, document_type: Optional[str] = None):
    agent = get_agent()
    results = agent.search_documents(query=query, k=k, document_type=document_type)
    return {"query": query, "k": k, "results": results}

@router.post("/upload")
async def rag_upload(file: UploadFile = File(...), metadata_json: Optional[str] = Form(None)):
    """Upload 1 file vào KB (multipart/form-data)."""
    agent = get_agent()

    tmp_path = BACKEND_DIR / "cache" / f"rag_upload_{file.filename}"
    tmp_path.parent.mkdir(parents=True, exist_ok=True)
    with open(tmp_path, "wb") as f:
        f.write(await file.read())

    metadata = None
    if metadata_json:
        import json
        try:
            metadata = json.loads(metadata_json)
        except Exception:
            metadata = None

    ok = agent.upload_document(str(tmp_path), metadata=metadata)
    if not ok:
        raise HTTPException(status_code=400, detail="Failed to upload/process document")

    return {"filename": file.filename, "uploaded": True}
