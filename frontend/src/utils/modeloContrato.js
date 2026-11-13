// Monta o texto do contrato a partir de uma versão do modelo (ModeloContrato no
// backend). Usado pela impressão e pela pré-visualização do editor, para os dois
// saírem sempre iguais.

import { VALOR_HORA_AULA_PADRAO } from './contrato';

export const TIPOS_MODELO = [
  { valor: 'NORMAL', rotulo: 'Contrato normal' },
  { valor: 'VIP', rotulo: 'Contrato VIP' }
];

// Onde cada cláusula aparece na folha, na ordem do documento
export const SECOES = [
  { chave: 'ABERTURA', rotulo: 'Antes do quadro do curso', dica: 'Normalmente só a cláusula 1, que apresenta o curso.' },
  { chave: 'ANTES_VALORES', rotulo: 'Antes dos quadros de material e curso', dica: 'A última cláusula daqui é a que fala do pagamento.' },
  { chave: 'DEPOIS_VALORES', rotulo: 'Depois dos quadros de valores', dica: 'Multa, cancelamento, trancamento, foro...' }
];

export const CLAUSULA = 'CLAUSULA';
export const PARAGRAFO = 'PARAGRAFO';

// Mesma lista de ModeloContratoService.VARIAVEIS no backend
export const VARIAVEIS = [
  { nome: 'ESCOLA_RAZAO_SOCIAL', descricao: 'Razão social da escola' },
  { nome: 'ESCOLA_CNPJ', descricao: 'CNPJ da escola' },
  { nome: 'ESCOLA_ENDERECO', descricao: 'Endereço da escola' },
  { nome: 'ESCOLA_CIDADE', descricao: 'Cidade da escola' },
  { nome: 'ESCOLA_COMARCA', descricao: 'Comarca do foro' },
  { nome: 'VALOR_HORA_AULA', descricao: 'Valor da hora/aula do contrato (VIP)' },
  { nome: 'CLAUSULA_FINANCEIRA', descricao: 'Número da cláusula de pagamento (a última antes dos quadros de valores)' }
];

const NOMES_VARIAVEIS = new Set(VARIAVEIS.map(v => v.nome));
const PADRAO_VARIAVEL = /\{([A-Z_]+)\}/g;

export const ROTULO_STATUS = {
  RASCUNHO: 'Em edição',
  VIGENTE: 'Em uso',
  ARQUIVADO: 'Arquivada'
};

// Variáveis escritas no texto que o sistema não conhece (ex.: {ESCOLA_NOME})
export function variaveisDesconhecidas(texto) {
  const achadas = new Set();
  for (const m of String(texto || '').matchAll(PADRAO_VARIAVEL)) {
    if (!NOMES_VARIAVEIS.has(m[1])) achadas.add(`{${m[1]}}`);
  }
  return [...achadas];
}

// Blocos na ordem do documento: primeiro por seção, depois pela ordem dentro dela
export function ordenarBlocos(blocos) {
  return SECOES.flatMap(s => (blocos || []).filter(b => b.secao === s.chave));
}

/**
 * Texto pronto para a folha: cláusulas numeradas ("Cláusula 3. ...") e variáveis
 * trocadas pelos valores. A numeração é contínua no documento inteiro.
 */
export function montarDocumento(modelo, contrato = {}) {
  const m = modelo || {};
  const ordenados = ordenarBlocos(m.blocos);

  let numero = 0;
  const numerados = ordenados.map(b => ({ ...b, numero: b.tipo === CLAUSULA ? ++numero : null }));
  const clausulaFinanceira = numerados.filter(b => b.numero && b.secao !== 'DEPOIS_VALORES').length;

  const valorHora = Number(contrato.valorHoraAula || VALOR_HORA_AULA_PADRAO)
    .toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const valores = {
    ESCOLA_RAZAO_SOCIAL: m.escolaRazaoSocial || '',
    ESCOLA_CNPJ: m.escolaCnpj || '',
    ESCOLA_ENDERECO: m.escolaEndereco || '',
    ESCOLA_CIDADE: m.escolaCidade || '',
    ESCOLA_COMARCA: m.escolaComarca || '',
    VALOR_HORA_AULA: valorHora,
    CLAUSULA_FINANCEIRA: clausulaFinanceira ? String(clausulaFinanceira) : '?'
  };
  const substituir = (texto) => String(texto || '')
    .replace(PADRAO_VARIAVEL, (inteira, nome) => (nome in valores ? valores[nome] : inteira));

  const secoes = {};
  SECOES.forEach(s => { secoes[s.chave] = []; });
  numerados.forEach(b => {
    const texto = substituir(b.texto);
    secoes[b.secao].push(b.numero ? `Cláusula ${b.numero}. ${texto}` : texto);
  });

  return {
    titulo: substituir(m.titulo),
    subtitulo: substituir(m.subtitulo),
    preambulo: substituir(m.preambulo),
    secoes,
    escola: {
      razaoSocial: m.escolaRazaoSocial || '',
      cnpj: m.escolaCnpj || '',
      cidade: m.escolaCidade || ''
    },
    rotuloContratante: substituir(m.rotuloAssinaturaContratante) || 'O (A) Contratante',
    rotuloContratada: substituir(m.rotuloAssinaturaContratada) || 'Contratada',
    testemunhas: m.testemunhas || []
  };
}
