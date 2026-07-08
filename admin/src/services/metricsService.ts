import { pedidoService } from "./pedidoService";
import { catalogoService } from "./catalogoService";
import type { MetricasDia } from "../types";

function ehHoje(isoDate: string): boolean {
  const data = new Date(isoDate);
  const hoje = new Date();
  return (
    data.getFullYear() === hoje.getFullYear() &&
    data.getMonth() === hoje.getMonth() &&
    data.getDate() === hoje.getDate()
  );
}

export async function calcularMetricasDoDia(): Promise<MetricasDia> {
  const pedidos = await pedidoService.listar();
  const produtos = catalogoService.listarProdutos();
  const nomePorProdutoId = new Map(produtos.map((p) => [p.id, p.nome]));

  const pedidosValidos = pedidos.filter((p) => ehHoje(p.criado_em) && p.status !== "cancelado");

  const faturamentoBruto = pedidosValidos.reduce((soma, p) => soma + p.valor_total, 0);
  const totalPedidos = pedidosValidos.length;
  const ticketMedio = totalPedidos > 0 ? faturamentoBruto / totalPedidos : 0;

  const contagemPorProduto = new Map<string, { quantidade: number; total: number }>();
  for (const pedido of pedidosValidos) {
    for (const item of pedido.itens) {
      const atual = contagemPorProduto.get(item.produto_id) ?? { quantidade: 0, total: 0 };
      atual.quantidade += item.quantidade;
      atual.total += item.quantidade * item.preco_unitario_cobrado;
      contagemPorProduto.set(item.produto_id, atual);
    }
  }

  const rankingProdutos = [...contagemPorProduto.entries()]
    .map(([produtoId, dados]) => ({
      produtoId,
      nome: nomePorProdutoId.get(produtoId) ?? `Produto ${produtoId.slice(0, 8)}`,
      ...dados,
    }))
    .sort((a, b) => b.quantidade - a.quantidade)
    .slice(0, 5);

  return { faturamentoBruto, ticketMedio, totalPedidos, rankingProdutos };
}
