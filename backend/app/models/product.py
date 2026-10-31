import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database.session import Base

class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    product_code = Column(String(50), unique=True, index=True, nullable=False)
    product_type = Column(String(100), default="Submersible Pump Impeller")
    batch_id = Column(Integer, ForeignKey("batches.id", ondelete="SET NULL"), nullable=True)
    status = Column(String(50), default="PENDING")  # PENDING, ACCEPTED, REJECTED, MANUAL_REVIEW
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    batch = relationship("Batch", back_populates="products")
    inspections = relationship("Inspection", back_populates="product", cascade="all, delete-orphan")
