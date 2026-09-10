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

// Nota final no formato do boletim: "8,76 (8,8)"
export function formatarNotaFinal(nota, arredondada) {
  if (nota === null || nota === undefined || isNaN(nota)) return '---';
  const cheia = formatarNumero(nota, 2);
  const curta = formatarNumero(arredondada !== null && arredondada !== undefined ? arredondada : nota, 1);
  return `${cheia} (${curta})`;
}
