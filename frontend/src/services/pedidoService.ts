import { apiFetch, tratarResposta } from "./apiClient";
import type { DadosCheckout, ItemCarrinho } from "../types";

interface NovoPedidoPayload {
  itens: ItemCarrinho[];
  checkout: DadosCheckout;
  valorTotal: number;
}

interface PedidoConfirmado {
  id: string;
  status: string;
}

export const pedidoService = {
  async enviar(payload: NovoPedidoPayload): Promise<PedidoConfirmado> {
    const response = await apiFetch("/pedidos", {
      method: "POST",
      body: JSON.stringify({
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
    return tratarResposta(response, "Não foi possível enviar o pedido.");
  },
};
