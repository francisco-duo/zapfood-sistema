import { apiFetch, tratarResposta } from "./apiClient";
import { authStorage } from "./authStorage";
import type { PerfilUsuario, Usuario } from "../types";

interface TokenResponse {
  access_token: string;
  token_type: string;
  usuario: Usuario;
}

const PERFIS_PERMITIDOS: PerfilUsuario[] = ["admin", "cozinha"];

export const authService = {
  async login(email: string, senha: string): Promise<Usuario> {
    const response = await apiFetch("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, senha }),
    });
    const dados = await tratarResposta<TokenResponse>(response, "E-mail ou senha inválidos.");

    if (!PERFIS_PERMITIDOS.includes(dados.usuario.perfil)) {
      throw new Error("Este usuário não tem acesso ao painel da cozinha.");
    }

    authStorage.salvar(dados.access_token, dados.usuario);
    return dados.usuario;
  },

  obterSessao(): Usuario | null {
    return authStorage.obterUsuario();
  },

  obterToken(): string | null {
    return authStorage.obterToken();
  },

  logout(): void {
    authStorage.limpar();
  },

  async esqueciSenha(email: string): Promise<{ mensagem: string }> {
    const response = await apiFetch("/auth/esqueci-senha", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
    return tratarResposta(response, "Não foi possível processar a solicitação.");
  },

  async redefinirSenha(token: string, senhaNova: string): Promise<{ mensagem: string }> {
    const response = await apiFetch("/auth/redefinir-senha", {
      method: "POST",
      body: JSON.stringify({ token, senha_nova: senhaNova }),
    });
    return tratarResposta(response, "Este link é inválido ou já expirou.");
  },
};
