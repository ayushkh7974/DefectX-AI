import datetime
from sqlalchemy import Column, Integer, String, DateTime, Float
from sqlalchemy.orm import relationship
from app.database.session import Base

class Batch(Base):
    __tablename__ = "batches"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    batch_number = Column(String(50), unique=True, index=True, nullable=False)
    production_date = Column(DateTime, default=datetime.datetime.utcnow)
    machine_id = Column(String(50), nullable=False, index=True)
    alloy_grade = Column(String(50), default="A380 Aluminum")
    target_yield = Column(Float, default=98.0)
    total_produced = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    products = relationship("Product", back_populates="batch", cascade="all, delete-orphan")
