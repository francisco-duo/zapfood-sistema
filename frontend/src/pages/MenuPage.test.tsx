import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("../services/menuService", () => ({
  buscarCardapio: vi.fn(),
}));

import { buscarCardapio } from "../services/menuService";
import { CartProvider } from "../context/CartContext";
import MenuPage from "./MenuPage";

function renderPage() {
  return render(
    <CartProvider>
      <MenuPage />
    </CartProvider>
  );
}

describe("MenuPage", () => {
  it("mostra o cardápio carregado, com destaque pras promoções", async () => {
    (buscarCardapio as ReturnType<typeof vi.fn>).mockResolvedValue({
      categorias: [{ id: "c1", nome: "Lanches" }],
      produtos: [
        { id: "p1", categoriaId: "c1", nome: "X-Burger", descricao: "d", preco: 20, imagemUrl: "url" },
        {
          id: "p2",
          categoriaId: "c1",
          nome: "X-Salada",
          descricao: "d",
          preco: 25,
          precoPromocional: 19,
          imagemUrl: "url",
        },
      ],
    });

    renderPage();

    expect(await screen.findByText("Promoções em alta")).toBeInTheDocument();
    expect(screen.getByText("Lanches")).toBeInTheDocument();
    expect(screen.getAllByText("X-Salada")).toHaveLength(2); // aparece na seção de promoção e na categoria
  });

  it("mostra mensagem de erro quando a busca falha", async () => {
    (buscarCardapio as ReturnType<typeof vi.fn>).mockRejectedValue(new Error("falhou"));
    renderPage();
    expect(
      await screen.findByText("Não foi possível carregar o cardápio agora. Tente novamente em instantes.")
    ).toBeInTheDocument();
  });
});
