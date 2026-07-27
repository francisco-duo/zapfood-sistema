import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { apiFetch, tratarResposta } from "./apiClient";
import { authStorage } from "./authStorage";

describe("apiFetch", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("não envia Authorization quando não há token salvo", async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue(new Response("{}", { status: 200 }));

    await apiFetch("/cardapio");

    const [, options] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect((options.headers as Headers).has("Authorization")).toBe(false);
  });

  it("inclui o Bearer token quando há sessão salva", async () => {
    authStorage.salvar("meu-token", {
      id: "u1",
      nome: "Ana",
      email: "a@a.com",
      perfil: "cliente",
      email_verificado: true,
    });
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue(new Response("{}", { status: 200 }));

    await apiFetch("/pedidos");

    const [, options] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect((options.headers as Headers).get("Authorization")).toBe("Bearer meu-token");
  });

  it("define Content-Type json quando manda corpo e não foi definido", async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue(new Response("{}", { status: 200 }));

    await apiFetch("/pedidos", { method: "POST", body: JSON.stringify({ a: 1 }) });

    const [, options] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect((options.headers as Headers).get("Content-Type")).toBe("application/json");
  });

  it("limpa a sessão automaticamente numa resposta 401", async () => {
    authStorage.salvar("token-expirado", {
      id: "u1",
      nome: "Ana",
      email: "a@a.com",
      perfil: "cliente",
      email_verificado: true,
    });
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue(new Response("{}", { status: 401 }));

    await apiFetch("/pedidos");

    expect(authStorage.obterToken()).toBeNull();
  });

  it("monta a URL prefixada com a base da API", async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue(new Response("{}", { status: 200 }));
    await apiFetch("/cardapio");
    const [url] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(url).toContain("/cardapio");
  });
});

describe("tratarResposta", () => {
  it("retorna o corpo em json quando a resposta é ok", async () => {
    const resposta = new Response(JSON.stringify({ ok: true }), { status: 200 });
    const resultado = await tratarResposta<{ ok: boolean }>(resposta, "erro genérico");
    expect(resultado).toEqual({ ok: true });
  });

  it("lança o detail retornado pela API quando a resposta falha", async () => {
    const resposta = new Response(JSON.stringify({ detail: "e-mail já cadastrado" }), { status: 409 });
    await expect(tratarResposta(resposta, "erro genérico")).rejects.toThrow("e-mail já cadastrado");
  });

  it("usa a mensagem padrão quando a resposta de erro não tem corpo json válido", async () => {
    const resposta = new Response("não é json", { status: 500 });
    await expect(tratarResposta(resposta, "erro genérico")).rejects.toThrow("erro genérico");
  });
});
