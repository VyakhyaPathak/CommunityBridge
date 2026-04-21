from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional
from ..database import get_db
from ..models import Volunteer
from pydantic import BaseModel
import json

router = APIRouter()

class VolunteerCreate(BaseModel):
    firebase_uid: str
    email: str
    name: str
    phone: Optional[str] = None
    skill_tags: List[str] = []
    location_address: Optional[str] = None
    radius_km: float = 10.0
    bio: Optional[str] = None

@router.post("")
async def upsert_volunteer(data: VolunteerCreate, db: AsyncSession = Depends(get_db)):
    query = select(Volunteer).where(Volunteer.firebase_uid == data.firebase_uid)
    result = await db.execute(query)
    existing = result.scalar_one_or_none()
    
    if existing:
        existing.name = data.name
        existing.phone = data.phone
        existing.skill_tags = json.dumps(data.skill_tags)
        existing.location_address = data.location_address
        existing.radius_km = data.radius_km
        existing.bio = data.bio
        msg = "Profile updated"
    else:
        existing = Volunteer(
            firebase_uid=data.firebase_uid,
            email=data.email,
            name=data.name,
            phone=data.phone,
            skill_tags=json.dumps(data.skill_tags),
            location_address=data.location_address,
            radius_km=data.radius_km,
            bio=data.bio
        )
        db.add(existing)
        msg = "Profile created"
        
    await db.commit()
    return {"data": {"id": existing.id}, "message": msg}

@router.get("")
async def list_volunteers(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Volunteer))
    return {"data": result.scalars().all()}
