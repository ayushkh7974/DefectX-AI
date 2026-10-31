import os
import cv2
import time
import uuid
from typing import Dict, Any, List
from PIL import Image
from sqlalchemy.orm import Session
from app.core.config import settings
from app.services.inspection_service import inspection_service

class VideoService:
    @staticmethod
    def process_video_file(
        db: Session,
        video_bytes: bytes,
        filename: str = "conveyor_stream.mp4",
        sample_every_n_frames: int = 15
    ) -> Dict[str, Any]:
        """
        Processes an uploaded conveyor inspection video frame by frame.
        Extracts sample frames, runs real-time inference, and computes performance stats.
        """
        uid = uuid.uuid4().hex[:8]
        temp_video_path = settings.UPLOAD_DIR / f"{uid}_{filename}"
        with open(temp_video_path, "wb") as f:
            f.write(video_bytes)

        cap = cv2.VideoCapture(str(temp_video_path))
        if not cap.isOpened():
            raise ValueError("Could not open video file.")

        fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
        total_video_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))

        frame_count = 0
        inspected_frames = []
        defects_detected = 0
        total_time_ms = 0.0

        while True:
            ret, frame = cap.read()
            if not ret:
                break

            if frame_count % sample_every_n_frames == 0:
                # Convert BGR to RGB
                rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                pil_img = Image.fromarray(rgb_frame)

                # Encode to JPEG bytes
                is_success, buffer = cv2.imencode(".jpg", frame)
                if is_success:
                    t0 = time.perf_counter()
                    insp_res = inspection_service.inspect_image(
                        db=db,
                        image_bytes=buffer.tobytes(),
                        filename=f"frame_{frame_count:04d}.jpg",
                        source="video_frame"
                    )
                    elapsed = (time.perf_counter() - t0) * 1000
                    total_time_ms += elapsed

                    if insp_res["status"] == "DEFECTIVE":
                        defects_detected += 1

                    inspected_frames.append({
                        "frame_number": frame_count,
                        "timestamp_sec": round(frame_count / fps, 2),
                        "status": insp_res["status"],
                        "decision": insp_res["recommended_decision"],
                        "confidence": insp_res["confidence"],
                        "severity": insp_res["severity"],
                        "defect_type": insp_res["defect_type"],
                        "heatmap_path": insp_res["heatmap_path"]
                    })

                # Limit to first 20 processed keyframes for demo performance
                if len(inspected_frames) >= 20:
                    break

            frame_count += 1

        cap.release()

        avg_fps = (len(inspected_frames) / (total_time_ms / 1000.0)) if total_time_ms > 0 else 30.0
        n_processed = len(inspected_frames)

        return {
            "total_video_frames": total_video_frames,
            "processed_frames_count": n_processed,
            "defects_detected": defects_detected,
            "defect_rate": round((defects_detected / n_processed * 100.0) if n_processed > 0 else 0.0, 1),
            "average_fps": round(avg_fps, 1),
            "video_url": f"/uploads/{temp_video_path.name}",
            "frames": inspected_frames
        }

video_service = VideoService()
