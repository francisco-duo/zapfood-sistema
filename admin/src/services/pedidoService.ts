import { API_BASE_URL } from "./config";
import type { Pedido, StatusPedido, TipoEntrega } from "../types";

async function tratarResposta<T>(response: Response, mensagemErro: string): Promise<T> {
  if (!response.ok) {
    const corpo = await response.json().catch(() => null);
    throw new Error(corpo?.detail ?? mensagemErro);
  }
  return response.json();
}

export const pedidoService = {
  async listar(status?: StatusPedido): Promise<Pedido[]> {
    const url = new URL(`${API_BASE_URL}/pedidos`);
    if (status) url.searchParams.set("status_pedido", status);
    const response = await fetch(url);
    return tratarResposta(response, "Não foi possível carregar os pedidos.");
  },

  async aprovar(pedidoId: string): Promise<Pedido> {
    const response = await fetch(`${API_BASE_URL}/pedidos/${pedidoId}/aprovar`, { method: "POST" });
    return tratarResposta(response, "Não foi possível aprovar o pedido.");
  },

  async cancelar(pedidoId: string): Promise<Pedido> {
    const response = await fetch(`${API_BASE_URL}/pedidos/${pedidoId}/cancelar`, { method: "POST" });
    return tratarResposta(response, "Não foi possível cancelar o pedido.");
  },

  async marcarPronto(pedidoId: string): Promise<Pedido> {
    const response = await fetch(`${API_BASE_URL}/pedidos/${pedidoId}/pronto`, { method: "POST" });
    return tratarResposta(response, "Não foi possível marcar o pedido como pronto.");
  },

  async marcarSaiuParaEntrega(pedidoId: string): Promise<Pedido> {
    const response = await fetch(`${API_BASE_URL}/pedidos/${pedidoId}/saiu-para-entrega`, {
      method: "POST",
    });
    return tratarResposta(response, "Não foi possível marcar o pedido como saiu para entrega.");
  },

  async finalizar(pedidoId: string): Promise<Pedido> {
    const response = await fetch(`${API_BASE_URL}/pedidos/${pedidoId}/finalizar`, { method: "POST" });
    return tratarResposta(response, "Não foi possível finalizar o pedido.");
  },

  async criarVendaBalcao(dados: {
    tipoEntrega: TipoEntrega;
    formaPagamento: string;
    itens: { produto_id: string; quantidade: number; preco_unitario_cobrado: number; observacao?: string }[];
  }): Promise<Pedido> {
    const response = await fetch(`${API_BASE_URL}/pedidos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
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
