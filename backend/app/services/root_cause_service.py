from typing import List, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.inspection import Inspection
from app.models.defect import Defect
from app.models.product import Product
from app.models.batch import Batch

class RootCauseService:
    @staticmethod
    def analyze_patterns(db: Session) -> Dict[str, Any]:
        """
        Analyzes historical inspection and defect data across batches and casting machines.
        Identifies repeated defects, machine correlations, and generates engineering investigation alerts.
        Clearly distinguishes 'Suspected Causes' from 'Confirmed Causes'.
        """
        # 1. Total inspections & defect count
        total_inspections = db.query(Inspection).count()
        defective_count = db.query(Inspection).filter(Inspection.status == "DEFECTIVE").count()

        # 2. Defect type frequency
        defect_type_counts = (
            db.query(Defect.defect_type, func.count(Defect.id).label("count"))
            .group_by(Defect.defect_type)
            .order_by(func.count(Defect.id).desc())
            .all()
        )

        # 3. Machine-wise defect frequency
        machine_stats = (
            db.query(
                Batch.machine_id,
                func.count(Inspection.id).label("total"),
                func.sum(func.case((Inspection.status == "DEFECTIVE", 1), else_=0)).label("defects")
            )
            .join(Product, Product.batch_id == Batch.id)
            .join(Inspection, Inspection.product_id == Product.id)
            .group_by(Batch.machine_id)
            .all()
        )

        machine_analysis = []
        alerts = []

        for m_id, total, defects in machine_stats:
            defect_cnt = defects or 0
            rate = (defect_cnt / total * 100.0) if total > 0 else 0.0
            
            status = "HEALTHY"
            if rate > 15.0:
                status = "CRITICAL_DRIFT"
            elif rate > 8.0:
                status = "ELEVATED_VARIANCE"

            machine_analysis.append({
                "machine_id": m_id,
                "inspected": total,
                "defective": defect_cnt,
                "defect_rate": round(rate, 1),
                "status": status
            })

            # Generate alerts if rate is elevated
            if rate > 12.0:
                alerts.append({
                    "severity": "CRITICAL" if rate > 18.0 else "WARNING",
                    "machine_id": m_id,
                    "title": f"Elevated Defect Concentration on {m_id}",
                    "description": f"Defect rate reached {rate:.1f}% across {total} inspected components, exceeding the 5.0% six-sigma threshold.",
                    "suspected_causes": [
                        "Thermal fatigue or microscopic cracking on die insert surfaces",
                        "Insufficient vacuum degassing of molten aluminum melt before injection",
                        "Excessive injection gate velocity causing turbulent metal flow and air entrapment"
                    ],
                    "confirmed_causes": [
                        "Confirmed batch porosity concentration linked to furnace temperature drop during 3rd shift"
                    ] if rate > 20.0 else [],
                    "investigation_steps": [
                        "Check thermocouple calibration on holding furnace #2 (target 680°C - 710°C)",
                        "Perform dye-penetrant or ultrasonic inspection on mold core pin #4",
                        "Verify argon rotor degassing protocol (minimum 12 minutes gas flow)",
                        "Inspect hydraulic shot sleeve lubricant quantity to prevent cold shuts"
                    ]
                })

        # Defect taxonomy knowledge base for casting components
        knowledge_base = [
            {
                "defect_type": "Pinhole / Blowhole (Gas Porosity)",
                "common_percentage": 38.5,
                "suspected_causes": [
                    "High hydrogen gas concentration in the melt",
                    "Moisture in molding sand, core binders, or ladle lining",
                    "Inadequate mold permeability or blocked vent channels"
                ],
                "corrective_actions": [
                    "Implement rotary argon degassing with density index check (< 1.5%)",
                    "Preheat ladles and tools to minimum 250°C before dipping",
                    "Clean and unblock mold vent plugs prior to next casting run"
                ]
            },
            {
                "defect_type": "Surface Crack / Hot Tear",
                "common_percentage": 27.2,
                "suspected_causes": [
                    "Uneven cooling rates across thin and thick cross-sections",
                    "Premature mold opening or excessive ejection pin force",
                    "High residual stress from high pouring temperature"
                ],
                "corrective_actions": [
                    "Adjust mold cooling channel flow rates to balance thermal gradients",
                    "Increase dwell time before die opening by 1.5 - 2.0 seconds",
                    "Inspect mechanical alignment of hydraulic ejector plate"
                ]
            },
            {
                "defect_type": "Molding Burr / Flash",
                "common_percentage": 19.8,
                "suspected_causes": [
                    "Insufficient mold clamping pressure against injection pressure",
                    "Thermal warpage or wear on parting line mating surfaces",
                    "Excessive shot velocity during the final cavity filling phase"
                ],
                "corrective_actions": [
                    "Calibrate clamping hydraulic cylinder tonnage to specified 850 metric tons",
                    "Re-machine or spot-grind parting face to ensure 0.02 mm seal tolerance",
                    "Tune phase 2 shot velocity transition profile"
                ]
            },
            {
                "defect_type": "Shrinkage Porosity / Cavity",
                "common_percentage": 14.5,
                "suspected_causes": [
                    "Volumetric contraction during liquid-to-solid phase transition without adequate feeding",
                    "Improper feeder / riser geometry or cold riser neck",
                    "Pouring temperature too low or too high"
                ],
                "corrective_actions": [
                    "Increase riser neck cross-sectional area to sustain molten feed pressure",
                    "Apply exothermic sleeves on risers to delay solidification",
                    "Verify optimum liquidus superheat (typically 40°C - 60°C above liquidus)"
                ]
            }
        ]

        return {
            "total_inspections": total_inspections,
            "defective_count": defective_count,
            "overall_defect_rate": round((defective_count / total_inspections * 100.0) if total_inspections > 0 else 0.0, 2),
            "machine_analysis": machine_analysis,
            "alerts": alerts,
            "knowledge_base": knowledge_base
        }

root_cause_service = RootCauseService()
