import { useEffect, useState } from "react";

/** Segundos decorridos desde `iniciadoEm`, atualizado a cada segundo. */
export function useCronometro(iniciadoEm: number): number {
  const [segundos, setSegundos] = useState(() => Math.floor((Date.now() - iniciadoEm) / 1000));

  useEffect(() => {
    const intervalo = setInterval(() => {
      setSegundos(Math.floor((Date.now() - iniciadoEm) / 1000));
    }, 1000);
    return () => clearInterval(intervalo);
  }, [iniciadoEm]);

  return segundos;
}

export function formatarTempo(segundosTotais: number): string {
  const minutos = Math.floor(segundosTotais / 60);
  const segundos = segundosTotais % 60;
  return `${String(minutos).padStart(2, "0")}:${String(segundos).padStart(2, "0")}`;
}
