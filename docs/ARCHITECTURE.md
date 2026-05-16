# System Architecture (Local Development)

## 1. Tech Stack
- **Frontend:** React (Vite), TailwindCSS, Axios
- **Backend:** FastAPI (Python), Uvicorn, Python `BackgroundTasks`
- **Core Processing:** 
  - `faster-whisper` (รัน Local ประหยัดสเปค)
  - `pydub` (ตรวจจับระดับเสียงและความเงียบ)
  - `ffmpeg-python` (จัดการวิดีโอและเสียง)

## 2. Directory Structure
```text
project-root/
│
├── backend/
│   ├── api/
│   │   └── routes.py         # จุดรับส่ง Request/Response (FastAPI)
│   ├── core/
│   │   ├── audio_ops.py      # ดึงเสียง, หาความเงียบ (pydub)
│   │   ├── whisper_ops.py    # ถอดเสียง, แปลงรูปแบบซับไตเติล
│   │   └── video_ops.py      # สั่งตัดต่อวิดีโอ (ffmpeg copy), สร้าง zip
│   ├── temp_storage/         # เก็บไฟล์ระหว่างประมวลผล (ลบเมื่อเสร็จ)
│   ├── main.py               # จุดเริ่มรันเซิร์ฟเวอร์
│   └── requirements.txt
│
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── UploadZone.jsx
    │   │   ├── SilenceEditor.jsx
    │   │   ├── SubtitleEditor.jsx
    │   │   └── ExportButton.jsx
    │   ├── App.jsx
    │   └── main.jsx
    ├── package.json
    └── tailwind.config.js