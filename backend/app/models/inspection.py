import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.database.session import Base

class Inspection(Base):
    __tablename__ = "inspections"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"), nullable=False, index=True)
    image_path = Column(String(255), nullable=False)
    heatmap_path = Column(String(255), nullable=True)
    status = Column(String(50), nullable=False, index=True)  # OK, DEFECTIVE
    anomaly_score = Column(Float, nullable=False)
    threshold = Column(Float, nullable=False)
    confidence = Column(Float, nullable=False)
    defect_type = Column(String(100), default="None")
    severity = Column(String(50), default="NONE")  # NONE, LOW, MEDIUM, HIGH
    recommended_decision = Column(String(50), default="ACCEPT")  # ACCEPT, REJECT, MANUAL_REVIEW
    processing_time_ms = Column(Float, default=0.0)
    source = Column(String(50), default="image_upload")  # image_upload, video_frame, webcam
    inspected_at = Column(DateTime, default=datetime.datetime.utcnow, index=True)

    product = relationship("Product", back_populates="inspections")
    defects = relationship("Defect", back_populates="inspection", cascade="all, delete-orphan")
    decision = relationship("Decision", back_populates="inspection", uselist=False, cascade="all, delete-orphan")
    report = relationship("Report", back_populates="inspection", uselist=False, cascade="all, delete-orphan")
