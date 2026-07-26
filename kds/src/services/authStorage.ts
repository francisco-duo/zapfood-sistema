import type { Usuario } from "../types";

const TOKEN_KEY = "zapfood_kds_token";
const USUARIO_KEY = "zapfood_kds_usuario";

export const authStorage = {
  obterToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  },

  obterUsuario(): Usuario | null {
    const raw = localStorage.getItem(USUARIO_KEY);
    return raw ? JSON.parse(raw) : null;
  },

  salvar(token: string, usuario: Usuario): void {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USUARIO_KEY, JSON.stringify(usuario));
  },

  limpar(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USUARIO_KEY);
  },
};
