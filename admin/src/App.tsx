import { Routes, Route } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import PedidosPage from "./pages/PedidosPage";
import PdvPage from "./pages/PdvPage";
import CardapioPage from "./pages/CardapioPage";
import LogsPage from "./pages/LogsPage";
import UsuariosPage from "./pages/UsuariosPage";
import RequireAuth from "./components/layout/RequireAuth";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <RequireAuth somenteAdmin>
            <DashboardPage />
          </RequireAuth>
        }
      />
      <Route
        path="/pedidos"
        element={
          <RequireAuth>
            <PedidosPage />
          </RequireAuth>
        }
      />
      <Route
        path="/pdv"
        element={
          <RequireAuth>
            <PdvPage />
          </RequireAuth>
        }
      />
      <Route
        path="/cardapio"
        element={
          <RequireAuth somenteAdmin>
            <CardapioPage />
          </RequireAuth>
        }
      />
      <Route
        path="/logs"
        element={
          <RequireAuth somenteAdmin>
            <LogsPage />
          </RequireAuth>
        }
      />
      <Route
        path="/usuarios"
        element={
          <RequireAuth somenteAdmin>
            <UsuariosPage />
          </RequireAuth>
        }
      />
    </Routes>
  );
}
