export interface DefectRegion {
  x: number;
  y: number;
  width: number;
  height: number;
  area: number;
  intensity: number;
  ratio?: number;
  defect_subcat?: string;
}

export interface InspectionRecord {
  id: number;
  product_id: number;
  product_code: string;
  batch_number?: string;
  machine_id?: string;
  image_path: string;
  heatmap_path: string | null;
  status: 'OK' | 'DEFECTIVE';
  anomaly_score: number;
  threshold: number;
  confidence: number;
  defect_type: string;
  severity: 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH';
  recommended_decision: 'ACCEPT' | 'REJECT' | 'MANUAL_REVIEW';
  processing_time_ms: number;
  source: string;
  inspected_at: string;
  regions?: DefectRegion[];
  defects?: any[];
  decision?: {
    id?: number;
    decision: 'ACCEPT' | 'REJECT' | 'MANUAL_REVIEW';
    reason: string;
    approved_by?: string;
    is_override?: boolean;
    override_reason?: string;
  };
  report?: {
    id: number;
    report_code: string;
    report_path: string;
    generated_at: string;
  };
}

export interface OverviewStats {
  total_inspected: number;
  accepted_count: number;
  rejected_count: number;
  manual_review_count: number;
  defect_rate: number;
  avg_inference_ms: number;
  today_yield: number;
  active_line: string;
  ai_status: string;
}

export interface DefectDistributionItem {
  defect_type: string;
  count: number;
  percentage: number;
}

export interface BatchAnalyticsItem {
  batch_id: number;
  batch_number: string;
  machine_id: string;
  alloy_grade: string;
  target_yield: number;
  inspected: number;
  passed: number;
  failed: number;
  defect_rate: number;
}

export interface TrendItem {
  date: string;
  inspected: number;
  accepted: number;
  rejected: number;
  manual_review: number;
  defect_rate: number;
}

export interface ModelMetrics {
  category: string;
  images_tested: number;
  auroc: number;
  accuracy: number;
  precision: number;
  recall: number;
  f1_score: number;
  latency_ms: number;
  fps: number;
  model_size_mb: number;
  confusion_matrix: {
    true_positive: number;
    false_positive: number;
    true_negative: number;
    false_negative: number;
  };
  recall_by_defect: Record<string, number>;
}

export interface ModelStatus {
  loaded: boolean;
  category: string;
  device: string;
  threshold: number;
  bank_size: number;
  image_size: number;
  model_path: string;
}

export interface SampleItem {
  name: string;
  type: 'OK' | 'DEFECTIVE';
  url: string;
}

export interface SampleGalleryResponse {
  defective_samples: SampleItem[];
  normal_samples: SampleItem[];
}

export interface RootCauseAlert {
  severity: 'CRITICAL' | 'WARNING';
  machine_id: string;
  title: string;
  description: string;
  suspected_causes: string[];
  confirmed_causes: string[];
  investigation_steps: string[];
}

export interface RootCauseKnowledge {
  defect_type: string;
  common_percentage: number;
  suspected_causes: string[];
  corrective_actions: string[];
}

export interface RootCauseData {
  total_inspections: number;
  defective_count: number;
  overall_defect_rate: number;
  machine_analysis: {
    machine_id: string;
    inspected: number;
    defective: number;
    defect_rate: number;
    status: string;
  }[];
  alerts: RootCauseAlert[];
  knowledge_base: RootCauseKnowledge[];
}

export interface NotificationItem {
  id: number;
  type: string;
  title: string;
  message: string;
  read_status: boolean;
  created_at: string;
}
