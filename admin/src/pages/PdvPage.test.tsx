import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../services/catalogoService", () => ({
  catalogoService: { listarProdutos: vi.fn() },
}));
vi.mock("../services/pedidoService", () => ({
  pedidoService: { criarVendaBalcao: vi.fn() },
}));
vi.mock("../services/logService", () => ({ registrarLog: vi.fn() }));
vi.mock("../utils/imprimirRecibo", () => ({ imprimirRecibo: vi.fn() }));

import { catalogoService } from "../services/catalogoService";
import { pedidoService } from "../services/pedidoService";
import { imprimirRecibo } from "../utils/imprimirRecibo";
import PdvPage from "./PdvPage";

const produtos = [
  { id: "p1", categoriaId: "c1", nome: "X-Burger", descricao: "d", preco: 20, imagemUrl: "url", ativo: true },
  { id: "p2", categoriaId: "c1", nome: "Inativo", descricao: "d", preco: 10, imagemUrl: "url", ativo: false },
];

describe("PdvPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (catalogoService.listarProdutos as ReturnType<typeof vi.fn>).mockResolvedValue(produtos);
  });

  it("mostra apenas produtos ativos e o carrinho vazio inicialmente", async () => {
    render(<PdvPage />);
    expect(await screen.findByText("X-Burger")).toBeInTheDocument();
    expect(screen.queryByText("Inativo")).not.toBeInTheDocument();
    expect(screen.getByText("Clique nos produtos ao lado para adicionar.")).toBeInTheDocument();
  });

  it("mostra erro quando o carregamento de produtos falha", async () => {
    (catalogoService.listarProdutos as ReturnType<typeof vi.fn>).mockRejectedValue(new Error("falhou"));
    render(<PdvPage />);
    expect(await screen.findByText("Não foi possível carregar os produtos.")).toBeInTheDocument();
  });

  it("clicar num produto adiciona à comanda e soma o total", async () => {
    const user = userEvent.setup();
    render(<PdvPage />);
    const cardProduto = await screen.findByText("X-Burger");
    await user.click(cardProduto);

    expect(screen.getAllByText("R$ 20,00").length).toBeGreaterThan(0);

    await user.click(cardProduto);
    // duas unidades agora: total 40 (aparece tanto no item quanto no resumo)
    expect(screen.getAllByText("R$ 40,00").length).toBeGreaterThan(0);
  });

  it("diminuir a quantidade até zero remove o item da comanda", async () => {
    const user = userEvent.setup();
    render(<PdvPage />);
    await user.click(await screen.findByText("X-Burger"));

    const botoesRemover = screen.getAllByRole("button").filter((b) => b.querySelector("svg[data-testid='RemoveRoundedIcon']"));
    await user.click(botoesRemover[0]);

    expect(screen.getByText("Clique nos produtos ao lado para adicionar.")).toBeInTheDocument();
  });

  it("finaliza a venda de consumo local e mostra o recibo", async () => {
    (pedidoService.criarVendaBalcao as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "pedido-123",
      status: "em_preparo",
    });
    const user = userEvent.setup();
    render(<PdvPage />);
    await user.click(await screen.findByText("X-Burger"));

    await user.click(screen.getByRole("button", { name: "Enviar para a cozinha" }));

    expect(await screen.findByText("Venda registrada!")).toBeInTheDocument();
    expect(pedidoService.criarVendaBalcao).toHaveBeenCalledWith(
      expect.objectContaining({ tipoEntrega: "consumo_local", enderecoEntrega: null })
    );
  });

  it("imprimir recibo chama o utilitário de impressão", async () => {
    (pedidoService.criarVendaBalcao as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "pedido-123",
      status: "em_preparo",
    });
    const user = userEvent.setup();
    render(<PdvPage />);
    await user.click(await screen.findByText("X-Burger"));
    await user.click(screen.getByRole("button", { name: "Enviar para a cozinha" }));
    await screen.findByText("Venda registrada!");

    await user.click(screen.getByRole("button", { name: "Imprimir recibo" }));
    expect(imprimirRecibo).toHaveBeenCalled();
  });

  it("delivery sem endereço preenchido bloqueia o envio", async () => {
    const user = userEvent.setup();
    render(<PdvPage />);
    await user.click(await screen.findByText("X-Burger"));

    await user.click(screen.getByLabelText("Modalidade", { exact: false }));
    await user.click(screen.getByRole("option", { name: "Delivery" }));
    await user.click(screen.getByRole("button", { name: "Enviar para a cozinha" }));

    expect(
      await screen.findByText("Preencha o endereço de entrega para vendas em delivery.")
    ).toBeInTheDocument();
    expect(pedidoService.criarVendaBalcao).not.toHaveBeenCalled();
  });

  it("delivery com endereço completo monta o texto formatado", async () => {
    (pedidoService.criarVendaBalcao as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "pedido-999",
      status: "em_preparo",
    });
    const user = userEvent.setup();
    render(<PdvPage />);
    await user.click(await screen.findByText("X-Burger"));

    await user.click(screen.getByLabelText("Modalidade", { exact: false }));
    await user.click(screen.getByRole("option", { name: "Delivery" }));

    await user.type(screen.getByLabelText("Rua", { exact: false }), "Rua A");
    await user.type(screen.getByLabelText("Número", { exact: false }), "10");
    await user.type(screen.getByLabelText("Bairro", { exact: false }), "Centro");
    await user.type(screen.getByLabelText("Cidade", { exact: false }), "SP");
    await user.click(screen.getByRole("button", { name: "Enviar para a cozinha" }));

    expect(pedidoService.criarVendaBalcao).toHaveBeenCalledWith(
      expect.objectContaining({ enderecoEntrega: expect.stringContaining("Rua A, 10 - Centro, SP") })
    );
  });

  it("fechar o diálogo de recibo sem imprimir", async () => {
    (pedidoService.criarVendaBalcao as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "pedido-123",
      status: "em_preparo",
    });
    const user = userEvent.setup();
    render(<PdvPage />);
    await user.click(await screen.findByText("X-Burger"));
    await user.click(screen.getByLabelText("Forma de pagamento", { exact: false }));
    await user.click(screen.getByRole("option", { name: "Pix" }));
    await user.click(screen.getByRole("button", { name: "Enviar para a cozinha" }));
    await screen.findByText("Venda registrada!");

    await user.click(screen.getByRole("button", { name: "Fechar" }));
    await waitFor(() => expect(screen.queryByText("Venda registrada!")).not.toBeInTheDocument());
  });

  it("mostra erro quando o registro da venda falha", async () => {
    (pedidoService.criarVendaBalcao as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error("Não foi possível registrar a venda.")
    );
    const user = userEvent.setup();
    render(<PdvPage />);
    await user.click(await screen.findByText("X-Burger"));
    await user.click(screen.getByRole("button", { name: "Enviar para a cozinha" }));

    expect(await screen.findByText("Não foi possível registrar a venda.")).toBeInTheDocument();
  });
});
