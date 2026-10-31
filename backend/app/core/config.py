import os
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parent.parent.parent
PROJECT_ROOT = BACKEND_DIR.parent
APP_DIR = BACKEND_DIR / "app"

UPLOAD_DIR = BACKEND_DIR / "uploads"
REPORT_DIR = BACKEND_DIR / "reports"
ML_DIR = APP_DIR / "ml"
MODELS_DIR = ML_DIR / "models"
DB_DIR = APP_DIR / "database"
DATASET_DIR = PROJECT_ROOT / "dataset" / "casting_data"

for d in [UPLOAD_DIR, REPORT_DIR, MODELS_DIR, DB_DIR]:
    d.mkdir(parents=True, exist_ok=True)

class Settings:
    PROJECT_NAME: str = "IntelliInspect AI"
    VERSION: str = "2.0.0"
    API_V1_STR: str = "/api"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "intelliinspect-super-secret-production-key-2026")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # Paths
    BACKEND_DIR: Path = BACKEND_DIR
    PROJECT_ROOT: Path = PROJECT_ROOT
    UPLOAD_DIR: Path = UPLOAD_DIR
    REPORT_DIR: Path = REPORT_DIR
    DATASET_DIR: Path = DATASET_DIR
    
    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", f"sqlite:///{DB_DIR}/intelliinspect.db")
    
    # ML & Anomaly Detection Defaults
    IMAGE_SIZE: int = 224
    DEFAULT_CONFIDENCE_THRESHOLD: float = 0.70
    SEVERITY_LOW_RATIO: float = 1.15
    SEVERITY_HIGH_RATIO: float = 1.45
    
    # Model Paths
    CASTING_MODEL_PATH: Path = MODELS_DIR / "casting.pt"
    CASTING_METRICS_PATH: Path = MODELS_DIR / "metrics_casting.json"
    
    # CORS
    CORS_ORIGINS: list = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
        "*"
    ]

settings = Settings()
