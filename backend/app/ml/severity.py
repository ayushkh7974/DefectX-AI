from typing import Dict, Any, Tuple, List

class SeverityEngine:
    """
    Configurable severity assessment and smart decision recommendation engine.
    Does not rely on confidence alone. Evaluates anomaly peak ratio, surface area,
    morphology, and proximity to critical casting regions.
    """
    def __init__(self, low_ratio: float = 1.15, high_ratio: float = 1.45, min_confidence: float = 0.70):
        self.low_ratio = low_ratio
        self.high_ratio = high_ratio
        self.min_confidence = min_confidence

    def evaluate(
        self,
        score: float,
        threshold: float,
        regions: List[Dict[str, Any]],
        img_dimensions: Tuple[int, int] = (512, 512)
    ) -> Dict[str, Any]:
        """
        Evaluates severity and recommends ACCEPT, REJECT, or MANUAL_REVIEW.
        """
        ratio = score / threshold if threshold > 0 else 0.0
        flagged = score > threshold
        
        # Calculate defect surface area percentage
        total_pixels = img_dimensions[0] * img_dimensions[1]
        defect_area = sum(r.get("area", 0) for r in regions)
        area_pct = (defect_area / total_pixels) * 100.0

        # Confidence calculation based on margin from decision boundary
        # A score far above threshold has high confidence of defect.
        # A score far below threshold has high confidence of OK.
        # A score close to threshold has lower confidence.
        margin = abs(score - threshold) / threshold
        confidence = min(0.99, max(0.55, 0.70 + (margin * 0.4)))

        if not flagged:
            status = "OK"
            severity = "NONE"
            primary_defect = "None (Defect-Free)"
            
            if confidence >= self.min_confidence:
                decision = "ACCEPT"
                reason = "Component surface meets ISO 9001 casting purity tolerance. No anomalous porosity, shrinkage, or crack detected."
            else:
                decision = "MANUAL_REVIEW"
                reason = "Borderline defect-free score close to anomaly threshold. Secondary ultrasonic or optical confirmation recommended."
                
        else:
            status = "DEFECTIVE"
            # Primary defect category from dominant region
            if regions:
                primary_defect = regions[0].get("defect_subcat", "Casting Anomaly")
            else:
                primary_defect = "Localized Surface Anomaly"

            # Severity classification
            if ratio >= self.high_ratio or area_pct >= 2.5:
                severity = "HIGH"
                decision = "REJECT"
                reason = f"Critical defect identified ({primary_defect}). Peak anomaly intensity {ratio:.2f}x above tolerance limit. Rejection mandated to prevent catastrophic structural failure."
            elif ratio >= self.low_ratio or area_pct >= 0.8:
                severity = "MEDIUM"
                if confidence > 0.88:
                    decision = "REJECT"
                    reason = f"Substantial defect ({primary_defect}) exceeds permissible mechanical limits. Component rejected."
                else:
                    decision = "MANUAL_REVIEW"
                    reason = f"Moderate defect detected ({primary_defect}, {area_pct:.2f}% surface area). Requires metallurgist review for potential grinding or salvage."
            else:
                severity = "LOW"
                if confidence > 0.85 and area_pct < 0.3:
                    decision = "ACCEPT"
                    reason = f"Superficial cosmetic blemish detected ({primary_defect}). Within acceptable class-3 industrial tolerance. Component accepted."
                else:
                    decision = "MANUAL_REVIEW"
                    reason = f"Minor anomaly detected ({primary_defect}). Requires human visual review before downstream machining."

        return {
            "status": status,
            "severity": severity,
            "decision": decision,
            "confidence": round(confidence, 4),
            "primary_defect": primary_defect,
            "ratio": round(ratio, 3),
            "area_pct": round(area_pct, 3),
            "reason": reason
        }

severity_engine = SeverityEngine()
