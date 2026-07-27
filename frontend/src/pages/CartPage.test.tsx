import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../services/authService", () => ({
  authService: {
    obterSessao: vi.fn().mockReturnValue(null),
    login: vi.fn(),
    cadastrar: vi.fn(),
    logout: vi.fn(),
    me: vi.fn(),
  },
}));

import { AuthProvider } from "../context/AuthContext";
import { CartProvider } from "../context/CartContext";
import CartPage from "./CartPage";

const CART_STORAGE_KEY = "zapfood_cart";

function preencherCarrinho() {
  localStorage.setItem(
    CART_STORAGE_KEY,
    JSON.stringify([
      { produtoId: "p1", nome: "X-Burger", precoUnitario: 20, quantidade: 2, imagemUrl: "url" },
    ])
  );
}

function renderPage() {
  return render(
    <MemoryRouter initialEntries={["/carrinho"]}>
      <AuthProvider>
        <CartProvider>
          <Routes>
            <Route path="/carrinho" element={<CartPage />} />
            <Route path="/" element={<div>página do cardápio</div>} />
          </Routes>
        </CartProvider>
      </AuthProvider>
    </MemoryRouter>
  );
}

describe("CartPage", () => {
  beforeEach(() => vi.clearAllMocks());

  it("mostra o estado vazio quando não há itens", () => {
    renderPage();
    expect(screen.getByText("Seu carrinho está vazio")).toBeInTheDocument();
  });

  it("lista os itens do carrinho e o total", () => {
    preencherCarrinho();
    renderPage();

    expect(screen.getByText("X-Burger")).toBeInTheDocument();
    expect(screen.getByText("R$ 40,00")).toBeInTheDocument();
  });

  it("aumentar a quantidade atualiza o total", async () => {
    preencherCarrinho();
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByLabelText("Aumentar quantidade de X-Burger"));
    expect(screen.getByText("R$ 60,00")).toBeInTheDocument();
  });

  it("remover o item volta pro estado vazio", async () => {
    preencherCarrinho();
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByLabelText("Remover X-Burger do carrinho"));
    expect(screen.getByText("Seu carrinho está vazio")).toBeInTheDocument();
  });

  it("finalizar pedido sem estar logado abre o diálogo de login", async () => {
    preencherCarrinho();
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole("button", { name: "Finalizar Pedido" }));
    expect(screen.getByText("Identifique-se para continuar")).toBeInTheDocument();
  });

  it("diminuir a quantidade reduz o total", async () => {
    localStorage.setItem(
      CART_STORAGE_KEY,
      JSON.stringify([
        { produtoId: "p1", nome: "X-Burger", precoUnitario: 20, quantidade: 2, imagemUrl: "url" },
      ])
    );
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByLabelText("Diminuir quantidade de X-Burger"));
    expect(screen.getByText("R$ 20,00")).toBeInTheDocument();
  });

  it("ver cardápio no estado vazio navega pra home", async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByRole("button", { name: "Ver cardápio" }));
    expect(screen.getByText("página do cardápio")).toBeInTheDocument();
  });
});
