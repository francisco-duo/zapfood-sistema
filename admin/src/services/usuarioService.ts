import { apiFetch, tratarResposta } from "./apiClient";
import { registrarLog } from "./logService";
import type { PerfilUsuario } from "../types";

interface UsuarioApi {
  id: string;
  nome: string;
  email: string;
  telefone: string | null;
  perfil: PerfilUsuario;
  criado_em: string;
}

export interface NovoUsuarioStaff {
  nome: string;
  email: string;
  senha: string;
  perfil: PerfilUsuario;
  telefone?: string;
}

export const usuarioService = {
  async listar(): Promise<UsuarioApi[]> {
    const response = await apiFetch("/auth/usuarios");
    return tratarResposta(response, "Não foi possível carregar os usuários.");
  },

  async criar(dados: NovoUsuarioStaff): Promise<UsuarioApi> {
    const response = await apiFetch("/auth/usuarios", {
      method: "POST",
      body: JSON.stringify(dados),
    });
    const criado = await tratarResposta<UsuarioApi>(response, "Não foi possível criar o usuário.");
    registrarLog("catalogo", `Usuário "${criado.nome}" (${criado.perfil}) criado.`);
    return criado;
  },
};
