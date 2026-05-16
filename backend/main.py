from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from backend.api import routes
import os

app = FastAPI(title="AutoCut & Caption API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve temp_storage for video previews
UPLOAD_DIR = "backend/temp_storage"
if not os.path.exists(UPLOAD_DIR):
    os.makedirs(UPLOAD_DIR)
app.mount("/previews", StaticFiles(directory=UPLOAD_DIR), name="previews")

app.include_router(routes.router)

@app.get("/")
def read_root():
    return {"message": "Welcome to AutoCut & Caption API"}
