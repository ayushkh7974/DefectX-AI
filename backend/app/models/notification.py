import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text
from app.database.session import Base

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    type = Column(String(50), default="INFO")  # ALERT, WARNING, INFO
    title = Column(String(150), nullable=False)
    message = Column(Text, nullable=False)
    read_status = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, index=True)
