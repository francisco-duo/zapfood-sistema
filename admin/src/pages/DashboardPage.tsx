import { useEffect, useState, type ReactNode } from "react";
import {
  Box,
  Grid,
  Paper,
  Typography,
  CircularProgress,
  Alert,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Chip,
} from "@mui/material";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import ReceiptIcon from "@mui/icons-material/Receipt";
import ShoppingBasketIcon from "@mui/icons-material/ShoppingBasket";
import { calcularMetricasDoDia } from "../services/metricsService";
import type { MetricasDia } from "../types";

const formatador = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

function CartaoMetrica({
  icone,
  titulo,
  valor,
}: {
  icone: ReactNode;
  titulo: string;
  valor: string;
}) {
  return (
    <Paper sx={{ p: 2.5, display: "flex", alignItems: "center", gap: 2 }}>
      <Box
        sx={{
          bgcolor: "primary.main",
          color: "primary.contrastText",
          borderRadius: 2,
          width: 48,
          height: 48,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {icone}
      </Box>
      <Box>
        <Typography variant="body2" color="text.secondary">
          {titulo}
        </Typography>
        <Typography variant="h5" fontWeight={700}>
          {valor}
        </Typography>
      </Box>
    </Paper>
  );
}

export default function DashboardPage() {
  const [metricas, setMetricas] = useState<MetricasDia | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    calcularMetricasDoDia()
      .then(setMetricas)
      .catch(() => setErro("Não foi possível carregar as métricas do dia."));
  }, []);

  if (erro) return <Alert severity="error">{erro}</Alert>;
  if (!metricas) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h1" sx={{ mb: 3 }}>
        Dashboard do dia
      </Typography>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <CartaoMetrica
            icone={<TrendingUpIcon />}
            titulo="Faturamento bruto"
            valor={formatador.format(metricas.faturamentoBruto)}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <CartaoMetrica
            icone={<ReceiptIcon />}
            titulo="Ticket médio"
            valor={formatador.format(metricas.ticketMedio)}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <CartaoMetrica
            icone={<ShoppingBasketIcon />}
            titulo="Pedidos válidos hoje"
            valor={String(metricas.totalPedidos)}
          />
        </Grid>
      </Grid>

      <Paper sx={{ p: 2.5 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Ranking de pratos mais vendidos
        </Typography>
        {metricas.rankingProdutos.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            Nenhum item vendido hoje ainda.
          </Typography>
        ) : (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>#</TableCell>
                <TableCell>Produto</TableCell>
                <TableCell align="right">Quantidade</TableCell>
                <TableCell align="right">Total gerado</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {metricas.rankingProdutos.map((item, index) => (
                <TableRow key={item.produtoId}>
                  <TableCell>
                    <Chip label={index + 1} size="small" color={index === 0 ? "secondary" : "default"} />
                  </TableCell>
                  <TableCell>{item.nome}</TableCell>
                  <TableCell align="right">{item.quantidade}</TableCell>
                  <TableCell align="right">{formatador.format(item.total)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Paper>
    </Box>
  );
}
