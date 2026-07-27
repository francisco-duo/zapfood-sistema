import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../services/authService", () => ({
  authService: { redefinirSenha: vi.fn() },
}));

import { authService } from "../services/authService";
import RedefinirSenhaPage from "./RedefinirSenhaPage";

function renderPage(query = "?token=token-valido") {
  return render(
    <MemoryRouter initialEntries={[`/redefinir-senha${query}`]}>
      <Routes>
        <Route path="/redefinir-senha" element={<RedefinirSenhaPage />} />
        <Route path="/login" element={<div>login</div>} />
      </Routes>
    </MemoryRouter>
  );
}

describe("RedefinirSenhaPage (admin)", () => {
  beforeEach(() => vi.clearAllMocks());

  it("redefine a senha com sucesso", async () => {
    (authService.redefinirSenha as ReturnType<typeof vi.fn>).mockResolvedValue({
      mensagem: "Senha redefinida com sucesso.",
    });
    const user = userEvent.setup();
    renderPage();

    await user.type(screen.getByLabelText(/^Nova senha/), "novaSenha123");
    await user.type(screen.getByLabelText(/^Confirmar nova senha/), "novaSenha123");
    await user.click(screen.getByRole("button", { name: "Redefinir senha" }));

    expect(authService.redefinirSenha).toHaveBeenCalledWith("token-valido", "novaSenha123");
    expect(await screen.findByText("Senha redefinida com sucesso.")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Ir para o login" }));
    expect(screen.getByText("login")).toBeInTheDocument();
  });

  it("mostra erro quando as senhas não coincidem", async () => {
    const user = userEvent.setup();
    renderPage();

    await user.type(screen.getByLabelText(/^Nova senha/), "novaSenha123");
    await user.type(screen.getByLabelText(/^Confirmar nova senha/), "outraSenha456");
    await user.click(screen.getByRole("button", { name: "Redefinir senha" }));

    expect(screen.getByText("As senhas não coincidem.")).toBeInTheDocument();
  });

  it("mostra erro quando não há token na URL", async () => {
    const user = userEvent.setup();
    renderPage("");

    await user.type(screen.getByLabelText(/^Nova senha/), "novaSenha123");
    await user.type(screen.getByLabelText(/^Confirmar nova senha/), "novaSenha123");
    await user.click(screen.getByRole("button", { name: "Redefinir senha" }));

    expect(screen.getByText("Link de redefinição inválido.")).toBeInTheDocument();
  });
});
