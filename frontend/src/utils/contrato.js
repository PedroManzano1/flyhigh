// Opções dos dois modelos de contrato da Fly High Idiomas (normal e VIP), tiradas
// das planilhas oficiais da escola. O texto das cláusulas, os dados da escola e as
// testemunhas não ficam mais aqui: vivem nos modelos de contrato com versão
// (tela Modelos de contrato; ver utils/modeloContrato.js).

export const TIPO_NORMAL = 'NORMAL';
export const TIPO_VIP = 'VIP';

export const CURSOS_CONTRATO = [
  'Tiny kids - 1', 'Tiny Kids - 2', 'Tiny Kids - 3',
  'Young Learners - 1', 'Young Learners - 2',
  'Kids - 1', 'Kids - 2',
  'Teens - 1', 'Teens - 2',
  'Basic', 'Intermediate', 'Upper Intermediate',
  'Pre Advanced', 'Advanced - 1', 'Advanced - 2'
];

export const TIPOS_CURSO = {
  [TIPO_NORMAL]: ['Semestral', 'Anual'],
  [TIPO_VIP]: ['Semestral', 'Anual', 'VIP']
};

export const CARGAS_HORARIAS = ['54 H/A', '64 H/A', '80 H/A'];

// No contrato normal existe a faixa de 75%; no VIP ela não é oferecida.
export const DESCONTOS = {
  [TIPO_NORMAL]: [0, 5, 10, 15, 20, 25, 30, 40, 50, 75, 100],
  [TIPO_VIP]: [0, 5, 10, 15, 20, 25, 30, 40, 50, 100]
};

export const CONVENIOS = {
  [TIPO_NORMAL]: ['Particular', 'Municipal', 'Estadual'],
  [TIPO_VIP]: ['Particular', 'Municipal', 'Estadual', 'Opcional']
};

export const DIAS_SEMANA = [
  'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado',
  'Seg./Qua.', 'Ter./Qui.'
];

// Concluído: turma encerrada (normalmente pelo botão "Encerrar turma")
export const STATUS_MATRICULA = ['Ativo', 'Trancado', 'Cancelado', 'Concluído'];
export const STATUS_ASSINATURA = ['Aguardando Assinatura', 'Assinado'];

// Valor da hora/aula citado na cláusula 7 do contrato VIP
export const VALOR_HORA_AULA_PADRAO = 70;

// --- Apoio às telas ---------------------------------------------------------

export const corDoStatus = (status) => {
  const s = (status || '').toUpperCase();
  if (s === 'ATIVO') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  if (s === 'TRANCADO') return 'bg-amber-50 text-amber-700 border-amber-200';
  if (s === 'CONCLUÍDO' || s === 'CONCLUIDO') return 'bg-sky-50 text-sky-700 border-sky-200';
  return 'bg-red-50 text-red-700 border-red-200';
};

export const corDaParcela = (status) => {
  const s = (status || '').toUpperCase();
  if (s === 'PAGA') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  if (s === 'ATRASADA') return 'bg-red-50 text-red-700 border-red-200';
  // Matrícula trancada ou cancelada: a parcela não é mais cobrada
  if (s === 'CANCELADA') return 'bg-white text-zinc-400 border-zinc-200 line-through';
  return 'bg-zinc-100 text-zinc-600 border-zinc-200';
};
