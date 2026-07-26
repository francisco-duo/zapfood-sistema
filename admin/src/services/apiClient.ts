import { API_BASE_URL } from "./config";
import { authStorage } from "./authStorage";

export async function apiFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const token = authStorage.obterToken();
  const headers = new Headers(options.headers);
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (options.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");

  const response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });
  if (response.status === 401) {
    authStorage.limpar();
  }
  return response;
}

export async function tratarResposta<T>(response: Response, mensagemErro: string): Promise<T> {
  if (!response.ok) {
    const corpo = await response.json().catch(() => null);
    throw new Error(corpo?.detail ?? mensagemErro);
  }
  return response.json();
}
