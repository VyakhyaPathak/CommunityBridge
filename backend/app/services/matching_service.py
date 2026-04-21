from .maps_service import calculate_distance, geocode_address
from .gemini_service import match_volunteers_to_need
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from ..models import Volunteer, Need
import json

async def get_volunteer_matches(need_id: str, db: AsyncSession):
    """
    Orchestrates the matching process:
    1. Fetches need details
    2. Fetches all available volunteers
    3. Calculates distances for nearby volunteers
    4. Filters down to top candidates based on proximity and skills
    5. Calls Gemini to rank them definitively
    """
    # 1. Fetch data
    need = await db.get(Need, need_id)
    if not need or not need.lat or not need.lng:
        return []

    # 2. Fetch available volunteers
    # In a massive app, we'd use a spatial query here. 
    # For this scale, we fetch available ones and filter in Python.
    query = select(Volunteer).where(Volunteer.is_available == 1)
    result = await db.execute(query)
    all_volunteers = result.scalars().all()

    volunteers_with_dist = []
    need_context = {
        "title": need.title,
        "description": need.description,
        "category": need.category,
        "urgency_score": need.urgency_score,
        "address": need.address
    }

    # 3. Process volunteers and calculate proximity
    for v in all_volunteers:
        # Resolve volunteer location if not done (simplified for demo)
        v_lat, v_lng = None, None
        if v.location_address:
            # In production, we'd cache these coordinates in the DB
            # For this matching loop, we assume they are roughly near a fixed point if not saved
            # Simulation:
            v_lat = 26.9124 + (abs(hash(v.id)) % 200) / 1000
            v_lng = 75.7873 + (abs(hash(v.id)) % 200) / 1000
            
        dist = calculate_distance(need.lat, need.lng, v_lat, v_lng)
        
        # Only consider volunteers within their preferred radius or a default 50km
        if dist <= (v.radius_km or 50.0):
            volunteers_with_dist.append({
                "id": v.id,
                "name": v.name,
                "skill_tags": json.loads(v.skill_tags) if v.skill_tags else [],
                "bio": v.bio,
                "distance_km": dist,
                "total_tasks": v.total_tasks_completed
            })

    # 4. Sort by proximity first as a primary filter
    sorted_by_dist = sorted(volunteers_with_dist, key=lambda x: x["distance_km"])
    top_candidates = sorted_by_dist[:10] # Take nearest 10 for AI refinement

    # 5. Use Gemini for final behavioral/skill matching
    ai_matches = await match_volunteers_to_need(need_context, top_candidates)
    
    # 6. Merge AI scores with candidate details
    final_results = []
    for am in ai_matches:
        candidate = next((c for c in top_candidates if c["id"] == am["volunteer_id"]), None)
        if candidate:
            final_results.append({
                **candidate,
                "match_score": am["match_score"],
                "match_reason": am["reason"]
            })

    # Sort final results by AI match score
    return sorted(final_results, key=lambda x: x.get("match_score", 0), reverse=True)
