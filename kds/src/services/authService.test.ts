import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./apiClient", () => ({
  apiFetch: vi.fn(),
  tratarResposta: vi.fn(),
}));

import { apiFetch, tratarResposta } from "./apiClient";
import { authService } from "./authService";
import { authStorage } from "./authStorage";

const cozinha = { id: "u1", nome: "Cozinha", email: "cozinha@zapfood.com", perfil: "cozinha" as const };
const cliente = { id: "u2", nome: "Cliente", email: "c@c.com", perfil: "cliente" as const };

describe("authService (kds)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authStorage.limpar();
  });

  it("login salva a sessão quando o perfil tem acesso à cozinha", async () => {
    (apiFetch as ReturnType<typeof vi.fn>).mockResolvedValue("r");
    (tratarResposta as ReturnType<typeof vi.fn>).mockResolvedValue({
      access_token: "token-123",
      token_type: "bearer",
      usuario: cozinha,
    });

    const resultado = await authService.login("cozinha@zapfood.com", "senha123");
    expect(resultado).toEqual(cozinha);
    expect(authStorage.obterToken()).toBe("token-123");
  });

  it("login rejeita perfil sem acesso à cozinha", async () => {
    (apiFetch as ReturnType<typeof vi.fn>).mockResolvedValue("r");
    (tratarResposta as ReturnType<typeof vi.fn>).mockResolvedValue({
      access_token: "token-123",
      token_type: "bearer",
      usuario: cliente,
    });

    await expect(authService.login("c@c.com", "senha123")).rejects.toThrow(
      "Este usuário não tem acesso ao painel da cozinha."
    );
    expect(authStorage.obterToken()).toBeNull();
  });

  it("obterSessao/obterToken leem o que está salvo", () => {
    authStorage.salvar("token-xyz", cozinha);
    expect(authService.obterSessao()).toEqual(cozinha);
    expect(authService.obterToken()).toBe("token-xyz");
  });

  it("logout limpa a sessão", () => {
    authStorage.salvar("token", cozinha);
    authService.logout();
    expect(authStorage.obterUsuario()).toBeNull();
  });

  it("esqueciSenha e redefinirSenha chamam os endpoints certos", async () => {
    (apiFetch as ReturnType<typeof vi.fn>).mockResolvedValue("r");
    (tratarResposta as ReturnType<typeof vi.fn>).mockResolvedValue({ mensagem: "ok" });

    await authService.esqueciSenha("cozinha@zapfood.com");
    expect(apiFetch).toHaveBeenCalledWith(
      "/auth/esqueci-senha",
      expect.objectContaining({ body: JSON.stringify({ email: "cozinha@zapfood.com" }) })
    );

    await authService.redefinirSenha("token-abc", "novaSenha123");
    expect(apiFetch).toHaveBeenCalledWith(
      "/auth/redefinir-senha",
      expect.objectContaining({ body: JSON.stringify({ token: "token-abc", senha_nova: "novaSenha123" }) })
    );
  });
});
