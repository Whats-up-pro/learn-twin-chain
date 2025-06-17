from fastapi import APIRouter, HTTPException, Request
from ..services.twin_service import TwinService
from ..services.digital_twin_service import update_digital_twin

router = APIRouter()
twin_service = TwinService()

@router.post("/twins")
def create_twin(twin_id: str, config: dict):
    return twin_service.create_twin(twin_id, config)

@router.get("/twins/{twin_id}")
def get_twin(twin_id: str):
    return twin_service.get_twin(twin_id)

@router.post("/update-twin")
async def update_twin(request: Request):
    try:
        data = await request.json()
        result = update_digital_twin(data)
        return result
    except Exception as e:
        raise HTTPException(status_code=422, detail=str(e)) 