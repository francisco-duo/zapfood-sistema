import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../services/authService", () => ({
  authService: { obterSessao: vi.fn(), login: vi.fn(), logout: vi.fn() },
}));

import { authService } from "../services/authService";
import { AuthProvider } from "../context/AuthContext";
import LoginPage from "./LoginPage";

function renderPage() {
  return render(
    <MemoryRouter initialEntries={["/login"]}>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<div>dashboard</div>} />
          <Route path="/esqueci-senha" element={<div>esqueci a senha</div>} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>
  );
}

describe("LoginPage (admin)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (authService.obterSessao as ReturnType<typeof vi.fn>).mockReturnValue(null);
  });

  it("faz login com sucesso", async () => {
    (authService.login as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "u1",
      nome: "Admin",
      email: "admin@zapfood.com",
      perfil: "admin",
    });
    const user = userEvent.setup();
    renderPage();

    await user.type(screen.getByLabelText("E-mail", { exact: false }), "admin@zapfood.com");
    await user.type(screen.getByLabelText("Senha", { exact: false }), "admin123");
    await user.click(screen.getByRole("button", { name: "Entrar" }));

    expect(await screen.findByText("dashboard")).toBeInTheDocument();
  });

  it("mostra erro quando o login falha", async () => {
    (authService.login as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error("E-mail ou senha inválidos.")
    );
    const user = userEvent.setup();
    renderPage();

    await user.type(screen.getByLabelText("E-mail", { exact: false }), "admin@zapfood.com");
    await user.type(screen.getByLabelText("Senha", { exact: false }), "errada");
    await user.click(screen.getByRole("button", { name: "Entrar" }));

    expect(await screen.findByText("E-mail ou senha inválidos.")).toBeInTheDocument();
  });

  it("já autenticado redireciona pro dashboard", () => {
    (authService.obterSessao as ReturnType<typeof vi.fn>).mockReturnValue({
      id: "u1",
      nome: "Admin",
      email: "admin@zapfood.com",
      perfil: "admin",
    });
    renderPage();
    expect(screen.getByText("dashboard")).toBeInTheDocument();
  });

  it("esqueci minha senha navega pra tela de recuperação", async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByText("Esqueci minha senha"));
    expect(screen.getByText("esqueci a senha")).toBeInTheDocument();
  });
});
