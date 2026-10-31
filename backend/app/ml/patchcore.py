import torch
import torch.nn.functional as F
import torchvision.models as models
import numpy as np
import cv2
from PIL import Image
from scipy.ndimage import gaussian_filter
from typing import Tuple, List, Dict, Any

DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")
MEAN = torch.tensor([0.485, 0.456, 0.406]).view(1, 3, 1, 1).to(DEVICE)
STD = torch.tensor([0.229, 0.224, 0.225]).view(1, 3, 1, 1).to(DEVICE)

def pil_to_tensor(img: Image.Image, size: int = 224) -> torch.Tensor:
    img = img.convert("RGB").resize((size, size))
    arr = np.asarray(img, dtype=np.float32) / 255.0
    t = torch.from_numpy(arr).permute(2, 0, 1).unsqueeze(0).to(DEVICE)
    return (t - MEAN) / STD

class FeatureExtractor(torch.nn.Module):
    def __init__(self):
        super().__init__()
        net = models.resnet18(weights=models.ResNet18_Weights.IMAGENET1K_V1)
        self.stem = torch.nn.Sequential(net.conv1, net.bn1, net.relu, net.maxpool)
        self.layer1 = net.layer1
        self.layer2 = net.layer2
        self.layer3 = net.layer3
        self.eval()
        for p in self.parameters():
            p.requires_grad = False

    @torch.no_grad()
    def forward(self, x: torch.Tensor) -> torch.Tensor:
        f1 = self.stem(x)
        f1 = self.layer1(f1)
        f2 = self.layer2(f1)
        f3 = self.layer3(f2)
        f2 = F.avg_pool2d(f2, 3, 1, 1)
        f3 = F.avg_pool2d(f3, 3, 1, 1)
        f3 = F.interpolate(f3, size=f2.shape[-2:], mode="bilinear", align_corners=False)
        return torch.cat([f2, f3], dim=1)

class PatchCore:
    def __init__(self):
        self.extractor = FeatureExtractor().to(DEVICE)
        self.bank: torch.Tensor = None
        self.threshold: float = 1.6577
        self.meta: dict = {}

    @torch.no_grad()
    def score(self, img: Image.Image) -> Tuple[float, np.ndarray]:
        """
        Calculates maximum anomaly score and dense anomaly heatmap (224x224).
        """
        x = pil_to_tensor(img, size=224)
        features = self.extractor(x)
        _, c, h, w = features.shape
        patches = features.permute(0, 2, 3, 1).reshape(-1, c)
        
        # Compute nearest distance in memory bank
        bank_device = self.bank.to(DEVICE)
        distances = torch.cdist(patches, bank_device).min(dim=1).values
        
        amap = distances.reshape(1, 1, h, w)
        amap = F.interpolate(amap, size=(224, 224), mode="bilinear", align_corners=False)[0, 0].cpu().numpy()
        amap = gaussian_filter(amap, sigma=4)
        return float(amap.max()), amap

    @classmethod
    def load(cls, path: str):
        ckpt = torch.load(path, map_location="cpu")
        pc = cls()
        pc.bank = ckpt["bank"].to(DEVICE)
        pc.threshold = float(ckpt["threshold"])
        pc.meta = ckpt.get("meta", {})
        return pc


def find_defect_regions(amap: np.ndarray, threshold: float, img_size: Tuple[int, int] = (512, 512)) -> List[Dict[str, Any]]:
    """
    Extracts defect contours, bounding boxes, area and severity from anomaly heatmap.
    """
    # Resize amap to target image size
    amap_resized = cv2.resize(amap, img_size, interpolation=cv2.INTER_LINEAR)
    mask = (amap_resized > threshold).astype(np.uint8) * 255

    # Clean morphological noise
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
    mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN, kernel)
    mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, kernel)

    contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    regions = []

    for cnt in contours:
        area = cv2.contourArea(cnt)
        if area < 50:  # Filter out trivial speckles
            continue
        x, y, w, h = cv2.boundingRect(cnt)
        sub_map = amap_resized[y:y+h, x:x+w]
        peak_val = float(sub_map.max()) if sub_map.size > 0 else float(threshold)
        ratio = peak_val / threshold

        # Classify morphology
        aspect_ratio = max(w, h) / max(min(w, h), 1)
        if aspect_ratio > 3.0:
            defect_subcat = "Surface Crack / Inclusion"
        elif area < 300:
            defect_subcat = "Pinhole / Blowhole"
        elif x < 30 or y < 30 or (x + w) > (img_size[0] - 30) or (y + h) > (img_size[1] - 30):
            defect_subcat = "Molding Burr / Flash"
        else:
            defect_subcat = "Shrinkage Porosity / Cavity"

        regions.append({
            "x": int(x),
            "y": int(y),
            "width": int(w),
            "height": int(h),
            "area": int(area),
            "intensity": round(peak_val, 3),
            "ratio": round(ratio, 2),
            "defect_subcat": defect_subcat
        })

    # Sort by area descending
    regions.sort(key=lambda r: r["area"], reverse=True)
    return regions


def render_annotated_overlay(
    img: Image.Image,
    amap: np.ndarray,
    threshold: float,
    regions: List[Dict[str, Any]],
    status: str,
    severity: str
) -> np.ndarray:
    """
    Renders high-tech industrial inspection overlay:
    - Thermal colormap blended onto casting surface
    - Neon bounding boxes with defect tags
    - Quality badge
    """
    img_rgb = np.array(img.convert("RGB"))
    h, w, _ = img_rgb.shape
    
    # Scale heatmap to image dimensions
    amap_scaled = cv2.resize(amap, (w, h), interpolation=cv2.INTER_LINEAR)
    
    # Normalize heatmap for thermal colormap
    v_min, v_max = threshold * 0.7, max(float(amap_scaled.max()), threshold * 1.5)
    amap_norm = np.clip((amap_scaled - v_min) / (v_max - v_min + 1e-6), 0.0, 1.0)
    amap_uint8 = (amap_norm * 255).astype(np.uint8)
    
    heatmap_color = cv2.applyColorMap(amap_uint8, cv2.COLORMAP_JET)
    heatmap_color = cv2.cvtColor(heatmap_color, cv2.COLOR_BGR2RGB)
    
    # Mask where heatmap is significant
    blend_mask = (amap_norm > 0.35).astype(np.float32)[:, :, None] * 0.55
    blended = (img_rgb * (1.0 - blend_mask) + heatmap_color * blend_mask).astype(np.uint8)
    
    # Draw defect regions
    for idx, reg in enumerate(regions[:5]):  # Show top 5
        rx, ry, rw, rh = reg["x"], reg["y"], reg["width"], reg["height"]
        subcat = reg.get("defect_subcat", "Defect")
        
        # Color based on severity
        box_color = (239, 68, 68) if severity == "HIGH" else ((245, 158, 11) if severity == "MEDIUM" else (59, 130, 246))
        cv2.rectangle(blended, (rx, ry), (rx + rw, ry + rh), box_color, 2)
        
        # Tag label
        label = f"#{idx+1} {subcat}"
        (tw, th), _ = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.45, 1)
        cv2.rectangle(blended, (rx, max(0, ry - 18)), (rx + tw + 6, max(0, ry)), box_color, -1)
        cv2.putText(blended, label, (rx + 3, max(12, ry - 4)), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (255, 255, 255), 1, cv2.LINE_AA)

    # Add corner badge
    badge_color = (34, 197, 94) if status == "OK" else (239, 68, 68)
    badge_text = f"INTELLIINSPECT AI: {status}"
    cv2.rectangle(blended, (10, 10), (280, 42), (15, 23, 42), -1)
    cv2.rectangle(blended, (10, 10), (280, 42), badge_color, 2)
    cv2.putText(blended, badge_text, (18, 32), cv2.FONT_HERSHEY_SIMPLEX, 0.55, (255, 255, 255), 1, cv2.LINE_AA)
    
    return blended
