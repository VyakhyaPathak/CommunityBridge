from fastapi import APIRouter, Depends, BackgroundTasks, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional
from ..database import get_db
from ..models import Need, NeedStatus
from ..services.maps_service import geocode_address
from ..services.gemini_service import analyze_need
from pydantic import BaseModel
import json

router = APIRouter()

class NeedCreate(BaseModel):
    title: str
    description: str
    address: str
    urgency_input: int
    submitted_by_email: Optional[str] = None
    category: Optional[str] = None
    urgency_score: Optional[float] = None
    ai_analysis_json: Optional[dict] = None

async def run_ai_analysis_background(need_id: str, db: AsyncSession):
    need = await db.get(Need, need_id)
    if not need:
        return
        
    try:
        analysis = await analyze_need(need.title, need.description, need.address, need.urgency_input)
        need.category = analysis.get("category")
        need.urgency_score = analysis.get("urgency_score")
        need.ai_analysis_json = json.dumps(analysis)
        need.status = NeedStatus.OPEN
        await db.commit()
    except Exception as e:
        print(f"Background AI Error: {e}")
        need.status = NeedStatus.OPEN
        await db.commit()

@router.post("")
async def create_need(need_data: NeedCreate, background_tasks: BackgroundTasks, db: AsyncSession = Depends(get_db)):
    coords = await geocode_address(need_data.address)
    
    new_need = Need(
        title=need_data.title,
        description=need_data.description,
        address=need_data.address,
        lat=coords["lat"],
        lng=coords["lng"],
        urgency_input=need_data.urgency_input,
        submitted_by_email=need_data.submitted_by_email,
        status=NeedStatus.OPEN if need_data.category else NeedStatus.PENDING_ANALYSIS,
        category=need_data.category,
        urgency_score=need_data.urgency_score,
        ai_analysis_json=json.dumps(need_data.ai_analysis_json) if need_data.ai_analysis_json else None
    )
    
    db.add(new_need)
    await db.flush()
    
    if not need_data.category:
        background_tasks.add_task(run_ai_analysis_background, new_need.id, db)
        
    return {"data": {"id": new_need.id, "status": new_need.status}, "message": "Need submitted"}

@router.get("")
async def get_needs(status: Optional[str] = None, category: Optional[str] = None, db: AsyncSession = Depends(get_db)):
    query = select(Need)
    if status:
        query = query.where(Need.status == status)
    if category:
        query = query.where(Need.category == category)
        
    result = await db.execute(query.order_by(Need.created_at.desc()))
    needs = result.scalars().all()
    return {"data": needs}

@router.get("/heatmap")
async def get_heatmap_data(db: AsyncSession = Depends(get_db)):
    """
    Returns simplified need data for heatmap visualization.
    """
    query = select(Need).where(Need.status.in_([NeedStatus.OPEN, NeedStatus.ASSIGNED]))
    result = await db.execute(query)
    rows = result.scalars().all()
    
    data = [
        {
            "id": r.id,
            "title": r.title,
            "lat": r.lat,
            "lng": r.lng,
            "weight": r.urgency_score or 5.0
        }
        for r in rows if r.lat is not None
    ]
    return {"data": data}

@router.get("/stats")
async def get_stats(db: AsyncSession = Depends(get_db)):
    from sqlalchemy import func
    from ..models import Volunteer
    
    total = await db.execute(select(func.count(Need.id)))
    open_needs = await db.execute(select(func.count(Need.id)).where(Need.status == NeedStatus.OPEN))
    resolved = await db.execute(select(func.count(Need.id)).where(Need.status == NeedStatus.RESOLVED))
    volunteers = await db.execute(select(func.count(Volunteer.id)))
    
    return {
        "data": {
            "total": total.scalar(),
            "open": open_needs.scalar(),
            "resolved": resolved.scalar(),
            "volunteers": volunteers.scalar()
        }
    }
