import type { LogCategoria, LogEntry } from "../types";

const LOGS_KEY = "zapfood_admin_logs";
const MAX_LOGS = 500;

function ler(): LogEntry[] {
  const raw = localStorage.getItem(LOGS_KEY);
  return raw ? JSON.parse(raw) : [];
}

export function registrarLog(categoria: LogCategoria, mensagem: string, autor = "admin"): LogEntry {
  const entrada: LogEntry = {
    id: crypto.randomUUID(),
    categoria,
    mensagem,
    autor,
    criadoEm: new Date().toISOString(),
  };
  const logs = [entrada, ...ler()].slice(0, MAX_LOGS);
  localStorage.setItem(LOGS_KEY, JSON.stringify(logs));
  return entrada;
}

export const logService = {
  listar(): LogEntry[] {
    return ler().sort((a, b) => b.criadoEm.localeCompare(a.criadoEm));
  },
  registrar: registrarLog,
};
