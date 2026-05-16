import os
import shutil
import uuid
from fastapi import APIRouter, UploadFile, File, BackgroundTasks, HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import List
from backend.core.audio_ops import extract_audio, detect_silence
# from backend.core.whisper_ops import transcribe_audio, format_to_srt
from backend.core.video_ops import slice_video, create_export_zip

router = APIRouter()
UPLOAD_DIR = "backend/temp_storage"
if not os.path.exists(UPLOAD_DIR):
    os.makedirs(UPLOAD_DIR)

jobs = {}

class ExportRequest(BaseModel):
    job_id: str
    keep_ranges: List[List[float]]
    subtitles: List[dict]

@router.post("/upload")
async def upload_video(
    background_tasks: BackgroundTasks, 
    file: UploadFile = File(...),
    min_silence_len: int = 1000,
    silence_thresh: int = -40,
    model_size: str = "base",
    with_subtitles: bool = True
):
    job_id = str(uuid.uuid4())
    file_extension = file.filename.split(".")[-1]
    video_path = os.path.join(UPLOAD_DIR, f"{job_id}_input.{file_extension}")

    with open(video_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    jobs[job_id] = {
        "status": "processing", 
        "progress_status": "กำลังเริ่มต้น...",
        "progress_percent": 5,
        "video_path": video_path
    }
    background_tasks.add_task(process_video, job_id, video_path, min_silence_len, silence_thresh, model_size, with_subtitles)

    return {"job_id": job_id}

@router.get("/status/{job_id}")
async def get_status(job_id: str):
    if job_id not in jobs:
        raise HTTPException(status_code=404, detail="Job not found")
    return jobs[job_id]

def process_video(job_id: str, video_path: str, min_silence_len: int, silence_thresh: int, model_size: str, with_subtitles: bool):
    try:
        audio_path = video_path.replace("_input", "_audio").rsplit(".", 1)[0] + ".wav"

        jobs[job_id].update({"progress_status": "กำลังดึงข้อมูลเสียง...", "progress_percent": 20})
        extract_audio(video_path, audio_path)

        jobs[job_id].update({"progress_status": "กำลังวิเคราะห์หาช่วงเงียบ...", "progress_percent": 60})
        silent_ranges = detect_silence(audio_path, min_silence_len=min_silence_len, silence_thresh=silence_thresh)

        segments = []
        # if with_subtitles:
        #     jobs[job_id].update({"progress_status": f"กำลังถอดเสียงด้วย AI ({model_size})...", "progress_percent": 80})
        #     segments = transcribe_audio(audio_path, model_size=model_size)

        
        jobs[job_id].update({
            "status": "completed",
            "progress_status": "ประมวลผลเสร็จสมบูรณ์!",
            "progress_percent": 100,
            "audio_path": audio_path,
            "video_filename": os.path.basename(video_path),
            "silence": silent_ranges,
            "segments": segments
        })
    except Exception as e:
        print(f"Error in process_video: {e}")
        jobs[job_id].update({
            "status": "failed", 
            "progress_status": f"เกิดข้อผิดพลาด: {str(e)}",
            "error": str(e)
        })

@router.post("/export")
async def export_project(request: ExportRequest):
    job_id = request.job_id
    if job_id not in jobs:
        raise HTTPException(status_code=404, detail="Job not found")
        
    job_data = jobs[job_id]
    input_video = job_data["video_path"]
    output_video = os.path.join(UPLOAD_DIR, f"{job_id}_output.mp4")
    srt_path = os.path.join(UPLOAD_DIR, f"{job_id}.srt")
    zip_path = os.path.join(UPLOAD_DIR, f"{job_id}_export.zip")
    
    success = slice_video(input_video, output_video, request.keep_ranges)
    if not success:
        raise HTTPException(status_code=500, detail="Video slicing failed")
        
    # srt_content = format_to_srt(request.subtitles)
    # with open(srt_path, "w", encoding="utf-8") as f:
    #     f.write(srt_content)
    
    files_to_zip = [output_video]
    if os.path.exists(srt_path):
        files_to_zip.append(srt_path)
        
    create_export_zip(zip_path, files_to_zip)
    return {"download_url": f"/download/{job_id}"}

@router.get("/download/{job_id}")
async def download_file(job_id: str, background_tasks: BackgroundTasks):
    zip_path = os.path.join(UPLOAD_DIR, f"{job_id}_export.zip")
    if not os.path.exists(zip_path):
        raise HTTPException(status_code=404, detail="Export file not found")
    
    # สั่งลบไฟล์ขยะทั้งหมดที่เกี่ยวกับ Job นี้หลังจากส่งไฟล์ให้ลูกค้าแล้ว
    background_tasks.add_task(cleanup_job_files, job_id)
    
    return FileResponse(zip_path, media_type='application/zip', filename="autocut_export.zip")

def cleanup_job_files(job_id: str):
    """
    ลบไฟล์ทุกไฟล์ที่มี job_id อยู่ในชื่อ เพื่อคืนพื้นที่ให้เซิร์ฟเวอร์
    """
    print(f"[Cleanup] เริ่มลบไฟล์ขยะสำหรับ Job: {job_id}")
    try:
        for filename in os.listdir(UPLOAD_DIR):
            if job_id in filename:
                file_path = os.path.join(UPLOAD_DIR, filename)
                if os.path.exists(file_path):
                    os.remove(file_path)
                    print(f"[Cleanup] ลบสำเร็จ: {filename}")
    except Exception as e:
        print(f"[Cleanup Error] ไม่สามารถลบไฟล์ได้: {e}")
