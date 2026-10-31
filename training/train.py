import argparse
import random
import sys
from pathlib import Path
from PIL import Image
import numpy as np
from sklearn.metrics import precision_recall_curve

# Add backend to path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "backend"))

from app.core.config import settings
from app.ml.patchcore import PatchCore
from training.preprocess import split_dataset

def pick_optimal_threshold(pc: PatchCore, holdout_paths: list, test_tuples: list) -> float:
    """
    Finds optimal decision threshold balancing precision and recall.
    """
    if test_tuples and len(test_tuples) > 10:
        scores = [pc.score(Image.open(p).convert("RGB"))[0] for p, _ in test_tuples]
        labels = [l for _, l in test_tuples]
        if len(set(labels)) == 2:
            p, r, t = precision_recall_curve(labels, scores)
            f1 = 2 * p[:-1] * r[:-1] / (p[:-1] + r[:-1] + 1e-9)
            best_idx = int(np.argmax(f1))
            return float(t[best_idx])
            
    # Fallback to mean + 3 sigma on normal holdouts
    h_scores = [pc.score(Image.open(p).convert("RGB"))[0] for p in holdout_paths]
    h_arr = np.array(h_scores)
    return float(h_arr.mean() + 3.0 * h_arr.std())

def train_patchcore(data_dir: Path, output_path: Path, coreset_ratio: float = 0.05, max_train: int = 300):
    print(f"Loading dataset from {data_dir}...")
    splits = split_dataset(data_dir)
    train_paths = splits["train"][:max_train]
    holdout_paths = splits["holdout"]
    
    print(f"Fitting PatchCore on {len(train_paths)} defect-free casting images (coreset ratio {coreset_ratio})...")
    pc = PatchCore()
    
    # Feature extraction & greedy coreset subsampling
    import torch
    from app.ml.patchcore import pil_to_tensor, DEVICE
    
    feats = []
    for i in range(0, len(train_paths), 16):
        batch = train_paths[i:i + 16]
        imgs = [Image.open(p).convert("RGB") for p in batch]
        x = torch.cat([pil_to_tensor(im) for im in imgs]).to(DEVICE)
        f = pc.extractor(x)
        feats.append(f.permute(0, 2, 3, 1).reshape(-1, f.shape[1]).cpu())
        
    X = torch.cat(feats)
    print(f"Extracted {X.shape[0]} patch vectors of dimension {X.shape[1]}. Running coreset selection...")
    
    # Coreset selection
    g = torch.Generator().manual_seed(42)
    n = X.shape[0]
    k = max(1, int(n * coreset_ratio))
    proj = torch.randn(X.shape[1], 128, generator=g) / (128 ** 0.5)
    Z = (X @ proj).to(DEVICE)
    sel = [int(torch.randint(0, n, (1,), generator=g))]
    min_d = torch.full((n,), float("inf"), device=DEVICE)
    for _ in range(k - 1):
        d = ((Z - Z[sel[-1]]) ** 2).sum(1)
        min_d = torch.minimum(min_d, d)
        sel.append(int(torch.argmax(min_d)))
    pc.bank = X[sel].to(DEVICE)
    
    # Threshold determination
    print(f"Evaluating holdout score distribution on {len(holdout_paths)} images...")
    threshold = pick_optimal_threshold(pc, holdout_paths, [])
    
    meta = {
        "category": "casting",
        "image_size": 224,
        "n_train": len(train_paths),
        "bank_size": int(pc.bank.shape[0]),
        "threshold": threshold
    }
    
    # Save checkpoint
    torch.save({"bank": pc.bank.cpu(), "threshold": float(threshold), "meta": meta}, output_path)
    print(f"Model saved to {output_path} with threshold {threshold:.4f} and memory bank size {meta['bank_size']}.")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Train PatchCore model for casting QA.")
    parser.add_argument("--data_dir", type=Path, default=settings.DATASET_DIR)
    parser.add_argument("--output", type=Path, default=settings.CASTING_MODEL_PATH)
    parser.add_argument("--coreset", type=float, default=0.05)
    args = parser.parse_args()
    
    train_patchcore(args.data_dir, args.output, args.coreset)
