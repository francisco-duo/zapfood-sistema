import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./services/authService", () => ({
  authService: { obterSessao: vi.fn(), login: vi.fn(), logout: vi.fn() },
}));
vi.mock("./services/metricsService", () => ({
  calcularMetricasDoDia: vi.fn().mockResolvedValue({
    faturamentoBruto: 0,
    ticketMedio: 0,
    totalPedidos: 0,
    rankingProdutos: [],
  }),
}));

import { authService } from "./services/authService";
import { AuthProvider } from "./context/AuthContext";
import App from "./App";

function renderApp(rota: string) {
  return render(
    <MemoryRouter initialEntries={[rota]}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </MemoryRouter>
  );
}

describe("App (admin)", () => {
  beforeEach(() => vi.clearAllMocks());

  it("visitante deslogado na raiz é redirecionado pro login", () => {
    (authService.obterSessao as ReturnType<typeof vi.fn>).mockReturnValue(null);
    renderApp("/");
    expect(screen.getByText("zapFood Backoffice")).toBeInTheDocument();
  });

  it("admin autenticado acessa o dashboard na raiz", async () => {
    (authService.obterSessao as ReturnType<typeof vi.fn>).mockReturnValue({
      id: "u1",
      nome: "Admin",
      email: "admin@zapfood.com",
      perfil: "admin",
    });
    renderApp("/");
    expect(await screen.findByText("Dashboard do dia")).toBeInTheDocument();
  });
});
