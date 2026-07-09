import { useEffect, useRef, useState } from "react";
import { WS_URL } from "../services/config";
import type { MensagemKds } from "../types";

const INTERVALO_RECONEXAO_MS = 2000;

/**
 * RF011/RNF001: canal WebSocket persistente com a cozinha — a tela nunca
 * precisa de F5. Se a conexão cair (rede, deploy, etc.), reconecta sozinha.
 */
export function useKdsSocket(onMensagem: (mensagem: MensagemKds) => void) {
  const [conectado, setConectado] = useState(false);
  const callbackRef = useRef(onMensagem);
  callbackRef.current = onMensagem;

  useEffect(() => {
    let socket: WebSocket | null = null;
    let timerReconexao: ReturnType<typeof setTimeout> | null = null;
    let desmontado = false;

    function conectar() {
      socket = new WebSocket(WS_URL);

      socket.onopen = () => setConectado(true);

      socket.onmessage = (event) => {
        try {
          const mensagem = JSON.parse(event.data) as MensagemKds;
          callbackRef.current(mensagem);
        } catch {
          // mensagem não reconhecida, ignora
        }
      };

      socket.onclose = () => {
        setConectado(false);
        if (!desmontado) {
          timerReconexao = setTimeout(conectar, INTERVALO_RECONEXAO_MS);
        }
      };

      socket.onerror = () => {
        socket?.close();
      };
    }

    conectar();

    return () => {
      desmontado = true;
      if (timerReconexao) clearTimeout(timerReconexao);
      socket?.close();
    };
  }, []);

  return { conectado };
}
