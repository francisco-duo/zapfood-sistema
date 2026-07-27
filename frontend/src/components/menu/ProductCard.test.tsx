import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import ProductCard from "./ProductCard";
import { CartProvider } from "../../context/CartContext";
import type { Produto } from "../../types";

const produto: Produto = {
  id: "p1",
  categoriaId: "c1",
  nome: "X-Burger",
  descricao: "Pão, carne e queijo",
  preco: 20,
  imagemUrl: "https://picsum.photos/200",
};

function renderComCarrinho() {
  return render(
    <CartProvider>
      <ProductCard produto={produto} />
    </CartProvider>
  );
}

describe("ProductCard", () => {
  it("mostra nome, descrição e preço do produto", () => {
    renderComCarrinho();
    expect(screen.getByText("X-Burger")).toBeInTheDocument();
    expect(screen.getByText("Pão, carne e queijo")).toBeInTheDocument();
    expect(screen.getByText("R$ 20,00")).toBeInTheDocument();
  });

  it("mostra o preço promocional riscado junto do normal quando em oferta", () => {
    render(
      <CartProvider>
        <ProductCard produto={{ ...produto, precoPromocional: 15 }} />
      </CartProvider>
    );
    expect(screen.getByText("R$ 15,00")).toBeInTheDocument();
    expect(screen.getByText("OFERTA")).toBeInTheDocument();
  });

  it("clicar em adicionar troca o botão pelo seletor de quantidade", async () => {
    const user = userEvent.setup();
    renderComCarrinho();

    await user.click(screen.getByLabelText("Adicionar X-Burger ao carrinho"));

    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByLabelText("Aumentar quantidade de X-Burger")).toBeInTheDocument();
  });

  it("aumentar e diminuir quantidade atualiza o contador exibido", async () => {
    const user = userEvent.setup();
    renderComCarrinho();

    await user.click(screen.getByLabelText("Adicionar X-Burger ao carrinho"));
    await user.click(screen.getByLabelText("Aumentar quantidade de X-Burger"));
    expect(screen.getByText("2")).toBeInTheDocument();

    await user.click(screen.getByLabelText("Diminuir quantidade de X-Burger"));
    expect(screen.getByText("1")).toBeInTheDocument();
  });
});
