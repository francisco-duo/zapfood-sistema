import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../services/authService", () => ({
  authService: { esqueciSenha: vi.fn() },
}));

import { authService } from "../services/authService";
import EsqueciSenhaPage from "./EsqueciSenhaPage";

function renderPage() {
  return render(
    <MemoryRouter initialEntries={["/esqueci-senha"]}>
      <Routes>
        <Route path="/esqueci-senha" element={<EsqueciSenhaPage />} />
        <Route path="/" element={<div>home</div>} />
      </Routes>
    </MemoryRouter>
  );
}

describe("EsqueciSenhaPage", () => {
  beforeEach(() => vi.clearAllMocks());

  it("envia o e-mail e mostra a mensagem de sucesso", async () => {
    (authService.esqueciSenha as ReturnType<typeof vi.fn>).mockResolvedValue({
      mensagem: "Enviamos um e-mail com as instruções.",
    });
    const user = userEvent.setup();
    renderPage();

    await user.type(screen.getByLabelText("E-mail cadastrado", { exact: false }), "ana@example.com");
    await user.click(screen.getByRole("button", { name: "Enviar link de redefinição" }));

    expect(authService.esqueciSenha).toHaveBeenCalledWith("ana@example.com");
    expect(await screen.findByText("Enviamos um e-mail com as instruções.")).toBeInTheDocument();
  });

  it("mostra erro quando o e-mail não está cadastrado", async () => {
    (authService.esqueciSenha as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error("Este e-mail ainda não foi cadastrado.")
    );
    const user = userEvent.setup();
    renderPage();

    await user.type(screen.getByLabelText("E-mail cadastrado", { exact: false }), "fantasma@example.com");
    await user.click(screen.getByRole("button", { name: "Enviar link de redefinição" }));

    expect(await screen.findByText("Este e-mail ainda não foi cadastrado.")).toBeInTheDocument();
  });

  it("voltar navega pra home", async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByRole("button", { name: "Voltar" }));
    expect(screen.getByText("home")).toBeInTheDocument();
  });
});
