// Sistema de notas da escola: cada atividade vale pontos, a turma soma tudo
// (até 400 ou 500) e no fim divide por 4 ou 5. Aprova quem fica com 70 ou mais.
// As mesmas regras estão em AvaliacaoService e BoletimService no backend.

export const MODELOS_AVALIACAO = [
  { valor: 400, rotulo: 'Modelo 400 (soma ÷ 4)' },
  { valor: 500, rotulo: 'Modelo 500 (soma ÷ 5)' }
];

export function rotuloModelo(pontuacaoTotal) {
  const modelo = MODELOS_AVALIACAO.find(m => m.valor === Number(pontuacaoTotal));
  return modelo ? modelo.rotulo : (pontuacaoTotal ? `${pontuacaoTotal} pontos` : 'Sem modelo');
}

// Colunas da planilha da escola, na ordem em que aparecem
export const CATEGORIAS = ['Written Check', 'Oral Check', 'Project', 'Homework', 'Performance', 'Attitude'];
export const ETAPAS = ['1st', '2nd', '3rd', '4th', 'Mid', 'Final'];

// Quantos pontos ainda cabem na turma
export function pontosDisponiveis(pontuacaoTotal, avaliacoes) {
  if (!pontuacaoTotal) return null;
  const usados = (avaliacoes || []).reduce((soma, a) => soma + (Number(a.notaMaxima) || 0), 0);
  return Math.round((pontuacaoTotal - usados) * 100) / 100;
}

// Agrupa as atividades por categoria, mantendo a ordem da planilha
export function agruparPorCategoria(avaliacoes) {
  const grupos = [];
  const porNome = {};
  for (const a of avaliacoes || []) {
    const nome = a.categoria || 'Outras';
    if (!porNome[nome]) {
      porNome[nome] = { categoria: nome, itens: [] };
      grupos.push(porNome[nome]);
    }
    porNome[nome].itens.push(a);
  }
  return grupos;
}

// "Written Check 1st" quando a atividade veio do modelo; senão o título livre
export function rotuloAvaliacao(a) {
  if (a?.categoria && a?.etapa) return `${a.categoria} ${a.etapa}`;
  return a?.titulo || '---';
}

export const corDaSituacao = (situacao) => {
  if (situacao === 'APROVADO') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  if (situacao === 'REPROVADO') return 'bg-red-50 text-red-700 border-red-200';
  if (situacao === 'CURSANDO') return 'bg-sky-50 text-sky-700 border-sky-200';
  return 'bg-zinc-100 text-zinc-500 border-zinc-200';
};
