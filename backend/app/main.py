from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.core.config import settings
from app.database.session import engine, Base, SessionLocal
from app.database.seed import seed_database
from app.api.auth import router as auth_router
from app.api.inspection import router as inspection_router
from app.api.products import router as products_router
from app.api.decisions import router as decisions_router
from app.api.analytics import router as analytics_router
from app.api.model import router as model_router
from app.api.reports import router as reports_router
from app.api.qr import router as qr_router
from app.api.notifications import router as notifications_router
from app.api.health import router as health_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize DB schema
    Base.metadata.create_all(bind=engine)
    
    # Auto-seed initial data
    db = SessionLocal()
    try:
        seed_database(db)
    finally:
        db.close()
        
    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Intelligent Vision. Automated Inspection. Better Manufacturing.",
    lifespan=lifespan
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static file mounts
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")
app.mount("/reports", StaticFiles(directory=settings.REPORT_DIR), name="reports")

# Include API Routers under /api
app.include_router(auth_router, prefix=settings.API_V1_STR)
app.include_router(inspection_router, prefix=settings.API_V1_STR)
app.include_router(products_router, prefix=settings.API_V1_STR)
app.include_router(decisions_router, prefix=settings.API_V1_STR)
app.include_router(analytics_router, prefix=settings.API_V1_STR)
app.include_router(model_router, prefix=settings.API_V1_STR)
app.include_router(reports_router, prefix=settings.API_V1_STR)
app.include_router(qr_router, prefix=settings.API_V1_STR)
app.include_router(notifications_router, prefix=settings.API_V1_STR)
app.include_router(health_router, prefix=settings.API_V1_STR)

# Root convenience redirects
@app.get("/")
def root():
    return {
        "system": settings.PROJECT_NAME,
        "tagline": "Intelligent Vision. Automated Inspection. Better Manufacturing.",
        "version": settings.VERSION,
        "docs_url": "/docs",
        "api_v1": settings.API_V1_STR
    }

# Live inspection WebSocket channel for video stream telemetry
@app.websocket("/api/ws/inspection")
async def websocket_inspection_endpoint(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            data = await websocket.receive_text()
            # Echo telemetry heartbeat
            await websocket.send_json({
                "type": "TELEMETRY_HEARTBEAT",
                "status": "CONVEYOR_ACTIVE",
                "line": "LINE-02",
                "fps": 39.0
            })
    except WebSocketDisconnect:
        pass
