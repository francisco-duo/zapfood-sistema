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
  Avatar,
} from "@mui/material";
import TrendingUpRoundedIcon from "@mui/icons-material/TrendingUpRounded";
import ReceiptLongRoundedIcon from "@mui/icons-material/ReceiptLongRounded";
import ShoppingBasketRoundedIcon from "@mui/icons-material/ShoppingBasketRounded";
import EmojiEventsRoundedIcon from "@mui/icons-material/EmojiEventsRounded";
import { calcularMetricasDoDia } from "../services/metricsService";
import type { MetricasDia } from "../types";

const formatador = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

function CartaoMetrica({
  icone,
  titulo,
  valor,
  gradiente,
}: {
  icone: ReactNode;
  titulo: string;
  valor: string;
  gradiente: string;
}) {
  return (
    <Paper sx={{ p: 2.5, borderRadius: "18px", position: "relative", overflow: "hidden" }}>
      <Box
        sx={{
          position: "absolute",
          top: -20,
          right: -20,
          width: 90,
          height: 90,
          borderRadius: "50%",
          background: gradiente,
          opacity: 0.12,
        }}
      />
      <Box
        sx={{
          width: 46,
          height: 46,
          borderRadius: "14px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: gradiente,
          color: "#fff",
          mb: 1.5,
          boxShadow: "0 8px 18px -6px rgba(15,23,42,0.35)",
        }}
      >
        {icone}
      </Box>
      <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
        {titulo}
      </Typography>
      <Typography variant="h5" sx={{ letterSpacing: "-0.01em", fontWeight: 800 }}>
        {valor}
      </Typography>
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
      <Typography variant="h1" sx={{ mb: 0.5 }}>
        Dashboard do dia
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Indicadores consolidados de hoje, atualizados em tempo real.
      </Typography>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <CartaoMetrica
            icone={<TrendingUpRoundedIcon />}
            titulo="Faturamento bruto"
            valor={formatador.format(metricas.faturamentoBruto)}
            gradiente="linear-gradient(135deg, #34D399 0%, #059669 100%)"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <CartaoMetrica
            icone={<ReceiptLongRoundedIcon />}
            titulo="Ticket médio"
            valor={formatador.format(metricas.ticketMedio)}
            gradiente="linear-gradient(135deg, #60A5FA 0%, #2563EB 100%)"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <CartaoMetrica
            icone={<ShoppingBasketRoundedIcon />}
            titulo="Pedidos válidos hoje"
            valor={String(metricas.totalPedidos)}
            gradiente="linear-gradient(135deg, #FF8563 0%, #E23F1D 100%)"
          />
        </Grid>
      </Grid>

      <Paper sx={{ p: 2.5, borderRadius: "18px" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
          <EmojiEventsRoundedIcon sx={{ color: "#F5A524" }} />
          <Typography variant="h6">Ranking de pratos mais vendidos</Typography>
        </Box>
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
                    <Avatar
                      sx={{
                        width: 26,
                        height: 26,
                        fontSize: "0.75rem",
                        fontWeight: 800,
                        bgcolor: index === 0 ? "#F5A524" : "action.hover",
                        color: index === 0 ? "#fff" : "text.secondary",
                      }}
                    >
                      {index + 1}
                    </Avatar>
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>{item.nome}</TableCell>
                  <TableCell align="right">{item.quantidade}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>
                    {formatador.format(item.total)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Paper>
    </Box>
  );
}
