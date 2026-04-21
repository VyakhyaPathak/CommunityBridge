from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional
from ..database import get_db
from ..models import Task, Need, Volunteer, TaskStatus, NeedStatus
from pydantic import BaseModel
import datetime

router = APIRouter()

class TaskCreate(BaseModel):
    need_id: str
    volunteer_id: str
    coordinator_notes: Optional[str] = None

@router.post("")
async def create_task(data: TaskCreate, db: AsyncSession = Depends(get_db)):
    # Verify need
    need = await db.get(Need, data.need_id)
    if not need:
        raise HTTPException(status_code=404, detail="Need not found")
        
    volunteer = await db.get(Volunteer, data.volunteer_id)
    if not volunteer:
        raise HTTPException(status_code=404, detail="Volunteer not found")
        
    new_task = Task(
        need_id=data.need_id,
        volunteer_id=data.volunteer_id,
        coordinator_notes=data.coordinator_notes
    )
    
    db.add(new_task)
    need.status = NeedStatus.ASSIGNED
    
    await db.commit()
    return {"data": {"id": new_task.id}, "message": "Task assigned"}

@router.get("/my/{volunteer_id}")
async def get_my_tasks(volunteer_id: str, db: AsyncSession = Depends(get_db)):
    # Join with needs to get title/address
    from sqlalchemy.orm import joinedload
    query = select(Task).where(Task.volunteer_id == volunteer_id).order_by(Task.created_at.desc())
    result = await db.execute(query)
    tasks = result.scalars().all()
    
    # We need to manually populate the joined data or use a more complex query
    # For now, let's just return basic data
    return {"data": tasks}

@router.patch("/{task_id}/status")
async def update_task_status(task_id: str, status: TaskStatus, db: AsyncSession = Depends(get_db)):
    task = await db.get(Task, task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
        
    task.status = status
    if status == TaskStatus.COMPLETED:
        task.completed_at = datetime.datetime.utcnow()
        # Also resolve the need
        need = await db.get(Need, task.need_id)
        if need:
            need.status = NeedStatus.RESOLVED
            
    await db.commit()
    return {"message": f"Status updated to {status}"}
