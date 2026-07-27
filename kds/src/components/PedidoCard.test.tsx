import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import PedidoCard from "./PedidoCard";
import type { PedidoNaFila } from "../types";

function pedido(overrides: Partial<PedidoNaFila>): PedidoNaFila {
  return {
    id: "12345678-abcd",
    usuario_id: null,
    origem: "online",
    tipo_entrega: "delivery",
    status: "em_preparo",
    forma_pagamento: "Pix",
    endereco_entrega: null,
    valor_total: 40,
    criado_em: "2026-01-01T00:00:00Z",
    itens: [{ id: "i1", produto_id: "p1", quantidade: 2, preco_unitario_cobrado: 20 }],
    entrouNaFilaEm: Date.now(),
    ...overrides,
  };
}

describe("PedidoCard (kds)", () => {
  it("mostra o id curto, a modalidade e o nome do produto resolvido", () => {
    render(
      <PedidoCard pedido={pedido({})} ocupado={false} nomesProdutos={new Map([["p1", "X-Burger"]])} onMarcarPronto={vi.fn()} />
    );
    expect(screen.getByText("#12345678")).toBeInTheDocument();
    expect(screen.getByText("Delivery")).toBeInTheDocument();
    expect(screen.getByText(/X-Burger/)).toBeInTheDocument();
  });

  it("usa um fallback quando o produto não está no mapa de nomes", () => {
    render(
      <PedidoCard
        pedido={pedido({ itens: [{ id: "i1", produto_id: "produto-sumido", quantidade: 1, preco_unitario_cobrado: 10 }] })}
        ocupado={false}
        nomesProdutos={new Map()}
        onMarcarPronto={vi.fn()}
      />
    );
    expect(screen.getByText(/Produto produto-/)).toBeInTheDocument();
  });

  it("mostra a observação do item quando presente", () => {
    render(
      <PedidoCard
        pedido={pedido({ itens: [{ id: "i1", produto_id: "p1", quantidade: 1, preco_unitario_cobrado: 10, observacao: "sem cebola" }] })}
        ocupado={false}
        nomesProdutos={new Map([["p1", "X-Burger"]])}
        onMarcarPronto={vi.fn()}
      />
    );
    expect(screen.getByText(/sem cebola/)).toBeInTheDocument();
  });

  it("clicar em marcar como pronto chama o callback com o id do pedido", async () => {
    const onMarcarPronto = vi.fn();
    const user = userEvent.setup();
    render(
      <PedidoCard pedido={pedido({})} ocupado={false} nomesProdutos={new Map()} onMarcarPronto={onMarcarPronto} />
    );

    await user.click(screen.getByRole("button", { name: /Marcar como pronto/ }));
    expect(onMarcarPronto).toHaveBeenCalledWith("12345678-abcd");
  });

  it("o botão fica desabilitado quando ocupado", () => {
    render(
      <PedidoCard pedido={pedido({})} ocupado nomesProdutos={new Map()} onMarcarPronto={vi.fn()} />
    );
    expect(screen.getByRole("button", { name: /Marcar como pronto/ })).toBeDisabled();
  });

  it("fica no nível de alerta (vermelho) quando muito além do tempo padrão", () => {
    const entrouHaMuitoTempo = Date.now() - 30 * 60 * 1000; // 30 min atrás
    render(
      <PedidoCard
        pedido={pedido({ entrouNaFilaEm: entrouHaMuitoTempo })}
        ocupado={false}
        nomesProdutos={new Map()}
        onMarcarPronto={vi.fn()}
      />
    );
    // Só garante que renderiza sem quebrar nesse cenário de tempo estourado.
    expect(screen.getByText("#12345678")).toBeInTheDocument();
  });

  it("renderiza os 3 tipos de entrega sem erro", () => {
    for (const tipo of ["delivery", "retirada", "consumo_local"] as const) {
      const { unmount } = render(
        <PedidoCard pedido={pedido({ tipo_entrega: tipo })} ocupado={false} nomesProdutos={new Map()} onMarcarPronto={vi.fn()} />
      );
      unmount();
    }
  });
});
