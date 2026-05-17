# Aircut AI - Run Script (Windows PowerShell)

Write-Host "🚀 Starting Aircut AI Development Servers..." -ForegroundColor Cyan

# 1. Start Backend in a new window
Start-Process powershell.exe -ArgumentList "-NoExit", "-Command", "Write-Host '🐍 Starting FastAPI Backend...'; backend/venv/Scripts/python -m uvicorn backend.main:app --reload --reload-dir backend --reload-exclude 'temp_storage/*' --port 8000"

# 2. Start Frontend in a new window
Start-Process powershell.exe -ArgumentList "-NoExit", "-Command", "Write-Host '⚛️ Starting Vite Frontend...'; cd frontend; npm run dev"

Write-Host "✅ Both servers are starting in separate windows." -ForegroundColor Green
Write-Host "Backend: http://localhost:8000"
Write-Host "Frontend: http://localhost:5173"
