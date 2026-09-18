// Opções e textos fixos dos dois modelos de contrato da Fly High Idiomas.
// Foram tirados das planilhas oficiais (contrato normal e contrato VIP) para que
// a tela e a impressão fiquem iguais ao documento que a secretaria já usa.

export const TIPO_NORMAL = 'NORMAL';
export const TIPO_VIP = 'VIP';

export const ESCOLA = {
  razaoSocial: 'FLY HIGH IDIOMAS LTDA ME',
  cnpj: '28.715.122/0001-83',
  endereco: 'AVENIDA PADRE JOÃO SCHNEIDER - 915, CENTRO, MARTINÓPOLIS, 19.500-000',
  cidade: 'Martinópolis - SP',
  comarca: 'Martinópolis'
};

export const TESTEMUNHAS = [
  { nome: 'Maria Fernanda S. de Melo', documento: '406.657.368-19' },
  { nome: 'Antonio Tavares Junior', documento: '446.578.258-60' },
  { nome: 'Bruna Teixeira Souza', documento: '458.218.838-90' },
  { nome: 'Vitória Martins Silva', documento: '434.633.788-09' }
];

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

export const STATUS_MATRICULA = ['Ativo', 'Trancado', 'Cancelado'];
export const STATUS_ASSINATURA = ['Aguardando Assinatura', 'Assinado'];

// Valor da hora/aula citado na cláusula 7 do contrato VIP
export const VALOR_HORA_AULA_PADRAO = 70;

export const PREAMBULO =
  'Pelo presente instrumento particular, a FLY HIGH IDIOMAS LTDA ME, devidamente inscrito no CNPJ/MF sob n.º ' +
  '28.715.122/0001-83, entidade mantenedora da FLY HIGH, com endereço na AVENIDA PADRE JOÃO SCHNEIDER - 915, ' +
  'CENTRO, MARTINÓPOLIS, 19.500-000, denominada CONTRATADA, neste ato representada pelo seu representante legal ' +
  'e de outro lado o(s) responsável (eis) pelo(a) aluno(a), ou o(a) próprio(a) aluno(a), neste instrumento ' +
  'qualificado, doravante denominado CONTRATANTE-ALUNO têm justo e contratado o seguinte:';

// Cláusula 1 abre o quadro do curso, por isso ela fica fora das listas abaixo.
export const CLAUSULA_1 =
  'Cláusula 1. A CONTRATADA ministrará aulas de línguas estrangeiras, de acordo com as diretrizes pedagógicas e ' +
  'metodológicas de ensino desenvolvidas pela FLY HIGH IDIOMAS LTDA ME, (de forma presencial e/ou outra em virtude ' +
  'de situações atípicas) conferindo ao CONTRATANTE-ALUNO declaração ou certificado de conclusão ao término do ' +
  'curso ou estágio, abaixo especificado assim que requerido:';

const CLAUSULAS_NORMAL_ANTES = [
  'Cláusula 2. Em todos os estágios do curso, é obrigatório o uso pelo CONTRATANTE-ALUNO do material didático sugerido pela FLY HIGH IDIOMAS, e/ou por ele autorizado. Vedada a reprodução, sob pena de violação de direitos autorais.',
  'Parágrafo Único. O material didático deverá ser pago junto com a mensalidade referente ao primeiro mês de cada um dos estágios cursados pelo aluno, conforme estabelecido no item 8.',
  'Cláusula 3. É permitido ao CONTRATANTE-ALUNO participar das atividades extracurriculares promovidas na unidade CONTRATADA dentro do devido nível.',
  'Cláusula 4. O CONTRATANTE-ALUNO deverá ter frequência não inferior a 75% (setenta e cinco porcento) e aproveitamento mínimo de 70% (setenta porcento) para que possa prosseguir para o estágio seguinte.',
  'Cláusula 5. É de responsabilidade da FLY HIGH IDIOMAS, a orientação pedagógica dos cursos, bem como a seleção de material didático, cabendo à unidade CONTRATADA definir preços, fixar data para início das turmas, dias, horários de aulas e provas, formação de turmas e mudança de professores. (Vale lembrar que não garantimos a exclusividade de professores, sendo assim, não há opção de escolha.',
  'Cláusula 6. As turmas serão formadas com no mínimo 07 (sete) alunos. Nos casos de turmas vigentes com número inferior a 7 alunos, estes poderão sofrer uma redução na carga horária semanal de até 50% ou serão vinculados a modalidade do curso VIP. Sendo facultado à CONTRATADA, até 03 (três) dias antes do início das aulas, cancelar aquelas com número inferior, ressalvado, nesse caso, o direito do CONTRATANTE-ALUNO de optar por vaga existente em outras turmas do mesmo nível ou pleitear a devolução dos valores pagos (parcelas e/ou material).',
  'Cláusula 7. Para aproveitamento dos descontos referentes a promoções, planos de incentivos e convênios, entre outros, é necessário que o CONTRATANTE-ALUNO efetue o pagamento até o dia do vencimento e comprove a condição de beneficiário a cada novo estágio.',
  'Cláusula 8. Compromete-se o CONTRATANTE-ALUNO a efetuar o pagamento das obrigações financeiras assumidas na forma e prazo abaixo estipulados:'
];

const CLAUSULAS_NORMAL_DEPOIS = [
  'Parágrafo Único - Em caso de falta de pagamento no vencimento, o valor será acrescido de multa contratual de 2% (dois por cento), dos juros de mora diária de R$ 1,50 (um real e cinquenta centavos) e da correção monetária com base na tabela utilizada pelo Poder Judiciário ou outro índice inflacionário, até a data do efetivo pagamento.',
  'Cláusula 9. Em caso de desistência do curso antes do início das aulas, a quantia paga a título de matrícula/parcela será restituída ao CONTRATANTE-ALUNO, deduzido o percentual de 10% (dez por cento) correspondente às despesas administrativas incorridas pela CONTRATADA.',
  'Cláusula 10. O CONTRATANTE-ALUNO poderá cancelar unilateralmente o contrato, resguardado o direito da CONTRATADA de reter ou cobrar o valor correspondente às aulas dadas, bem como os percentuais de 10% (dez por cento) para contrato anual/semestral, sobre a importância que remanesceria até a conclusão do curso.',
  'Cláusula 11. Em caso de trancamento, o valor das parcelas correspondentes às aulas não assistidas pelo CONTRATANTE-ALUNO será convertido em crédito de horas/aulas, devendo o mesmo submeter-se a teste de nivelamento caso o seu retorno ocorra após 06 (seis) meses.',
  'Cláusula 12. No caso de desistência após 75% (setenta e cinco por cento) da carga horária total contratada ter sido ministrada, serão devidas as parcelas restantes, as quais deverão ser quitadas pelo CONTRATANTE-ALUNO nas respectivas datas de vencimento.',
  'Cláusula 13. Os requerimentos de desistência e trancamento deverão ser formalizados por escrito pelo CONTRATANTE-ALUNO, mediante protocolo na secretaria da CONTRATADA, ocasião em que se apurarão os valores mencionados nas cláusulas precedentes.',
  'Cláusula 14. O CONTRATANTE-ALUNO, desde já, autoriza a divulgação de seu nome e imagem e/ou do próprio aluno(a), a título gratuito e por prazo indeterminado, sempre de forma honrosa, atrelada a divulgação da marca FLY HIGH IDIOMAS em eventos, website e murais das escolas FLY HIGH IDIOMAS.',
  'Cláusula 15. Poderão ser cobradas taxas de matrícula, rematrícula, transferência de turma, 2ª chamada, trancamento e desistência, referentes às despesas administrativas incorridas pela CONTRATADA, observada tabela vigente da unidade na ocasião do evento.',
  'Cláusula 16. Estando o CONTRATANTE-ALUNO adimplente com o plano de pagamento ajustado na cláusula 8, renovar-se-á automaticamente o presente contrato pela confirmação da matrícula e/ou aquisição do material didático para o estágio seguinte.',
  'Cláusula 17. Os valores do presente instrumento estão expressos em reais e poderão ser reajustados na forma da legislação vigente, de acordo com os índices indicados pelo Governo.',
  'Cláusula 18. Elegem as partes o Foro da Comarca de Martinópolis para conhecer e dirimir as dúvidas ou discussões oriundas deste contrato, preterindo qualquer outro por mais privilegiado que seja.'
];

const CLAUSULAS_VIP_ANTES = [
  'Cláusula 2. Em todos os estágios do curso, é obrigatório o uso pelo CONTRATANTE-ALUNO do material didático sugerido pela FLY HIGH IDIOMAS, e/ou por ele autorizado. Vedada a reprodução, sob pena de violação de direitos autorais.',
  'Parágrafo Único. O material didático deverá ser pago junto com a mensalidade referente ao primeiro mês de cada um dos estágios cursados pelo aluno, conforme estabelecido na cláusula 7.',
  'Cláusula 3. É permitido ao CONTRATANTE-ALUNO participar das atividades extracurriculares promovidas na unidade CONTRATADA dentro do devido nível.',
  'Cláusula 4. O CONTRATANTE-ALUNO deverá ter frequência não inferior a 75% (setenta e cinco porcento) e aproveitamento mínimo de 70% (setenta porcento) para que possa prosseguir para o estágio seguinte.',
  'Cláusula 5. É de responsabilidade da FLY HIGH IDIOMAS, a orientação pedagógica dos cursos, bem como a seleção de material didático, cabendo à unidade CONTRATADA definir preços, fixar data para início das aulas, dias, horários de aulas e provas. (Vale lembrar que não garantimos a exclusividade de professores, sendo assim, não há opção de escolha.',
  'Cláusula 6. Para aproveitamento dos descontos referentes a promoções, planos de incentivos e convênios, entre outros, é necessário que o CONTRATANTE-ALUNO efetue o pagamento até o dia do vencimento e comprove a condição de beneficiário a cada novo estágio.',
  'Cláusula 7. Compromete-se o CONTRATANTE-ALUNO a efetuar o pagamento das obrigações financeiras assumidas na forma e prazo abaixo estipulados, (vale lembrar que os valores mensais serão computados ao término de cada mês em número de horas (H) aulas (A) prestadas e multiplicado pelo valor vigente de R$ {VALOR_HORA_AULA} H/A - comprovado pelo registro no diário de classe do aluno).'
];

const CLAUSULAS_VIP_DEPOIS = [
  'Parágrafo Único - Em caso de falta de pagamento no vencimento, o valor será acrescido de multa contratual de 2% (dois por cento), dos juros de mora diária de R$ 1,50 (um real e cinquenta centavos) e da correção monetária com base na tabela utilizada pelo Poder Judiciário ou outro índice inflacionário, até a data do efetivo pagamento.',
  'Cláusula 8. Em caso de desistência do curso antes do início das aulas, a quantia paga a título de matrícula/parcela será restituída ao CONTRATANTE-ALUNO, deduzido o percentual de 10% (dez por cento) correspondente às despesas administrativas incorridas pela CONTRATADA.',
  'Cláusula 9. O CONTRATANTE-ALUNO poderá cancelar unilateralmente o contrato, resguardado o direito da CONTRATADA de reter ou cobrar o valor correspondente às aulas dadas.',
  'Cláusula 10. Em caso de trancamento ou desistência, o valor das parcelas correspondentes às aulas não assistidas pelo CONTRATANTE-ALUNO será convertido em crédito de horas/aulas, devendo o mesmo submeter-se a teste de nivelamento caso o seu retorno ocorra após 06 (seis) meses.',
  'Cláusula 11. Os requerimentos de desistência e trancamento deverão ser formalizados por escrito pelo CONTRATANTE-ALUNO, mediante protocolo na secretaria da CONTRATADA, ocasião em que se apurarão os valores mencionados nas cláusulas precedentes.',
  'Cláusula 12. O CONTRATANTE-ALUNO, desde já, autoriza a divulgação de seu nome e imagem e/ou do próprio aluno(a), a título gratuito e por prazo indeterminado, sempre de forma honrosa, atrelada a divulgação da marca FLY HIGH IDIOMAS em eventos, website e murais das escolas FLY HIGH IDIOMAS.',
  'Cláusula 13. Poderão ser cobradas taxas de matrícula, rematrícula, transferência de turma, 2ª chamada, trancamento e desistência, referentes às despesas administrativas incorridas pela CONTRATADA, observada tabela vigente da unidade na ocasião do evento.',
  'Cláusula 14. Estando o CONTRATANTE-ALUNO adimplente com o plano de pagamento ajustado na cláusula 7, renovar-se-á automaticamente o presente contrato pela confirmação da matrícula e/ou aquisição do material didático para o estágio seguinte.',
  'Cláusula 15. Os valores do presente instrumento estão expressos em reais e poderão ser reajustados na forma da legislação vigente, de acordo com os índices indicados pelo Governo.',
  'Cláusula 18. Elegem as partes o Foro da Comarca de Martinópolis para conhecer e dirimir as dúvidas ou discussões oriundas deste contrato, preterindo qualquer outro por mais privilegiado que seja.'
];

/**
 * Cláusulas que vêm antes do quadro financeiro. No VIP a cláusula 7 cita o valor
 * da hora/aula, então ele entra no texto.
 */
export function clausulasAntesDoFinanceiro(tipo, valorHoraAula) {
  if (tipo === TIPO_VIP) {
    const valor = Number(valorHoraAula || VALOR_HORA_AULA_PADRAO)
      .toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return CLAUSULAS_VIP_ANTES.map(t => t.replace('{VALOR_HORA_AULA}', valor));
  }
  return CLAUSULAS_NORMAL_ANTES;
}

export function clausulasDepoisDoFinanceiro(tipo) {
  return tipo === TIPO_VIP ? CLAUSULAS_VIP_DEPOIS : CLAUSULAS_NORMAL_DEPOIS;
}

// --- Apoio às telas ---------------------------------------------------------

export const corDoStatus = (status) => {
  const s = (status || '').toUpperCase();
  if (s === 'ATIVO') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  if (s === 'TRANCADO') return 'bg-amber-50 text-amber-700 border-amber-200';
  return 'bg-red-50 text-red-700 border-red-200';
};

export const corDaParcela = (status) => {
  const s = (status || '').toUpperCase();
  if (s === 'PAGA') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  if (s === 'ATRASADA') return 'bg-red-50 text-red-700 border-red-200';
  return 'bg-zinc-100 text-zinc-600 border-zinc-200';
};
