import json
import time
import sys
import glob
from pathlib import Path
from PIL import Image
import numpy as np
from sklearn.metrics import roc_auc_score, accuracy_score, precision_score, recall_score, f1_score, confusion_matrix

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "backend"))

from app.core.config import settings
from app.ml.patchcore import PatchCore

def evaluate_model(model_path: Path, data_dir: Path, output_json: Path = None):
    print(f"Loading trained model from {model_path}...")
    pc = PatchCore.load(str(model_path))
    threshold = pc.threshold
    print(f"Model loaded. Anomaly threshold: {threshold:.4f}")
    
    # Locate test dataset
    def_paths = glob.glob(str(data_dir / "**" / "test" / "def_front" / "*.jpeg"), recursive=True) or \
                glob.glob(str(data_dir / "**" / "def_front" / "*.jpeg"), recursive=True)
    ok_paths = glob.glob(str(data_dir / "**" / "test" / "ok_front" / "*.jpeg"), recursive=True) or \
               glob.glob(str(data_dir / "**" / "ok_front" / "*.jpeg"), recursive=True)

    print(f"Test samples found: {len(def_paths)} Defective, {len(ok_paths)} Normal")
    
    samples = [(p, 1) for p in def_paths] + [(p, 0) for p in ok_paths]
    if not samples:
        print("No test samples found.")
        return

    y_true = []
    y_scores = []
    y_pred = []
    latencies = []

    for path, label in samples:
        img = Image.open(path).convert("RGB")
        t0 = time.perf_counter()
        score, _ = pc.score(img)
        ms = (time.perf_counter() - t0) * 1000
        latencies.append(ms)

        y_true.append(label)
        y_scores.append(score)
        y_pred.append(1 if score > threshold else 0)

    # Calculate metrics
    auroc = roc_auc_score(y_true, y_scores)
    acc = accuracy_score(y_true, y_pred)
    prec = precision_score(y_true, y_pred)
    rec = recall_score(y_true, y_pred)
    f1 = f1_score(y_true, y_pred)
    cm = confusion_matrix(y_true, y_pred)
    tn, fp, fn, tp = cm.ravel()

    avg_ms = float(np.mean(latencies))
    fps = 1000.0 / avg_ms if avg_ms > 0 else 0.0

    metrics = {
        "category": "casting",
        "images": len(samples),
        "auroc": round(float(auroc), 4),
        "accuracy": round(float(acc), 4),
        "precision": round(float(prec), 4),
        "recall": round(float(rec), 4),
        "f1_score": round(float(f1), 4),
        "ms_per_image": round(avg_ms, 1),
        "fps": round(fps, 1),
        "model_size_mb": round(model_path.stat().st_size / (1024 * 1024), 2),
        "confusion_matrix": {
            "true_positive": int(tp),
            "false_positive": int(fp),
            "true_negative": int(tn),
            "false_negative": int(fn)
        }
    }

    print("\n================ EVALUATION RESULTS ================")
    print(f"Total Test Images: {len(samples)}")
    print(f"AUROC:             {auroc:.4f}")
    print(f"Accuracy:          {acc*100:.2f}%")
    print(f"Precision:         {prec*100:.2f}%")
    print(f"Recall:            {rec*100:.2f}%")
    print(f"F1-Score:          {f1:.4f}")
    print(f"Inference Latency: {avg_ms:.1f} ms/image ({fps:.1f} FPS)")
    print(f"Confusion Matrix:  TP={tp}, FP={fp}, TN={tn}, FN={fn}")
    print("====================================================\n")

    if output_json:
        with open(output_json, "w") as f:
            json.dump(metrics, f, indent=2)
        print(f"Saved evaluation metrics to {output_json}")

    return metrics

if __name__ == "__main__":
    evaluate_model(
        model_path=settings.CASTING_MODEL_PATH,
        data_dir=settings.DATASET_DIR,
        output_json=settings.CASTING_METRICS_PATH
    )
