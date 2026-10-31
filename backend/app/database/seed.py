import os
import glob
import shutil
import datetime
from sqlalchemy.orm import Session
from app.core.config import settings
from app.models.user import User
from app.models.batch import Batch
from app.models.product import Product
from app.models.inspection import Inspection
from app.models.decision import Decision
from app.models.defect import Defect
from app.models.notification import Notification
from app.services.inspection_service import inspection_service

def seed_database(db: Session):
    """
    Seeds initial realistic industrial batches, products, and historical inspections.
    Uses real casting images from the dataset if available.
    """
    # 1. Check if already seeded
    if db.query(Batch).count() > 0:
        return

    print("Seeding database with initial industrial data...")

    # 2. Seed Default User
    import hashlib
    admin = User(
        name="Chief Quality Engineer",
        email="lead.inspector@intelliinspect.ai",
        password_hash=hashlib.sha256("admin123".encode("utf-8")).hexdigest(),
        role="quality_director"
    )
    db.add(admin)

    # 3. Seed Batches
    batches_data = [
        {"batch_number": "B2026-01", "machine_id": "DC-CELL-01", "alloy_grade": "A380 Aluminum", "target_yield": 98.5, "total_produced": 540},
        {"batch_number": "B2026-02", "machine_id": "DC-CELL-02", "alloy_grade": "A380 Aluminum", "target_yield": 97.0, "total_produced": 620},
        {"batch_number": "B2026-03", "machine_id": "DC-CELL-03", "alloy_grade": "ADC12 Alloy", "target_yield": 96.5, "total_produced": 480},
        {"batch_number": "B2026-04", "machine_id": "DC-CELL-04", "alloy_grade": "AlSi9Cu3 Cast", "target_yield": 98.0, "total_produced": 510},
    ]

    db_batches = []
    for b in batches_data:
        batch_obj = Batch(**b)
        db.add(batch_obj)
        db_batches.append(batch_obj)
    db.flush()

    # 4. Find real sample casting images
    sample_dir = settings.DATASET_DIR
    def_paths = glob.glob(str(sample_dir / "**" / "test" / "def_front" / "*.jpeg"), recursive=True) or \
                glob.glob(str(sample_dir / "**" / "def_front" / "*.jpeg"), recursive=True)
    ok_paths = glob.glob(str(sample_dir / "**" / "test" / "ok_front" / "*.jpeg"), recursive=True) or \
               glob.glob(str(sample_dir / "**" / "ok_front" / "*.jpeg"), recursive=True)

    # Ensure uploads directory has samples
    samples_dir = settings.UPLOAD_DIR / "samples"
    samples_dir.mkdir(parents=True, exist_ok=True)

    # Inspect 8 samples (4 normal, 4 defective) using the real AI inference pipeline
    sample_items = []
    for p in ok_paths[:4]:
        sample_items.append((p, "ok"))
    for p in def_paths[:4]:
        sample_items.append((p, "def"))

    for idx, (path, label) in enumerate(sample_items):
        if not os.path.exists(path):
            continue
        try:
            with open(path, "rb") as f:
                content = f.read()
            p_code = f"CAST-26-X{idx+101:03d}"
            target_batch = db_batches[idx % len(db_batches)]
            
            inspection_service.inspect_image(
                db=db,
                image_bytes=content,
                filename=os.path.basename(path),
                product_code=p_code,
                batch_id=target_batch.id,
                source="image_upload"
            )
        except Exception as e:
            print(f"Failed to seed sample image {path}: {e}")

    # Seed an industrial notification
    notif = Notification(
        type="INFO",
        title="IntelliInspect AI System Activated",
        message="Vision Station Cell #2 connected to conveyor. PatchCore ResNet-18 model online with 96.9% accuracy."
    )
    db.add(notif)
    db.commit()
    print("Database seeding completed.")
