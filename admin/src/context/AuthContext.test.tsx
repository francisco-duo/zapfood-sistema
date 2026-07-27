import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../services/authService", () => ({
  authService: {
    obterSessao: vi.fn(),
    login: vi.fn(),
    logout: vi.fn(),
  },
}));

import { authService } from "../services/authService";
import { AuthProvider, useAuth } from "./AuthContext";

const admin = { id: "u1", nome: "Admin", email: "admin@zapfood.com", perfil: "admin" as const };

function renderAuth() {
  return renderHook(() => useAuth(), { wrapper: AuthProvider });
}

describe("AuthContext (admin)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (authService.obterSessao as ReturnType<typeof vi.fn>).mockReturnValue(null);
  });

  it("começa deslogado sem sessão salva", () => {
    const { result } = renderAuth();
    expect(result.current.estaAutenticado).toBe(false);
  });

  it("login autentica o usuário", async () => {
    (authService.login as ReturnType<typeof vi.fn>).mockResolvedValue(admin);
    const { result } = renderAuth();

    await act(async () => {
      await result.current.login(admin.email, "admin123");
    });

    expect(result.current.usuario).toEqual(admin);
  });

  it("logout limpa a sessão", () => {
    (authService.obterSessao as ReturnType<typeof vi.fn>).mockReturnValue(admin);
    const { result } = renderAuth();

    act(() => result.current.logout());

    expect(result.current.estaAutenticado).toBe(false);
    expect(authService.logout).toHaveBeenCalled();
  });

  it("useAuth fora do provider lança erro", () => {
    expect(() => renderHook(() => useAuth())).toThrow(
      "useAuth deve ser usado dentro de um AuthProvider."
    );
  });
});
