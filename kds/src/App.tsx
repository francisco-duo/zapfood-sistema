import { useState } from "react";
import { useAuth } from "./context/AuthContext";
import LoginPage from "./pages/LoginPage";
import EsqueciSenhaPage from "./pages/EsqueciSenhaPage";
import RedefinirSenhaPage from "./pages/RedefinirSenhaPage";
import KdsBoard from "./components/KdsBoard";

type Tela = "login" | "esqueci-senha";

export default function App() {
  const { estaAutenticado } = useAuth();
  const [tela, setTela] = useState<Tela>("login");

  if (window.location.pathname === "/redefinir-senha") {
    return <RedefinirSenhaPage />;
  }

  if (!estaAutenticado) {
    if (tela === "esqueci-senha") {
      return <EsqueciSenhaPage onVoltar={() => setTela("login")} />;
    }
    return <LoginPage onEsqueciSenha={() => setTela("esqueci-senha")} />;
  }

  return <KdsBoard />;
}
