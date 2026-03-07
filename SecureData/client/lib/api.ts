import apiClient from "./api-client";
import type { AuthResponse, LoginPayload, User, AuditLog, FileInfo, DashboardStats } from "@shared/api";

// ==================== Auth ====================
export const authAPI = {
  login: async (payload: LoginPayload): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>("/auth/login", payload);
    return response.data;
  },

  logout: () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("userRole");
    localStorage.removeItem("userId");
  },

  getToken: (): string | null => {
    return localStorage.getItem("authToken");
  },

  getRole: (): "Admin" | "Standard" | null => {
    return (localStorage.getItem("userRole") as "Admin" | "Standard") || null;
  },

  isAuthenticated: (): boolean => {
    return !!localStorage.getItem("authToken");
  },
};

// ==================== Dashboard ====================
export const dashboardAPI = {
  getStats: async (): Promise<DashboardStats> => {
    const response = await apiClient.get<DashboardStats>("/stats");
    return response.data;
  },
};

// ==================== Files ====================
export const filesAPI = {
  uploadFile: async (file: File, sanitizationMethod = "masking") => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("sanitization_method", sanitizationMethod);

    const response = await apiClient.post("/files/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },

  getFiles: async (): Promise<FileInfo[]> => {
    const response = await apiClient.get<FileInfo[]>("/files");
    return response.data;
  },

  getRawFile: async (fileId: number) => {
    const response = await apiClient.get(`/files/${fileId}/raw`);
    return response.data;
  },

  getSanitizedFile: async (fileId: number) => {
    const response = await apiClient.get(`/files/${fileId}/sanitized`);
    return response.data;
  },

  searchFiles: async (fileId: number, query: string) => {
    const response = await apiClient.get(`/files/${fileId}/search`, {
      params: { q: query },
    });
    return response.data;
  },

  downloadFile: async (fileId: number) => {
    const response = await apiClient.get(`/files/${fileId}/download`, {
      responseType: "blob",
    });
    return response.data;
  },

  deleteFile: async (fileId: number) => {
    await apiClient.delete(`/files/${fileId}`);
  },
};

// ==================== Users ====================
export const usersAPI = {
  getUsers: async (): Promise<User[]> => {
    const response = await apiClient.get<User[]>("/users");
    return response.data;
  },

  addUser: async (username: string, email: string, role: "Admin" | "Standard") => {
    const response = await apiClient.post("/users", {
      username,
      email,
      role,
    });
    return response.data;
  },

  updateUser: async (userId: number, role: "Admin" | "Standard") => {
    const response = await apiClient.patch(`/users/${userId}`, { role });
    return response.data;
  },

  deleteUser: async (userId: number) => {
    await apiClient.delete(`/users/${userId}`);
  },
};

// ==================== DPDP Consent ====================
export interface ConsentPreferences {
  analytics_consent: boolean;
  security_scanning_consent: boolean;
  pii_processing_consent: boolean;
  third_party_sharing_consent: boolean;
}

export interface ConsentAuditEntry {
  id: number;
  timestamp: string;
  consent_snapshot: ConsentPreferences;
  consent_hash: string;
}

export interface DeletionCertificate {
  certificate_id: string;
  erased_at: string;
  message: string;
  audit_logs_redacted: number;
  files_deleted: number;
}

export const consentAPI = {
  getConsent: async (): Promise<{ preferences: ConsentPreferences }> => {
    const response = await apiClient.get("/users/consent");
    return response.data;
  },

  updateConsent: async (preferences: ConsentPreferences) => {
    const response = await apiClient.put("/users/consent", preferences);
    return response.data;
  },

  getAuditTrail: async (): Promise<ConsentAuditEntry[]> => {
    const response = await apiClient.get<ConsentAuditEntry[]>("/users/consent/audit");
    return response.data;
  },

  forgetMe: async (): Promise<DeletionCertificate> => {
    const response = await apiClient.post<DeletionCertificate>("/users/forget-me");
    return response.data;
  },
};

// ==================== Audit Logs ====================
export const logsAPI = {
  getLogs: async (): Promise<AuditLog[]> => {
    const response = await apiClient.get<AuditLog[]>("/logs");
    return response.data;
  },

  searchLogs: async (filters: {
    user?: string;
    action?: string;
    dateFrom?: string;
    dateTo?: string;
  }): Promise<AuditLog[]> => {
    const response = await apiClient.get<AuditLog[]>("/logs", {
      params: filters,
    });
    return response.data;
  },
};
