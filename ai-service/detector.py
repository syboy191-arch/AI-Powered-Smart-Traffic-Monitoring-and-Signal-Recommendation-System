import argparse
import json
import logging
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

import cv2
from ultralytics import YOLO
from ultralytics.utils import LOGGER

# Redirect Ultralytics logger to stderr so stdout carries ONLY PROGRESS lines
for handler in LOGGER.handlers:
    if isinstance(handler, logging.StreamHandler):
        handler.setStream(sys.stderr)

# ==============================================================================
# Constants
# ==============================================================================

VEHICLE_CLASS_NAMES = ("car", "motorcycle", "bus", "truck")
DENSITY_MEDIUM_MIN = 5
DENSITY_HIGH_MIN = 12
DEFAULT_CONFIDENCE = 0.4

SCRIPT_DIR = Path(__file__).resolve().parent
REPO_ROOT = SCRIPT_DIR.parent

DEFAULT_MODEL = SCRIPT_DIR / "models" / "yolov8n.pt"
DEFAULT_VIDEO = REPO_ROOT / "videos" / "traffic.mp4"
DEFAULT_OUTPUT = REPO_ROOT / "traffic_data.json"


# ==============================================================================
# FFmpeg Transcoding Utility
# ==============================================================================

def find_ffmpeg() -> str | None:
    """Find ffmpeg binary from imageio-ffmpeg or system PATH."""
    try:
        import imageio_ffmpeg
        exe = imageio_ffmpeg.get_ffmpeg_exe()
        if exe and Path(exe).exists():
            return exe
    except Exception:
        pass

    return shutil.which("ffmpeg")


def transcode_to_mp4(avi_path: Path, mp4_path: Path) -> bool:
    """Transcode AVI to browser-playable H.264 MP4 with yuv420p and +faststart."""
    ffmpeg_exe = find_ffmpeg()
    if not ffmpeg_exe:
        print(
            "Warning: ffmpeg not found via imageio-ffmpeg or system PATH; skipping video transcode",
            file=sys.stderr,
        )
        return False

    try:
        cmd = [
            ffmpeg_exe,
            "-y",
            "-i",
            str(avi_path),
            "-c:v",
            "libx264",
            "-pix_fmt",
            "yuv420p",
            "-movflags",
            "+faststart",
            "-an",
            str(mp4_path),
        ]
        res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, check=False)
        if res.returncode == 0 and mp4_path.exists() and mp4_path.stat().st_size > 0:
            print(f"Successfully transcoded annotated video to {mp4_path}", file=sys.stderr)
            return True
        else:
            err_msg = res.stderr.decode("utf-8", errors="ignore")
            print(
                f"Warning: ffmpeg transcode failed (exit {res.returncode}): {err_msg}",
                file=sys.stderr,
            )
            return False
    except Exception as e:
        print(f"Warning: ffmpeg transcode encountered an exception: {e}", file=sys.stderr)
        return False


# ==============================================================================
# Video Analysis Function
# ==============================================================================

def analyze_video(
    video_path: Path,
    output_path: Path,
    model_path: Path = DEFAULT_MODEL,
    run_dir: Path | None = None,
) -> int:
    """Analyze a video for vehicles, compute density, and write JSON output.

    Returns:
        0 on success
        2 if file missing or not decodable
        3 if no frames processed
        1 on other errors
    """
    video_path = Path(video_path).resolve()
    output_path = Path(output_path).resolve()
    model_path = Path(model_path).resolve()

    # Step 1: Validate video decodability and get metadata using OpenCV
    if not video_path.exists():
        print(f"Error: Video file not found: {video_path}", file=sys.stderr)
        return 2

    cap = cv2.VideoCapture(str(video_path))
    if not cap.isOpened():
        print(f"Error: Unable to open video file: {video_path}", file=sys.stderr)
        return 2

    ret, first_frame = cap.read()
    if not ret or first_frame is None:
        cap.release()
        print(f"Error: Cannot decode frames from video: {video_path}", file=sys.stderr)
        return 2

    # Get video metadata
    fps = cap.get(cv2.CAP_PROP_FPS) or 0.0
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    duration_seconds = (total_frames / fps) if (fps > 0 and total_frames > 0) else 0.0

    cap.release()

    print(f"Video metadata: {total_frames} frames, {fps:.2f} fps, {duration_seconds:.2f}s duration", file=sys.stderr)
    print(f"Model path: {model_path}", file=sys.stderr)

    # Step 2: Load YOLO model
    if not model_path.exists():
        print(f"Error: Model file not found: {model_path}", file=sys.stderr)
        return 1

    try:
        model = YOLO(str(model_path))
    except Exception as e:
        print(f"Error loading model: {e}", file=sys.stderr)
        return 1

    # Step 3: Run YOLO tracking with stream=True, persist=True, and ByteTrack
    effective_run_dir = Path(run_dir).resolve() if run_dir is not None else (REPO_ROOT / "runs")
    annotated_dir = effective_run_dir / "annotated"

    track_kwargs = {
        "source": str(video_path),
        "save": True,
        "conf": DEFAULT_CONFIDENCE,
        "stream": True,
        "persist": True,
        "tracker": "bytetrack.yaml",
        "verbose": False,
        "project": str(effective_run_dir),
        "name": "annotated",
        "exist_ok": True,
    }

    vehicle_classes = {cls_name: 0 for cls_name in VEHICLE_CLASS_NAMES}
    unique_ids_by_class = {cls_name: set() for cls_name in VEHICLE_CLASS_NAMES}
    all_unique_ids = set()
    frames_processed = 0
    peak_vehicles_in_frame = 0

    try:
        results = model.track(**track_kwargs)

        for result in results:
            frames_processed += 1
            frame_vehicle_count = 0

            if result.boxes is not None:
                for box in result.boxes:
                    class_id = int(box.cls[0])
                    class_name = model.names[class_id]

                    if class_name in vehicle_classes:
                        vehicle_classes[class_name] += 1
                        frame_vehicle_count += 1

                        if box.id is not None:
                            track_id = int(box.id[0])
                            unique_ids_by_class[class_name].add(track_id)
                            all_unique_ids.add(track_id)

            if frame_vehicle_count > peak_vehicles_in_frame:
                peak_vehicles_in_frame = frame_vehicle_count

            # Emit progress percentage to stdout (only stdout output permitted)
            if total_frames > 0:
                progress = min(100, int((frames_processed / total_frames) * 100))
                print(f"PROGRESS {progress}", flush=True)

    except Exception as e:
        print(f"Error during video tracking: {e}", file=sys.stderr)
        return 1

    if frames_processed == 0:
        print("Error: No frames were processed from video", file=sys.stderr)
        return 3

    # Step 4: Transcode annotated video to H.264 MP4 for web streaming
    annotated_video_filename = None
    if annotated_dir.exists():
        avi_candidates = sorted(
            annotated_dir.glob("*.avi"),
            key=lambda p: p.stat().st_mtime,
            reverse=True,
        )
        if avi_candidates:
            avi_path = avi_candidates[0]
            mp4_target = effective_run_dir / "annotated.mp4"
            if transcode_to_mp4(avi_path, mp4_target):
                annotated_video_filename = "annotated.mp4"

    # Step 5: Compute summary metrics
    total_detections = sum(vehicle_classes.values())
    avg_vehicles_per_frame = round(total_detections / frames_processed, 4)

    # Density based on avg_vehicles_per_frame using named constants
    if avg_vehicles_per_frame < DENSITY_MEDIUM_MIN:
        density = "LOW"
    elif avg_vehicles_per_frame < DENSITY_HIGH_MIN:
        density = "MEDIUM"
    else:
        density = "HIGH"

    unique_vehicles_data = {
        "cars": len(unique_ids_by_class["car"]),
        "motorcycles": len(unique_ids_by_class["motorcycle"]),
        "buses": len(unique_ids_by_class["bus"]),
        "trucks": len(unique_ids_by_class["truck"]),
        "total": len(all_unique_ids),
    }

    # Diagnostics to stderr
    print("\n===== VEHICLE COUNT (FRAME-SUM) =====", file=sys.stderr)
    for vehicle, count in vehicle_classes.items():
        print(f"{vehicle}: {count}", file=sys.stderr)
    print(f"\nTotal Detections (frame-sum): {total_detections}", file=sys.stderr)
    print(f"Frames Processed: {frames_processed}", file=sys.stderr)
    print(f"Avg Vehicles Per Frame: {avg_vehicles_per_frame:.4f}", file=sys.stderr)
    print(f"Peak Vehicles In Single Frame: {peak_vehicles_in_frame}", file=sys.stderr)
    print(f"Traffic Density: {density}", file=sys.stderr)
    print("\n===== ESTIMATED UNIQUE VEHICLES =====", file=sys.stderr)
    for v_key, v_count in unique_vehicles_data.items():
        print(f"{v_key}: {v_count}", file=sys.stderr)
    print("Detection and tracking completed!", file=sys.stderr)

    # Step 6: Construct JSON payload
    traffic_data = {
        "cars": vehicle_classes["car"],
        "motorcycles": vehicle_classes["motorcycle"],
        "buses": vehicle_classes["bus"],
        "trucks": vehicle_classes["truck"],
        "density": density,
        "unique_vehicles": unique_vehicles_data,
        "frames_processed": frames_processed,
        "fps": round(fps, 2),
        "duration_seconds": round(duration_seconds, 2),
        "avg_vehicles_per_frame": avg_vehicles_per_frame,
        "peak_vehicles_in_frame": peak_vehicles_in_frame,
        "thresholds": {
            "medium": DENSITY_MEDIUM_MIN,
            "high": DENSITY_HIGH_MIN,
        },
        "annotated_video": annotated_video_filename,
    }

    # Step 7: Atomic JSON write (temp file + os.replace)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    temp_file = None
    try:
        with tempfile.NamedTemporaryFile(
            mode="w",
            dir=str(output_path.parent),
            delete=False,
            suffix=".tmp",
            encoding="utf-8",
        ) as f:
            temp_file = Path(f.name)
            json.dump(traffic_data, f, indent=4)

        temp_file.replace(output_path)
        print(f"Successfully wrote output to {output_path}", file=sys.stderr)
    except Exception as e:
        if temp_file and temp_file.exists():
            temp_file.unlink(missing_ok=True)
        print(f"Error writing output JSON: {e}", file=sys.stderr)
        return 1

    return 0


# ==============================================================================
# CLI Entry Point
# ==============================================================================

def main() -> int:
    parser = argparse.ArgumentParser(
        description="Smart Traffic Monitor - YOLOv8 Vehicle Detector",
    )
    parser.add_argument(
        "--video",
        type=Path,
        default=DEFAULT_VIDEO,
        help=f"Path to input video file (default: {DEFAULT_VIDEO})",
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=DEFAULT_OUTPUT,
        help=f"Path to output JSON file (default: {DEFAULT_OUTPUT})",
    )
    parser.add_argument(
        "--run-dir",
        type=Path,
        default=None,
        help="Custom run directory for YOLO annotated output",
    )
    parser.add_argument(
        "--model",
        type=Path,
        default=DEFAULT_MODEL,
        help=f"Path to YOLO model file (default: {DEFAULT_MODEL})",
    )

    args = parser.parse_args()

    try:
        return analyze_video(
            video_path=args.video,
            output_path=args.output,
            model_path=args.model,
            run_dir=args.run_dir,
        )
    except Exception as e:
        print(f"Fatal error: {e}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    sys.exit(main())
