import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cardapioService } from "./cardapioService";

describe("cardapioService", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("retorna a lista de produtos do cardápio público", async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
      new Response(JSON.stringify({ produtos: [{ id: "p1", nome: "X-Burger" }] }), { status: 200 })
    );

    const produtos = await cardapioService.listarProdutos();
    expect(produtos).toEqual([{ id: "p1", nome: "X-Burger" }]);
  });

  it("lança erro quando a resposta não é ok", async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue(new Response("erro", { status: 500 }));
    await expect(cardapioService.listarProdutos()).rejects.toThrow(
      "Não foi possível carregar os nomes dos produtos."
    );
  });
});
