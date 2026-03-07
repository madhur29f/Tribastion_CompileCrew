import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/lib/auth-context";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { PlaceholderPage } from "@/components/Placeholder";

// Pages
import Login from "./pages/Login";
import AdminDashboard from "./pages/AdminDashboard";
import AdminUpload from "./pages/AdminUpload";
import AdminDataViewer from "./pages/AdminDataViewer";
import AdminFiles from "./pages/AdminFiles";
import AdminUsers from "./pages/AdminUsers";
import AdminLogs from "./pages/AdminLogs";
import UserDashboard from "./pages/UserDashboard";
import NotFound from "./pages/NotFound";
import AdminSettings from "./pages/AdminSettings";
import UserDownloads from "./pages/UserDownloads";

import UserSettings from "./pages/UserSettings";
import UserUpload from "./pages/UserUpload";

const queryClient = new QueryClient();

const AppComponent = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />

            {/* Admin Routes */}
            <Route
              path="/admin/dashboard"
              element={
                <ProtectedRoute requiredRole="Admin">
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/upload"
              element={
                <ProtectedRoute requiredRole="Admin">
                  <AdminUpload />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/data-viewer"
              element={
                <ProtectedRoute requiredRole="Admin">
                  <AdminDataViewer />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/files"
              element={
                <ProtectedRoute requiredRole="Admin">
                  <AdminFiles />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/users"
              element={
                <ProtectedRoute requiredRole="Admin">
                  <AdminUsers />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/logs"
              element={
                <ProtectedRoute requiredRole="Admin">
                  <AdminLogs />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/settings"
              element={
                <ProtectedRoute requiredRole="Admin">
                  <AdminSettings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/*"
              element={
                <ProtectedRoute requiredRole="Admin">
                  <PlaceholderPage />
                </ProtectedRoute>
              }
            />

            {/* User Routes */}
            <Route
              path="/user/dashboard"
              element={
                <ProtectedRoute requiredRole="Standard">
                  <UserDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/user/upload"
              element={
                <ProtectedRoute requiredRole="Standard">
                  <UserUpload />
                </ProtectedRoute>
              }
            />
            <Route
              path="/user/downloads"
              element={
                <ProtectedRoute requiredRole="Standard">
                  <UserDownloads />
                </ProtectedRoute>
              }
            />

            <Route
              path="/user/settings"
              element={
                <ProtectedRoute requiredRole="Standard">
                  <UserSettings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/user/*"
              element={
                <ProtectedRoute requiredRole="Standard">
                  <PlaceholderPage />
                </ProtectedRoute>
              }
            />

            {/* Root and Fallback */}
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

// Store root instance on window to avoid creating it multiple times during HMR
declare global {
  interface Window {
    __APP_ROOT__?: ReturnType<typeof createRoot>;
  }
}

const rootElement = document.getElementById("root");
if (rootElement) {
  if (!window.__APP_ROOT__) {
    window.__APP_ROOT__ = createRoot(rootElement);
  }
  window.__APP_ROOT__.render(<AppComponent />);
}

export default AppComponent;
