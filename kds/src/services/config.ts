export const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8001/api/v1";
export const WS_URL = import.meta.env.VITE_WS_URL ?? "ws://localhost:8001/ws/kds";

/** RF012: tempo padrão de preparo, em minutos, usado para colorir o cronômetro. */
export const TEMPO_PADRAO_PREPARO_MINUTOS = Number(
  import.meta.env.VITE_TEMPO_PADRAO_PREPARO_MINUTOS ?? 15
);
