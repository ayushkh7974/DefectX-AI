from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, EmailStr, Field

# --- User Schemas ---
class UserBase(BaseModel):
    name: str
    email: EmailStr
    role: Optional[str] = "quality_inspector"

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserOut(UserBase):
    id: int
    created_at: datetime
    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserOut

# --- Batch Schemas ---
class BatchBase(BaseModel):
    batch_number: str
    machine_id: str
    alloy_grade: Optional[str] = "A380 Aluminum"
    target_yield: Optional[float] = 98.0
    total_produced: Optional[int] = 0

class BatchCreate(BatchBase):
    pass

class BatchOut(BatchBase):
    id: int
    production_date: datetime
    created_at: datetime
    class Config:
        from_attributes = True

# --- Product Schemas ---
class ProductBase(BaseModel):
    product_code: str
    product_type: Optional[str] = "Submersible Pump Impeller"
    batch_id: Optional[int] = None

class ProductCreate(ProductBase):
    pass

class ProductOut(ProductBase):
    id: int
    status: str
    created_at: datetime
    batch: Optional[BatchOut] = None
    class Config:
        from_attributes = True

# --- Defect Schemas ---
class DefectLocation(BaseModel):
    x: int
    y: int
    width: int
    height: int
    area: int
    intensity: float

class DefectOut(BaseModel):
    id: int
    defect_type: str
    confidence: float
    severity: str
    location_data: Optional[str] = None
    created_at: datetime
    class Config:
        from_attributes = True

# --- Decision Schemas ---
class DecisionBase(BaseModel):
    decision: str  # ACCEPT, REJECT, MANUAL_REVIEW
    reason: str
    approved_by: Optional[str] = "AI Smart Decision Engine"

class DecisionCreate(DecisionBase):
    inspection_id: int

class DecisionUpdate(BaseModel):
    decision: str  # ACCEPT, REJECT, MANUAL_REVIEW
    override_reason: str
    approved_by: str

class DecisionOut(DecisionBase):
    id: int
    inspection_id: int
    is_override: bool
    override_reason: Optional[str] = None
    created_at: datetime
    class Config:
        from_attributes = True

# --- Report Schemas ---
class ReportOut(BaseModel):
    id: int
    inspection_id: int
    report_code: str
    report_path: str
    generated_at: datetime
    class Config:
        from_attributes = True

# --- Inspection Schemas ---
class InspectionBase(BaseModel):
    product_id: int
    source: Optional[str] = "image_upload"

class InspectionOut(BaseModel):
    id: int
    product_id: int
    image_path: str
    heatmap_path: Optional[str] = None
    status: str  # OK, DEFECTIVE
    anomaly_score: float
    threshold: float
    confidence: float
    defect_type: str
    severity: str
    recommended_decision: str
    processing_time_ms: float
    source: str
    inspected_at: datetime
    product: Optional[ProductOut] = None
    defects: List[DefectOut] = []
    decision: Optional[DecisionOut] = None
    report: Optional[ReportOut] = None
    class Config:
        from_attributes = True

# --- Analytics Schemas ---
class OverviewStats(BaseModel):
    total_inspected: int
    accepted_count: int
    rejected_count: int
    manual_review_count: int
    defect_rate: float
    avg_inference_ms: float
    today_yield: float
    active_line: str
    ai_status: str

class DefectCategoryStat(BaseModel):
    defect_type: str
    count: int
    percentage: float

class BatchStat(BaseModel):
    batch_number: str
    machine_id: str
    inspected: int
    passed: int
    failed: int
    defect_rate: float

class TrendPoint(BaseModel):
    date: str
    inspected: int
    accepted: int
    rejected: int
    manual_review: int
    defect_rate: float

# --- Model Schemas ---
class ModelStatusOut(BaseModel):
    loaded: bool
    category: str
    device: str
    threshold: float
    bank_size: int
    image_size: int
    model_path: str

class ModelMetricsOut(BaseModel):
    category: str
    images_tested: int
    auroc: float
    accuracy: float
    precision: float
    recall: float
    f1_score: float
    latency_ms: float
    fps: float
    model_size_mb: float
    confusion_matrix: Dict[str, int]
    recall_by_defect: Dict[str, float]

class NotificationOut(BaseModel):
    id: int
    type: str
    title: str
    message: str
    read_status: bool
    created_at: datetime
    class Config:
        from_attributes = True
