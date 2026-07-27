import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { buscarCardapio } from "./menuService";

describe("buscarCardapio", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("converte categorias e produtos do formato da API pro formato do app", async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
      new Response(
        JSON.stringify({
          categorias: [{ id: "c1", nome: "Lanches", ativa: true }],
          produtos: [
            {
              id: "p1",
              categoria_id: "c1",
              nome: "X-Burger",
              descricao: "Delicioso",
              preco: 20,
              preco_promocional: 15,
              imagem_url: "https://picsum.photos/200",
              ativo: true,
            },
          ],
        }),
        { status: 200 }
      )
    );

    const resultado = await buscarCardapio();

    expect(resultado.categorias).toEqual([{ id: "c1", nome: "Lanches" }]);
    expect(resultado.produtos).toEqual([
      {
        id: "p1",
        categoriaId: "c1",
        nome: "X-Burger",
        descricao: "Delicioso",
        preco: 20,
        precoPromocional: 15,
        imagemUrl: "https://picsum.photos/200",
      },
    ]);
  });

  it("preco_promocional nulo vira undefined", async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
      new Response(
        JSON.stringify({
          categorias: [],
          produtos: [
            {
              id: "p1",
              categoria_id: "c1",
              nome: "X",
              descricao: "d",
              preco: 10,
              preco_promocional: null,
              imagem_url: "url",
              ativo: true,
            },
          ],
        }),
        { status: 200 }
      )
    );

    const resultado = await buscarCardapio();
    expect(resultado.produtos[0].precoPromocional).toBeUndefined();
  });

  it("lança erro quando a resposta não é ok", async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue(new Response("erro", { status: 500 }));
    await expect(buscarCardapio()).rejects.toThrow("Não foi possível carregar o cardápio.");
  });
});
