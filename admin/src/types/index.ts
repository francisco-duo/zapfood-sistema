export type PerfilUsuario = "cliente" | "admin" | "funcionario_balcao";

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  perfil: PerfilUsuario;
}

export interface Categoria {
  id: string;
  nome: string;
  ativa: boolean;
}

export interface Produto {
  id: string;
  categoriaId: string;
  nome: string;
  descricao: string;
  preco: number;
  precoPromocional?: number | null;
  imagemUrl: string;
  ativo: boolean;
}

export type OrigemPedido = "online" | "balcao";
export type TipoEntrega = "delivery" | "retirada" | "consumo_local";
export type StatusPedido =
  | "aguardando_aprovacao"
  | "em_preparo"
  | "pronto_entrega"
  | "pronto_retirada"
  | "finalizado"
  | "cancelado";

export interface ItemPedido {
  id: string;
  produto_id: string;
  quantidade: number;
  preco_unitario_cobrado: number;
  observacao?: string | null;
}

export interface Pedido {
  id: string;
  usuario_id: string | null;
  origem: OrigemPedido;
  tipo_entrega: TipoEntrega;
  status: StatusPedido;
  forma_pagamento: string;
  endereco_entrega: string | null;
  valor_total: number;
  criado_em: string;
  itens: ItemPedido[];
}

export type LogCategoria =
  | "preco"
  | "catalogo"
  | "pedido"
  | "loja"
  | "erro_servidor";

export interface LogEntry {
  id: string;
  categoria: LogCategoria;
  mensagem: string;
  autor: string;
  criadoEm: string;
}

export interface MetricasDia {
  faturamentoBruto: number;
  ticketMedio: number;
  totalPedidos: number;
  rankingProdutos: { produtoId: string; nome: string; quantidade: number; total: number }[];
}
