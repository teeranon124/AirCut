from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.api import routes
import os
import shutil

app = FastAPI(title="Aircut AI - WASM Core")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Startup Cleanup
UPLOAD_DIR = "backend/temp_storage"
if not os.path.exists(UPLOAD_DIR):
    os.makedirs(UPLOAD_DIR)

app.include_router(routes.router)

@app.on_event("startup")
async def startup_event():
    """
    Clear all temp files on start.
    """
    try:
        for filename in os.listdir(UPLOAD_DIR):
            file_path = os.path.join(UPLOAD_DIR, filename)
            if os.path.isfile(file_path):
                os.unlink(file_path)
        print("[Startup] Cleaned storage.")
    except Exception as e:
        print(f"Startup Warning: {e}")

@app.get("/")
def read_root():
    return {"message": "Aircut AI Analysis API is Live"}
