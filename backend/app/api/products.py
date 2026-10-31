from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.product import Product
from app.models.batch import Batch
from app.models.inspection import Inspection
from app.schemas.all_schemas import ProductCreate, ProductOut

router = APIRouter(prefix="/products", tags=["Products"])

@router.post("", response_model=ProductOut)
def create_product(product_in: ProductCreate, db: Session = Depends(get_db)):
    existing = db.query(Product).filter(Product.product_code == product_in.product_code).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Product with code '{product_in.product_code}' already exists.")
    product = Product(
        product_code=product_in.product_code,
        product_type=product_in.product_type or "Submersible Pump Impeller",
        batch_id=product_in.batch_id
    )
    db.add(product)
    db.commit()
    db.refresh(product)
    return product

@router.get("", response_model=List[ProductOut])
def list_products(
    batch_id: Optional[int] = Query(None),
    status_filter: Optional[str] = Query(None, alias="status"),
    limit: int = Query(50, le=200),
    db: Session = Depends(get_db)
):
    query = db.query(Product)
    if batch_id:
        query = query.filter(Product.batch_id == batch_id)
    if status_filter:
        query = query.filter(Product.status == status_filter.upper())
    return query.order_by(Product.id.desc()).limit(limit).all()

@router.get("/{product_id}")
def get_product(product_id: int, db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found.")
    
    batch = product.batch
    return {
        "id": product.id,
        "product_code": product.product_code,
        "product_type": product.product_type,
        "status": product.status,
        "created_at": product.created_at.isoformat(),
        "batch": {
            "id": batch.id,
            "batch_number": batch.batch_number,
            "machine_id": batch.machine_id,
            "alloy_grade": batch.alloy_grade,
            "production_date": batch.production_date.isoformat()
        } if batch else None
    }

@router.get("/{product_id}/history")
def get_product_history(product_id: int, db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found.")

    inspections = (
        db.query(Inspection)
        .filter(Inspection.product_id == product_id)
        .order_by(Inspection.id.desc())
        .all()
    )

    history = []
    for insp in inspections:
        history.append({
            "inspection_id": insp.id,
            "inspected_at": insp.inspected_at.isoformat(),
            "status": insp.status,
            "severity": insp.severity,
            "anomaly_score": insp.anomaly_score,
            "recommended_decision": insp.recommended_decision,
            "image_path": insp.image_path,
            "heatmap_path": insp.heatmap_path,
            "decision": insp.decision.decision if insp.decision else insp.recommended_decision,
            "is_override": insp.decision.is_override if insp.decision else False
        })

    return {
        "product_id": product.id,
        "product_code": product.product_code,
        "product_type": product.product_type,
        "current_status": product.status,
        "inspection_count": len(history),
        "history": history
    }
