from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from ..database import get_db
from ..models import Need, Volunteer
from ..services.gemini_service import analyze_need, generate_trend_report
from ..services.matching_service import get_volunteer_matches
import json
import datetime

router = APIRouter()

@router.post("/analyze/{need_id}")
async def trigger_manual_analysis(need_id: str, db: AsyncSession = Depends(get_db)):
    """
    Manually triggers AI analysis for a specific need.
    """
    need = await db.get(Need, need_id)
    if not need:
        raise HTTPException(status_code=404, detail="Need not found")

    try:
        analysis = await analyze_need(need.title, need.description, need.address, need.urgency_input)
        
        need.category = analysis.get("category")
        need.urgency_score = analysis.get("urgency_score")
        need.ai_analysis_json = json.dumps(analysis)
        need.status = "open"
        
        await db.commit()
        return {"data": analysis, "message": "AI Analysis completed successfully"}
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"AI Service Error: {str(e)}")

@router.get("/match/{need_id}")
async def get_matches(need_id: str, db: AsyncSession = Depends(get_db)):
    """
    Retrieves ranked volunteer matches for a specific need.
    """
    try:
        matches = await get_volunteer_matches(need_id, db)
        return {"data": matches, "message": f"Found {len(matches)} suitable volunteers"}
    except Exception as e:
        print(f"Matching error: {e}")
        return {"data": [], "message": "Matching service currently unavailable"}

@router.get("/report")
async def get_trend_report(
    period: str = Query("7d", description="Time period for report (7d, 30d, 90d)"),
    db: AsyncSession = Depends(get_db)
):
    """
    Generates an AI-driven trend report for a specific time period.
    """
    # Calculate cutoff date
    days = int(period[:-1]) if period.endswith('d') else 7
    cutoff = datetime.datetime.utcnow() - datetime.timedelta(days=days)
    
    # Fetch needs from that period
    query = select(Need).where(Need.created_at >= cutoff)
    result = await db.execute(query)
    needs = result.scalars().all()
    
    needs_data = [
        {"title": n.title, "category": n.category, "urgency_score": n.urgency_score}
        for n in needs if n.category
    ]
    
    report = await generate_trend_report(needs_data, period)
    return {"data": report}

@router.get("/status/{need_id}")
async def get_ai_status(need_id: str, db: AsyncSession = Depends(get_db)):
    """
    Checks the status of AI analysis for a specific need.
    """
    need = await db.get(Need, need_id)
    if not need:
        raise HTTPException(status_code=404, detail="Need not found")
        
    return {
        "data": {
            "id": need_id,
            "status": need.status,
            "has_analysis": need.ai_analysis_json is not None,
            "analysis": json.loads(need.ai_analysis_json) if need.ai_analysis_json else None
        }
    }
