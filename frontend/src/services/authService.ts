import { apiFetch, tratarResposta } from "./apiClient";
import { authStorage } from "./authStorage";
import type { Usuario } from "../types";

interface Credenciais {
  email: string;
  senha: string;
}

interface DadosCadastro extends Credenciais {
  nome: string;
  telefone?: string;
}

interface TokenResponse {
  access_token: string;
  token_type: string;
  usuario: Usuario;
}

export const authService = {
  async login({ email, senha }: Credenciais): Promise<Usuario> {
    const response = await apiFetch("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, senha }),
    });
    const dados = await tratarResposta<TokenResponse>(response, "E-mail ou senha inválidos.");
    authStorage.salvar(dados.access_token, dados.usuario);
    return dados.usuario;
  },

  async cadastrar(dados: DadosCadastro): Promise<Usuario> {
    const response = await apiFetch("/auth/registrar", {
      method: "POST",
      body: JSON.stringify(dados),
    });
    const resposta = await tratarResposta<TokenResponse>(
      response,
      "Não foi possível concluir o cadastro."
    );
    authStorage.salvar(resposta.access_token, resposta.usuario);
    return resposta.usuario;
  },

  obterSessao(): Usuario | null {
    return authStorage.obterUsuario();
  },

  logout(): void {
    authStorage.limpar();
  },

  async me(): Promise<Usuario> {
    const response = await apiFetch("/auth/me");
    return tratarResposta<Usuario>(response, "Não foi possível carregar os dados da conta.");
  },

  async reenviarVerificacao(): Promise<{ mensagem: string }> {
    const response = await apiFetch("/auth/reenviar-verificacao", { method: "POST" });
    return tratarResposta(response, "Não foi possível reenviar o e-mail de confirmação.");
  },

  async verificarEmail(token: string): Promise<{ mensagem: string }> {
    const response = await apiFetch("/auth/verificar-email", {
      method: "POST",
      body: JSON.stringify({ token }),
    });
    return tratarResposta(response, "Este link é inválido ou já expirou.");
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
