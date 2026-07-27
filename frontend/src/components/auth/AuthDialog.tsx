import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Tab,
  Tabs,
  TextField,
  Button,
  Stack,
  Alert,
  Link,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { useAuth } from "../../context/AuthContext";

interface AuthDialogProps {
  open: boolean;
  onClose: () => void;
  onSucesso: () => void;
}

export default function AuthDialog({ open, onClose, onSucesso }: AuthDialogProps) {
  const [aba, setAba] = useState<"login" | "cadastro">("login");
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);
  const { login, cadastrar } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");

  function limparCampos() {
    setEmail("");
    setSenha("");
    setNome("");
    setTelefone("");
    setErro(null);
  }

  function handleClose() {
    limparCampos();
    onClose();
  }

  function handleEsqueciSenha() {
    handleClose();
    navigate("/esqueci-senha");
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setErro(null);
    setCarregando(true);
    try {
      if (aba === "login") {
        await login(email, senha);
      } else {
        await cadastrar(nome, email, senha, telefone || undefined);
      }
      limparCampos();
      onSucesso();
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Ocorreu um erro inesperado.");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="xs">
      <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        Identifique-se para continuar
        <IconButton onClick={handleClose} size="small" aria-label="Fechar">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <Tabs
        value={aba}
        onChange={(_, valor) => {
          setAba(valor);
          setErro(null);
        }}
        variant="fullWidth"
      >
        <Tab label="Entrar" value="login" />
        <Tab label="Criar conta" value="cadastro" />
      </Tabs>
      <DialogContent>
        <Stack component="form" spacing={2} onSubmit={handleSubmit} sx={{ pt: 1 }}>
          {erro && <Alert severity="error">{erro}</Alert>}
          {aba === "cadastro" && (
            <TextField
              label="Nome completo"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              required
              fullWidth
            />
          )}
          <TextField
            label="E-mail"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            fullWidth
          />
          <TextField
            label="Senha"
            type="password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            required
            fullWidth
            slotProps={{ htmlInput: { minLength: 8 } }}
            helperText={aba === "cadastro" ? "Mínimo de 8 caracteres" : undefined}
          />
          {aba === "cadastro" && (
            <TextField
              label="Telefone (opcional)"
              value={telefone}
              onChange={(e) => setTelefone(e.target.value)}
              fullWidth
            />
          )}
          <Button type="submit" variant="contained" size="large" disabled={carregando} fullWidth>
            {carregando ? "Aguarde..." : aba === "login" ? "Entrar" : "Criar conta"}
          </Button>
          {aba === "login" && (
            <Link
              component="button"
              type="button"
              onClick={handleEsqueciSenha}
              underline="hover"
              sx={{ fontSize: "0.85rem", alignSelf: "center" }}
            >
              Esqueci minha senha
            </Link>
          )}
        </Stack>
      </DialogContent>
    </Dialog>
  );
}
