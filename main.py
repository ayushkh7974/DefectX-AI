app = FastAPI(title="SmartInspect-AI", lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])
app.mount("/outputs", StaticFiles(directory=config.OUTPUTS_DIR), name="outputs")


@app.get("/health")
def health():
    return {"status": "ok", "models": available_categories()}

import time
import uuid
from contextlib import asynccontextmanager
from typing import Literal, Optional

import cv2
from fastapi import FastAPI, File, HTTPException, Query, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from starlette.concurrency import run_in_threadpool

import config
from core.registry import available_categories, get_model
from core.utils import find_regions, read_image, render_overlay
from db import database as db


@asynccontextmanager
async def lifespan(app: FastAPI):
    db.init_db()
    yield
@app.get("/categories")
def categories():
    return {"categories": available_categories()}


@app.post("/predict")
async def predict(file: UploadFile = File(...), category: str = Query("metal_nut")):
    if category not in available_categories():
        raise HTTPException(404, f"No trained model for '{category}'. Available: {available_categories()}")
    try:
        img = read_image(await file.read())
    except Exception:
        raise HTTPException(400, "Invalid image file")

    model = get_model(category)
    t0 = time.perf_counter()
    score, amap = await run_in_threadpool(model.score, img)
    ms = (time.perf_counter() - t0) * 1000

    thr = model.threshold
    flagged = score > thr
    regions = find_regions(amap, thr) if flagged else []
    status = "FLAGGED" if flagged else "OK"
    ratio = score / thr
    severity = "NONE" if not flagged else ("HIGH" if ratio >= 1.5 else "LOW")

    uid = uuid.uuid4().hex[:10]
    input_name, heat_name = f"{uid}_input.jpg", f"{uid}_heatmap.jpg"
    img.save(config.OUTPUTS_DIR / input_name)
    cv2.imwrite(str(config.OUTPUTS_DIR / heat_name), render_overlay(img, amap, thr, regions))

    rec_id = db.add_record(category, file.filename, score, thr, status,
                           f"/outputs/{input_name}", f"/outputs/{heat_name}", regions)
    return {
        "id": rec_id,
        "category": category,
        "status": status,
        "severity": severity,
        "anomaly_score": round(score, 4),
        "threshold": round(thr, 4),
        "defect_regions": regions,
        "inference_ms": round(ms, 1),
        "input_url": f"/outputs/{input_name}",
        "heatmap_url": f"/outputs/{heat_name}",
    }


@app.get("/inspections")
def inspections(status: Optional[Literal["OK", "FLAGGED"]] = None, limit: int = 50):
    return db.list_records(status, limit)


class Review(BaseModel):
    review: Literal["confirmed_defect", "false_alarm", "scrapped"]


@app.patch("/inspections/{rec_id}/review")
def review(rec_id: int, body: Review):
    if not db.update_review(rec_id, body.review):
        raise HTTPException(404, "Record not found")
    return {"id": rec_id, "review": body.review}


@app.get("/stats")
def stats():
    return db.stats()
