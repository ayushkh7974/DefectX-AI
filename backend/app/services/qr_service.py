import qrcode
from io import BytesIO
from pathlib import Path
from app.core.config import settings

def generate_qr_code(product_code: str, product_id: int, status: str, batch_number: str = "B2026-01") -> BytesIO:
    """
    Generates a high-resolution QR code containing product traceability data.
    """
    qr_data = (
        f"https://intelliinspect.ai/traceability/{product_code}\n"
        f"ID: {product_id}\n"
        f"BATCH: {batch_number}\n"
        f"STATUS: {status}\n"
        f"VERIFIED: INTELLIINSPECT-AI"
    )
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_H,
        box_size=10,
        border=4,
    )
    qr.add_data(qr_data)
    qr.make(fit=True)
    img = qr.make_image(fill_color="#0f172a", back_color="#ffffff")
    
    buf = BytesIO()
    img.save(buf, format="PNG")
    buf.seek(0)
    return buf
