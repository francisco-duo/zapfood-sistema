import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../services/pedidoService", () => ({
  pedidoService: {
    listar: vi.fn(),
    aprovar: vi.fn(),
    cancelar: vi.fn(),
    marcarPronto: vi.fn(),
    marcarSaiuParaEntrega: vi.fn(),
    finalizar: vi.fn(),
  },
}));
vi.mock("../services/catalogoService", () => ({
  catalogoService: { listarProdutos: vi.fn().mockResolvedValue([]) },
}));
vi.mock("../services/logService", () => ({ registrarLog: vi.fn() }));

import { pedidoService } from "../services/pedidoService";
import PedidosPage from "./PedidosPage";

function pedido(overrides: Record<string, unknown>) {
  return {
    id: "12345678-abcd",
    usuario_id: null,
    origem: "online",
    tipo_entrega: "retirada",
    status: "aguardando_aprovacao",
    forma_pagamento: "Pix",
    endereco_entrega: null,
    valor_total: 40,
    criado_em: "2026-01-01T00:00:00Z",
    itens: [],
    ...overrides,
  };
}

describe("PedidosPage", () => {
  beforeEach(() => vi.clearAllMocks());

  it("mostra os pedidos ativos carregados", async () => {
    (pedidoService.listar as ReturnType<typeof vi.fn>).mockResolvedValue([
      pedido({ id: "aaaaaaaa" }),
      pedido({ id: "bbbbbbbb", status: "finalizado" }),
    ]);
    render(<PedidosPage />);

    expect(await screen.findByText("#aaaaaaaa")).toBeInTheDocument();
    expect(screen.queryByText("#bbbbbbbb")).not.toBeInTheDocument();
  });

  it("mostra mensagem quando não há pedidos na aba", async () => {
    (pedidoService.listar as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    render(<PedidosPage />);
    expect(await screen.findByText("Nenhum pedido nesta visualização.")).toBeInTheDocument();
  });

  it("aba Todos mostra pedidos finalizados também", async () => {
    (pedidoService.listar as ReturnType<typeof vi.fn>).mockResolvedValue([
      pedido({ id: "bbbbbbbb", status: "finalizado" }),
    ]);
    const user = userEvent.setup();
    render(<PedidosPage />);

    await user.click(await screen.findByRole("tab", { name: "Todos" }));
    expect(await screen.findByText("#bbbbbbbb")).toBeInTheDocument();
  });

  it("mostra erro quando a listagem falha", async () => {
    (pedidoService.listar as ReturnType<typeof vi.fn>).mockRejectedValue(new Error("falhou"));
    render(<PedidosPage />);
    expect(await screen.findByText("Não foi possível carregar a fila de pedidos.")).toBeInTheDocument();
  });

  it("aceitar um pedido chama o service e recarrega a lista", async () => {
    (pedidoService.listar as ReturnType<typeof vi.fn>).mockResolvedValue([pedido({})]);
    (pedidoService.aprovar as ReturnType<typeof vi.fn>).mockResolvedValue(pedido({}));
    const user = userEvent.setup();
    render(<PedidosPage />);

    await user.click(await screen.findByRole("button", { name: "Aceitar" }));

    await waitFor(() => expect(pedidoService.aprovar).toHaveBeenCalledWith("12345678-abcd"));
    expect(await screen.findByText("Ação aplicada com sucesso.")).toBeInTheDocument();
  });

  it("mostra a mensagem de erro do service quando a ação falha", async () => {
    (pedidoService.listar as ReturnType<typeof vi.fn>).mockResolvedValue([pedido({})]);
    (pedidoService.aprovar as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error("Pedido não está aguardando aprovação.")
    );
    const user = userEvent.setup();
    render(<PedidosPage />);

    await user.click(await screen.findByRole("button", { name: "Aceitar" }));

    expect(await screen.findByText("Pedido não está aguardando aprovação.")).toBeInTheDocument();
  });

  it("cancelar, marcar pronto e finalizar chamam os services corretos", async () => {
    (pedidoService.listar as ReturnType<typeof vi.fn>).mockResolvedValue([
      pedido({ id: "cccccccc", status: "em_preparo" }),
    ]);
    (pedidoService.marcarPronto as ReturnType<typeof vi.fn>).mockResolvedValue(pedido({}));
    const user = userEvent.setup();
    render(<PedidosPage />);

    await user.click(await screen.findByRole("button", { name: "Marcar como pronto" }));
    await waitFor(() => expect(pedidoService.marcarPronto).toHaveBeenCalledWith("cccccccc"));
  });

  it("cancelar um pedido chama pedidoService.cancelar", async () => {
    (pedidoService.listar as ReturnType<typeof vi.fn>).mockResolvedValue([pedido({ id: "dddddddd" })]);
    (pedidoService.cancelar as ReturnType<typeof vi.fn>).mockResolvedValue(pedido({}));
    const user = userEvent.setup();
    render(<PedidosPage />);

    await user.click(await screen.findByRole("button", { name: "Cancelar" }));
    await waitFor(() => expect(pedidoService.cancelar).toHaveBeenCalledWith("dddddddd"));
  });

  it("saiu para entrega e finalizar chamam os services corretos", async () => {
    (pedidoService.listar as ReturnType<typeof vi.fn>).mockResolvedValue([
      pedido({ id: "eeeeeeee", status: "pronto_entrega", tipo_entrega: "delivery" }),
    ]);
    (pedidoService.marcarSaiuParaEntrega as ReturnType<typeof vi.fn>).mockResolvedValue(pedido({}));
    (pedidoService.finalizar as ReturnType<typeof vi.fn>).mockResolvedValue(pedido({}));
    const user = userEvent.setup();
    render(<PedidosPage />);

    await user.click(await screen.findByRole("button", { name: "Saiu para entrega" }));
    await waitFor(() => expect(pedidoService.marcarSaiuParaEntrega).toHaveBeenCalledWith("eeeeeeee"));

    await user.click(screen.getByRole("button", { name: "Finalizar" }));
    await waitFor(() => expect(pedidoService.finalizar).toHaveBeenCalledWith("eeeeeeee"));
  });
});
