import ffmpeg
import os
import zipfile

def slice_video(input_path: str, output_path: str, keep_ranges: list, job_id: str) -> bool:
    """
    Slices and joins video segments accurately using FFmpeg filters.
    Forces re-encoding with a fast preset to ensure perfect joins.
    """
    if not keep_ranges:
        return False

    try:
        input_stream = ffmpeg.input(input_path)
        concat_inputs = []

        # Create filter chains for each keep range
        for i, (start, end) in enumerate(keep_ranges):
            # Interleave video and audio for each segment
            v = input_stream.video.trim(start=start, end=end).setpts('PTS-STARTPTS')
            a = input_stream.audio.filter('atrim', start=start, end=end).filter('asetpts', 'PTS-STARTPTS')
            concat_inputs.extend([v, a])

        # Concat expects interleaved inputs: [v0, a0, v1, a1, ...]
        joined = ffmpeg.concat(*concat_inputs, v=1, a=1).node
        
        # Output with fast encoding to ensure accuracy and speed
        try:
            (
                ffmpeg
                .output(
                    joined[0], joined[1], 
                    output_path, 
                    vcodec='libx264', 
                    acodec='aac', 
                    preset='ultrafast',
                    crf=28,             # Slightly higher CRF for faster encoding on limited CPU
                    threads=1           # Limit threads to avoid crashing free tier CPU
                )
                .overwrite_output()
                .run(capture_stdout=True, capture_stderr=True)
            )
        except ffmpeg.Error as e:
            print(f"FFmpeg Stdout: {e.stdout.decode() if e.stdout else 'None'}")
            print(f"FFmpeg Stderr: {e.stderr.decode() if e.stderr else 'None'}")
            return False
            
        return True
    except Exception as e:
        print(f"Error constructing FFmpeg filter chain: {e}")
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
