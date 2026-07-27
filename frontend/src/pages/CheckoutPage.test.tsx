import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../services/authService", () => ({
  authService: {
    obterSessao: vi.fn(),
    login: vi.fn(),
    cadastrar: vi.fn(),
    logout: vi.fn(),
    me: vi.fn(),
  },
}));

vi.mock("../services/pedidoService", () => ({
  pedidoService: { enviar: vi.fn() },
}));

import { authService } from "../services/authService";
import { pedidoService } from "../services/pedidoService";
import { AuthProvider } from "../context/AuthContext";
import { CartProvider } from "../context/CartContext";
import CheckoutPage from "./CheckoutPage";

const CART_STORAGE_KEY = "zapfood_cart";
const usuario = {
  id: "u1",
  nome: "Ana",
  email: "ana@example.com",
  perfil: "cliente" as const,
  email_verificado: true,
};

function renderPage() {
  localStorage.setItem(
    CART_STORAGE_KEY,
    JSON.stringify([
      { produtoId: "p1", nome: "X-Burger", precoUnitario: 20, quantidade: 1, imagemUrl: "url" },
    ])
  );
  (authService.obterSessao as ReturnType<typeof vi.fn>).mockReturnValue(usuario);

  return render(
    <MemoryRouter initialEntries={["/checkout"]}>
      <AuthProvider>
        <CartProvider>
          <Routes>
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/pedido-confirmado" element={<div>pedido confirmado</div>} />
          </Routes>
        </CartProvider>
      </AuthProvider>
    </MemoryRouter>
  );
}

describe("CheckoutPage", () => {
  beforeEach(() => vi.clearAllMocks());

  it("envia o pedido de retirada (sem endereço) e navega pra confirmação", async () => {
    (pedidoService.enviar as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "pedido-1",
      status: "aguardando_aprovacao",
    });
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByLabelText("Retirar no local"));
    await user.click(screen.getByRole("button", { name: "Confirmar Pedido" }));

    expect(pedidoService.enviar).toHaveBeenCalled();
    expect(await screen.findByText("pedido confirmado")).toBeInTheDocument();
  });

  it("mostra erro quando o envio do pedido falha", async () => {
    (pedidoService.enviar as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error("Não foi possível enviar o pedido.")
    );
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByLabelText("Retirar no local"));
    await user.click(screen.getByRole("button", { name: "Confirmar Pedido" }));

    expect(await screen.findByText("Não foi possível enviar o pedido.")).toBeInTheDocument();
  });

  it("mostra os campos de endereço quando é delivery (padrão)", () => {
    renderPage();
    expect(screen.getByLabelText("CEP", { exact: false })).toBeInTheDocument();
  });

  it("envia o pedido de delivery com o endereço formatado", async () => {
    (pedidoService.enviar as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "pedido-1",
      status: "aguardando_aprovacao",
    });
    const user = userEvent.setup();
    renderPage();

    await user.type(screen.getByLabelText("CEP", { exact: false }), "12345-000");
    await user.type(screen.getByLabelText("Rua", { exact: false }), "Rua A");
    await user.type(screen.getByLabelText("Número", { exact: false }), "10");
    await user.type(screen.getByLabelText("Bairro", { exact: false }), "Centro");
    await user.type(screen.getByLabelText("Cidade", { exact: false }), "São Paulo");
    await user.type(screen.getByLabelText("Complemento (opcional)", { exact: false }), "Apto 1");
    await user.click(screen.getByRole("button", { name: "Confirmar Pedido" }));

    expect(pedidoService.enviar).toHaveBeenCalledWith(
      expect.objectContaining({
        checkout: expect.objectContaining({
          tipoEntrega: "delivery",
          endereco: expect.objectContaining({ cep: "12345-000", complemento: "Apto 1" }),
        }),
      })
    );
    expect(await screen.findByText("pedido confirmado")).toBeInTheDocument();
  });

  it("redireciona pro carrinho quando o usuário não está autenticado", () => {
    (authService.obterSessao as ReturnType<typeof vi.fn>).mockReturnValue(null);
    localStorage.setItem(
      CART_STORAGE_KEY,
      JSON.stringify([
        { produtoId: "p1", nome: "X-Burger", precoUnitario: 20, quantidade: 1, imagemUrl: "url" },
      ])
    );

    render(
      <MemoryRouter initialEntries={["/checkout"]}>
        <AuthProvider>
          <CartProvider>
            <Routes>
              <Route path="/checkout" element={<CheckoutPage />} />
              <Route path="/carrinho" element={<div>carrinho</div>} />
            </Routes>
          </CartProvider>
        </AuthProvider>
      </MemoryRouter>
    );

    expect(screen.getByText("carrinho")).toBeInTheDocument();
  });

  it("redireciona pro cardápio quando o carrinho está vazio", () => {
    (authService.obterSessao as ReturnType<typeof vi.fn>).mockReturnValue(usuario);
    localStorage.removeItem(CART_STORAGE_KEY);

    render(
      <MemoryRouter initialEntries={["/checkout"]}>
        <AuthProvider>
          <CartProvider>
            <Routes>
              <Route path="/checkout" element={<CheckoutPage />} />
              <Route path="/" element={<div>cardápio</div>} />
            </Routes>
          </CartProvider>
        </AuthProvider>
      </MemoryRouter>
    );

    expect(screen.getByText("cardápio")).toBeInTheDocument();
  });
});
