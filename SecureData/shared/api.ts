export interface LoginPayload {
  username: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  role: "Admin" | "Standard";
  user_id: number;
  username: string;
}

export interface User {
  id: number;
  username: string;
  email: string;
  role: "Admin" | "Standard";
  lastLogin: string;
  status: "Active" | "Inactive";
}

// ==================== Files ====================

export interface FileUploadPayload {
  file: File;
  sanitization_method?: "masking" | "redaction" | "tokenization";
}

export interface FileUploadResponse {
  file_id: number;
  status: "processing" | "completed" | "failed";
  message: string;
}

export interface FileInfo {
  id: number;
  name: string;
  uploadDate: string;
  uploadedBy: string;
  status: "Completed" | "Processing" | "Failed";
  piiDetected: number;
  piiRiskScore?: number;
  dataClassificationTier?: "Public" | "Internal" | "Confidential" | "Strictly Confidential";
}

export interface FileData {
  id: number;
  raw: string | Record<string, unknown>;
  sanitized: string | Record<string, unknown>;
}

// ==================== Audit Logs ====================

export interface AuditLog {
  timestamp: string;
  user: string;
  action: "File Upload" | "File Download" | "User Login" | "PII Detection";
  file?: string;
  details: string;
  ipAddress: string;
}

// ==================== Dashboard Stats ====================

export interface DashboardStats {
  totalFiles: number;
  piiDetected: number;
  activeUsers: number;
  sanitizedDownloads: number;
}

export interface DemoResponse {
  message: string;
}

// ==========================================================
// ==================== MOCK DATABASE =======================
// ==========================================================

const mockUsers: User[] = [
  {
    id: 1,
    username: "admin1",
    email: "[admin@securedata.com](mailto:admin@securedata.com)",
    role: "Admin",
    lastLogin: new Date().toISOString(),
    status: "Active",
  },
  {
    id: 2,
    username: "john_doe",
    email: "[john@securedata.com](mailto:john@securedata.com)",
    role: "Standard",
    lastLogin: new Date().toISOString(),
    status: "Active",
  },
];

let files: FileInfo[] = [
  {
    id: 1,
    name: "customer_data.csv",
    uploadDate: new Date().toISOString(),
    uploadedBy: "admin1",
    status: "Completed",
    piiDetected: 5,
  },
];

// ==========================================================
// ==================== AUTH FUNCTIONS ======================
// ==========================================================

export async function login(payload: LoginPayload): Promise<AuthResponse> {
  // Use the real backend API
  const apiClient = (await import("../client/lib/api-client")).default;
  const response = await apiClient.post<AuthResponse>("/auth/login", payload);
  return response.data;
}

// ==========================================================
// ==================== FILE FUNCTIONS ======================
// ==========================================================

export async function uploadFile(
  payload: FileUploadPayload
): Promise<FileUploadResponse> {
  await new Promise((resolve) => setTimeout(resolve, 800));

  const newFile: FileInfo = {
    id: files.length + 1,
    name: payload.file.name,
    uploadDate: new Date().toISOString(),
    uploadedBy: "admin1",
    status: "Completed",
    piiDetected: Math.floor(Math.random() * 10),
  };

  files.push(newFile);

  return {
    file_id: newFile.id,
    status: "completed",
    message: "File uploaded and processed successfully",
  };
}

export async function getFiles(): Promise<FileInfo[]> {
  await new Promise((resolve) => setTimeout(resolve, 300));
  return files;
}

// ==========================================================
// ==================== DASHBOARD DATA ======================
// ==========================================================

export async function getDashboardStats(): Promise<DashboardStats> {
  await new Promise((resolve) => setTimeout(resolve, 300));

  return {
    totalFiles: files.length,
    piiDetected: files.reduce((sum, f) => sum + f.piiDetected, 0),
    activeUsers: mockUsers.length,
    sanitizedDownloads: 12,
  };
}

// ==========================================================
// ==================== AUDIT LOGS ==========================
// ==========================================================

export async function getAuditLogs(): Promise<AuditLog[]> {
  await new Promise((resolve) => setTimeout(resolve, 300));

  return [
    {
      timestamp: new Date().toISOString(),
      user: "admin1",
      action: "User Login",
      details: "Admin logged in",
      ipAddress: "127.0.0.1",
    },
  ];
}
