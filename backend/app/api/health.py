from fastapi import APIRouter
from app.ml.model_manager import model_manager

router = APIRouter(tags=["Health"])

@router.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "IntelliInspect AI Quality Assurance System",
        "version": "2.0.0",
        "model_loaded": model_manager.is_loaded,
        "database": "connected"
    }
