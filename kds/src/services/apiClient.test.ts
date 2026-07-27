import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { apiFetch, tratarResposta } from "./apiClient";
import { authStorage } from "./authStorage";

describe("apiFetch (kds)", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("inclui o Bearer token quando há sessão salva", async () => {
    authStorage.salvar("meu-token", { id: "u1", nome: "Cozinha", email: "c@c.com", perfil: "cozinha" });
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue(new Response("{}", { status: 200 }));

    await apiFetch("/kds/fila");

    const [, options] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect((options.headers as Headers).get("Authorization")).toBe("Bearer meu-token");
  });

  it("limpa a sessão numa resposta 401", async () => {
    authStorage.salvar("token", { id: "u1", nome: "Cozinha", email: "c@c.com", perfil: "cozinha" });
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue(new Response("{}", { status: 401 }));

    await apiFetch("/kds/fila");

    expect(authStorage.obterToken()).toBeNull();
  });
});

describe("tratarResposta (kds)", () => {
  it("retorna o json quando ok", async () => {
    const resposta = new Response(JSON.stringify({ ok: true }), { status: 200 });
    expect(await tratarResposta<{ ok: boolean }>(resposta, "erro")).toEqual({ ok: true });
  });

  it("lança o detail da API quando falha", async () => {
    const resposta = new Response(JSON.stringify({ detail: "não autorizado" }), { status: 403 });
    await expect(tratarResposta(resposta, "erro genérico")).rejects.toThrow("não autorizado");
  });

  it("usa a mensagem padrão quando não há corpo json", async () => {
    const resposta = new Response("erro cru", { status: 500 });
    await expect(tratarResposta(resposta, "erro genérico")).rejects.toThrow("erro genérico");
  });
});
