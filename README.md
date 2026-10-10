# AI-Powered Smart Traffic Monitoring and Signal Recommendation System

An intelligent traffic analysis and adaptive signal recommendation system that processes traffic camera footage using YOLOv8 object detection and ByteTrack vehicle tracking, exposes asynchronous processing via a Spring Boot REST API, and visualizes real-time metrics with an interactive React dashboard.

---

## Architecture Overview

```
[ Video Feed / Upload ]
          │
          ▼
[ React 19 + Vite Dashboard ] ──(Multipart Upload)──► [ Spring Boot 3.5 API ]
          ▲                                                    │
          │                                           (Asynchronous Job Queue)
          │                                                    ▼
[ Metric Cards & Video Player ] ◄──(Progress / Results)── [ Python AI Detector ]
                                                               │
                                                     (YOLOv8 + ByteTrack)
                                                               │
                                                     [ Annotated MP4 + JSON ]
```

1. **AI Service (`ai-service/`)**: Python CLI detector utilizing Ultralytics YOLOv8 for vehicle classification (`car`, `motorcycle`, `bus`, `truck`) and ByteTrack for unique vehicle tracking. Computes density, frame analytics, and exports H.264-encoded annotated video.
2. **Backend (`backend/`)**: Spring Boot 3 Java 21 REST API managing video upload validation, asynchronous worker job queues, subprocess execution, storage cleanup, and HTTP 206 partial-content video streaming.
3. **Dashboard (`dashboard/`)**: Modern React 19 + TypeScript + Tailwind CSS v4 frontend featuring drag-and-drop video upload, polling state machine with exponential backoff, animated telemetry metrics, and custom video playback.

---

## Prerequisites

- **Java**: JDK 21+
- **Maven**: 3.8+ (or included `mvnw`)
- **Python**: 3.10+
- **Node.js**: 18+ and `npm`

---

## Installation & Environment Setup

### 1. Python Virtual Environment (`ai-service`)

Create and activate a virtual environment at the repository root:

```bash
# Create virtual environment
python -m venv .venv

# Activate virtual environment (Windows PowerShell)
.venv\Scripts\Activate.ps1

# Activate virtual environment (Linux / macOS)
source .venv/bin/activate

# Install required AI dependencies
pip install -r ai-service/requirements.txt
```

> **Note on Dependencies**: `requirements.txt` installs `ultralytics`, `opencv-python`, and `imageio-ffmpeg` for MP4 transcoding. Flask is **not** used or required.

### 2. Backend Setup (`backend`)

Configure the Python binary path in `backend/src/main/resources/application.properties` or set the `TRAFFIC_PYTHON_COMMAND` environment variable:

```bash
# Windows PowerShell
$env:TRAFFIC_PYTHON_COMMAND = "$PWD\.venv\Scripts\python.exe"

# Linux / macOS
export TRAFFIC_PYTHON_COMMAND="$(pwd)/.venv/bin/python"
```

Build and run the backend:

```bash
cd backend
mvn clean test
mvn spring-boot:run
```
The backend starts on `http://localhost:8080`.

### 3. Frontend Dashboard (`dashboard`)

Install frontend dependencies and start the Vite development server:

```bash
cd dashboard
npm install
npm test
npm run dev
```
The dashboard will open at `http://localhost:5173` (with `/api` automatically proxied to `http://localhost:8080`).

---

## Running the AI Detector Standalone (CLI)

The Python detector can also be invoked directly as a CLI tool:

```bash
python ai-service/detector.py --video videos/traffic.mp4 --output traffic_data.json --run-dir runs
```

### CLI Arguments
- `--video <path>`: Path to input video file (default: `videos/traffic.mp4`).
- `--output <path>`: Path to destination JSON metrics file (default: `traffic_data.json`).
- `--run-dir <path>`: Working directory for annotated video outputs.
- `--model <path>`: Path to YOLO model weights (default: `ai-service/models/yolov8n.pt`).

---

## REST API Specification

All endpoints return a consistent JSON structure. Errors always conform to `{ "error": { "code": "...", "message": "..." } }`.

### 1. Upload Video for Analysis
- **Method**: `POST /api/videos`
- **Content-Type**: `multipart/form-data` (`video` field)
- **Response**: `202 Accepted`
```json
{
  "jobId": "2963325e-0433-4f34-a2d6-3bc28cacd720",
  "status": "QUEUED",
  "filename": "traffic.mp4"
}
```

### 2. Poll Job Status & Results
- **Method**: `GET /api/jobs/{jobId}`
- **Response**: `200 OK`
```json
{
  "jobId": "2963325e-0433-4f34-a2d6-3bc28cacd720",
  "status": "COMPLETED",
  "progress": 100,
  "result": {
    "cars": 2653,
    "motorcycles": 127,
    "buses": 1274,
    "trucks": 92,
    "density": "HIGH",
    "recommendation": "Increase signal duration",
    "unique_vehicles": {
      "cars": 50,
      "motorcycles": 5,
      "buses": 21,
      "trucks": 13,
      "total": 74
    },
    "frames_processed": 310,
    "fps": 30.0,
    "duration_seconds": 10.33,
    "avg_vehicles_per_frame": 13.37,
    "peak_vehicles_in_frame": 19,
    "thresholds": {
      "medium": 5,
      "high": 12
    },
    "annotated_video": "annotated.mp4"
  }
}
```

### 3. Stream Annotated Video
- **Method**: `GET /api/jobs/{jobId}/video`
- **Headers**: Supports standard `Range: bytes=start-end` header.
- **Response**: `206 Partial Content` (or `200 OK` for full downloads) with `Content-Type: video/mp4`.

### 4. Legacy Status Endpoint
- **Method**: `GET /traffic/status`
- **Response**: `200 OK` with the most recent traffic analysis results.

---

## Metric & Density Definitions

### Traffic Density Classification
Density is calculated using the **average number of vehicles per frame** across the entire video:

$$\text{Average Vehicles Per Frame} = \frac{\sum \text{Detections across all frames}}{\text{Total Frames Processed}}$$

| Density Level | Average Vehicles / Frame | Signal Recommendation |
|:---|:---|:---|
| **LOW** | $< 5.0$ | *Reduce signal duration* |
| **MEDIUM** | $5.0 \le \text{avg} < 12.0$ | *Maintain standard timing* |
| **HIGH** | $\ge 12.0$ | *Increase signal duration* |

### Counting Metrics
- **`cars` / `motorcycles` / `buses` / `trucks`**: Cumulative detection count summed across all frames.
- **`unique_vehicles`**: Distinct vehicle count estimated across the footage using ByteTrack tracking IDs.
- **`peak_vehicles_in_frame`**: Highest vehicle count detected in any single video frame.

---

## Configuration Properties

Backend behavior is configured in `backend/src/main/resources/application.properties` or overridden via environment variables:

| Property | Env Var Override | Default | Description |
|:---|:---|:---|:---|
| `traffic.python-command` | `TRAFFIC_PYTHON_COMMAND` | `python` | Path to Python binary inside virtual environment |
| `traffic.detector-script` | - | `ai-service/detector.py` | Relative path to detector script |
| `traffic.timeout-seconds` | - | `600` | Process execution timeout (seconds) |
| `traffic.max-pending-jobs` | - | `3` | Maximum queued jobs before returning HTTP 429 `QUEUE_FULL` |
| `traffic.storage-dir` | - | `${java.io.tmpdir}/traffic-monitor` | Base directory for job uploads and outputs |
| `traffic.job-ttl-seconds` | - | `3600` | Retention duration for job artifacts before TTL cleanup |
| `traffic.cleanup-interval-ms` | - | `60000` | Background cleanup scheduler interval (ms) |

---

## Storage & File Lifecycle

1. **Upload**: Uploaded video is saved to `<storage-dir>/<job-id>/input_<filename>`.
2. **Execution**: The AI detector processes the video and writes results to `<storage-dir>/<job-id>/traffic_data.json` and `<storage-dir>/<job-id>/runs/annotated.mp4`.
3. **Immediate Cleanup**: As soon as analysis finishes (success or failure), the raw uploaded input video is deleted immediately to reclaim disk space.
4. **TTL Cleanup**: Output artifacts (`traffic_data.json`, `annotated.mp4`) are retained for 1 hour (`traffic.job-ttl-seconds`) to allow user review and video streaming, after which the entire job directory is automatically purged.

---

## System Limitations & Considerations

- **Single-Worker Execution**: Jobs are executed sequentially using a single-worker thread pool to prevent GPU/CPU thrashing from concurrent YOLO inference runs.
- **In-Memory Job Store**: Active job metadata is stored in an in-memory `ConcurrentHashMap`. Restarting the backend clears job state.
- **Single-Node Deployment**: Designed for single-server or local edge deployment. Distributed multi-node setups require a distributed task queue (e.g., Celery/RabbitMQ) and object storage (e.g., S3).
