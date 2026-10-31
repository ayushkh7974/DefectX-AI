import os
import time
import uuid
import json
from io import BytesIO
from typing import Optional, Dict, Any, List
from PIL import Image
import cv2
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.product import Product
from app.models.batch import Batch
from app.models.inspection import Inspection
from app.models.defect import Defect
from app.models.decision import Decision
from app.models.notification import Notification
from app.ml.model_manager import model_manager
from app.ml.patchcore import find_defect_regions, render_annotated_overlay
from app.ml.severity import severity_engine

class InspectionService:
    @staticmethod
    def inspect_image(
        db: Session,
        image_bytes: bytes,
        filename: str = "upload.jpg",
        product_code: Optional[str] = None,
        batch_id: Optional[int] = None,
        source: str = "image_upload"
    ) -> Dict[str, Any]:
        """
        Full end-to-end inspection pipeline for a single casting image.
        """
        # Ensure model is ready
        if not model_manager.is_loaded or model_manager.model is None:
            model_manager.load_model()
            if not model_manager.is_loaded:
                raise RuntimeError("AI Inspection model is not ready. Check model checkpoint.")

        # 1. Read Image
        try:
            img = Image.open(BytesIO(image_bytes)).convert("RGB")
        except Exception as e:
            raise ValueError(f"Invalid image format: {e}")

        # 2. Run AI Model Inference
        t0 = time.perf_counter()
        score, amap = model_manager.model.score(img)
        inference_ms = round((time.perf_counter() - t0) * 1000, 2)

        threshold = model_manager.model.threshold
        w, h = img.size

        # 3. Defect Localization & Regions
        regions = find_defect_regions(amap, threshold, img_size=(w, h))

        # 4. Severity & Smart Decision Assessment
        eval_result = severity_engine.evaluate(score, threshold, regions, img_dimensions=(w, h))
        status = eval_result["status"]
        severity = eval_result["severity"]
        decision_val = eval_result["decision"]
        confidence = eval_result["confidence"]
        primary_defect = eval_result["primary_defect"]
        reason = eval_result["reason"]

        # 5. Save Original and Annotated Images
        uid = uuid.uuid4().hex[:10]
        orig_filename = f"{uid}_orig_{filename}"
        heat_filename = f"{uid}_annotated.jpg"

        orig_path = settings.UPLOAD_DIR / orig_filename
        heat_path = settings.UPLOAD_DIR / heat_filename

        img.save(str(orig_path), quality=95)

        annotated_img = render_annotated_overlay(img, amap, threshold, regions, status, severity)
        cv2.imwrite(str(heat_path), cv2.cvtColor(annotated_img, cv2.COLOR_RGB2BGR))

        # 6. Database Persistence
        # Resolve or create Product
        if not product_code:
            product_code = f"CAST-{datetime_code()}-{uid[:4].upper()}"

        product = db.query(Product).filter(Product.product_code == product_code).first()
        if not product:
            # Default to first batch if batch_id is None
            if not batch_id:
                first_batch = db.query(Batch).first()
                batch_id = first_batch.id if first_batch else None
            product = Product(
                product_code=product_code,
                product_type="Submersible Pump Impeller",
                batch_id=batch_id,
                status=decision_val
            )
            db.add(product)
            db.flush()
        else:
            product.status = decision_val

        # Create Inspection Record
        inspection = Inspection(
            product_id=product.id,
            image_path=f"/uploads/{orig_filename}",
            heatmap_path=f"/uploads/{heat_filename}",
            status=status,
            anomaly_score=round(score, 4),
            threshold=round(threshold, 4),
            confidence=round(confidence, 4),
            defect_type=primary_defect,
            severity=severity,
            recommended_decision=decision_val,
            processing_time_ms=inference_ms,
            source=source
        )
        db.add(inspection)
        db.flush()

        # Add Defect Entries
        db_defects = []
        for r in regions:
            defect = Defect(
                inspection_id=inspection.id,
                defect_type=r.get("defect_subcat", primary_defect),
                confidence=round(confidence, 4),
                severity=severity,
                location_data=json.dumps(r)
            )
            db.add(defect)
            db_defects.append(defect)

        # Create Smart Decision Record
        decision = Decision(
            inspection_id=inspection.id,
            decision=decision_val,
            reason=reason,
            approved_by="AI Smart Decision Engine",
            is_override=False
        )
        db.add(decision)

        # Create Notification if Defective or Rejected
        if status == "DEFECTIVE" or decision_val == "REJECT":
            notif = Notification(
                type="ALERT" if severity == "HIGH" else "WARNING",
                title=f"Defect Detected: {product.product_code}",
                message=f"Defect ({primary_defect}, {severity} severity) identified on {product.product_code}. Recommended action: {decision_val}."
            )
            db.add(notif)

        db.commit()
        db.refresh(inspection)

        return {
            "id": inspection.id,
            "product_id": product.id,
            "product_code": product.product_code,
            "image_path": inspection.image_path,
            "heatmap_path": inspection.heatmap_path,
            "status": inspection.status,
            "anomaly_score": inspection.anomaly_score,
            "threshold": inspection.threshold,
            "confidence": inspection.confidence,
            "defect_type": inspection.defect_type,
            "severity": inspection.severity,
            "recommended_decision": inspection.recommended_decision,
            "processing_time_ms": inspection.processing_time_ms,
            "source": inspection.source,
            "inspected_at": inspection.inspected_at.isoformat(),
            "regions": regions,
            "decision": {
                "id": decision.id,
                "decision": decision.decision,
                "reason": decision.reason,
                "approved_by": decision.approved_by,
                "is_override": decision.is_override
            }
        }

def datetime_code():
    import datetime
    return datetime.datetime.utcnow().strftime("%y%m%d")

inspection_service = InspectionService()
