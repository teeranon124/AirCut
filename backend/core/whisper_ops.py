from faster_whisper import WhisperModel
import os

def transcribe_audio(audio_path: str, model_size: str = "medium") -> list:
    """
    Transcribes audio using faster-whisper. Optimized for speed and standard segmentation.
    """
    print(f"--- Starting Transcription with model: {model_size} ---")
    model = WhisperModel(model_size, device="cpu", compute_type="int8")
    
    segments, info = model.transcribe(
        audio_path, 
        language="th",
        beam_size=5, 
        word_timestamps=True,
        vad_filter=True,
        vad_parameters=dict(min_silence_duration_ms=500),
        condition_on_previous_text=False,
        initial_prompt="วิดีโอภาษาไทย เกี่ยวกับการพูดคุย"
    )
    
    result = []
    for segment in segments:
        result.append({
            "start": segment.start,
            "end": segment.end,
            "text": segment.text.strip()
        })
        
    return result

def format_to_srt(segments: list) -> str:
    """
    Converts whisper segments to SRT format string.
    """
    srt_content = ""
    for i, segment in enumerate(segments):
        start = format_timestamp(segment['start'])
        end = format_timestamp(segment['end'])
        srt_content += f"{i + 1}\n{start} --> {end}\n{segment['text']}\n\n"
    return srt_content

def format_timestamp(seconds: float) -> str:
    """
    Formats seconds into SRT timestamp format HH:MM:SS,mmm
    """
    td_hours = int(seconds // 3600)
    td_mins = int((seconds % 3600) // 60)
    td_secs = int(seconds % 60)
    td_millis = int((seconds % 1) * 1000)
    return f"{td_hours:02}:{td_mins:02}:{td_secs:02},{td_millis:03}"
