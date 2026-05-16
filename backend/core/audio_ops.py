import os
from pydub import AudioSegment, silence
import ffmpeg

def extract_audio(video_path: str, output_audio_path: str) -> str:
    """
    Extracts audio from a video file using FFmpeg.
    """
    try:
        (
            ffmpeg
            .input(video_path)
            .output(output_audio_path, acodec='pcm_s16le', ac=1, ar='16k')
            .overwrite_output()
            .run(quiet=True)
        )
        return output_audio_path
    except ffmpeg.Error as e:
        print(f"Error extracting audio: {e}")
        return ""

def detect_silence(audio_path: str, min_silence_len: int = 1000, silence_thresh: int = -40) -> list:
    """
    Detects silent periods with Preprocessing (Normalization).
    """
    audio = AudioSegment.from_file(audio_path)
    
    # Preprocessing: Normalize loudness so threshold is consistent across different videos
    normalized_audio = audio.normalize()
    
    silent_ranges = silence.detect_silence(
        normalized_audio, 
        min_silence_len=min_silence_len, 
        silence_thresh=silence_thresh
    )
    return silent_ranges

def get_non_silent_ranges(silent_ranges: list, total_duration_ms: int, padding_ms: int = 200) -> list:
    """
    Calculates ranges to KEEP with Padding to prevent abrupt cuts.
    padding_ms: adds extra milliseconds before and after speech.
    """
    if not silent_ranges:
        return [(0, total_duration_ms / 1000.0)]
    
    non_silent = []
    current_pos = 0
    
    for start, end in silent_ranges:
        if start > current_pos:
            # Apply padding: Start a bit earlier, end a bit later
            p_start = max(0, current_pos - padding_ms)
            p_end = min(total_duration_ms, start + padding_ms)
            non_silent.append((p_start / 1000.0, p_end / 1000.0))
        current_pos = end
        
    if current_pos < total_duration_ms:
        p_start = max(0, current_pos - padding_ms)
        p_end = total_duration_ms
        non_silent.append((p_start / 1000.0, p_end / 1000.0))
        
    return non_silent
