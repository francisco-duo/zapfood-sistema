import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import AdminShell from "./AdminShell";

export default function RequireAuth({
  children,
  somenteAdmin = false,
}: {
  children: ReactNode;
  somenteAdmin?: boolean;
}) {
  const { estaAutenticado, usuario } = useAuth();

  if (!estaAutenticado) {
    return <Navigate to="/login" replace />;
  }

  if (somenteAdmin && usuario?.perfil !== "admin") {
    return <Navigate to="/pedidos" replace />;
  }

  return <AdminShell>{children}</AdminShell>;
}
