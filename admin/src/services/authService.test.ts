import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./apiClient", () => ({
  apiFetch: vi.fn(),
  tratarResposta: vi.fn(),
}));

import { apiFetch, tratarResposta } from "./apiClient";
import { authService } from "./authService";
import { authStorage } from "./authStorage";

const admin = { id: "u1", nome: "Admin", email: "admin@zapfood.com", perfil: "admin" as const };
const cliente = { id: "u2", nome: "Cliente", email: "c@c.com", perfil: "cliente" as const };

describe("authService (admin)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authStorage.limpar();
  });

  it("login salva a sessão quando o perfil tem acesso ao backoffice", async () => {
    (apiFetch as ReturnType<typeof vi.fn>).mockResolvedValue("resposta");
    (tratarResposta as ReturnType<typeof vi.fn>).mockResolvedValue({
      access_token: "token-123",
      token_type: "bearer",
      usuario: admin,
    });

    const resultado = await authService.login("admin@zapfood.com", "admin123");

    expect(resultado).toEqual(admin);
    expect(authStorage.obterToken()).toBe("token-123");
  });

  it("login rejeita perfil sem acesso ao backoffice (ex.: cliente)", async () => {
    (apiFetch as ReturnType<typeof vi.fn>).mockResolvedValue("resposta");
    (tratarResposta as ReturnType<typeof vi.fn>).mockResolvedValue({
      access_token: "token-123",
      token_type: "bearer",
      usuario: cliente,
    });

    await expect(authService.login("c@c.com", "senha123")).rejects.toThrow(
      "Este usuário não tem acesso ao backoffice."
    );
    expect(authStorage.obterToken()).toBeNull();
  });

  it("obterSessao lê o usuário salvo", () => {
    authStorage.salvar("token", admin);
    expect(authService.obterSessao()).toEqual(admin);
  });

  it("logout limpa a sessão", () => {
    authStorage.salvar("token", admin);
    authService.logout();
    expect(authStorage.obterUsuario()).toBeNull();
  });

  it("esqueciSenha envia o e-mail informado", async () => {
    (apiFetch as ReturnType<typeof vi.fn>).mockResolvedValue("resposta");
    (tratarResposta as ReturnType<typeof vi.fn>).mockResolvedValue({ mensagem: "ok" });

    await authService.esqueciSenha("admin@zapfood.com");

    expect(apiFetch).toHaveBeenCalledWith(
      "/auth/esqueci-senha",
      expect.objectContaining({ body: JSON.stringify({ email: "admin@zapfood.com" }) })
    );
  });

  it("redefinirSenha envia token e nova senha", async () => {
    (apiFetch as ReturnType<typeof vi.fn>).mockResolvedValue("resposta");
    (tratarResposta as ReturnType<typeof vi.fn>).mockResolvedValue({ mensagem: "ok" });

    await authService.redefinirSenha("token-abc", "novaSenha123");

    expect(apiFetch).toHaveBeenCalledWith(
      "/auth/redefinir-senha",
      expect.objectContaining({
        body: JSON.stringify({ token: "token-abc", senha_nova: "novaSenha123" }),
      })
    );
  });
});
