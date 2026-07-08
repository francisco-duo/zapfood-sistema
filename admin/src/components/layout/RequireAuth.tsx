import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import AdminShell from "./AdminShell";

export default function RequireAuth({ children }: { children: ReactNode }) {
  const { estaAutenticado } = useAuth();

  if (!estaAutenticado) {
    return <Navigate to="/login" replace />;
  }

  return <AdminShell>{children}</AdminShell>;
}
