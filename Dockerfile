# Use an official Python runtime as a parent image
FROM python:3.10-slim

# Install system dependencies (ffmpeg)
RUN apt-get update && apt-get install -y \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# Set the working directory in the container
WORKDIR /app

# Copy requirements file
COPY backend/requirements.txt .

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the backend code
COPY backend/ /app/backend/

# Define environment variables
ENV PYTHONUNBUFFERED=1
ENV PORT=10000

# Expose the port
EXPOSE $PORT

# ใช้ sh -c เพื่อให้มันอ่านค่าตัวแปร $PORT ของ Render ได้อัตโนมัติ
CMD ["sh", "-c", "uvicorn backend.main:app --host 0.0.0.0 --port ${PORT}"]
