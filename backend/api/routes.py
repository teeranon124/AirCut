import os
import shutil
import uuid
from fastapi import APIRouter, UploadFile, File, HTTPException
from pydantic import BaseModel
from typing import List
from backend.core.audio_ops import detect_silence

router = APIRouter()
UPLOAD_DIR = "backend/temp_storage"
if not os.path.exists(UPLOAD_DIR):
    os.makedirs(UPLOAD_DIR)

@router.post("/analyze-silence")
async def analyze_silence_endpoint(
    audio: UploadFile = File(...),
    min_silence_len: int = 1000,
    silence_thresh: int = -40
):
    """
    AI Silence Detection.
    Receives only WAV audio from client, analyzes it, and returns silence ranges.
    No heavy video processing happens here anymore.
    """
    job_id = str(uuid.uuid4())
    audio_path = os.path.join(UPLOAD_DIR, f"{job_id}_analyze.wav")
    
    # Save the small audio file
    with open(audio_path, "wb") as buffer:
        shutil.copyfileobj(audio.file, buffer)
        
    try:
        # Perform Analysis
        silent_ranges = detect_silence(audio_path, min_silence_len=min_silence_len, silence_thresh=silence_thresh)
        
        # Cleanup immediately
        os.remove(audio_path)
        
        return {"silence": silent_ranges}
    except Exception as e:
        if os.path.exists(audio_path): os.remove(audio_path)
        print(f"Analysis Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
