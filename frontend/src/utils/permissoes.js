// Módulos da matriz de acesso, um por tela do sistema e na ordem do menu.
// Usado pelas telas de perfis (criação e edição); módulo novo entra só aqui.
//
// somenteLeitura: telas de consulta, em que só a coluna "Ler" faz sentido.

export const MODULOS_PERMISSAO = [
  { modulo: 'ALUNOS', rotulo: '🎓 Alunos' },
  { modulo: 'RESPONSAVEIS', rotulo: '👥 Responsáveis' },
  { modulo: 'VINCULOS', rotulo: '🔗 Vínculos (família)' },
  { modulo: 'CURSOS', rotulo: '📚 Cursos' },
  { modulo: 'TURMAS', rotulo: '🗓️ Turmas' },
  { modulo: 'CONTRATOS', rotulo: '📄 Contratos (matrículas)' },
  { modulo: 'FINANCEIRO', rotulo: '💰 Financeiro (baixa de parcelas)' },
  { modulo: 'INADIMPLENCIA', rotulo: '🚨 Inadimplência', somenteLeitura: true },
  { modulo: 'FREQUENCIAS', rotulo: '📋 Faltas (frequência)' },
  { modulo: 'AVALIACOES', rotulo: '✍️ Notas (avaliações)' },
  { modulo: 'BOLETIM', rotulo: '📊 Boletim', somenteLeitura: true },
  { modulo: 'RECADOS', rotulo: '📢 Recados' },
  { modulo: 'USUARIOS', rotulo: '👤 Equipe (usuários e cadastros)' },
  { modulo: 'PERFIS', rotulo: '🛡️ Perfis' }
];

export const MODULOS = MODULOS_PERMISSAO.map(m => m.modulo);

export const ROTULO_MODULO = MODULOS_PERMISSAO.reduce((acc, m) => {
  acc[m.modulo] = m.rotulo;
  return acc;
}, {});

export const SOMENTE_LEITURA = new Set(MODULOS_PERMISSAO.filter(m => m.somenteLeitura).map(m => m.modulo));

// Contas de aluno (perfil ALUNO ou cadastro aguardando aprovação) não entram em
// listas de equipe, como a escolha do professor da turma
export const PERFIL_ALUNO = 'ALUNO';

export function ehContaDeAluno(usuario) {
  return (usuario?.perfil?.nomePerfil || '').toUpperCase() === PERFIL_ALUNO
    || (usuario?.status || '').toUpperCase() === 'PENDENTE';
}
