from sqlalchemy import Column, String, Integer, Float, DateTime, Text, JSON, Enum as SQLEnum, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from .database import Base
import uuid
import enum

class UserRole(str, enum.Enum):
    VOLUNTEER = "volunteer"
    COORDINATOR = "coordinator"
    ADMIN = "admin"

class NeedStatus(str, enum.Enum):
    PENDING_ANALYSIS = "pending_analysis"
    OPEN = "open"
    ASSIGNED = "assigned"
    RESOLVED = "resolved"

class TaskStatus(str, enum.Enum):
    PENDING = "pending"
    ACCEPTED = "accepted"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"

class User(Base):
    __tablename__ = "users"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    firebase_uid = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)
    name = Column(String)
    role = Column(SQLEnum(UserRole), default=UserRole.VOLUNTEER)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

class Need(Base):
    __tablename__ = "needs"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    title = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    address = Column(String, nullable=False)
    lat = Column(Float)
    lng = Column(Float)
    urgency_input = Column(Integer, nullable=False)
    urgency_score = Column(Float)
    category = Column(String)
    status = Column(SQLEnum(NeedStatus), default=NeedStatus.PENDING_ANALYSIS)
    submitted_by_email = Column(String)
    ai_analysis_json = Column(Text) # Stored as JSON string
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

class Volunteer(Base):
    __tablename__ = "volunteers"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    firebase_uid = Column(String, unique=True, index=True)
    email = Column(String)
    name = Column(String)
    phone = Column(String)
    skill_tags = Column(Text) # JSON string of list
    location_address = Column(String)
    radius_km = Column(Float, default=10.0)
    bio = Column(Text)
    is_available = Column(Integer, default=1)
    total_tasks_completed = Column(Integer, default=0)
    total_hours = Column(Float, default=0.0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

class Task(Base):
    __tablename__ = "tasks"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    need_id = Column(String, ForeignKey("needs.id"))
    volunteer_id = Column(String, ForeignKey("volunteers.id"))
    status = Column(SQLEnum(TaskStatus), default=TaskStatus.PENDING)
    coordinator_notes = Column(Text)
    hours_logged = Column(Float, default=0.0)
    completed_at = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
