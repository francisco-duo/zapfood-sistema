import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../services/kdsService", () => ({ kdsService: { obterFilaAtual: vi.fn() } }));
vi.mock("../services/pedidoService", () => ({ pedidoService: { marcarPronto: vi.fn() } }));
vi.mock("../services/cardapioService", () => ({
  cardapioService: { listarProdutos: vi.fn().mockResolvedValue([]) },
}));
vi.mock("../hooks/useBeep", () => ({ useBeep: () => vi.fn() }));
vi.mock("../context/AuthContext", () => ({ useAuth: () => ({ logout: vi.fn() }) }));

let ultimoHandleMensagem: ((mensagem: unknown) => void) | null = null;
vi.mock("../hooks/useKdsSocket", () => ({
  useKdsSocket: (onMensagem: (mensagem: unknown) => void) => {
    ultimoHandleMensagem = onMensagem;
    return { conectado: true };
  },
}));

import { kdsService } from "../services/kdsService";
import { pedidoService } from "../services/pedidoService";
import KdsBoard from "./KdsBoard";

function pedido(overrides: Record<string, unknown>) {
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
    itens: [],
    ...overrides,
  };
}

describe("KdsBoard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    ultimoHandleMensagem = null;
  });

  it("mostra estado vazio quando não há pedidos na fila", async () => {
    (kdsService.obterFilaAtual as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    render(<KdsBoard />);
    expect(await screen.findByText("Nenhum pedido em preparo no momento.")).toBeInTheDocument();
    expect(screen.getByText("Ao vivo")).toBeInTheDocument();
  });

  it("mostra erro quando a fila inicial falha ao carregar", async () => {
    (kdsService.obterFilaAtual as ReturnType<typeof vi.fn>).mockRejectedValue(new Error("falhou"));
    render(<KdsBoard />);
    expect(await screen.findByText("Não foi possível carregar a fila da cozinha.")).toBeInTheDocument();
  });

  it("lista os pedidos carregados inicialmente", async () => {
    (kdsService.obterFilaAtual as ReturnType<typeof vi.fn>).mockResolvedValue([pedido({})]);
    render(<KdsBoard />);
    expect(await screen.findByText("#12345678")).toBeInTheDocument();
    expect(screen.getByText("1 pedido em andamento")).toBeInTheDocument();
  });

  it("recebe um novo pedido via WebSocket e adiciona à fila", async () => {
    (kdsService.obterFilaAtual as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    render(<KdsBoard />);
    await screen.findByText("Nenhum pedido em preparo no momento.");

    ultimoHandleMensagem?.({ tipo: "pedido_em_preparo", pedido: pedido({ id: "novoid12" }) });

    expect(await screen.findByText("#novoid12")).toBeInTheDocument();
  });

  it("ignora um pedido duplicado recebido via WebSocket", async () => {
    (kdsService.obterFilaAtual as ReturnType<typeof vi.fn>).mockResolvedValue([pedido({})]);
    render(<KdsBoard />);
    await screen.findByText("#12345678");

    ultimoHandleMensagem?.({ tipo: "pedido_em_preparo", pedido: pedido({}) });

    expect(screen.getAllByText("#12345678")).toHaveLength(1);
  });

  it("remove um pedido da fila quando recebe pedido_removido", async () => {
    (kdsService.obterFilaAtual as ReturnType<typeof vi.fn>).mockResolvedValue([pedido({})]);
    render(<KdsBoard />);
    await screen.findByText("#12345678");

    ultimoHandleMensagem?.({ tipo: "pedido_removido", pedido_id: "12345678-abcd" });

    expect(await screen.findByText("Nenhum pedido em preparo no momento.")).toBeInTheDocument();
  });

  it("marcar como pronto chama o service", async () => {
    (kdsService.obterFilaAtual as ReturnType<typeof vi.fn>).mockResolvedValue([pedido({})]);
    (pedidoService.marcarPronto as ReturnType<typeof vi.fn>).mockResolvedValue(pedido({}));
    const user = userEvent.setup();
    render(<KdsBoard />);
    await screen.findByText("#12345678");

    await user.click(screen.getByRole("button", { name: /Marcar como pronto/ }));
    expect(pedidoService.marcarPronto).toHaveBeenCalledWith("12345678-abcd");
  });

  it("mostra erro quando marcar como pronto falha", async () => {
    (kdsService.obterFilaAtual as ReturnType<typeof vi.fn>).mockResolvedValue([pedido({})]);
    (pedidoService.marcarPronto as ReturnType<typeof vi.fn>).mockRejectedValue(new Error("falhou"));
    const user = userEvent.setup();
    render(<KdsBoard />);
    await screen.findByText("#12345678");

    await user.click(screen.getByRole("button", { name: /Marcar como pronto/ }));
    expect(
      await screen.findByText("Não foi possível marcar o pedido como pronto. Tente novamente.")
    ).toBeInTheDocument();
  });
});
