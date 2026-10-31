import os
import glob
import random
from pathlib import Path
from PIL import Image
import torchvision.transforms as transforms

def get_transforms(image_size: int = 224, is_train: bool = True):
    """
    Standard image transformation pipeline for industrial casting QA.
    """
    if is_train:
        return transforms.Compose([
            transforms.Resize((image_size, image_size)),
            transforms.RandomHorizontalFlip(p=0.5),
            transforms.RandomVerticalFlip(p=0.5),
            transforms.RandomRotation(degrees=15),
            transforms.ColorJitter(brightness=0.1, contrast=0.1),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
        ])
    else:
        return transforms.Compose([
            transforms.Resize((image_size, image_size)),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
        ])

def split_dataset(data_dir: Path, holdout_ratio: float = 0.1, seed: int = 42):
    """
    Splits normal casting images into coreset training set and holdout validation set.
    """
    train_ok_paths = glob.glob(str(data_dir / "**" / "train" / "ok_front" / "*.jpeg"), recursive=True) or \
                     glob.glob(str(data_dir / "**" / "ok_front" / "*.jpeg"), recursive=True)
    
    random.Random(seed).shuffle(train_ok_paths)
    n_hold = max(1, int(len(train_ok_paths) * holdout_ratio))
    
    return {
        "holdout": train_ok_paths[:n_hold],
        "train": train_ok_paths[n_hold:]
    }

if __name__ == "__main__":
    from app.core.config import settings
    splits = split_dataset(settings.DATASET_DIR)
    print(f"Dataset split: {len(splits['train'])} train normal images, {len(splits['holdout'])} holdout validation images.")
