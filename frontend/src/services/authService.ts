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
};
