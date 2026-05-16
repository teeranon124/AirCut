import ffmpeg
import os
import zipfile

def slice_video(input_path: str, output_path: str, keep_ranges: list) -> bool:
    """
    Slices video segments and concatenates them using FFmpeg stream copy.
    keep_ranges: list of tuples (start_sec, end_sec)
    """
    if not keep_ranges:
        return False

    temp_files = []
    try:
        # Create temporary segments
        for i, (start, end) in enumerate(keep_ranges):
            temp_segment = f"temp_seg_{i}.mp4"
            (
                ffmpeg
                .input(input_path, ss=start, to=end)
                .output(temp_segment, c="copy")
                .overwrite_output()
                .run(quiet=True)
            )
            temp_files.append(temp_segment)

        # Create concat file
        concat_list_path = "concat_list.txt"
        with open(concat_list_path, "w") as f:
            for temp_file in temp_files:
                f.write(f"file '{temp_file}'\n")

        # Concatenate
        (
            ffmpeg
            .input(concat_list_path, format='concat', safe=0)
            .output(output_path, c="copy")
            .overwrite_output()
            .run(quiet=True)
        )
        return True
    except ffmpeg.Error as e:
        print(f"Error slicing video: {e}")
        return False
    finally:
        # Cleanup
        for f in temp_files:
            if os.path.exists(f):
                os.remove(f)
        if os.path.exists("concat_list.txt"):
            os.remove("concat_list.txt")

def create_export_zip(zip_path: str, files_to_include: list):
    """
    Packages specified files into a zip archive.
    """
    with zipfile.ZipFile(zip_path, 'w') as zipf:
        for file in files_to_include:
            if os.path.exists(file):
                zipf.write(file, os.path.basename(file))
    return zip_path
