export interface Categoria {
  id: string;
  nome: string;
}

export interface Produto {
  id: string;
  categoriaId: string;
  nome: string;
  descricao: string;
  preco: number;
  precoPromocional?: number;
  imagemUrl: string;
}

export interface ItemCarrinho {
  produtoId: string;
  nome: string;
  precoUnitario: number;
  quantidade: number;
  imagemUrl: string;
  observacao?: string;
}

export type PerfilUsuario = "cliente" | "admin" | "funcionario_balcao";

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  telefone?: string;
  perfil: PerfilUsuario;
}

export type TipoEntrega = "delivery" | "retirada";

export interface EnderecoEntrega {
  cep: string;
  rua: string;
  numero: string;
  bairro: string;
  cidade: string;
  complemento?: string;
}

export interface DadosCheckout {
  tipoEntrega: TipoEntrega;
  endereco?: EnderecoEntrega;
  formaPagamento: string;
}
