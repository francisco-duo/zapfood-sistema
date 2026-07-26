export type PerfilUsuario = "cliente" | "admin" | "funcionario_balcao" | "cozinha";

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  perfil: PerfilUsuario;
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

export interface PedidoNaFila extends Pedido {
  /** Timestamp local (ms) usado pelo cronômetro do card — não vem do backend. */
  entrouNaFilaEm: number;
}

export type MensagemKds =
  | { tipo: "pedido_em_preparo"; pedido: Pedido }
  | { tipo: "pedido_removido"; pedido_id: string };
