import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import ProductFormDialog from "./ProductFormDialog";
import type { Categoria, Produto } from "../../types";

const categorias: Categoria[] = [{ id: "c1", nome: "Lanches", ativa: true }];

const produto: Produto = {
  id: "p1",
  categoriaId: "c1",
  nome: "X-Burger",
  descricao: "Delicioso",
  preco: 20,
  precoPromocional: 15,
  imagemUrl: "https://picsum.photos/200",
  ativo: true,
};

describe("ProductFormDialog", () => {
  it("cria um produto novo com os dados preenchidos", async () => {
    const onSalvar = vi.fn();
    const user = userEvent.setup();
    render(
      <ProductFormDialog open categorias={categorias} produtoEmEdicao={null} onClose={vi.fn()} onSalvar={onSalvar} />
    );

    expect(screen.getByText("Novo produto")).toBeInTheDocument();

    await user.click(screen.getByLabelText("Categoria", { exact: false }));
    await user.click(screen.getByRole("option", { name: "Lanches" }));
    await user.type(screen.getByLabelText("Nome do produto", { exact: false }), "X-Salada");
    await user.type(screen.getByLabelText("Descrição", { exact: false }), "Pão e salada");
    await user.type(screen.getByLabelText("Preço (R$)", { exact: false }), "22.5");
    await user.type(screen.getByLabelText("Preço promocional", { exact: false }), "18");
    await user.type(screen.getByLabelText("URL da imagem", { exact: false }), "https://picsum.photos/1");
    await user.click(screen.getByRole("button", { name: "Salvar" }));

    expect(onSalvar).toHaveBeenCalledWith(
      expect.objectContaining({ categoriaId: "c1", nome: "X-Salada", preco: 22.5, precoPromocional: 18 }),
      null
    );
  });

  it("pré-preenche o formulário quando está editando um produto", () => {
    render(
      <ProductFormDialog open categorias={categorias} produtoEmEdicao={produto} onClose={vi.fn()} onSalvar={vi.fn()} />
    );

    expect(screen.getByText("Editar produto")).toBeInTheDocument();
    expect(screen.getByDisplayValue("X-Burger")).toBeInTheDocument();
    expect(screen.getByDisplayValue("20")).toBeInTheDocument();
  });

  it("editar e salvar chama onSalvar com o id existente", async () => {
    const onSalvar = vi.fn();
    const user = userEvent.setup();
    render(
      <ProductFormDialog open categorias={categorias} produtoEmEdicao={produto} onClose={vi.fn()} onSalvar={onSalvar} />
    );

    await user.click(screen.getByRole("button", { name: "Salvar" }));
    expect(onSalvar).toHaveBeenCalledWith(expect.anything(), "p1");
  });

  it("cancelar chama onClose", async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(
      <ProductFormDialog open categorias={categorias} produtoEmEdicao={null} onClose={onClose} onSalvar={vi.fn()} />
    );

    await user.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(onClose).toHaveBeenCalled();
  });
});
