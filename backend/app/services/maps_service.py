from opencage.geocoder import OpenCageGeocode
from ..config import get_settings
from fastapi import HTTPException
import math

settings = get_settings()

async def geocode_address(address: str):
    """
    Translates an address string into latitude and longitude using OpenCage.
    Returns a dict with lat and lng.
    """
    if not settings.OPENCAGE_API_KEY:
        # Development fallback (Randomized coordinate near a base point)
        return {
            "lat": 26.9124 + (hash(address) % 100) / 1000, 
            "lng": 75.7873 + (hash(address) % 100) / 1000
        }
        
    try:
        # Note: opencage is synchronous, wrapping in try/except
        geocoder = OpenCageGeocode(settings.OPENCAGE_API_KEY)
        results = geocoder.geocode(address)
        
        if results and len(results) > 0:
            return {
                "lat": results[0]['geometry']['lat'],
                "lng": results[0]['geometry']['lng']
            }
        return {"lat": None, "lng": None}
    except Exception as e:
        print(f"OpenCage Geocoding error for [{address}]: {e}")
        # Stable fallback for demo/development environments
        return {
            "lat": 26.9124 + (abs(hash(address)) % 100) / 1000, 
            "lng": 75.7873 + (abs(hash(address)) % 100) / 1000
        }

def calculate_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calculates the Haversine distance between two points in kilometers.
    """
    if None in [lat1, lon1, lat2, lon2]:
        return float('inf')
        
    R = 6371.0 # Earth radius in km

    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    
    a = math.sin(dlat / 2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    
    distance = R * c
    return round(distance, 2)
