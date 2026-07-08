import { useEffect, useState, type FormEvent } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack,
  TextField,
  MenuItem,
  Button,
} from "@mui/material";
import type { Categoria, Produto } from "../../types";

interface ProductFormDialogProps {
  open: boolean;
  categorias: Categoria[];
  produtoEmEdicao: Produto | null;
  onClose: () => void;
  onSalvar: (dados: Omit<Produto, "id" | "ativo">, idExistente: string | null) => void;
}

const VAZIO = {
  categoriaId: "",
  nome: "",
  descricao: "",
  preco: "",
  precoPromocional: "",
  imagemUrl: "",
};

export default function ProductFormDialog({
  open,
  categorias,
  produtoEmEdicao,
  onClose,
  onSalvar,
}: ProductFormDialogProps) {
  const [form, setForm] = useState(VAZIO);

  useEffect(() => {
    if (produtoEmEdicao) {
      setForm({
        categoriaId: produtoEmEdicao.categoriaId,
        nome: produtoEmEdicao.nome,
        descricao: produtoEmEdicao.descricao,
        preco: String(produtoEmEdicao.preco),
        precoPromocional: produtoEmEdicao.precoPromocional ? String(produtoEmEdicao.precoPromocional) : "",
        imagemUrl: produtoEmEdicao.imagemUrl,
      });
    } else {
      setForm(VAZIO);
    }
  }, [produtoEmEdicao, open]);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    onSalvar(
      {
        categoriaId: form.categoriaId,
        nome: form.nome,
        descricao: form.descricao,
        preco: Number(form.preco),
        precoPromocional: form.precoPromocional ? Number(form.precoPromocional) : null,
        imagemUrl: form.imagemUrl,
      },
      produtoEmEdicao?.id ?? null
    );
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{produtoEmEdicao ? "Editar produto" : "Novo produto"}</DialogTitle>
      <DialogContent>
        <Stack component="form" id="produto-form" spacing={2} onSubmit={handleSubmit} sx={{ pt: 1 }}>
          <TextField
            select
            label="Categoria"
            value={form.categoriaId}
            onChange={(e) => setForm((f) => ({ ...f, categoriaId: e.target.value }))}
            required
            fullWidth
          >
            {categorias.map((categoria) => (
              <MenuItem key={categoria.id} value={categoria.id}>
                {categoria.nome}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            label="Nome do produto"
            value={form.nome}
            onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
            required
            fullWidth
          />
          <TextField
            label="Descrição"
            value={form.descricao}
            onChange={(e) => setForm((f) => ({ ...f, descricao: e.target.value }))}
            required
            fullWidth
            multiline
            minRows={2}
          />
          <Stack direction="row" spacing={2}>
            <TextField
              label="Preço (R$)"
              type="number"
              slotProps={{ htmlInput: { step: "0.01", min: 0 } }}
              value={form.preco}
              onChange={(e) => setForm((f) => ({ ...f, preco: e.target.value }))}
              required
              fullWidth
            />
            <TextField
              label="Preço promocional (opcional)"
              type="number"
              slotProps={{ htmlInput: { step: "0.01", min: 0 } }}
              value={form.precoPromocional}
              onChange={(e) => setForm((f) => ({ ...f, precoPromocional: e.target.value }))}
              fullWidth
            />
          </Stack>
          <TextField
            label="URL da imagem"
            value={form.imagemUrl}
            onChange={(e) => setForm((f) => ({ ...f, imagemUrl: e.target.value }))}
            required
            fullWidth
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose}>Cancelar</Button>
        <Button type="submit" form="produto-form" variant="contained">
          Salvar
        </Button>
      </DialogActions>
    </Dialog>
  );
}
