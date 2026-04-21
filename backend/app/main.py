from fastapi import FastAPI, Request, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession
import os
import path
import httpx
from .database import engine, Base, get_db
from .config import get_settings
from .routers import needs, volunteers, tasks, ai

settings = get_settings()

app = FastAPI(title="CommunityBridge API")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(needs.router, prefix="/api/needs", tags=["needs"])
app.include_router(volunteers.router, prefix="/api/volunteers", tags=["volunteers"])
app.include_router(tasks.router, prefix="/api/tasks", tags=["tasks"])
app.include_router(ai.router, prefix="/api/ai", tags=["ai"])

@app.get("/api/health")
async def health_check():
    return {
        "status": "ok",
        "backend": "Python/FastAPI",
        "environment": settings.ENVIRONMENT,
        "database": "connected"
    }

# Vite Integration (SPA Fallback)
@app.on_event("startup")
async def startup():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

# Proxy to Vite dev server or serve static files
@app.get("/{rest_of_path:path}")
async def serve_frontend(request: Request, rest_of_path: str):
    if rest_of_path.startswith("api"):
        raise HTTPException(status_code=404)
        
    static_dir = os.path.join(os.getcwd(), "dist")
    
    if not settings.is_development:
        file_path = os.path.join(static_dir, rest_of_path)
        if os.path.isfile(file_path):
            return FileResponse(file_path)
        return FileResponse(os.path.join(static_dir, "index.html"))
    else:
        # In development, proxy to Vite on port 5173
        # This assumes vite is running in another process
        async with httpx.AsyncClient() as client:
            url = f"http://localhost:5173/{rest_of_path}"
            try:
                response = await client.get(url, params=request.query_params)
                return Response(
                    content=response.content,
                    status_code=response.status_code,
                    headers=dict(response.headers)
                )
            except Exception:
                return FileResponse(os.path.join(os.getcwd(), "index.html"))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=settings.PORT)
