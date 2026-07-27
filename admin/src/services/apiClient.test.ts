import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { apiFetch, tratarResposta } from "./apiClient";
import { authStorage } from "./authStorage";

describe("apiFetch (admin)", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("inclui o Bearer token quando há sessão salva", async () => {
    authStorage.salvar("meu-token", { id: "u1", nome: "Admin", email: "a@a.com", perfil: "admin" });
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue(new Response("{}", { status: 200 }));

    await apiFetch("/pedidos");

    const [, options] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect((options.headers as Headers).get("Authorization")).toBe("Bearer meu-token");
  });

  it("limpa a sessão numa resposta 401", async () => {
    authStorage.salvar("token", { id: "u1", nome: "Admin", email: "a@a.com", perfil: "admin" });
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue(new Response("{}", { status: 401 }));

    await apiFetch("/pedidos");

    expect(authStorage.obterToken()).toBeNull();
  });
});

describe("tratarResposta (admin)", () => {
  it("retorna o json quando ok", async () => {
    const resposta = new Response(JSON.stringify({ ok: true }), { status: 200 });
    expect(await tratarResposta<{ ok: boolean }>(resposta, "erro")).toEqual({ ok: true });
  });

  it("lança o detail da API quando falha", async () => {
    const resposta = new Response(JSON.stringify({ detail: "não autorizado" }), { status: 403 });
    await expect(tratarResposta(resposta, "erro genérico")).rejects.toThrow("não autorizado");
  });
});
