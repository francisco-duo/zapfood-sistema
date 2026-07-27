import { Routes, Route, useLocation } from "react-router-dom";
import AppShell from "./components/layout/AppShell";
import MenuPage from "./pages/MenuPage";
import CartPage from "./pages/CartPage";
import CheckoutPage from "./pages/CheckoutPage";
import OrderConfirmedPage from "./pages/OrderConfirmedPage";
import AccountPage from "./pages/AccountPage";
import VerifyEmailPendingPage from "./pages/VerifyEmailPendingPage";
import VerifyEmailConfirmPage from "./pages/VerifyEmailConfirmPage";
import EsqueciSenhaPage from "./pages/EsqueciSenhaPage";
import RedefinirSenhaPage from "./pages/RedefinirSenhaPage";
import { useAuth } from "./context/AuthContext";

const ROTAS_PUBLICAS_SEM_GATE = ["/verificar-email", "/esqueci-senha", "/redefinir-senha"];

export default function App() {
  const { usuario, estaAutenticado } = useAuth();
  const location = useLocation();

  if (ROTAS_PUBLICAS_SEM_GATE.includes(location.pathname)) {
    return (
      <Routes>
        <Route path="/verificar-email" element={<VerifyEmailConfirmPage />} />
        <Route path="/esqueci-senha" element={<EsqueciSenhaPage />} />
        <Route path="/redefinir-senha" element={<RedefinirSenhaPage />} />
      </Routes>
    );
  }

  const precisaConfirmarEmail =
    estaAutenticado && usuario?.perfil === "cliente" && !usuario.email_verificado;

  if (precisaConfirmarEmail) {
    return <VerifyEmailPendingPage />;
  }

  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<MenuPage />} />
        <Route path="/carrinho" element={<CartPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/pedido-confirmado" element={<OrderConfirmedPage />} />
        <Route path="/conta" element={<AccountPage />} />
      </Routes>
    </AppShell>
  );
}
