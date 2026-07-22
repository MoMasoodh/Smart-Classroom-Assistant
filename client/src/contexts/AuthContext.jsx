import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  getStoredTeacherAuth,
  removeTeacherAuth,
  saveTeacherAuth,
} from "../services/authService";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [authState, setAuthState] = useState(() => getStoredTeacherAuth());

  useEffect(() => {
    setAuthState(getStoredTeacherAuth());
  }, []);

  const login = (authData) => {
    const nextAuth = saveTeacherAuth(authData);
    setAuthState(nextAuth);
  };

  const logout = () => {
    removeTeacherAuth();
    setAuthState(null);
  };

  const value = useMemo(() => {
    const teacher = authState?.teacher || null;
    const token = authState?.token || null;

    return {
      teacher,
      token,
      isAuthenticated: Boolean(teacher && token),
      login,
      logout,
    };
  }, [authState]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}