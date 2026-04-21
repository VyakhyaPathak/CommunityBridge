import google.generativeai as genai
import json
import asyncio
from ..config import get_settings

settings = get_settings()

if settings.GEMINI_API_KEY:
    genai.configure(api_key=settings.GEMINI_API_KEY)

ANALYZE_NEED_PROMPT = """
You are a community needs analyst for NGOs in India. Analyze the submitted community need report.
Focus on extracting the real urgency and category based on the context provided.

Tasks:
1. Categorize into: Food, Medical, Shelter, Education, Water, Logistics, or Other.
2. Assign urgency score 1.0-10.0 based on severity and time-sensitivity.
3. Extract 3-5 key themes/issues.
4. Provide a professional 2-sentence summary.
"""

MATCH_VOLUNTEERS_PROMPT = """
You are an expert volunteer coordinator for NGOs. Match volunteers to community needs based on skills, location proximity, and availability.
Rank the volunteers based on their suitability for this specific need.
"""

TREND_REPORT_PROMPT = """
You are a data strategist for a humanitarian aid network. Analyze the following needs data for the specified period.
Identify patterns, critical hotspots, and resource gaps.
"""

async def analyze_need(title: str, description: str, address: str, urgency_input: int):
    """
    Analyzes a community need using Gemini 1.5 Flash.
    Retries up to 3 times with exponential backoff on failure.
    """
    if not settings.GEMINI_API_KEY:
        return {
            "category": "Other",
            "urgency_score": float(urgency_input * 2),
            "key_themes": ["Internal Service Bypass"],
            "summary": "AI analysis was bypassed due to configuration state."
        }

    model = genai.GenerativeModel('gemini-1.5-flash')
    
    prompt = f"""
    {ANALYZE_NEED_PROMPT}

    Need to analyze:
    Title: {title}
    Description: {description}
    Location: {address}
    User-reported urgency (1-5 scale): {urgency_input}

    Return JSON matching this schema:
    {{
        "category": str,
        "urgency_score": float,
        "key_themes": list[str],
        "summary": str
    }}
    """

    for attempt in range(3):
        try:
            response = await asyncio.to_thread(
                model.generate_content,
                prompt,
                generation_config=genai.types.GenerationConfig(
                    response_mime_type="application/json",
                    temperature=0.3
                )
            )
            return json.loads(response.text)
        except Exception as e:
            wait_time = (2 ** attempt)
            print(f"Gemini analyze_need attempt {attempt + 1} failed: {e}. Retrying in {wait_time}s...")
            await asyncio.sleep(wait_time)

    # Final fallback
    return {
        "category": "Other",
        "urgency_score": float(urgency_input * 2),
        "key_themes": ["Analysis Failure"],
        "summary": f"Automated analysis failed after repeated attempts for: {title}"
    }

async def match_volunteers_to_need(need_data: dict, volunteers: list[dict]) -> list[dict]:
    """
    Ranks volunteers for a specific need using Gemini.
    Returns a ranked list of volunteer IDs with match reasons.
    """
    if not settings.GEMINI_API_KEY or not volunteers:
        return []

    model = genai.GenerativeModel('gemini-1.5-flash')
    
    # Serialize data for the prompt
    volunteers_brief = [
        {
            "id": v["id"],
            "name": v["name"],
            "skills": v.get("skill_tags", []),
            "bio": v.get("bio", ""),
            "distance_km": v.get("distance_km")
        } for v in volunteers
    ]

    prompt = f"""
    {MATCH_VOLUNTEERS_PROMPT}

    Community Need:
    {json.dumps(need_data, indent=2)}

    Available Volunteers:
    {json.dumps(volunteers_brief, indent=2)}

    Return a JSON array of objects, ranked by suitability:
    [
        {{
            "volunteer_id": str,
            "match_score": float (0-100),
            "reason": str (Max 20 words explaining the specific fit)
        }},
        ...
    ]
    """

    try:
        response = await asyncio.to_thread(
            model.generate_content,
            prompt,
            generation_config=genai.types.GenerationConfig(
                response_mime_type="application/json",
                temperature=0.2
            )
        )
        return json.loads(response.text)
    except Exception as e:
        print(f"Gemini matching failed: {e}")
        return []

async def generate_trend_report(needs_data: list[dict], period: str) -> dict:
    """
    Generates a high-level trend report from multiple needs using Gemini.
    """
    if not settings.GEMINI_API_KEY or not needs_data:
        return {"summary": "No data available for report generation.", "top_categories": [], "hotspots": []}

    model = genai.GenerativeModel('gemini-1.5-flash')
    
    prompt = f"""
    {TREND_REPORT_PROMPT}
    Period: {period}
    Count: {len(needs_data)}

    Data Snippet:
    {json.dumps([{"title": n["title"], "category": n["category"], "urgency": n["urgency_score"]} for n in needs_data[:20]], indent=2)}

    Return JSON matching this schema:
    {{
        "summary": str (Executive summary of trends),
        "top_categories": list[str],
        "hotspots": list[str],
        "resource_gaps": list[str],
        "strategic_recommendation": str
    }}
    """

    try:
        response = await asyncio.to_thread(
            model.generate_content,
            prompt,
            generation_config=genai.types.GenerationConfig(
                response_mime_type="application/json",
                temperature=0.3
            )
        )
        return json.loads(response.text)
    except Exception as e:
        print(f"Gemini trend report failed: {e}")
        return {"summary": "Automatic report generation failed due to service interruption.", "top_categories": [], "hotspots": []}
