import { beforeEach, describe, expect, it, vi } from "vitest";
import { authService } from "./authService";
import { authStorage } from "./authStorage";

vi.mock("./apiClient", () => ({
  apiFetch: vi.fn(),
  tratarResposta: vi.fn(),
}));

import { apiFetch, tratarResposta } from "./apiClient";

const usuario = {
  id: "u1",
  nome: "Ana",
  email: "ana@example.com",
  perfil: "cliente" as const,
  email_verificado: true,
};

describe("authService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authStorage.limpar();
  });

  it("login salva o token e o usuário retornados pela API", async () => {
    (apiFetch as ReturnType<typeof vi.fn>).mockResolvedValue("resposta-fake");
    (tratarResposta as ReturnType<typeof vi.fn>).mockResolvedValue({
      access_token: "token-123",
      token_type: "bearer",
      usuario,
    });

    const resultado = await authService.login({ email: usuario.email, senha: "senha123" });

    expect(resultado).toEqual(usuario);
    expect(authStorage.obterToken()).toBe("token-123");
    expect(apiFetch).toHaveBeenCalledWith(
      "/auth/login",
      expect.objectContaining({ method: "POST" })
    );
  });

  it("cadastrar envia os dados e salva a sessão", async () => {
    (apiFetch as ReturnType<typeof vi.fn>).mockResolvedValue("resposta-fake");
    (tratarResposta as ReturnType<typeof vi.fn>).mockResolvedValue({
      access_token: "token-novo",
      token_type: "bearer",
      usuario: { ...usuario, email_verificado: false },
    });

    const resultado = await authService.cadastrar({
      nome: "Ana",
      email: usuario.email,
      senha: "senha123",
    });

    expect(resultado.email_verificado).toBe(false);
    expect(authStorage.obterToken()).toBe("token-novo");
  });

  it("obterSessao lê o usuário salvo no storage", () => {
    authStorage.salvar("token", usuario);
    expect(authService.obterSessao()).toEqual(usuario);
  });

  it("logout limpa a sessão", () => {
    authStorage.salvar("token", usuario);
    authService.logout();
    expect(authStorage.obterUsuario()).toBeNull();
  });

  it("verificarEmail envia o token no corpo da requisição", async () => {
    (apiFetch as ReturnType<typeof vi.fn>).mockResolvedValue("resposta-fake");
    (tratarResposta as ReturnType<typeof vi.fn>).mockResolvedValue({ mensagem: "ok" });

    await authService.verificarEmail("token-abc");

    expect(apiFetch).toHaveBeenCalledWith(
      "/auth/verificar-email",
      expect.objectContaining({ body: JSON.stringify({ token: "token-abc" }) })
    );
  });

  it("esqueciSenha envia o email informado", async () => {
    (apiFetch as ReturnType<typeof vi.fn>).mockResolvedValue("resposta-fake");
    (tratarResposta as ReturnType<typeof vi.fn>).mockResolvedValue({ mensagem: "ok" });

    await authService.esqueciSenha("ana@example.com");

    expect(apiFetch).toHaveBeenCalledWith(
      "/auth/esqueci-senha",
      expect.objectContaining({ body: JSON.stringify({ email: "ana@example.com" }) })
    );
  });

  it("me busca os dados atuais do usuário autenticado", async () => {
    (apiFetch as ReturnType<typeof vi.fn>).mockResolvedValue("resposta-fake");
    (tratarResposta as ReturnType<typeof vi.fn>).mockResolvedValue(usuario);

    const resultado = await authService.me();

    expect(resultado).toEqual(usuario);
    expect(apiFetch).toHaveBeenCalledWith("/auth/me");
  });

  it("reenviarVerificacao chama o endpoint correto", async () => {
    (apiFetch as ReturnType<typeof vi.fn>).mockResolvedValue("resposta-fake");
    (tratarResposta as ReturnType<typeof vi.fn>).mockResolvedValue({ mensagem: "ok" });

    await authService.reenviarVerificacao();

    expect(apiFetch).toHaveBeenCalledWith(
      "/auth/reenviar-verificacao",
      expect.objectContaining({ method: "POST" })
    );
  });

  it("redefinirSenha envia token e nova senha", async () => {
    (apiFetch as ReturnType<typeof vi.fn>).mockResolvedValue("resposta-fake");
    (tratarResposta as ReturnType<typeof vi.fn>).mockResolvedValue({ mensagem: "ok" });

    await authService.redefinirSenha("token-abc", "novaSenha1");

    expect(apiFetch).toHaveBeenCalledWith(
      "/auth/redefinir-senha",
      expect.objectContaining({
        body: JSON.stringify({ token: "token-abc", senha_nova: "novaSenha1" }),
      })
    );
  });
});
