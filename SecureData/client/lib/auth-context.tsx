import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { authAPI } from "./api";

interface AuthContextType {
  isAuthenticated: boolean;
  role: "Admin" | "Standard" | null;
  username: string | null;
  userId: number | null;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authState, setAuthState] = useState<AuthContextType>({
    isAuthenticated: false,
    role: null,
    username: null,
    userId: null,
    isLoading: true,
  });

  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem("authToken");
    const role = localStorage.getItem("userRole") as "Admin" | "Standard" | null;
    const username = localStorage.getItem("username");
    const userId = localStorage.getItem("userId");

    if (token && role) {
      setAuthState({
        isAuthenticated: true,
        role,
        username,
        userId: userId ? parseInt(userId) : null,
        isLoading: false,
      });
    } else {
      setAuthState((prev) => ({
        ...prev,
        isLoading: false,
      }));
    }
  }, []);

  return (
    <AuthContext.Provider value={authState}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
