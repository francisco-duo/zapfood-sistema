import { Routes, Route } from "react-router-dom";
import AppShell from "./components/layout/AppShell";
import MenuPage from "./pages/MenuPage";
import CartPage from "./pages/CartPage";
import CheckoutPage from "./pages/CheckoutPage";
import OrderConfirmedPage from "./pages/OrderConfirmedPage";
import AccountPage from "./pages/AccountPage";

export default function App() {
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
