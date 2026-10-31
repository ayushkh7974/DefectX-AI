import os
import glob
from pathlib import Path
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query, status
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.inspection import Inspection
from app.models.product import Product
from app.schemas.all_schemas import InspectionOut
from app.services.inspection_service import inspection_service
from app.services.video_service import video_service
from app.core.config import settings

router = APIRouter(prefix="/inspection", tags=["Inspection"])

@router.post("/image")
async def inspect_image(
    file: UploadFile = File(...),
    product_code: Optional[str] = Form(None),
    batch_id: Optional[int] = Form(None),
    db: Session = Depends(get_db)
):
    """
    Performs AI inference on a product casting image, assesses severity, and recommends decision.
    """
    content = await file.read()
    if len(content) == 0:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    try:
        result = inspection_service.inspect_image(
            db=db,
            image_bytes=content,
            filename=file.filename or "upload.jpg",
            product_code=product_code,
            batch_id=batch_id,
            source="image_upload"
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Inspection failed: {str(e)}")

@router.post("/video")
async def inspect_video(
    file: UploadFile = File(...),
    sample_every_n_frames: int = Form(15),
    db: Session = Depends(get_db)
):
    """
    Processes a video file frame-by-frame through the AI inspection pipeline.
    """
    content = await file.read()
    if len(content) == 0:
        raise HTTPException(status_code=400, detail="Uploaded video file is empty.")

    try:
        result = video_service.process_video_file(
            db=db,
            video_bytes=content,
            filename=file.filename or "conveyor.mp4",
            sample_every_n_frames=sample_every_n_frames
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Video inspection failed: {str(e)}")

@router.post("/webcam")
async def inspect_webcam_frame(
    file: UploadFile = File(...),
    product_code: Optional[str] = Form(None),
    db: Session = Depends(get_db)
):
    """
    Inspects a snapshot captured from the live webcam stream.
    """
    content = await file.read()
    if len(content) == 0:
        raise HTTPException(status_code=400, detail="No webcam frame data provided.")

    try:
        result = inspection_service.inspect_image(
            db=db,
            image_bytes=content,
            filename="webcam_capture.jpg",
            product_code=product_code,
            source="webcam"
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Webcam inspection failed: {str(e)}")

@router.get("/history")
def get_inspection_history(
    status_filter: Optional[str] = Query(None, alias="status"),
    severity_filter: Optional[str] = Query(None, alias="severity"),
    limit: int = Query(50, le=200),
    db: Session = Depends(get_db)
):
    """
    Retrieves historical inspection records with product, defect, and decision details.
    """
    query = db.query(Inspection)
    if status_filter:
        query = query.filter(Inspection.status == status_filter.upper())
    if severity_filter:
        query = query.filter(Inspection.severity == severity_filter.upper())

    inspections = query.order_by(Inspection.id.desc()).limit(limit).all()
    
    results = []
    for insp in inspections:
        prod = insp.product
        results.append({
            "id": insp.id,
            "product_id": insp.product_id,
            "product_code": prod.product_code if prod else "UNKNOWN",
            "image_path": insp.image_path,
            "heatmap_path": insp.heatmap_path,
            "status": insp.status,
            "anomaly_score": insp.anomaly_score,
            "threshold": insp.threshold,
            "confidence": insp.confidence,
            "defect_type": insp.defect_type,
            "severity": insp.severity,
            "recommended_decision": insp.recommended_decision,
            "processing_time_ms": insp.processing_time_ms,
            "source": insp.source,
            "inspected_at": insp.inspected_at.isoformat(),
            "decision": {
                "decision": insp.decision.decision if insp.decision else insp.recommended_decision,
                "reason": insp.decision.reason if insp.decision else "",
                "is_override": insp.decision.is_override if insp.decision else False
            } if insp.decision else None
        })
    return results

@router.get("/samples")
def get_sample_images():
    """
    Returns lists of sample OK and Defective images from the real dataset for instant testing in the UI.
    """
    sample_dir = settings.DATASET_DIR
    def_samples = []
    ok_samples = []

    # Search for def_front and ok_front test images
    def_paths = glob.glob(str(sample_dir / "**" / "test" / "def_front" / "*.jpeg"), recursive=True) or \
                glob.glob(str(sample_dir / "**" / "def_front" / "*.jpeg"), recursive=True) or \
                glob.glob(str(sample_dir / "**" / "def_front" / "*.png"), recursive=True)
    
    ok_paths = glob.glob(str(sample_dir / "**" / "test" / "ok_front" / "*.jpeg"), recursive=True) or \
               glob.glob(str(sample_dir / "**" / "ok_front" / "*.jpeg"), recursive=True) or \
               glob.glob(str(sample_dir / "**" / "ok_front" / "*.png"), recursive=True)

    # Copy 6 samples of each into uploads/samples for web serving
    samples_dir = settings.UPLOAD_DIR / "samples"
    samples_dir.mkdir(parents=True, exist_ok=True)

    import shutil
    for idx, p in enumerate(def_paths[:6]):
        dst = samples_dir / f"def_sample_{idx+1}.jpg"
        if not dst.exists():
            shutil.copy(p, dst)
        def_samples.append({
            "name": f"Defective Casting #{idx+1}",
            "type": "DEFECTIVE",
            "url": f"/uploads/samples/def_sample_{idx+1}.jpg"
        })

    for idx, p in enumerate(ok_paths[:6]):
        dst = samples_dir / f"ok_sample_{idx+1}.jpg"
        if not dst.exists():
            shutil.copy(p, dst)
        ok_samples.append({
            "name": f"Normal Casting #{idx+1}",
            "type": "OK",
            "url": f"/uploads/samples/ok_sample_{idx+1}.jpg"
        })

    return {
        "defective_samples": def_samples,
        "normal_samples": ok_samples
    }

@router.get("/{inspection_id}")
def get_inspection_detail(inspection_id: int, db: Session = Depends(get_db)):
    """
    Returns full inspection details including defect regions and decision history.
    """
    insp = db.query(Inspection).filter(Inspection.id == inspection_id).first()
    if not insp:
        raise HTTPException(status_code=404, detail="Inspection record not found.")

    prod = insp.product
    batch = prod.batch if prod else None

    import json
    defects = []
    for d in insp.defects:
        defects.append({
            "id": d.id,
            "defect_type": d.defect_type,
            "confidence": d.confidence,
            "severity": d.severity,
            "location_data": json.loads(d.location_data) if d.location_data else None
        })

    return {
        "id": insp.id,
        "product_id": insp.product_id,
        "product_code": prod.product_code if prod else "UNKNOWN",
        "batch_number": batch.batch_number if batch else "B2026-01",
        "machine_id": batch.machine_id if batch else "DC-CELL-02",
        "image_path": insp.image_path,
        "heatmap_path": insp.heatmap_path,
        "status": insp.status,
        "anomaly_score": insp.anomaly_score,
        "threshold": insp.threshold,
        "confidence": insp.confidence,
        "defect_type": insp.defect_type,
        "severity": insp.severity,
        "recommended_decision": insp.recommended_decision,
        "processing_time_ms": insp.processing_time_ms,
        "source": insp.source,
        "inspected_at": insp.inspected_at.isoformat(),
        "defects": defects,
        "decision": {
            "id": insp.decision.id,
            "decision": insp.decision.decision,
            "reason": insp.decision.reason,
            "approved_by": insp.decision.approved_by,
            "is_override": insp.decision.is_override,
            "override_reason": insp.decision.override_reason,
            "created_at": insp.decision.created_at.isoformat()
        } if insp.decision else None,
        "report": {
            "id": insp.report.id,
            "report_code": insp.report.report_code,
            "report_path": insp.report.report_path,
            "generated_at": insp.report.generated_at.isoformat()
        } if insp.report else None
    }
