import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../services/authService", () => ({
  authService: {
    obterSessao: vi.fn(),
    login: vi.fn(),
    cadastrar: vi.fn(),
    logout: vi.fn(),
    me: vi.fn(),
  },
}));

import { authService } from "../services/authService";
import { authStorage } from "../services/authStorage";
import { AuthProvider, useAuth } from "./AuthContext";

const usuario = {
  id: "u1",
  nome: "Ana",
  email: "ana@example.com",
  perfil: "cliente" as const,
  email_verificado: true,
};

function renderAuth() {
  return renderHook(() => useAuth(), { wrapper: AuthProvider });
}

describe("AuthContext", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (authService.obterSessao as ReturnType<typeof vi.fn>).mockReturnValue(null);
  });

  it("começa deslogado quando não há sessão salva", () => {
    const { result } = renderAuth();
    expect(result.current.estaAutenticado).toBe(false);
    expect(result.current.usuario).toBeNull();
  });

  it("começa logado quando já existe sessão salva", () => {
    (authService.obterSessao as ReturnType<typeof vi.fn>).mockReturnValue(usuario);
    const { result } = renderAuth();
    expect(result.current.estaAutenticado).toBe(true);
    expect(result.current.usuario).toEqual(usuario);
  });

  it("login autentica o usuário retornado pelo service", async () => {
    (authService.login as ReturnType<typeof vi.fn>).mockResolvedValue(usuario);
    const { result } = renderAuth();

    await act(async () => {
      await result.current.login(usuario.email, "senha123");
    });

    expect(result.current.estaAutenticado).toBe(true);
    expect(authService.login).toHaveBeenCalledWith({ email: usuario.email, senha: "senha123" });
  });

  it("cadastrar autentica o novo usuário", async () => {
    (authService.cadastrar as ReturnType<typeof vi.fn>).mockResolvedValue(usuario);
    const { result } = renderAuth();

    await act(async () => {
      await result.current.cadastrar("Ana", usuario.email, "senha123", "11999999999");
    });

    expect(result.current.usuario).toEqual(usuario);
  });

  it("logout limpa o usuário", () => {
    (authService.obterSessao as ReturnType<typeof vi.fn>).mockReturnValue(usuario);
    const { result } = renderAuth();

    act(() => result.current.logout());

    expect(result.current.estaAutenticado).toBe(false);
    expect(authService.logout).toHaveBeenCalled();
  });

  it("atualizarUsuario busca os dados mais recentes e atualiza o storage", async () => {
    (authService.obterSessao as ReturnType<typeof vi.fn>).mockReturnValue(usuario);
    const usuarioAtualizado = { ...usuario, email_verificado: true };
    (authService.me as ReturnType<typeof vi.fn>).mockResolvedValue(usuarioAtualizado);

    const { result } = renderAuth();
    await act(async () => {
      await result.current.atualizarUsuario();
    });

    await waitFor(() => expect(result.current.usuario).toEqual(usuarioAtualizado));
    expect(authStorage.obterUsuario()).toEqual(usuarioAtualizado);
  });

  it("useAuth fora do provider lança erro", () => {
    expect(() => renderHook(() => useAuth())).toThrow(
      "useAuth deve ser usado dentro de um AuthProvider."
    );
  });
});
