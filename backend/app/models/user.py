import datetime
from sqlalchemy import Column, Integer, String, DateTime
from app.database.session import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(100), nullable=False)
    email = Column(String(150), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(50), default="quality_inspector")  # admin, quality_inspector, engineer
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
