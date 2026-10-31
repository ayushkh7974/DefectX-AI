import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.database.session import Base

class Defect(Base):
    __tablename__ = "defects"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    inspection_id = Column(Integer, ForeignKey("inspections.id", ondelete="CASCADE"), nullable=False, index=True)
    defect_type = Column(String(100), nullable=False)  # Blowhole, Pinhole, Surface Crack, Mold Fin, Shrinkage Cavity
    confidence = Column(Float, nullable=False)
    severity = Column(String(50), nullable=False)  # LOW, MEDIUM, HIGH
    location_data = Column(Text, nullable=True)  # JSON string: {"x": .., "y": .., "width": .., "height": .., "area": ..}
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    inspection = relationship("Inspection", back_populates="defects")
