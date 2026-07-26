import { apiFetch, tratarResposta } from "./apiClient";
import type { Pedido, StatusPedido, TipoEntrega } from "../types";

export const pedidoService = {
  async listar(status?: StatusPedido): Promise<Pedido[]> {
    const query = status ? `?status_pedido=${status}` : "";
    const response = await apiFetch(`/pedidos${query}`);
    return tratarResposta(response, "Não foi possível carregar os pedidos.");
  },

  async aprovar(pedidoId: string): Promise<Pedido> {
    const response = await apiFetch(`/pedidos/${pedidoId}/aprovar`, { method: "POST" });
    return tratarResposta(response, "Não foi possível aprovar o pedido.");
  },

  async cancelar(pedidoId: string): Promise<Pedido> {
    const response = await apiFetch(`/pedidos/${pedidoId}/cancelar`, { method: "POST" });
    return tratarResposta(response, "Não foi possível cancelar o pedido.");
  },

  async marcarPronto(pedidoId: string): Promise<Pedido> {
    const response = await apiFetch(`/pedidos/${pedidoId}/pronto`, { method: "POST" });
    return tratarResposta(response, "Não foi possível marcar o pedido como pronto.");
  },

  async marcarSaiuParaEntrega(pedidoId: string): Promise<Pedido> {
    const response = await apiFetch(`/pedidos/${pedidoId}/saiu-para-entrega`, { method: "POST" });
    return tratarResposta(response, "Não foi possível marcar o pedido como saiu para entrega.");
  },

  async finalizar(pedidoId: string): Promise<Pedido> {
    const response = await apiFetch(`/pedidos/${pedidoId}/finalizar`, { method: "POST" });
    return tratarResposta(response, "Não foi possível finalizar o pedido.");
  },

  async criarVendaBalcao(dados: {
    tipoEntrega: TipoEntrega;
    formaPagamento: string;
    itens: { produto_id: string; quantidade: number; preco_unitario_cobrado: number; observacao?: string }[];
  }): Promise<Pedido> {
    const response = await apiFetch("/pedidos", {
      method: "POST",
      body: JSON.stringify({
        origem: "balcao",
        tipo_entrega: dados.tipoEntrega,
        forma_pagamento: dados.formaPagamento,
        itens: dados.itens,
      }),
    });
    return tratarResposta(response, "Não foi possível registrar a venda de balcão.");
  },
};
