const formatador = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export interface ItemRecibo {
  nome: string;
  quantidade: number;
  precoUnitario: number;
}

export interface DadosRecibo {
  pedidoId: string;
  itens: ItemRecibo[];
  total: number;
  formaPagamento: string;
  tipoEntregaRotulo: string;
  enderecoEntrega?: string | null;
  dataHora: Date;
}

function escaparHtml(texto: string): string {
  const div = document.createElement("div");
  div.textContent = texto;
  return div.innerHTML;
}

function montarHtmlRecibo(dados: DadosRecibo): string {
  const linhasItens = dados.itens
    .map(
      (item) => `
        <tr>
          <td>${item.quantidade}x ${escaparHtml(item.nome)}</td>
          <td class="valor">${formatador.format(item.quantidade * item.precoUnitario)}</td>
        </tr>`
    )
    .join("");

  const linhaEndereco = dados.enderecoEntrega
    ? `<div class="linha"><strong>Endereço:</strong> ${escaparHtml(dados.enderecoEntrega)}</div>`
    : "";

  return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>Recibo #${dados.pedidoId.slice(0, 8)}</title>
<style>
  * { box-sizing: border-box; }
  body {
    font-family: 'Courier New', monospace;
    width: 300px;
    margin: 0 auto;
    padding: 16px;
    color: #000;
  }
  h1 { font-size: 18px; text-align: center; margin: 0 0 2px; letter-spacing: 1px; }
  .subtitulo { text-align: center; font-size: 12px; margin-bottom: 12px; }
  hr { border: none; border-top: 1px dashed #000; margin: 10px 0; }
  table { width: 100%; border-collapse: collapse; font-size: 13px; }
  td { padding: 3px 0; vertical-align: top; }
  .valor { text-align: right; white-space: nowrap; }
  .total-row td { font-weight: bold; font-size: 15px; border-top: 1px dashed #000; padding-top: 8px; }
  .linha { font-size: 13px; margin-top: 4px; }
  .rodape { text-align: center; font-size: 11px; margin-top: 18px; }
</style>
</head>
<body>
  <h1>zapFood</h1>
  <div class="subtitulo">
    Pedido #${dados.pedidoId.slice(0, 8)}<br />
    ${dados.dataHora.toLocaleString("pt-BR")}
  </div>
  <hr />
  <table>
    ${linhasItens}
    <tr class="total-row">
      <td>Total</td>
      <td class="valor">${formatador.format(dados.total)}</td>
    </tr>
  </table>
  <hr />
  <div class="linha"><strong>Pagamento:</strong> ${escaparHtml(dados.formaPagamento)}</div>
  <div class="linha"><strong>Modalidade:</strong> ${escaparHtml(dados.tipoEntregaRotulo)}</div>
  ${linhaEndereco}
  <div class="rodape">Obrigado pela preferência!</div>
</body>
</html>`;
}

/**
 * Imprime o recibo via um iframe oculto na própria página, em vez de
 * window.open(): pop-ups são bloqueados com frequência (por policy do
 * navegador ou extensões), o que deixaria o botão de impressão sem efeito
 * justamente no momento em que o balconista mais precisa dele.
 */
export function imprimirRecibo(dados: DadosRecibo): void {
  const iframe = document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "0";
  document.body.appendChild(iframe);

  const doc = iframe.contentDocument;
  if (!doc) {
    document.body.removeChild(iframe);
    return;
  }

  doc.open();
  doc.write(montarHtmlRecibo(dados));
  doc.close();

  function limpar() {
    if (iframe.parentNode) document.body.removeChild(iframe);
  }

  iframe.contentWindow?.addEventListener("afterprint", limpar);

  iframe.onload = () => {
    iframe.contentWindow?.focus();
    iframe.contentWindow?.print();
    // Fallback para navegadores que não disparam "afterprint" de forma confiável.
    setTimeout(limpar, 2000);
  };
}
