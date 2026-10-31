import os
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.inspection import Inspection
from app.models.report import Report
from app.services.report_service import generate_pdf_report
from app.core.config import settings

router = APIRouter(prefix="/reports", tags=["Inspection Reports"])

@router.post("/generate/{inspection_id}")
def create_report(inspection_id: int, db: Session = Depends(get_db)):
    """
    Generates a professional downloadable PDF certificate for a given inspection ID.
    """
    insp = db.query(Inspection).filter(Inspection.id == inspection_id).first()
    if not insp:
        raise HTTPException(status_code=404, detail="Inspection not found.")

    prod = insp.product
    batch = prod.batch if prod else None

    # Check if report already exists
    existing = db.query(Report).filter(Report.inspection_id == inspection_id).first()
    if existing and os.path.exists(existing.report_path):
        return {
            "id": existing.id,
            "report_code": existing.report_code,
            "report_path": f"/api/reports/{existing.id}",
            "generated_at": existing.generated_at.isoformat()
        }

    # Resolve image filesystem paths
    img_fs = settings.BACKEND_DIR / insp.image_path.lstrip("/")
    heat_fs = settings.BACKEND_DIR / (insp.heatmap_path.lstrip("/") if insp.heatmap_path else "")

    report_code, file_path = generate_pdf_report(
        inspection_id=insp.id,
        product_code=prod.product_code if prod else f"PROD-{insp.id}",
        batch_number=batch.batch_number if batch else "B2026-01",
        machine_id=batch.machine_id if batch else "DC-CELL-02",
        status=insp.status,
        decision=insp.decision.decision if insp.decision else insp.recommended_decision,
        severity=insp.severity,
        confidence=insp.confidence,
        anomaly_score=insp.anomaly_score,
        threshold=insp.threshold,
        defect_type=insp.defect_type,
        reason=insp.decision.reason if insp.decision else "Standard automated QA inspection.",
        image_path=str(img_fs),
        heatmap_path=str(heat_fs) if insp.heatmap_path else "",
        regions=[]
    )

    report = Report(
        inspection_id=insp.id,
        report_code=report_code,
        report_path=str(file_path)
    )
    db.add(report)
    db.commit()
    db.refresh(report)

    return {
        "id": report.id,
        "report_code": report.report_code,
        "report_path": f"/api/reports/{report.id}",
        "generated_at": report.generated_at.isoformat()
    }

@router.get("/{report_id}")
def download_report(report_id: int, db: Session = Depends(get_db)):
    """
    Downloads the generated PDF inspection report.
    """
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found.")

    if not os.path.exists(report.report_path):
        raise HTTPException(status_code=404, detail="Report file not found on disk.")

    return FileResponse(
        path=report.report_path,
        media_type="application/pdf",
        filename=os.path.basename(report.report_path)
    )
