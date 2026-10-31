from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.decision import Decision
from app.models.inspection import Inspection
from app.models.product import Product
from app.schemas.all_schemas import DecisionCreate, DecisionUpdate, DecisionOut

router = APIRouter(prefix="/decisions", tags=["Smart Decision Center"])

@router.post("", response_model=DecisionOut)
def record_decision(decision_in: DecisionCreate, db: Session = Depends(get_db)):
    insp = db.query(Inspection).filter(Inspection.id == decision_in.inspection_id).first()
    if not insp:
        raise HTTPException(status_code=404, detail="Inspection record not found.")

    decision = Decision(
        inspection_id=decision_in.inspection_id,
        decision=decision_in.decision.upper(),
        reason=decision_in.reason,
        approved_by=decision_in.approved_by or "Lead Inspector",
        is_override=False
    )
    db.add(decision)

    # Update product status
    if insp.product:
        insp.product.status = decision_in.decision.upper()

    db.commit()
    db.refresh(decision)
    return decision

@router.get("/history")
def get_decisions_history(
    decision_filter: Optional[str] = Query(None, alias="decision"),
    is_override: Optional[bool] = Query(None),
    limit: int = Query(50, le=200),
    db: Session = Depends(get_db)
):
    query = db.query(Decision)
    if decision_filter:
        query = query.filter(Decision.decision == decision_filter.upper())
    if is_override is not None:
        query = query.filter(Decision.is_override == is_override)

    decisions = query.order_by(Decision.id.desc()).limit(limit).all()
    results = []
    for d in decisions:
        insp = d.inspection
        prod = insp.product if insp else None
        results.append({
            "id": d.id,
            "inspection_id": d.inspection_id,
            "product_code": prod.product_code if prod else "UNKNOWN",
            "decision": d.decision,
            "reason": d.reason,
            "approved_by": d.approved_by,
            "is_override": d.is_override,
            "override_reason": d.override_reason,
            "created_at": d.created_at.isoformat(),
            "defect_type": insp.defect_type if insp else "Unknown",
            "severity": insp.severity if insp else "NONE",
            "image_path": insp.image_path if insp else ""
        })
    return results

@router.patch("/{decision_id}")
def override_decision(
    decision_id: int,
    body: DecisionUpdate,
    db: Session = Depends(get_db)
):
    decision = db.query(Decision).filter(Decision.id == decision_id).first()
    if not decision:
        raise HTTPException(status_code=404, detail="Decision record not found.")

    decision.decision = body.decision.upper()
    decision.is_override = True
    decision.override_reason = body.override_reason
    decision.approved_by = body.approved_by

    # Update associated product status
    if decision.inspection and decision.inspection.product:
        decision.inspection.product.status = body.decision.upper()

    db.commit()
    db.refresh(decision)

    return {
        "id": decision.id,
        "inspection_id": decision.inspection_id,
        "decision": decision.decision,
        "reason": decision.reason,
        "is_override": decision.is_override,
        "override_reason": decision.override_reason,
        "approved_by": decision.approved_by,
        "updated_at": decision.created_at.isoformat()
    }
