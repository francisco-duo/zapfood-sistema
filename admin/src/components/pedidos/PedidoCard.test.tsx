import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import PedidoCard from "./PedidoCard";
import type { Pedido } from "../../types";

function pedido(overrides: Partial<Pedido>): Pedido {
  return {
    id: "12345678-abcd",
    usuario_id: null,
    origem: "online",
    tipo_entrega: "delivery",
    status: "aguardando_aprovacao",
    forma_pagamento: "Pix",
    endereco_entrega: "Rua A, 10",
    valor_total: 40,
    criado_em: "2026-01-01T00:00:00Z",
    itens: [{ id: "i1", produto_id: "p1", quantidade: 2, preco_unitario_cobrado: 20 }],
    ...overrides,
  };
}

const handlers = {
  onAceitar: vi.fn(),
  onCancelar: vi.fn(),
  onMarcarPronto: vi.fn(),
  onSaiuParaEntrega: vi.fn(),
  onFinalizar: vi.fn(),
};

function renderCard(p: Pedido, ocupado = false) {
  return render(
    <PedidoCard pedido={p} ocupado={ocupado} nomesProdutos={new Map([["p1", "X-Burger"]])} {...handlers} />
  );
}

describe("PedidoCard", () => {
  it("mostra o nome do produto resolvido e o endereço quando é delivery", () => {
    renderCard(pedido({}));
    expect(screen.getByText(/X-Burger/)).toBeInTheDocument();
    expect(screen.getByText("Rua A, 10")).toBeInTheDocument();
  });

  it("usa um fallback quando o produto não está no mapa de nomes", () => {
    render(
      <PedidoCard
        pedido={pedido({ itens: [{ id: "i1", produto_id: "produto-desconhecido", quantidade: 1, preco_unitario_cobrado: 10 }] })}
        ocupado={false}
        nomesProdutos={new Map()}
        {...handlers}
      />
    );
    expect(screen.getByText(/Produto produto-/)).toBeInTheDocument();
  });

  it("aguardando_aprovacao mostra os botões Aceitar e Cancelar", async () => {
    const user = userEvent.setup();
    renderCard(pedido({ status: "aguardando_aprovacao" }));

    await user.click(screen.getByRole("button", { name: "Aceitar" }));
    expect(handlers.onAceitar).toHaveBeenCalledWith("12345678-abcd");

    await user.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(handlers.onCancelar).toHaveBeenCalledWith("12345678-abcd");
  });

  it("em_preparo mostra o botão Marcar como pronto", async () => {
    const user = userEvent.setup();
    renderCard(pedido({ status: "em_preparo" }));
    await user.click(screen.getByRole("button", { name: "Marcar como pronto" }));
    expect(handlers.onMarcarPronto).toHaveBeenCalledWith("12345678-abcd");
  });

  it("pronto_entrega mostra Saiu para entrega e Finalizar", async () => {
    const user = userEvent.setup();
    renderCard(pedido({ status: "pronto_entrega" }));

    await user.click(screen.getByRole("button", { name: "Saiu para entrega" }));
    expect(handlers.onSaiuParaEntrega).toHaveBeenCalledWith("12345678-abcd");

    await user.click(screen.getByRole("button", { name: "Finalizar" }));
    expect(handlers.onFinalizar).toHaveBeenCalledWith("12345678-abcd");
  });

  it("pronto_retirada só mostra Finalizar (sem endereço, sem saiu-para-entrega)", () => {
    renderCard(pedido({ status: "pronto_retirada", tipo_entrega: "retirada", endereco_entrega: null }));
    expect(screen.getByRole("button", { name: "Finalizar" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Saiu para entrega" })).not.toBeInTheDocument();
  });

  it("botões ficam desabilitados quando ocupado", () => {
    renderCard(pedido({ status: "aguardando_aprovacao" }), true);
    expect(screen.getByRole("button", { name: "Aceitar" })).toBeDisabled();
  });

  it("finalizado não mostra nenhum botão de ação", () => {
    renderCard(pedido({ status: "finalizado" }));
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
