import time
from io import BytesIO
from PIL import Image
from fastapi import APIRouter, UploadFile, File, HTTPException
from app.ml.model_manager import model_manager
from app.ml.patchcore import find_defect_regions
from app.ml.severity import severity_engine
from app.schemas.all_schemas import ModelStatusOut, ModelMetricsOut

router = APIRouter(prefix="/model", tags=["AI Model"])

@router.get("/status", response_model=ModelStatusOut)
def get_model_status():
    """
    Returns AI model runtime state, parameters, threshold, and memory bank size.
    """
    return model_manager.get_status()

@router.get("/metrics", response_model=ModelMetricsOut)
def get_model_metrics():
    """
    Returns actual measured performance metrics: AUROC, accuracy, precision, recall, F1, latency, FPS.
    """
    return model_manager.metrics

@router.post("/reload")
def reload_model():
    """
    Hot reloads model checkpoint from disk.
    """
    success = model_manager.load_model()
    if not success:
        raise HTTPException(status_code=500, detail="Failed to reload model from disk.")
    model_manager.load_metrics()
    return {"status": "reloaded", "model_info": model_manager.get_status()}

@router.post("/predict")
async def raw_predict(file: UploadFile = File(...)):
    """
    Direct model inference endpoint returning raw anomaly score, heatmap matrix stats, and defect bounding boxes.
    """
    if not model_manager.is_loaded or model_manager.model is None:
        raise HTTPException(status_code=503, detail="AI Model not loaded or ready.")

    content = await file.read()
    try:
        img = Image.open(BytesIO(content)).convert("RGB")
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid image file.")

    t0 = time.perf_counter()
    score, amap = model_manager.model.score(img)
    latency_ms = (time.perf_counter() - t0) * 1000

    thr = model_manager.model.threshold
    w, h = img.size
    regions = find_defect_regions(amap, thr, (w, h))
    eval_res = severity_engine.evaluate(score, thr, regions, (w, h))

    return {
        "anomaly_score": round(score, 4),
        "threshold": round(thr, 4),
        "status": eval_res["status"],
        "severity": eval_res["severity"],
        "decision": eval_res["decision"],
        "confidence": eval_res["confidence"],
        "primary_defect": eval_res["primary_defect"],
        "regions": regions,
        "latency_ms": round(latency_ms, 2)
    }
