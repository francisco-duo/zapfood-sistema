import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../services/usuarioService", () => ({
  usuarioService: { listar: vi.fn(), criar: vi.fn() },
}));

import { usuarioService } from "../services/usuarioService";
import UsuariosPage from "./UsuariosPage";

const usuarios = [
  { id: "u1", nome: "Admin", email: "admin@zapfood.com", perfil: "admin", criado_em: "2026-01-01T00:00:00Z" },
];

describe("UsuariosPage", () => {
  beforeEach(() => vi.clearAllMocks());

  it("lista os usuários carregados", async () => {
    (usuarioService.listar as ReturnType<typeof vi.fn>).mockResolvedValue(usuarios);
    render(<UsuariosPage />);
    expect(await screen.findByText("Admin")).toBeInTheDocument();
    expect(screen.getByText("Administrador")).toBeInTheDocument();
  });

  it("mostra erro quando a listagem falha", async () => {
    (usuarioService.listar as ReturnType<typeof vi.fn>).mockRejectedValue(new Error("falhou"));
    render(<UsuariosPage />);
    expect(await screen.findByText("Não foi possível carregar os usuários.")).toBeInTheDocument();
  });

  it("cria um novo usuário pelo diálogo", async () => {
    (usuarioService.listar as ReturnType<typeof vi.fn>).mockResolvedValue(usuarios);
    (usuarioService.criar as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "u2",
      nome: "João",
      email: "joao@zapfood.com",
      perfil: "cozinha",
      criado_em: "2026-01-01T00:00:00Z",
    });
    const user = userEvent.setup();
    render(<UsuariosPage />);
    await screen.findByText("Admin");

    await user.click(screen.getByRole("button", { name: "Novo usuário" }));
    await user.type(screen.getByLabelText("Nome completo", { exact: false }), "João");
    await user.type(screen.getByLabelText("E-mail", { exact: false }), "joao@zapfood.com");
    await user.type(screen.getByLabelText("Senha", { exact: false }), "senha12345");
    await user.click(screen.getByRole("button", { name: "Criar usuário" }));

    expect(usuarioService.criar).toHaveBeenCalledWith(
      expect.objectContaining({ nome: "João", email: "joao@zapfood.com", perfil: "funcionario_balcao" })
    );
    expect(await screen.findByText('Usuário "João" criado com sucesso.')).toBeInTheDocument();
  });

  it("mostra erro quando a criação do usuário falha", async () => {
    (usuarioService.listar as ReturnType<typeof vi.fn>).mockResolvedValue(usuarios);
    (usuarioService.criar as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error("Não foi possível criar o usuário.")
    );
    const user = userEvent.setup();
    render(<UsuariosPage />);
    await screen.findByText("Admin");

    await user.click(screen.getByRole("button", { name: "Novo usuário" }));
    await user.type(screen.getByLabelText("Nome completo", { exact: false }), "João");
    await user.type(screen.getByLabelText("E-mail", { exact: false }), "joao@zapfood.com");
    await user.type(screen.getByLabelText("Senha", { exact: false }), "senha12345");
    await user.click(screen.getByLabelText("Perfil", { exact: false }));
    await user.click(screen.getByRole("option", { name: "Cozinha" }));
    await user.click(screen.getByRole("button", { name: "Criar usuário" }));

    expect(await screen.findByText("Não foi possível criar o usuário.")).toBeInTheDocument();
  });

  it("cancelar fecha o diálogo sem criar usuário", async () => {
    (usuarioService.listar as ReturnType<typeof vi.fn>).mockResolvedValue(usuarios);
    const user = userEvent.setup();
    render(<UsuariosPage />);
    await screen.findByText("Admin");

    await user.click(screen.getByRole("button", { name: "Novo usuário" }));
    await user.click(screen.getByRole("button", { name: "Cancelar" }));

    expect(usuarioService.criar).not.toHaveBeenCalled();
  });
});
