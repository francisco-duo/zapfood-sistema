import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../services/authService", () => ({
  authService: {
    obterSessao: vi.fn(),
    reenviarVerificacao: vi.fn(),
    login: vi.fn(),
    cadastrar: vi.fn(),
    logout: vi.fn(),
    me: vi.fn(),
  },
}));

import { authService } from "../services/authService";
import { AuthProvider } from "../context/AuthContext";
import VerifyEmailPendingPage from "./VerifyEmailPendingPage";

const usuarioNaoVerificado = {
  id: "u1",
  nome: "Ana",
  email: "ana@example.com",
  perfil: "cliente" as const,
  email_verificado: false,
};

function renderPage() {
  (authService.obterSessao as ReturnType<typeof vi.fn>).mockReturnValue(usuarioNaoVerificado);
  return render(
    <MemoryRouter>
      <AuthProvider>
        <VerifyEmailPendingPage />
      </AuthProvider>
    </MemoryRouter>
  );
}

describe("VerifyEmailPendingPage", () => {
  beforeEach(() => vi.clearAllMocks());

  it("mostra o e-mail do usuário aguardando confirmação", () => {
    renderPage();
    expect(screen.getByText("ana@example.com")).toBeInTheDocument();
  });

  it("reenviar e-mail chama o service e mostra a mensagem retornada", async () => {
    (authService.reenviarVerificacao as ReturnType<typeof vi.fn>).mockResolvedValue({
      mensagem: "E-mail de confirmação reenviado.",
    });
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole("button", { name: "Reenviar e-mail de confirmação" }));

    expect(authService.reenviarVerificacao).toHaveBeenCalled();
    expect(await screen.findByText("E-mail de confirmação reenviado.")).toBeInTheDocument();
  });

  it("sair chama o logout", async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByRole("button", { name: "Sair" }));
    expect(authService.logout).toHaveBeenCalled();
  });
});
