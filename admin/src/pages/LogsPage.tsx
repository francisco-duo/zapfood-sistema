import { useMemo, useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Chip,
  TextField,
  MenuItem,
  Stack,
  Button,
} from "@mui/material";
import { logService, registrarLog } from "../services/logService";
import type { LogCategoria } from "../types";

const ROTULO_CATEGORIA: Record<LogCategoria, string> = {
  preco: "Alteração de preço",
  catalogo: "Catálogo",
  pedido: "Pedido",
  loja: "Loja",
  erro_servidor: "Erro crítico do servidor",
};

const COR_CATEGORIA: Record<LogCategoria, "warning" | "info" | "success" | "default" | "error"> = {
  preco: "warning",
  catalogo: "info",
  pedido: "success",
  loja: "default",
  erro_servidor: "error",
};

export default function LogsPage() {
  const [versao, setVersao] = useState(0);
  const [filtro, setFiltro] = useState<LogCategoria | "todos">("todos");

  const logs = useMemo(() => {
    const todos = logService.listar();
    return filtro === "todos" ? todos : todos.filter((l) => l.categoria === filtro);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtro, versao]);

  function registrarAberturaLoja(abrir: boolean) {
    registrarLog("loja", abrir ? "Loja aberta para pedidos." : "Loja fechada para pedidos.");
    setVersao((v) => v + 1);
  }

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2, flexWrap: "wrap", gap: 2 }}>
        <Typography variant="h1">Auditoria de logs</Typography>
        <Stack direction="row" spacing={1}>
          <Button size="small" variant="outlined" onClick={() => registrarAberturaLoja(true)}>
            Registrar abertura da loja
          </Button>
          <Button size="small" variant="outlined" color="error" onClick={() => registrarAberturaLoja(false)}>
            Registrar fechamento
          </Button>
        </Stack>
      </Box>

      <TextField
        select
        label="Filtrar por categoria"
        value={filtro}
        onChange={(e) => setFiltro(e.target.value as LogCategoria | "todos")}
        size="small"
        sx={{ mb: 2, minWidth: 240 }}
      >
        <MenuItem value="todos">Todas as categorias</MenuItem>
        {Object.entries(ROTULO_CATEGORIA).map(([valor, rotulo]) => (
          <MenuItem key={valor} value={valor}>
            {rotulo}
          </MenuItem>
        ))}
      </TextField>

      <Paper sx={{ overflowX: "auto" }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Data/hora</TableCell>
              <TableCell>Categoria</TableCell>
              <TableCell>Mensagem</TableCell>
              <TableCell>Autor</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {logs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4}>
                  <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                    Nenhum registro encontrado.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell sx={{ whiteSpace: "nowrap" }}>
                    {new Date(log.criadoEm).toLocaleString("pt-BR")}
                  </TableCell>
                  <TableCell>
                    <Chip label={ROTULO_CATEGORIA[log.categoria]} color={COR_CATEGORIA[log.categoria]} size="small" />
                  </TableCell>
                  <TableCell>{log.mensagem}</TableCell>
                  <TableCell>{log.autor}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Paper>
    </Box>
  );
}
