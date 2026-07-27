import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../services/catalogoService", () => ({
  catalogoService: {
    listarProdutos: vi.fn(),
    listarCategorias: vi.fn(),
    criarProduto: vi.fn(),
    atualizarProduto: vi.fn(),
    alternarAtivo: vi.fn(),
  },
}));

import { catalogoService } from "../services/catalogoService";
import CardapioPage from "./CardapioPage";

const categorias = [{ id: "c1", nome: "Lanches", ativa: true }];
const produtos = [
  {
    id: "p1",
    categoriaId: "c1",
    nome: "X-Burger",
    descricao: "Pão, carne e queijo, delicioso do jeito que só o zapFood sabe fazer",
    preco: 20,
    precoPromocional: 15,
    imagemUrl: "url",
    ativo: true,
  },
];

describe("CardapioPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (catalogoService.listarProdutos as ReturnType<typeof vi.fn>).mockResolvedValue(produtos);
    (catalogoService.listarCategorias as ReturnType<typeof vi.fn>).mockResolvedValue(categorias);
  });

  it("lista os produtos com nome da categoria e preço promocional", async () => {
    render(<CardapioPage />);
    expect(await screen.findByText("X-Burger")).toBeInTheDocument();
    expect(screen.getByText("Lanches")).toBeInTheDocument();
    expect(screen.getByText("R$ 15,00")).toBeInTheDocument();
  });

  it("mostra erro quando o carregamento falha", async () => {
    (catalogoService.listarProdutos as ReturnType<typeof vi.fn>).mockRejectedValue(new Error("falhou"));
    render(<CardapioPage />);
    expect(await screen.findByText("Não foi possível carregar o cardápio.")).toBeInTheDocument();
  });

  it("alternar ativo desativa o produto e mostra a mensagem", async () => {
    (catalogoService.alternarAtivo as ReturnType<typeof vi.fn>).mockResolvedValue({ ...produtos[0], ativo: false });
    const user = userEvent.setup();
    render(<CardapioPage />);
    await screen.findByText("X-Burger");

    await user.click(screen.getByLabelText("Desativar"));

    expect(catalogoService.alternarAtivo).toHaveBeenCalledWith("p1");
    expect(await screen.findByText("Produto desativado.")).toBeInTheDocument();
  });

  it("criar um novo produto pelo diálogo", async () => {
    (catalogoService.criarProduto as ReturnType<typeof vi.fn>).mockResolvedValue({
      ...produtos[0],
      id: "p2",
      nome: "X-Salada",
    });
    const user = userEvent.setup();
    render(<CardapioPage />);
    await screen.findByText("X-Burger");

    await user.click(screen.getByRole("button", { name: "Novo produto" }));
    expect(screen.getByRole("heading", { name: "Novo produto" })).toBeInTheDocument();

    await user.click(screen.getByLabelText("Categoria", { exact: false }));
    await user.click(screen.getByRole("option", { name: "Lanches" }));
    await user.type(screen.getByLabelText("Nome do produto", { exact: false }), "X-Salada");
    await user.type(screen.getByLabelText("Descrição", { exact: false }), "Descrição");
    await user.type(screen.getByLabelText("Preço (R$)", { exact: false }), "18");
    await user.type(screen.getByLabelText("URL da imagem", { exact: false }), "url");
    await user.click(screen.getByRole("button", { name: "Salvar" }));

    expect(catalogoService.criarProduto).toHaveBeenCalled();
    expect(await screen.findByText("Produto criado.")).toBeInTheDocument();
  });

  it("reativa um produto inativo", async () => {
    (catalogoService.listarProdutos as ReturnType<typeof vi.fn>).mockResolvedValue([
      { ...produtos[0], ativo: false },
    ]);
    (catalogoService.alternarAtivo as ReturnType<typeof vi.fn>).mockResolvedValue({
      ...produtos[0],
      ativo: true,
    });
    const user = userEvent.setup();
    render(<CardapioPage />);
    await screen.findByText("X-Burger");

    await user.click(screen.getByLabelText("Reativar"));
    expect(await screen.findByText("Produto reativado.")).toBeInTheDocument();
  });

  it("mostra erro quando alternar o status do produto falha", async () => {
    (catalogoService.alternarAtivo as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error("Não foi possível alterar o status do produto.")
    );
    const user = userEvent.setup();
    render(<CardapioPage />);
    await screen.findByText("X-Burger");

    await user.click(screen.getByLabelText("Desativar"));
    expect(
      await screen.findByText("Não foi possível alterar o status do produto.")
    ).toBeInTheDocument();
  });

  it("mostra erro quando salvar o produto falha", async () => {
    (catalogoService.criarProduto as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error("Não foi possível criar o produto.")
    );
    const user = userEvent.setup();
    render(<CardapioPage />);
    await screen.findByText("X-Burger");

    await user.click(screen.getByRole("button", { name: "Novo produto" }));
    await user.click(screen.getByLabelText("Categoria", { exact: false }));
    await user.click(screen.getByRole("option", { name: "Lanches" }));
    await user.type(screen.getByLabelText("Nome do produto", { exact: false }), "X");
    await user.type(screen.getByLabelText("Descrição", { exact: false }), "d");
    await user.type(screen.getByLabelText("Preço (R$)", { exact: false }), "10");
    await user.type(screen.getByLabelText("URL da imagem", { exact: false }), "url");
    await user.click(screen.getByRole("button", { name: "Salvar" }));

    expect(await screen.findByText("Não foi possível criar o produto.")).toBeInTheDocument();
  });

  it("cancelar o diálogo de novo produto fecha sem salvar", async () => {
    const user = userEvent.setup();
    render(<CardapioPage />);
    await screen.findByText("X-Burger");

    await user.click(screen.getByRole("button", { name: "Novo produto" }));
    await user.click(screen.getByRole("button", { name: "Cancelar" }));

    await waitFor(() =>
      expect(screen.queryByRole("heading", { name: "Novo produto" })).not.toBeInTheDocument()
    );
    expect(catalogoService.criarProduto).not.toHaveBeenCalled();
  });

  it("editar um produto existente abre o formulário preenchido", async () => {
    const user = userEvent.setup();
    render(<CardapioPage />);
    await screen.findByText("X-Burger");

    await user.click(screen.getByLabelText("Editar"));
    expect(screen.getByText("Editar produto")).toBeInTheDocument();
  });
});
