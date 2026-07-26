import { useAuth } from "./context/AuthContext";
import LoginPage from "./pages/LoginPage";
import KdsBoard from "./components/KdsBoard";

export default function App() {
  const { estaAutenticado } = useAuth();

  if (!estaAutenticado) {
    return <LoginPage />;
  }

  return <KdsBoard />;
}
