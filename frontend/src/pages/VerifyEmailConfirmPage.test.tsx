import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../services/authService", () => ({
  authService: {
    obterSessao: vi.fn().mockReturnValue(null),
    verificarEmail: vi.fn(),
    login: vi.fn(),
    cadastrar: vi.fn(),
    logout: vi.fn(),
    me: vi.fn(),
  },
}));

import { authService } from "../services/authService";
import { AuthProvider } from "../context/AuthContext";
import VerifyEmailConfirmPage from "./VerifyEmailConfirmPage";

function renderPage(query = "?token=token-valido") {
  return render(
    <MemoryRouter initialEntries={[`/verificar-email${query}`]}>
      <AuthProvider>
        <Routes>
          <Route path="/verificar-email" element={<VerifyEmailConfirmPage />} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>
  );
}

describe("VerifyEmailConfirmPage", () => {
  beforeEach(() => vi.clearAllMocks());

  it("confirma o e-mail e mostra a mensagem de sucesso", async () => {
    (authService.verificarEmail as ReturnType<typeof vi.fn>).mockResolvedValue({
      mensagem: "E-mail confirmado com sucesso!",
    });
    renderPage();

    expect(screen.getByText("Confirmando seu e-mail...")).toBeInTheDocument();
    expect(await screen.findByText("E-mail confirmado!")).toBeInTheDocument();
    expect(screen.getByText("E-mail confirmado com sucesso!")).toBeInTheDocument();
  });

  it("mostra erro quando o token é inválido", async () => {
    (authService.verificarEmail as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error("Este link é inválido ou já expirou.")
    );
    renderPage();

    expect(await screen.findByText("Não foi possível confirmar")).toBeInTheDocument();
  });

  it("mostra erro quando não há token na URL", async () => {
    renderPage("");
    expect(await screen.findByText("Link de confirmação inválido.")).toBeInTheDocument();
  });
});
