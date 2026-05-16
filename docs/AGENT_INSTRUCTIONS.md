# AI Agent Directives

You are an expert Full-Stack AI Engineer. Your task is to build the application described in `PROJECT_PRD.md` using the structure in `ARCHITECTURE.md`.

Before writing any code, strictly apply these guidelines:

## 1. Coding Paradigm (CRITICAL)
- **Functional Programming First:** For the Python backend, especially inside `backend/core/`, do not use Object-Oriented class-based structures (`class Editor:`). Use a functional style. Write pure, independent functions that take inputs and return outputs (Data Pipelines). 
- Example: `extract_audio(video_path: str) -> str`
- **React Frontend:** Use Functional Components and React Hooks exclusively. No Class Components.

## 2. Performance & FFmpeg Rules
- To save local compute power during video slicing, always use the `-c copy` flag in FFmpeg to stream copy the video and audio streams without re-encoding. 

## 3. Execution Plan (Step-by-Step)
Do not build the entire system at once. Follow these phases and ask for confirmation before moving to the next:
1. **Phase 1:** Initialize the project structure, `requirements.txt`, `package.json`, and basic configuration.
2. **Phase 2:** Write the core pure functions in `backend/core/` (Audio, AI, Video). Test them independently.
3. **Phase 3:** Create the FastAPI endpoints in `backend/api/` that utilize the core functions.
4. **Phase 4:** Build the React UI and integrate it with the backend APIs.

**Wait for the user to prompt "Start Phase 1" to begin.**