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
        video_segments = []
        audio_segments = []

        # Create filter chains for each keep range
        for i, (start, end) in enumerate(keep_ranges):
            v = input_stream.video.trim(start=start, end=end).setpts('PTS-STARTPTS')
            a = input_stream.audio.filter('atrim', start=start, end=end).filter('asetpts', 'PTS-STARTPTS')
            video_segments.append(v)
            audio_segments.append(a)

        # Concat all segments into a single video/audio stream
        joined = ffmpeg.concat(*video_segments, *audio_segments, v=1, a=1).node
        
        # Output with fast encoding to ensure accuracy and speed
        (
            ffmpeg
            .output(
                joined[0], joined[1], 
                output_path, 
                vcodec='libx264', 
                acodec='aac', 
                preset='ultrafast', # Maximize speed
                crf=23              # Standard quality balance
            )
            .overwrite_output()
            .run(quiet=True)
        )
        return True
    except ffmpeg.Error as e:
        print(f"Error slicing video: {e}")
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
