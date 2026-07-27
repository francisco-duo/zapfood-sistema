import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../services/authService", () => ({
  authService: {
    obterSessao: vi.fn(),
    login: vi.fn(),
    logout: vi.fn(),
  },
}));

import { authService } from "../../services/authService";
import { AuthProvider } from "../../context/AuthContext";
import RequireAuth from "./RequireAuth";

const admin = { id: "u1", nome: "Admin", email: "admin@zapfood.com", perfil: "admin" as const };
const balcao = { id: "u2", nome: "Balcão", email: "balcao@zapfood.com", perfil: "funcionario_balcao" as const };

function renderRota(usuario: typeof admin | null, somenteAdmin: boolean) {
  (authService.obterSessao as ReturnType<typeof vi.fn>).mockReturnValue(usuario);
  return render(
    <MemoryRouter initialEntries={["/protegida"]}>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<div>tela de login</div>} />
          <Route path="/pedidos" element={<div>fila de pedidos</div>} />
          <Route
            path="/protegida"
            element={
              <RequireAuth somenteAdmin={somenteAdmin}>
                <div>conteúdo protegido</div>
              </RequireAuth>
            }
          />
        </Routes>
      </AuthProvider>
    </MemoryRouter>
  );
}

describe("RequireAuth", () => {
  beforeEach(() => vi.clearAllMocks());

  it("redireciona pro login quando deslogado", () => {
    renderRota(null, false);
    expect(screen.getByText("tela de login")).toBeInTheDocument();
  });

  it("mostra o conteúdo protegido quando autenticado", () => {
    renderRota(admin, false);
    expect(screen.getByText("conteúdo protegido")).toBeInTheDocument();
  });

  it("redireciona balcão pra fila de pedidos em rota só de admin", () => {
    renderRota(balcao, true);
    expect(screen.getByText("fila de pedidos")).toBeInTheDocument();
  });

  it("libera admin numa rota só de admin", () => {
    renderRota(admin, true);
    expect(screen.getByText("conteúdo protegido")).toBeInTheDocument();
  });
});
