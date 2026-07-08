import type { PerfilUsuario, Usuario } from "../types";

const SESSION_KEY = "zapfood_admin_session";

interface UsuarioAdminSeed extends Usuario {
  senha: string;
}

const USUARIOS_SEED: UsuarioAdminSeed[] = [
  {
    id: "admin-seed-1",
    nome: "Proprietário zapFood",
    email: "admin@zapfood.com",
    senha: "admin123",
    perfil: "admin",
  },
  {
    id: "funcionario-seed-1",
    nome: "Atendente Balcão",
    email: "balcao@zapfood.com",
    senha: "balcao123",
    perfil: "funcionario_balcao",
  },
];

const PERFIS_PERMITIDOS: PerfilUsuario[] = ["admin", "funcionario_balcao"];

export const authService = {
  async login(email: string, senha: string): Promise<Usuario> {
    const encontrado = USUARIOS_SEED.find((u) => u.email === email && u.senha === senha);
    if (!encontrado) {
      throw new Error("E-mail ou senha inválidos.");
    }
    if (!PERFIS_PERMITIDOS.includes(encontrado.perfil)) {
      throw new Error("Este usuário não tem acesso ao backoffice.");
    }
    const { senha: _senha, ...usuario } = encontrado;
    localStorage.setItem(SESSION_KEY, JSON.stringify(usuario));
    return usuario;
  },

  obterSessao(): Usuario | null {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  },

  logout(): void {
    localStorage.removeItem(SESSION_KEY);
  },
};
