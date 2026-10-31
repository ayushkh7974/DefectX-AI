import datetime
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.inspection import Inspection
from app.models.product import Product
from app.models.batch import Batch
from app.models.decision import Decision
from app.models.defect import Defect
from app.ml.model_manager import model_manager

class AnalyticsService:
    @staticmethod
    def get_overview_stats(db: Session) -> Dict[str, Any]:
        total_inspected = db.query(Inspection).count()
        
        # Decision breakdown
        accepted_count = db.query(Decision).filter(Decision.decision == "ACCEPT").count()
        rejected_count = db.query(Decision).filter(Decision.decision == "REJECT").count()
        manual_review_count = db.query(Decision).filter(Decision.decision == "MANUAL_REVIEW").count()
        
        # Average inference time
        avg_ms = db.query(func.avg(Inspection.processing_time_ms)).scalar() or 25.6
        
        # Defect rate
        defective_count = db.query(Inspection).filter(Inspection.status == "DEFECTIVE").count()
        defect_rate = round((defective_count / total_inspected * 100.0) if total_inspected > 0 else 0.0, 2)
        today_yield = round(100.0 - defect_rate, 2)

        model_status = "ONLINE (Active)" if model_manager.is_loaded else "OFFLINE"

        return {
            "total_inspected": total_inspected,
            "accepted_count": accepted_count,
            "rejected_count": rejected_count,
            "manual_review_count": manual_review_count,
            "defect_rate": defect_rate,
            "avg_inference_ms": round(float(avg_ms), 1),
            "today_yield": today_yield,
            "active_line": "Line 2 - Submersible Impeller Cell",
            "ai_status": model_status
        }

    @staticmethod
    def get_defect_distribution(db: Session) -> List[Dict[str, Any]]:
        # Count by primary defect type
        defects = (
            db.query(Defect.defect_type, func.count(Defect.id).label("count"))
            .group_by(Defect.defect_type)
            .order_by(func.count(Defect.id).desc())
            .all()
        )
        total = sum(d[1] for d in defects) or 1
        
        return [
            {
                "defect_type": d[0],
                "count": d[1],
                "percentage": round((d[1] / total) * 100.0, 1)
            }
            for d in defects
        ]

    @staticmethod
    def get_batch_analytics(db: Session) -> List[Dict[str, Any]]:
        batches = db.query(Batch).all()
        results = []
        for b in batches:
            products_count = db.query(Product).filter(Product.batch_id == b.id).count()
            inspections = (
                db.query(Inspection)
                .join(Product, Product.id == Inspection.product_id)
                .filter(Product.batch_id == b.id)
                .all()
            )
            total_insp = len(inspections)
            passed = sum(1 for i in inspections if i.status == "OK")
            failed = total_insp - passed
            defect_rate = round((failed / total_insp * 100.0) if total_insp > 0 else 0.0, 1)

            results.append({
                "batch_id": b.id,
                "batch_number": b.batch_number,
                "machine_id": b.machine_id,
                "alloy_grade": b.alloy_grade,
                "target_yield": b.target_yield,
                "inspected": total_insp,
                "passed": passed,
                "failed": failed,
                "defect_rate": defect_rate
            })
        return results

    @staticmethod
    def get_quality_trends(db: Session) -> List[Dict[str, Any]]:
        # Daily aggregate for the last 7 intervals
        # Group by date string from inspected_at
        rows = (
            db.query(
                func.strftime("%Y-%m-%d", Inspection.inspected_at).label("day"),
                func.count(Inspection.id).label("total"),
                func.sum(func.case((Inspection.status == "OK", 1), else_=0)).label("accepted"),
                func.sum(func.case((Inspection.status == "DEFECTIVE", 1), else_=0)).label("rejected")
            )
            .group_by("day")
            .order_by("day")
            .limit(14)
            .all()
        )

        trends = []
        for r in rows:
            day_str, total, acc, rej = r[0], r[1], r[2] or 0, r[3] or 0
            rate = round((rej / total * 100.0) if total > 0 else 0.0, 1)
            trends.append({
                "date": day_str or datetime.date.today().isoformat(),
                "inspected": total,
                "accepted": acc,
                "rejected": rej,
                "manual_review": max(0, total - (acc + rej)),
                "defect_rate": rate
            })
        return trends

analytics_service = AnalyticsService()
