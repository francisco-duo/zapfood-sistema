import { useCallback, useRef } from "react";

/**
 * RF012: sinal sonoro de curta duração a cada novo item na fila.
 * Gerado via Web Audio API — sem depender de nenhum arquivo de áudio externo.
 */
export function useBeep() {
  const contextoRef = useRef<AudioContext | null>(null);

  return useCallback(() => {
    try {
      if (!contextoRef.current) {
        contextoRef.current = new AudioContext();
      }
      const ctx = contextoRef.current;
      if (ctx.state === "suspended") {
        void ctx.resume();
      }

      const oscilador = ctx.createOscillator();
      const ganho = ctx.createGain();
      oscilador.type = "sine";
      oscilador.frequency.value = 880;
      ganho.gain.setValueAtTime(0.0001, ctx.currentTime);
      ganho.gain.exponentialRampToValueAtTime(0.35, ctx.currentTime + 0.02);
      ganho.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.35);

      oscilador.connect(ganho);
      ganho.connect(ctx.destination);
      oscilador.start();
      oscilador.stop(ctx.currentTime + 0.4);
    } catch {
      // Ambientes sem suporte a Web Audio (raro em tablets modernos) apenas ficam silenciosos.
    }
  }, []);
}
