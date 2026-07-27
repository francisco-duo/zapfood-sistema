import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./apiClient", () => ({
  apiFetch: vi.fn(),
  tratarResposta: vi.fn(),
}));

import { apiFetch, tratarResposta } from "./apiClient";
import { pedidoService } from "./pedidoService";
import type { ItemCarrinho } from "../types";

const itens: ItemCarrinho[] = [
  { produtoId: "p1", nome: "X-Burger", precoUnitario: 20, quantidade: 2, imagemUrl: "url" },
];

describe("pedidoService.enviar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (apiFetch as ReturnType<typeof vi.fn>).mockResolvedValue("resposta-fake");
    (tratarResposta as ReturnType<typeof vi.fn>).mockResolvedValue({ id: "pedido-1", status: "aguardando_aprovacao" });
  });

  it("monta o endereço formatado quando é delivery", async () => {
    await pedidoService.enviar({
      itens,
      valorTotal: 40,
      checkout: {
        tipoEntrega: "delivery",
        formaPagamento: "Pix",
        endereco: {
          cep: "12345-000",
          rua: "Rua A",
          numero: "10",
          bairro: "Centro",
          cidade: "SP",
          complemento: "Apto 1",
        },
      },
    });

    const [, options] = (apiFetch as ReturnType<typeof vi.fn>).mock.calls[0];
    const corpo = JSON.parse(options.body);
    expect(corpo.endereco_entrega).toBe("Rua A, 10 - Centro, SP (12345-000) - Apto 1");
    expect(corpo.tipo_entrega).toBe("delivery");
  });

  it("não envia endereço quando é retirada", async () => {
    await pedidoService.enviar({
      itens,
      valorTotal: 40,
      checkout: { tipoEntrega: "retirada", formaPagamento: "Dinheiro" },
    });

    const [, options] = (apiFetch as ReturnType<typeof vi.fn>).mock.calls[0];
    const corpo = JSON.parse(options.body);
    expect(corpo.endereco_entrega).toBeNull();
  });

  it("converte os itens do carrinho pro formato esperado pela API", async () => {
    await pedidoService.enviar({
      itens,
      valorTotal: 40,
      checkout: { tipoEntrega: "retirada", formaPagamento: "Pix" },
    });

    const [, options] = (apiFetch as ReturnType<typeof vi.fn>).mock.calls[0];
    const corpo = JSON.parse(options.body);
    expect(corpo.itens).toEqual([
      { produto_id: "p1", quantidade: 2, preco_unitario_cobrado: 20, observacao: null },
    ]);
    expect(corpo.origem).toBe("online");
  });

  it("preserva a observação do item quando informada", async () => {
    await pedidoService.enviar({
      itens: [{ ...itens[0], observacao: "sem cebola" }],
      valorTotal: 40,
      checkout: { tipoEntrega: "retirada", formaPagamento: "Pix" },
    });

    const [, options] = (apiFetch as ReturnType<typeof vi.fn>).mock.calls[0];
    const corpo = JSON.parse(options.body);
    expect(corpo.itens[0].observacao).toBe("sem cebola");
  });
});
