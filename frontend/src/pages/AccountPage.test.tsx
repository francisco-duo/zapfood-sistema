import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
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

import { authService } from "../services/authService";
import { AuthProvider } from "../context/AuthContext";
import AccountPage from "./AccountPage";

const usuario = {
  id: "u1",
  nome: "Ana Silva",
  email: "ana@example.com",
  perfil: "cliente" as const,
  email_verificado: true,
};

function renderPage() {
  return render(
    <MemoryRouter>
      <AuthProvider>
        <AccountPage />
      </AuthProvider>
    </MemoryRouter>
  );
}

describe("AccountPage", () => {
  beforeEach(() => vi.clearAllMocks());

  it("mostra convite pra entrar quando deslogado, e abre o diálogo ao clicar", async () => {
    (authService.obterSessao as ReturnType<typeof vi.fn>).mockReturnValue(null);
    const user = userEvent.setup();
    renderPage();

    expect(screen.getByText("Você ainda não entrou na sua conta")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Entrar ou criar conta" }));
    expect(screen.getByText("Identifique-se para continuar")).toBeInTheDocument();
  });

  it("mostra os dados da conta quando autenticado", () => {
    (authService.obterSessao as ReturnType<typeof vi.fn>).mockReturnValue(usuario);
    renderPage();

    expect(screen.getByText("Ana Silva")).toBeInTheDocument();
    expect(screen.getByText("ana@example.com")).toBeInTheDocument();
  });

  it("clicar em Sair desloga o usuário", async () => {
    (authService.obterSessao as ReturnType<typeof vi.fn>).mockReturnValue(usuario);
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole("button", { name: "Sair" }));

    expect(authService.logout).toHaveBeenCalled();
    expect(screen.getByText("Você ainda não entrou na sua conta")).toBeInTheDocument();
  });
});
