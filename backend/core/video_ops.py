import ffmpeg
import os
import zipfile

def slice_video(input_path: str, output_path: str, keep_ranges: list, job_id: str, crf: int = 23) -> bool:
    """
    Professional Grade Slicing & Joining.
    Uses precise trimming and PTS resetting to ensure 100% seamless, frame-accurate joins.
    """
    if not keep_ranges:
        return False

    try:
        input_stream = ffmpeg.input(input_path)
        segments = []

        # Build precise filter chains for each segment
        for i, (start, end) in enumerate(keep_ranges):
            v = input_stream.video.trim(start=start, end=end).setpts('PTS-STARTPTS')
            a = input_stream.audio.filter('atrim', start=start, end=end).filter('asetpts', 'PTS-STARTPTS')
            segments.append(v)
            segments.append(a)

        # Join everything using the concat filter (the most stable high-quality method)
        joined = ffmpeg.concat(*segments, v=1, a=1).node
        
        # Output with High Quality settings
        (
            ffmpeg
            .output(
                joined[0], joined[1], 
                output_path, 
                vcodec='libx264', 
                acodec='aac', 
                preset='medium',   # Balanced quality/speed for professional results
                crf=crf,           # Quality level (23 is standard HQ)
                threads=0          # Auto-detect threads for maximum local speed
            )
            .overwrite_output()
            .run(capture_stdout=True, capture_stderr=True)
        )
        return True
    except ffmpeg.Error as e:
        print(f"FFmpeg Error: {e.stderr.decode() if e.stderr else str(e)}")
        return False
    except Exception as e:
        print(f"Unexpected Error: {e}")
        return False

def create_export_zip(zip_path: str, files_to_include: list):
    """
    Packages specified files into a zip archive.
    """
    with zipfile.ZipFile(zip_path, 'w') as zipf:
        for file in files_to_include:
            if os.path.exists(file):
                zipf.write(file, os.path.basename(file))
    return zip_path
