import axios from 'axios';
import {
  InspectionRecord,
  OverviewStats,
  DefectDistributionItem,
  BatchAnalyticsItem,
  TrendItem,
  ModelMetrics,
  ModelStatus,
  SampleGalleryResponse,
  RootCauseData,
  NotificationItem
} from './types';

// Create Axios client with base URL
export const api = axios.create({
  baseURL: ((import.meta as any).env?.VITE_API_BASE_URL) || '/api',
  timeout: 30000,
});

// Inspection APIs
export const inspectionApi = {
  inspectImage: async (formData: FormData): Promise<InspectionRecord> => {
    const res = await api.post<InspectionRecord>('/inspection/image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return res.data;
  },

  inspectVideo: async (formData: FormData) => {
    const res = await api.post('/inspection/video', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return res.data;
  },

  inspectWebcam: async (formData: FormData): Promise<InspectionRecord> => {
    const res = await api.post<InspectionRecord>('/inspection/webcam', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return res.data;
  },

  getHistory: async (status?: string, severity?: string, limit = 50): Promise<InspectionRecord[]> => {
    const params: Record<string, any> = { limit };
    if (status) params.status = status;
    if (severity) params.severity = severity;
    const res = await api.get<InspectionRecord[]>('/inspection/history', { params });
    return res.data;
  },

  getDetail: async (id: number): Promise<InspectionRecord> => {
    const res = await api.get<InspectionRecord>(`/inspection/${id}`);
    return res.data;
  },

  getSamples: async (): Promise<SampleGalleryResponse> => {
    const res = await api.get<SampleGalleryResponse>('/inspection/samples');
    return res.data;
  }
};

// Analytics APIs
export const analyticsApi = {
  getOverview: async (): Promise<OverviewStats> => {
    const res = await api.get<OverviewStats>('/analytics/overview');
    return res.data;
  },

  getDefects: async (): Promise<DefectDistributionItem[]> => {
    const res = await api.get<DefectDistributionItem[]>('/analytics/defects');
    return res.data;
  },

  getBatches: async (): Promise<BatchAnalyticsItem[]> => {
    const res = await api.get<BatchAnalyticsItem[]>('/analytics/batches');
    return res.data;
  },

  getTrends: async (): Promise<TrendItem[]> => {
    const res = await api.get<TrendItem[]>('/analytics/trends');
    return res.data;
  },

  getRootCause: async (): Promise<RootCauseData> => {
    const res = await api.get<RootCauseData>('/analytics/root-cause');
    return res.data;
  }
};

// Decisions APIs
export const decisionsApi = {
  getHistory: async (limit = 50) => {
    const res = await api.get('/decisions/history', { params: { limit } });
    return res.data;
  },

  overrideDecision: async (decisionId: number, decision: string, overrideReason: string, approvedBy: string) => {
    const res = await api.patch(`/decisions/${decisionId}`, {
      decision,
      override_reason: overrideReason,
      approved_by: approvedBy
    });
    return res.data;
  }
};

// Model APIs
export const modelApi = {
  getStatus: async (): Promise<ModelStatus> => {
    const res = await api.get<ModelStatus>('/model/status');
    return res.data;
  },

  getMetrics: async (): Promise<ModelMetrics> => {
    const res = await api.get<ModelMetrics>('/model/metrics');
    return res.data;
  },

  reloadModel: async () => {
    const res = await api.post('/model/reload');
    return res.data;
  }
};

// Reports APIs
export const reportsApi = {
  generateReport: async (inspectionId: number) => {
    const res = await api.post(`/reports/generate/${inspectionId}`);
    return res.data;
  },

  getDownloadUrl: (reportId: number) => `/api/reports/${reportId}`
};

// Traceability APIs
export const traceabilityApi = {
  getProductQrUrl: (productId: number) => `/api/products/${productId}/qr`,
  getProductHistory: async (productId: number) => {
    const res = await api.get(`/products/${productId}/history`);
    return res.data;
  },
  listProducts: async (limit = 50) => {
    const res = await api.get('/products', { params: { limit } });
    return res.data;
  }
};

// Notifications APIs
export const notificationsApi = {
  list: async (): Promise<NotificationItem[]> => {
    const res = await api.get<NotificationItem[]>('/notifications');
    return res.data;
  },
  markRead: async (id: number) => {
    const res = await api.patch(`/notifications/${id}/read`);
    return res.data;
  }
};
