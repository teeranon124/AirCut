# Task: Prepare AutoCut App for Production Deployment (No Subtitles, Silence Cut Only)

โปรเจกต์นี้กำลังจะนำขึ้น Deploy จริงบนเซิร์ฟเวอร์ฟรี (Render.com สำหรับ Backend และ Vercel สำหรับ Frontend) โดยเราจะ "ปิดการใช้งาน" ฟีเจอร์ที่เกี่ยวกับ AI ถอดเสียงออกชั่วคราว เพื่อประหยัดทรัพยากร และโฟกัสแค่ฟีเจอร์ตัด Dead Air (pydub + ffmpeg)

กรุณาทำตามขั้นตอนต่อไปนี้อย่างเคร่งครัด:

## Step 1: Hide Subtitle Features (Frontend & Backend)
1. ในฝั่ง **Frontend (React)**: ค้นหา UI components ที่เกี่ยวข้องกับการใส่ซับไตเติล (ปุ่มกด, หน้าต่าง Editor) ให้ทำการ **Comment โค้ดส่วนนั้นไว้** (ห้ามลบทิ้ง เผื่อนำกลับมาใช้ในอนาคต) ปรับ UI ให้เหลือแค่ปุ่มอัปโหลด, ส่วนปรับแต่ง Dead Air และปุ่ม Export
2. ในฝั่ง **Backend (FastAPI)**: Comment ฟังก์ชันและการเรียกใช้งาน `faster-whisper` ในหน้า API Route ออกให้หมด ให้ Endpoint เหลือแค่กระบวนการรับไฟล์ -> `extract_audio` -> `find_silence` -> ส่งพิกัดกลับ -> รอรับคำสั่ง -> `cut_video`
3. ลบ `faster-whisper` ออกจากไฟล์ `requirements.txt` เพื่อให้เซิร์ฟเวอร์ปลายทางไม่ต้องโหลดแพ็กเกจที่หนักเกินความจำเป็น

## Step 2: Create Dockerfile for Backend (Render.com)
เนื่องจากเซิร์ฟเวอร์ Render ต้องใช้ FFmpeg ในการประมวลผล ให้สร้างไฟล์ `Dockerfile` ในโฟลเดอร์ `backend/` โดยมีโครงสร้างดังนี้:
- ใช้ Base image เป็น `python:3.10-slim`
- รันคำสั่งอัปเดต apt-get และติดตั้ง `ffmpeg`
- ติดตั้ง Python packages จาก `requirements.txt`
- เปิดพอร์ต 8000 และรัน Uvicorn 

## Step 3: Deployment Instructions (MD File)
สร้างไฟล์ `docs/DEPLOYMENT_GUIDE.md` อธิบายขั้นตอนสั้นๆ เป็นภาษาไทยให้ฉันอ่าน เพื่อให้นำโค้ดนี้ไปขึ้น Render และ Vercel ได้อย่างถูกต้อง (เน้นการตั้งค่า Environment variables และ CORS)

**Rule Reminder:** โค้ด Python ที่มีการอัปเดตหรือแก้ไข ต้องคงรูปแบบ Functional Programming ไว้อย่างเคร่งครัด ห้ามใช้ Class เด็ดขาด