import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./services/authService", () => ({
  authService: {
    obterSessao: vi.fn(),
    login: vi.fn(),
    cadastrar: vi.fn(),
    logout: vi.fn(),
    me: vi.fn(),
    verificarEmail: vi.fn(),
  },
}));

vi.mock("./services/menuService", () => ({
  buscarCardapio: vi.fn().mockResolvedValue({ categorias: [], produtos: [] }),
}));

import { authService } from "./services/authService";
import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import App from "./App";

const clienteVerificado = {
  id: "u1",
  nome: "Ana",
  email: "ana@example.com",
  perfil: "cliente" as const,
  email_verificado: true,
};

const clienteNaoVerificado = { ...clienteVerificado, email_verificado: false };

function renderApp(rota: string) {
  return render(
    <MemoryRouter initialEntries={[rota]}>
      <AuthProvider>
        <CartProvider>
          <App />
        </CartProvider>
      </AuthProvider>
    </MemoryRouter>
  );
}

describe("App", () => {
  beforeEach(() => vi.clearAllMocks());

  it("cliente com e-mail nao verificado fica preso na tela de confirmacao", () => {
    (authService.obterSessao as ReturnType<typeof vi.fn>).mockReturnValue(clienteNaoVerificado);
    renderApp("/");
    expect(screen.getByText("Confirme seu e-mail")).toBeInTheDocument();
  });

  it("cliente verificado navega normalmente pro cardápio (dentro do AppShell)", () => {
    (authService.obterSessao as ReturnType<typeof vi.fn>).mockReturnValue(clienteVerificado);
    renderApp("/");
    expect(screen.getByText("zapFood")).toBeInTheDocument();
  });

  it("rotas públicas (esqueci-senha) ignoram o gate mesmo sem confirmar o e-mail", () => {
    (authService.obterSessao as ReturnType<typeof vi.fn>).mockReturnValue(clienteNaoVerificado);
    renderApp("/esqueci-senha");
    expect(screen.getByText("Esqueceu sua senha?")).toBeInTheDocument();
  });

  it("visitante deslogado acessa o cardápio normalmente", () => {
    (authService.obterSessao as ReturnType<typeof vi.fn>).mockReturnValue(null);
    renderApp("/");
    expect(screen.getByText("zapFood")).toBeInTheDocument();
  });
});
