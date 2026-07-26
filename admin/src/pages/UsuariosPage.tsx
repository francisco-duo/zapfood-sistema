import { useEffect, useState, type FormEvent } from "react";
import {
  Box,
  Typography,
  Button,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Chip,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack,
  TextField,
  MenuItem,
  Snackbar,
  Alert,
  CircularProgress,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import { usuarioService } from "../services/usuarioService";
import type { PerfilUsuario } from "../types";

interface UsuarioLinha {
  id: string;
  nome: string;
  email: string;
  perfil: PerfilUsuario;
  criado_em: string;
}

const ROTULO_PERFIL: Record<PerfilUsuario, string> = {
  admin: "Administrador",
  funcionario_balcao: "Balcão",
  cozinha: "Cozinha",
  cliente: "Cliente",
};

const COR_PERFIL: Record<PerfilUsuario, "primary" | "secondary" | "warning" | "default"> = {
  admin: "primary",
  funcionario_balcao: "secondary",
  cozinha: "warning",
  cliente: "default",
};

const FORM_VAZIO = { nome: "", email: "", senha: "", perfil: "funcionario_balcao" as PerfilUsuario };

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<UsuarioLinha[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [dialogAberto, setDialogAberto] = useState(false);
  const [form, setForm] = useState(FORM_VAZIO);
  const [mensagem, setMensagem] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  async function carregar() {
    try {
      const lista = await usuarioService.listar();
      setUsuarios(lista);
    } catch {
      setErro("Não foi possível carregar os usuários.");
    }
  }

  useEffect(() => {
    carregar();
  }, []);

  function abrirNovo() {
    setForm(FORM_VAZIO);
    setDialogAberto(true);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSalvando(true);
    try {
      await usuarioService.criar(form);
      setMensagem(`Usuário "${form.nome}" criado com sucesso.`);
      setDialogAberto(false);
      await carregar();
    } catch (err) {
      setMensagem(err instanceof Error ? err.message : "Não foi possível criar o usuário.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
        <Typography variant="h1">Usuários do sistema</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={abrirNovo}>
          Novo usuário
        </Button>
      </Box>

      {erro && <Alert severity="error" sx={{ mb: 2 }}>{erro}</Alert>}

      {usuarios === null ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Paper sx={{ overflowX: "auto" }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Nome</TableCell>
                <TableCell>E-mail</TableCell>
                <TableCell>Perfil</TableCell>
                <TableCell>Criado em</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {usuarios.map((usuario) => (
                <TableRow key={usuario.id}>
                  <TableCell>{usuario.nome}</TableCell>
                  <TableCell>{usuario.email}</TableCell>
                  <TableCell>
                    <Chip label={ROTULO_PERFIL[usuario.perfil]} color={COR_PERFIL[usuario.perfil]} size="small" />
                  </TableCell>
                  <TableCell>{new Date(usuario.criado_em).toLocaleDateString("pt-BR")}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
      )}

      <Dialog open={dialogAberto} onClose={() => setDialogAberto(false)} fullWidth maxWidth="xs">
        <DialogTitle>Novo usuário de gestão</DialogTitle>
        <DialogContent>
          <Stack component="form" id="usuario-form" spacing={2} onSubmit={handleSubmit} sx={{ pt: 1 }}>
            <TextField
              label="Nome completo"
              value={form.nome}
              onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
              required
              fullWidth
            />
            <TextField
              label="E-mail"
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              required
              fullWidth
            />
            <TextField
              label="Senha"
              type="password"
              value={form.senha}
              onChange={(e) => setForm((f) => ({ ...f, senha: e.target.value }))}
              required
              fullWidth
              slotProps={{ htmlInput: { minLength: 8 } }}
              helperText="Mínimo de 8 caracteres"
            />
            <TextField
              select
              label="Perfil"
              value={form.perfil}
              onChange={(e) => setForm((f) => ({ ...f, perfil: e.target.value as PerfilUsuario }))}
              required
              fullWidth
            >
              <MenuItem value="admin">Administrador</MenuItem>
              <MenuItem value="funcionario_balcao">Funcionário de balcão</MenuItem>
              <MenuItem value="cozinha">Cozinha</MenuItem>
            </TextField>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDialogAberto(false)}>Cancelar</Button>
          <Button type="submit" form="usuario-form" variant="contained" disabled={salvando}>
            {salvando ? "Salvando..." : "Criar usuário"}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={!!mensagem} autoHideDuration={3000} onClose={() => setMensagem(null)} message={mensagem} />
    </Box>
  );
}
