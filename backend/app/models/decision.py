import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.database.session import Base

class Decision(Base):
    __tablename__ = "decisions"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    inspection_id = Column(Integer, ForeignKey("inspections.id", ondelete="CASCADE"), nullable=False, unique=True)
    decision = Column(String(50), nullable=False)  # ACCEPT, REJECT, MANUAL_REVIEW
    reason = Column(Text, nullable=False)
    approved_by = Column(String(100), default="AI Smart Decision Engine")
    is_override = Column(Boolean, default=False)
    override_reason = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, index=True)

    inspection = relationship("Inspection", back_populates="decision")
