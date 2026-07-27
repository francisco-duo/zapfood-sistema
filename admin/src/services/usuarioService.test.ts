import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./apiClient", () => ({
  apiFetch: vi.fn(),
  tratarResposta: vi.fn(),
}));
vi.mock("./logService", () => ({ registrarLog: vi.fn() }));

import { apiFetch, tratarResposta } from "./apiClient";
import { registrarLog } from "./logService";
import { usuarioService } from "./usuarioService";

describe("usuarioService", () => {
  beforeEach(() => vi.clearAllMocks());

  it("listar busca os usuários cadastrados", async () => {
    (apiFetch as ReturnType<typeof vi.fn>).mockResolvedValue("r");
    (tratarResposta as ReturnType<typeof vi.fn>).mockResolvedValue([]);

    await usuarioService.listar();
    expect(apiFetch).toHaveBeenCalledWith("/auth/usuarios");
  });

  it("criar registra log com nome e perfil do novo usuário", async () => {
    (apiFetch as ReturnType<typeof vi.fn>).mockResolvedValue("r");
    (tratarResposta as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "u1",
      nome: "João",
      email: "joao@zapfood.com",
      telefone: null,
      perfil: "cozinha",
      criado_em: "2026-01-01T00:00:00Z",
    });

    await usuarioService.criar({
      nome: "João",
      email: "joao@zapfood.com",
      senha: "senha123",
      perfil: "cozinha",
    });

    expect(registrarLog).toHaveBeenCalledWith("catalogo", expect.stringContaining("João"));
    expect(registrarLog).toHaveBeenCalledWith("catalogo", expect.stringContaining("cozinha"));
  });
});
