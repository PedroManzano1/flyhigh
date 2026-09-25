// Constantes e apoio da tela do financeiro.

// Mesma lista de FinanceiroService.FORMAS_PAGAMENTO no backend
export const FORMAS_PAGAMENTO = [
  'Dinheiro', 'PIX', 'Cartão de débito', 'Cartão de crédito', 'Transferência', 'Boleto'
];

export const FILTROS_STATUS = [
  { valor: 'EM_ABERTO', rotulo: 'Em aberto' },
  { valor: 'ATRASADA', rotulo: 'Atrasadas' },
  { valor: 'PENDENTE', rotulo: 'A vencer' },
  { valor: 'PAGA', rotulo: 'Pagas' },
  { valor: '', rotulo: 'Todas' }
];

export const ROTULO_TIPO = {
  MENSALIDADE: 'Mensalidade',
  MATERIAL: 'Material'
};

// Data de hoje no fuso do navegador. toISOString() usaria UTC e, à noite,
// já devolveria o dia seguinte
export function hojeISO() {
  const d = new Date();
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const dia = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mes}-${dia}`;
}

// "3/12"
export function rotuloParcela(p) {
  if (!p?.numeroParcela) return '---';
  return p.totalParcelas ? `${p.numeroParcela}/${p.totalParcelas}` : String(p.numeroParcela);
}

export function rotuloAtraso(dias) {
  if (!dias || dias <= 0) return '';
  return dias === 1 ? 'há 1 dia' : `há ${dias} dias`;
}
