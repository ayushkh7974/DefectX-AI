from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.product import Product
from app.services.qr_service import generate_qr_code

router = APIRouter(prefix="/products", tags=["Product Traceability"])

@router.get("/{product_id}/qr")
def get_product_qr(product_id: int, db: Session = Depends(get_db)):
    """
    Generates and returns a PNG QR code for direct scanning and traceability verification.
    """
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found.")

    batch_num = product.batch.batch_number if product.batch else "B2026-01"
    qr_stream = generate_qr_code(
        product_code=product.product_code,
        product_id=product.id,
        status=product.status,
        batch_number=batch_num
    )

    return Response(
        content=qr_stream.getvalue(),
        media_type="image/png",
        headers={"Content-Disposition": f"inline; filename=qr_{product.product_code}.png"}
    )
