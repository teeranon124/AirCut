# คู่มือการติดตั้งระบบ AutoCut (Production Deployment)

คู่มือนี้อธิบายขั้นตอนการนำโปรเจกต์ AutoCut ขึ้นระบบจริงบน **Render.com** (Backend) และ **Vercel** (Frontend) โดยปิดฟีเจอร์ซับไตเติลชั่วคราวเพื่อประหยัดทรัพยากร

---

## 1. การเตรียม Backend (Render.com)

Backend ของเราเขียนด้วย FastAPI และต้องการ FFmpeg ในการตัดต่อวิดีโอ การใช้ Docker จึงเป็นทางเลือกที่เสถียรที่สุด

### ขั้นตอนการสร้าง Web Service:
1.  **เชื่อมต่อ GitHub:** เลือก Repository ของคุณบน Render
2.  **เลือกประเภท Service:** เลือก **Web Service**
3.  **ตั้งค่า Docker:**
    *   Render จะตรวจพบ `Dockerfile` ในโฟลเดอร์ `backend/` อัตโนมัติ (หากไม่ได้อยู่ใน Root ให้ตั้งค่า **Docker Context** ไปที่โฟลเดอร์ที่มี Dockerfile)
4.  **Environment Variables:** ตั้งค่าตัวแปรที่จำเป็น:
    *   `PORT`: `8000`
5.  **CORS Setup:** ตรวจสอบว่าในไฟล์ `backend/main.py` ได้อนุญาต URL ของ Frontend ที่ได้จาก Vercel เรียบร้อยแล้ว

---

## 2. การเตรียม Frontend (Vercel)

Frontend ของเราเป็น React (Vite) ซึ่งสามารถนำขึ้น Vercel ได้ง่าย

### ขั้นตอนการ Build:
1.  **เชื่อมต่อ GitHub:** เลือก Repository ของคุณ
2.  **ตั้งค่า Build Settings:**
    *   **Framework Preset:** `Vite`
    *   **Root Directory:** `frontend/`
    *   **Build Command:** `npm run build`
    *   **Output Directory:** `dist`
3.  **Environment Variables:** 
    *   ตั้งค่า `VITE_API_BASE_URL` ให้ชี้ไปยัง URL ของ Backend ที่ได้จาก Render (เช่น `https://autocut-api.onrender.com`)

---

## 3. สิ่งที่ควรระวัง (Critical Notes)

1.  **CORS Policy:** หลังจากได้ URL จาก Vercel แล้ว อย่าลืมกลับมาเพิ่ม URL นั้นใน `backend/main.py` ตรงส่วนของ `allow_origins` เพื่อให้ Frontend เรียกใช้ API ได้
2.  **Storage:** เซิร์ฟเวอร์ฟรีของ Render มีพื้นที่จำกัดและจะลบไฟล์ทิ้งเมื่อรีสตาร์ท (Ephemeral Storage) ซึ่งเหมาะสำหรับระบบ `temp_storage` ของเราอยู่แล้ว
3.  **FFmpeg:** Dockerfile ที่จัดเตรียมไว้ได้ทำการติดตั้ง FFmpeg ให้เรียบร้อยแล้ว ไม่ต้องตั้งค่า PATH เพิ่มเติมในระบบจริง

---

**AutoCut ทีมพัฒนา**
*สถานะ: พร้อมสำหรับการ Deployment (โหมดตัดช่วงเงียบ)*
