// Formatação numérica no padrão brasileiro, usada nas telas de notas e boletim.

export function formatarNumero(valor, casas = 2) {
  if (valor === null || valor === undefined || isNaN(valor)) return '---';
  return Number(valor).toLocaleString('pt-BR', {
    minimumFractionDigits: casas,
    maximumFractionDigits: casas
  });
}

// Peso percentual: 80 -> "80%", 12.5 -> "12,5%"
export function formatarPeso(peso) {
  if (peso === null || peso === undefined || isNaN(peso)) return '---';
  const numero = Number(peso);
  const casas = Number.isInteger(numero) ? 0 : 1;
  return `${numero.toLocaleString('pt-BR', { minimumFractionDigits: casas, maximumFractionDigits: casas })}%`;
}

// Valores em reais: 2508.5 -> "R$ 2.508,50"
export function formatarMoeda(valor) {
  if (valor === null || valor === undefined || isNaN(valor)) return '---';
  return Number(valor).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

// Data vinda do backend ("2026-03-25") no formato brasileiro, sem passar por
// new Date() para não sofrer com o fuso horário
export function formatarData(iso) {
  if (!iso) return '---';
  const texto = String(iso).substring(0, 10);
  const partes = texto.split('-');
  if (partes.length !== 3) return texto;
  return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

// Nota final no formato do boletim: "8,76 (8,8)"
export function formatarNotaFinal(nota, arredondada) {
  if (nota === null || nota === undefined || isNaN(nota)) return '---';
  const cheia = formatarNumero(nota, 2);
  const curta = formatarNumero(arredondada !== null && arredondada !== undefined ? arredondada : nota, 1);
  return `${cheia} (${curta})`;
}
