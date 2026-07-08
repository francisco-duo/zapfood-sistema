import { API_BASE_URL, USE_MOCK_BACKEND } from "./config";
import type { DadosCheckout, ItemCarrinho } from "../types";

interface NovoPedidoPayload {
  usuarioId: string;
  itens: ItemCarrinho[];
  checkout: DadosCheckout;
  valorTotal: number;
}

interface PedidoConfirmado {
  id: string;
  status: string;
}

async function enviarPedidoMock(payload: NovoPedidoPayload): Promise<PedidoConfirmado> {
  await new Promise((resolve) => setTimeout(resolve, 600));
  return { id: crypto.randomUUID(), status: "aguardando_aprovacao" };
}

async function enviarPedidoApi(payload: NovoPedidoPayload): Promise<PedidoConfirmado> {
  const response = await fetch(`${API_BASE_URL}/pedidos`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      usuario_id: payload.usuarioId,
      origem: "online",
      tipo_entrega: payload.checkout.tipoEntrega,
      forma_pagamento: payload.checkout.formaPagamento,
      endereco_entrega: payload.checkout.endereco
        ? `${payload.checkout.endereco.rua}, ${payload.checkout.endereco.numero} - ${payload.checkout.endereco.bairro}, ${payload.checkout.endereco.cidade} (${payload.checkout.endereco.cep})${payload.checkout.endereco.complemento ? " - " + payload.checkout.endereco.complemento : ""}`
        : null,
      itens: payload.itens.map((item) => ({
        produto_id: item.produtoId,
        quantidade: item.quantidade,
        preco_unitario_cobrado: item.precoUnitario,
        observacao: item.observacao ?? null,
      })),
    }),
  });
  if (!response.ok) {
    throw new Error("Não foi possível enviar o pedido.");
  }
  return response.json();
}

export const pedidoService = {
  enviar: USE_MOCK_BACKEND ? enviarPedidoMock : enviarPedidoApi,
};
