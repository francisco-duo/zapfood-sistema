from enum import Enum


class RoutingKeyPedido(str, Enum):
    APROVADO = "pedido.status.aprovado"
    EM_PREPARO = "pedido.status.em_preparo"
    PRONTO = "pedido.status.pronto"
    SAIU_ENTREGA = "pedido.status.saiu_entrega"
