import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./pedidoService", () => ({ pedidoService: { listar: vi.fn() } }));
vi.mock("./catalogoService", () => ({ catalogoService: { listarProdutos: vi.fn() } }));

import { pedidoService } from "./pedidoService";
import { catalogoService } from "./catalogoService";
import { calcularMetricasDoDia } from "./metricsService";
import type { Pedido, Produto } from "../types";

const agora = new Date().toISOString();
const ontem = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

function pedido(overrides: Partial<Pedido>): Pedido {
  return {
    id: "pedido-1",
    usuario_id: null,
    origem: "balcao",
    tipo_entrega: "consumo_local",
    status: "finalizado",
    forma_pagamento: "Pix",
    endereco_entrega: null,
    valor_total: 50,
    criado_em: agora,
    itens: [{ id: "i1", produto_id: "p1", quantidade: 2, preco_unitario_cobrado: 25 }],
    ...overrides,
  };
}

const produtos: Produto[] = [
  { id: "p1", categoriaId: "c1", nome: "X-Burger", descricao: "d", preco: 25, imagemUrl: "url", ativo: true },
];

describe("calcularMetricasDoDia", () => {
  beforeEach(() => vi.clearAllMocks());

  it("soma faturamento e calcula ticket médio só dos pedidos de hoje não cancelados", async () => {
    (pedidoService.listar as ReturnType<typeof vi.fn>).mockResolvedValue([
      pedido({ id: "p-hoje", valor_total: 100 }),
      pedido({ id: "p-ontem", criado_em: ontem, valor_total: 999 }),
      pedido({ id: "p-cancelado", status: "cancelado", valor_total: 999 }),
    ]);
    (catalogoService.listarProdutos as ReturnType<typeof vi.fn>).mockResolvedValue(produtos);

    const metricas = await calcularMetricasDoDia();

    expect(metricas.totalPedidos).toBe(1);
    expect(metricas.faturamentoBruto).toBe(100);
    expect(metricas.ticketMedio).toBe(100);
  });

  it("retorna ticket médio 0 quando não há pedidos válidos hoje", async () => {
    (pedidoService.listar as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    (catalogoService.listarProdutos as ReturnType<typeof vi.fn>).mockResolvedValue([]);

    const metricas = await calcularMetricasDoDia();
    expect(metricas.ticketMedio).toBe(0);
    expect(metricas.totalPedidos).toBe(0);
  });

  it("monta o ranking de produtos mais vendidos com nome resolvido", async () => {
    (pedidoService.listar as ReturnType<typeof vi.fn>).mockResolvedValue([pedido({})]);
    (catalogoService.listarProdutos as ReturnType<typeof vi.fn>).mockResolvedValue(produtos);

    const metricas = await calcularMetricasDoDia();

    expect(metricas.rankingProdutos).toEqual([
      { produtoId: "p1", nome: "X-Burger", quantidade: 2, total: 50 },
    ]);
  });

  it("usa um nome de fallback quando o produto não é encontrado no catálogo", async () => {
    (pedidoService.listar as ReturnType<typeof vi.fn>).mockResolvedValue([
      pedido({ itens: [{ id: "i1", produto_id: "produto-removido-123", quantidade: 1, preco_unitario_cobrado: 10 }] }),
    ]);
    (catalogoService.listarProdutos as ReturnType<typeof vi.fn>).mockResolvedValue([]);

    const metricas = await calcularMetricasDoDia();
    expect(metricas.rankingProdutos[0].nome).toContain("Produto");
  });
});
