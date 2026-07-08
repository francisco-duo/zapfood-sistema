import { createContext, useContext, useState, type ReactNode } from "react";
import { authService } from "../services/authService";
import type { Usuario } from "../types";

interface AuthContextValue {
  usuario: Usuario | null;
  estaAutenticado: boolean;
  login: (email: string, senha: string) => Promise<void>;
  cadastrar: (nome: string, email: string, senha: string, telefone?: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(() => authService.obterSessao());

  async function login(email: string, senha: string) {
    const usuarioLogado = await authService.login({ email, senha });
    setUsuario(usuarioLogado);
  }

  async function cadastrar(nome: string, email: string, senha: string, telefone?: string) {
    const novoUsuario = await authService.cadastrar({ nome, email, senha, telefone });
    setUsuario(novoUsuario);
  }

  function logout() {
    authService.logout();
    setUsuario(null);
  }

  return (
    <AuthContext.Provider value={{ usuario, estaAutenticado: !!usuario, login, cadastrar, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth deve ser usado dentro de um AuthProvider.");
  }
  return context;
}
