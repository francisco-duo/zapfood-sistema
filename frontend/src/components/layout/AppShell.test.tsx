import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

vi.mock("../../services/authService", () => ({
  authService: {
    obterSessao: vi.fn().mockReturnValue(null),
    login: vi.fn(),
    cadastrar: vi.fn(),
    logout: vi.fn(),
    me: vi.fn(),
  },
}));

import { AuthProvider } from "../../context/AuthContext";
import { CartProvider } from "../../context/CartContext";
import AppShell from "./AppShell";

function renderShell(rota = "/") {
  return render(
    <MemoryRouter initialEntries={[rota]}>
      <AuthProvider>
        <CartProvider>
          <Routes>
            <Route
              path="*"
              element={
                <AppShell>
                  <div>conteúdo da página</div>
                </AppShell>
              }
            />
          </Routes>
        </CartProvider>
      </AuthProvider>
    </MemoryRouter>
  );
}

describe("AppShell", () => {
  it("mostra a marca, o conteúdo e os itens de navegação", () => {
    renderShell();
    expect(screen.getByText("zapFood")).toBeInTheDocument();
    expect(screen.getByText("conteúdo da página")).toBeInTheDocument();
    expect(screen.getByText("Cardápio")).toBeInTheDocument();
    expect(screen.getByText("Carrinho")).toBeInTheDocument();
    expect(screen.getByText("Conta")).toBeInTheDocument();
  });

  it("clicar num item de navegação não quebra a renderização", async () => {
    const user = userEvent.setup();
    renderShell();
    await user.click(screen.getByText("Carrinho"));
    expect(screen.getByText("conteúdo da página")).toBeInTheDocument();
  });
});
