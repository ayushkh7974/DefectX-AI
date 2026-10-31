import io
import sys
from pathlib import Path
from PIL import Image
import pytest
from fastapi.testclient import TestClient

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.main import app

client = TestClient(app)

def test_health_endpoint():
    res = client.get("/api/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "healthy"
    assert data["model_loaded"] is True

def test_analytics_overview():
    res = client.get("/api/analytics/overview")
    assert res.status_code == 200
    data = res.json()
    assert "total_inspected" in data
    assert "defect_rate" in data
    assert "accepted_count" in data

def test_model_status_and_metrics():
    r_status = client.get("/api/model/status")
    assert r_status.status_code == 200
    assert r_status.json()["loaded"] is True
    
    r_metrics = client.get("/api/model/metrics")
    assert r_metrics.status_code == 200
    metrics = r_metrics.json()
    assert metrics["accuracy"] >= 0.95
    assert metrics["auroc"] >= 0.98

def test_inspection_samples():
    res = client.get("/api/inspection/samples")
    assert res.status_code == 200
    data = res.json()
    assert len(data.get("defective_samples", [])) > 0
    assert len(data.get("normal_samples", [])) > 0

def test_image_inspection_workflow():
    # Create synthetic test image
    img = Image.new("RGB", (224, 224), color=(180, 180, 180))
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    buf.seek(0)

    res = client.post(
        "/api/inspection/image",
        files={"file": ("test_component.jpg", buf.getvalue(), "image/jpeg")},
        data={"product_code": "TEST-CI-001"}
    )
    assert res.status_code == 200
    data = res.json()
    assert "anomaly_score" in data
    assert "recommended_decision" in data
    assert data["recommended_decision"] in ["ACCEPT", "REJECT", "MANUAL_REVIEW"]
    assert "image_path" in data
    assert "heatmap_path" in data

    # Test PDF report generation on the new inspection
    insp_id = data["id"]
    r_rep = client.post(f"/api/reports/generate/{insp_id}")
    assert r_rep.status_code == 200
    rep_data = r_rep.json()
    assert "report_code" in rep_data

    # Test QR code retrieval
    prod_id = data["product_id"]
    r_qr = client.get(f"/api/products/{prod_id}/qr")
    assert r_qr.status_code == 200
    assert r_qr.headers["content-type"] == "image/png"
