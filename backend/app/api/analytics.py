from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.services.analytics_service import analytics_service
from app.services.root_cause_service import root_cause_service
from app.schemas.all_schemas import OverviewStats

router = APIRouter(prefix="/analytics", tags=["Quality Analytics & Root Cause"])

@router.get("/overview", response_model=OverviewStats)
def get_overview_analytics(db: Session = Depends(get_db)):
    """
    Returns high-level quality metrics: total inspected, pass/fail counts, yield, defect rate.
    """
    return analytics_service.get_overview_stats(db)

@router.get("/defects")
def get_defect_distribution(db: Session = Depends(get_db)):
    """
    Returns frequency distribution of defect classifications.
    """
    return analytics_service.get_defect_distribution(db)

@router.get("/batches")
def get_batch_analytics(db: Session = Depends(get_db)):
    """
    Returns batch-level quality yield and defect rates.
    """
    return analytics_service.get_batch_analytics(db)

@router.get("/trends")
def get_quality_trends(db: Session = Depends(get_db)):
    """
    Returns time-series quality and defect trends.
    """
    return analytics_service.get_quality_trends(db)

@router.get("/root-cause")
def get_root_cause_analysis(db: Session = Depends(get_db)):
    """
    Provides machine correlation, repeated defect identification, suspected vs confirmed causes, and corrective actions.
    """
    return root_cause_service.analyze_patterns(db)
