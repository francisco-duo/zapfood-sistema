import { API_BASE_URL, USE_MOCK_BACKEND } from "./config";
import type { Usuario } from "../types";

interface Credenciais {
  email: string;
  senha: string;
}

interface DadosCadastro extends Credenciais {
  nome: string;
  telefone?: string;
}

const MOCK_USERS_KEY = "zapfood_mock_users";
const MOCK_SESSION_KEY = "zapfood_mock_session";

interface MockUserRecord extends Usuario {
  senha: string;
}

function lerUsuariosMock(): MockUserRecord[] {
  const raw = localStorage.getItem(MOCK_USERS_KEY);
  return raw ? JSON.parse(raw) : [];
}

function salvarUsuariosMock(usuarios: MockUserRecord[]): void {
  localStorage.setItem(MOCK_USERS_KEY, JSON.stringify(usuarios));
}

async function loginMock({ email, senha }: Credenciais): Promise<Usuario> {
  const usuarios = lerUsuariosMock();
  const encontrado = usuarios.find((u) => u.email === email && u.senha === senha);
  if (!encontrado) {
    throw new Error("E-mail ou senha inválidos.");
  }
  const { senha: _senha, ...usuario } = encontrado;
  localStorage.setItem(MOCK_SESSION_KEY, JSON.stringify(usuario));
  return usuario;
}

async function cadastrarMock(dados: DadosCadastro): Promise<Usuario> {
  const usuarios = lerUsuariosMock();
  if (usuarios.some((u) => u.email === dados.email)) {
    throw new Error("Este e-mail já está cadastrado.");
  }
  const novoUsuario: MockUserRecord = {
    id: crypto.randomUUID(),
    nome: dados.nome,
    email: dados.email,
    telefone: dados.telefone,
    perfil: "cliente",
    senha: dados.senha,
  };
  salvarUsuariosMock([...usuarios, novoUsuario]);
  const { senha: _senha, ...usuario } = novoUsuario;
  localStorage.setItem(MOCK_SESSION_KEY, JSON.stringify(usuario));
  return usuario;
}

function obterSessaoMock(): Usuario | null {
  const raw = localStorage.getItem(MOCK_SESSION_KEY);
  return raw ? JSON.parse(raw) : null;
}

function logoutMock(): void {
  localStorage.removeItem(MOCK_SESSION_KEY);
}

async function loginApi({ email, senha }: Credenciais): Promise<Usuario> {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, senha }),
  });
  if (!response.ok) {
    throw new Error("E-mail ou senha inválidos.");
  }
  return response.json();
}

async function cadastrarApi(dados: DadosCadastro): Promise<Usuario> {
  const response = await fetch(`${API_BASE_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...dados, perfil: "cliente" }),
  });
  if (!response.ok) {
    throw new Error("Não foi possível concluir o cadastro.");
  }
  return response.json();
}

export const authService = {
  login: USE_MOCK_BACKEND ? loginMock : loginApi,
  cadastrar: USE_MOCK_BACKEND ? cadastrarMock : cadastrarApi,
  obterSessao: USE_MOCK_BACKEND ? obterSessaoMock : () => null,
  logout: USE_MOCK_BACKEND ? logoutMock : () => undefined,
};
