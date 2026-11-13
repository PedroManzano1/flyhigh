package com.example.backend.service;

import com.example.backend.model.BlocoContrato;
import com.example.backend.model.ModeloContrato;
import com.example.backend.model.TestemunhaContrato;

import java.util.ArrayList;
import java.util.List;

/**
 * Texto original dos contratos da escola (planilhas oficiais do contrato normal e do
 * VIP). Vira a versão 1 de cada modelo na primeira vez que o backend sobe; depois
 * disso o texto é mantido pela tela de Modelos de contrato, não por aqui.
 */
final class ModeloContratoPadrao {

    private ModeloContratoPadrao() {
    }

    private static final String PREAMBULO =
            "Pelo presente instrumento particular, a {ESCOLA_RAZAO_SOCIAL}, devidamente inscrito no CNPJ/MF "
            + "sob n.º {ESCOLA_CNPJ}, entidade mantenedora da FLY HIGH, com endereço na {ESCOLA_ENDERECO}, "
            + "denominada CONTRATADA, neste ato representada pelo seu representante legal e de outro lado o(s) "
            + "responsável (eis) pelo(a) aluno(a), ou o(a) próprio(a) aluno(a), neste instrumento qualificado, "
            + "doravante denominado CONTRATANTE-ALUNO têm justo e contratado o seguinte:";

    private static List<BlocoContrato> blocosNormal() {
        return List.of(
                new BlocoContrato(BlocoContrato.ABERTURA, BlocoContrato.CLAUSULA,
                        "A CONTRATADA ministrará aulas de línguas estrangeiras, de acordo com as diretrizes pedagógicas "
                        + "e metodológicas de ensino desenvolvidas pela {ESCOLA_RAZAO_SOCIAL}, (de forma presencial e/ou "
                        + "outra em virtude de situações atípicas) conferindo ao CONTRATANTE-ALUNO declaração ou "
                        + "certificado de conclusão ao término do curso ou estágio, abaixo especificado assim que "
                        + "requerido:"),
                new BlocoContrato(BlocoContrato.ANTES_VALORES, BlocoContrato.CLAUSULA,
                        "Em todos os estágios do curso, é obrigatório o uso pelo CONTRATANTE-ALUNO do material didático "
                        + "sugerido pela FLY HIGH IDIOMAS, e/ou por ele autorizado. Vedada a reprodução, sob pena de "
                        + "violação de direitos autorais."),
                new BlocoContrato(BlocoContrato.ANTES_VALORES, BlocoContrato.PARAGRAFO,
                        "Parágrafo Único. O material didático deverá ser pago junto com a mensalidade referente ao "
                        + "primeiro mês de cada um dos estágios cursados pelo aluno, conforme estabelecido no item "
                        + "{CLAUSULA_FINANCEIRA}."),
                new BlocoContrato(BlocoContrato.ANTES_VALORES, BlocoContrato.CLAUSULA,
                        "É permitido ao CONTRATANTE-ALUNO participar das atividades extracurriculares promovidas na "
                        + "unidade CONTRATADA dentro do devido nível."),
                new BlocoContrato(BlocoContrato.ANTES_VALORES, BlocoContrato.CLAUSULA,
                        "O CONTRATANTE-ALUNO deverá ter frequência não inferior a 75% (setenta e cinco porcento) e "
                        + "aproveitamento mínimo de 70% (setenta porcento) para que possa prosseguir para o estágio "
                        + "seguinte."),
                new BlocoContrato(BlocoContrato.ANTES_VALORES, BlocoContrato.CLAUSULA,
                        "É de responsabilidade da FLY HIGH IDIOMAS, a orientação pedagógica dos cursos, bem como a "
                        + "seleção de material didático, cabendo à unidade CONTRATADA definir preços, fixar data para "
                        + "início das turmas, dias, horários de aulas e provas, formação de turmas e mudança de "
                        + "professores. (Vale lembrar que não garantimos a exclusividade de professores, sendo assim, não "
                        + "há opção de escolha."),
                new BlocoContrato(BlocoContrato.ANTES_VALORES, BlocoContrato.CLAUSULA,
                        "As turmas serão formadas com no mínimo 07 (sete) alunos. Nos casos de turmas vigentes com "
                        + "número inferior a 7 alunos, estes poderão sofrer uma redução na carga horária semanal de até "
                        + "50% ou serão vinculados a modalidade do curso VIP. Sendo facultado à CONTRATADA, até 03 (três) "
                        + "dias antes do início das aulas, cancelar aquelas com número inferior, ressalvado, nesse caso, o "
                        + "direito do CONTRATANTE-ALUNO de optar por vaga existente em outras turmas do mesmo nível ou "
                        + "pleitear a devolução dos valores pagos (parcelas e/ou material)."),
                new BlocoContrato(BlocoContrato.ANTES_VALORES, BlocoContrato.CLAUSULA,
                        "Para aproveitamento dos descontos referentes a promoções, planos de incentivos e convênios, "
                        + "entre outros, é necessário que o CONTRATANTE-ALUNO efetue o pagamento até o dia do vencimento e "
                        + "comprove a condição de beneficiário a cada novo estágio."),
                new BlocoContrato(BlocoContrato.ANTES_VALORES, BlocoContrato.CLAUSULA,
                        "Compromete-se o CONTRATANTE-ALUNO a efetuar o pagamento das obrigações financeiras assumidas na "
                        + "forma e prazo abaixo estipulados:"),
                new BlocoContrato(BlocoContrato.DEPOIS_VALORES, BlocoContrato.PARAGRAFO,
                        "Parágrafo Único - Em caso de falta de pagamento no vencimento, o valor será acrescido de multa "
                        + "contratual de 2% (dois por cento), dos juros de mora diária de R$ 1,50 (um real e cinquenta "
                        + "centavos) e da correção monetária com base na tabela utilizada pelo Poder Judiciário ou outro "
                        + "índice inflacionário, até a data do efetivo pagamento."),
                new BlocoContrato(BlocoContrato.DEPOIS_VALORES, BlocoContrato.CLAUSULA,
                        "Em caso de desistência do curso antes do início das aulas, a quantia paga a título de "
                        + "matrícula/parcela será restituída ao CONTRATANTE-ALUNO, deduzido o percentual de 10% (dez por "
                        + "cento) correspondente às despesas administrativas incorridas pela CONTRATADA."),
                new BlocoContrato(BlocoContrato.DEPOIS_VALORES, BlocoContrato.CLAUSULA,
                        "O CONTRATANTE-ALUNO poderá cancelar unilateralmente o contrato, resguardado o direito da "
                        + "CONTRATADA de reter ou cobrar o valor correspondente às aulas dadas, bem como os percentuais de "
                        + "10% (dez por cento) para contrato anual/semestral, sobre a importância que remanesceria até a "
                        + "conclusão do curso."),
                new BlocoContrato(BlocoContrato.DEPOIS_VALORES, BlocoContrato.CLAUSULA,
                        "Em caso de trancamento, o valor das parcelas correspondentes às aulas não assistidas pelo "
                        + "CONTRATANTE-ALUNO será convertido em crédito de horas/aulas, devendo o mesmo submeter-se a "
                        + "teste de nivelamento caso o seu retorno ocorra após 06 (seis) meses."),
                new BlocoContrato(BlocoContrato.DEPOIS_VALORES, BlocoContrato.CLAUSULA,
                        "No caso de desistência após 75% (setenta e cinco por cento) da carga horária total contratada "
                        + "ter sido ministrada, serão devidas as parcelas restantes, as quais deverão ser quitadas pelo "
                        + "CONTRATANTE-ALUNO nas respectivas datas de vencimento."),
                new BlocoContrato(BlocoContrato.DEPOIS_VALORES, BlocoContrato.CLAUSULA,
                        "Os requerimentos de desistência e trancamento deverão ser formalizados por escrito pelo "
                        + "CONTRATANTE-ALUNO, mediante protocolo na secretaria da CONTRATADA, ocasião em que se apurarão "
                        + "os valores mencionados nas cláusulas precedentes."),
                new BlocoContrato(BlocoContrato.DEPOIS_VALORES, BlocoContrato.CLAUSULA,
                        "O CONTRATANTE-ALUNO, desde já, autoriza a divulgação de seu nome e imagem e/ou do próprio "
                        + "aluno(a), a título gratuito e por prazo indeterminado, sempre de forma honrosa, atrelada a "
                        + "divulgação da marca FLY HIGH IDIOMAS em eventos, website e murais das escolas FLY HIGH IDIOMAS."),
                new BlocoContrato(BlocoContrato.DEPOIS_VALORES, BlocoContrato.CLAUSULA,
                        "Poderão ser cobradas taxas de matrícula, rematrícula, transferência de turma, 2ª chamada, "
                        + "trancamento e desistência, referentes às despesas administrativas incorridas pela CONTRATADA, "
                        + "observada tabela vigente da unidade na ocasião do evento."),
                new BlocoContrato(BlocoContrato.DEPOIS_VALORES, BlocoContrato.CLAUSULA,
                        "Estando o CONTRATANTE-ALUNO adimplente com o plano de pagamento ajustado na cláusula "
                        + "{CLAUSULA_FINANCEIRA}, renovar-se-á automaticamente o presente contrato pela confirmação da "
                        + "matrícula e/ou aquisição do material didático para o estágio seguinte."),
                new BlocoContrato(BlocoContrato.DEPOIS_VALORES, BlocoContrato.CLAUSULA,
                        "Os valores do presente instrumento estão expressos em reais e poderão ser reajustados na forma "
                        + "da legislação vigente, de acordo com os índices indicados pelo Governo."),
                new BlocoContrato(BlocoContrato.DEPOIS_VALORES, BlocoContrato.CLAUSULA,
                        "Elegem as partes o Foro da Comarca de {ESCOLA_COMARCA} para conhecer e dirimir as dúvidas ou "
                        + "discussões oriundas deste contrato, preterindo qualquer outro por mais privilegiado que seja.")
        );
    }

    private static List<BlocoContrato> blocosVip() {
        return List.of(
                new BlocoContrato(BlocoContrato.ABERTURA, BlocoContrato.CLAUSULA,
                        "A CONTRATADA ministrará aulas de línguas estrangeiras, de acordo com as diretrizes pedagógicas "
                        + "e metodológicas de ensino desenvolvidas pela {ESCOLA_RAZAO_SOCIAL}, (de forma presencial e/ou "
                        + "outra em virtude de situações atípicas) conferindo ao CONTRATANTE-ALUNO declaração ou "
                        + "certificado de conclusão ao término do curso ou estágio, abaixo especificado assim que "
                        + "requerido:"),
                new BlocoContrato(BlocoContrato.ANTES_VALORES, BlocoContrato.CLAUSULA,
                        "Em todos os estágios do curso, é obrigatório o uso pelo CONTRATANTE-ALUNO do material didático "
                        + "sugerido pela FLY HIGH IDIOMAS, e/ou por ele autorizado. Vedada a reprodução, sob pena de "
                        + "violação de direitos autorais."),
                new BlocoContrato(BlocoContrato.ANTES_VALORES, BlocoContrato.PARAGRAFO,
                        "Parágrafo Único. O material didático deverá ser pago junto com a mensalidade referente ao "
                        + "primeiro mês de cada um dos estágios cursados pelo aluno, conforme estabelecido na cláusula "
                        + "{CLAUSULA_FINANCEIRA}."),
                new BlocoContrato(BlocoContrato.ANTES_VALORES, BlocoContrato.CLAUSULA,
                        "É permitido ao CONTRATANTE-ALUNO participar das atividades extracurriculares promovidas na "
                        + "unidade CONTRATADA dentro do devido nível."),
                new BlocoContrato(BlocoContrato.ANTES_VALORES, BlocoContrato.CLAUSULA,
                        "O CONTRATANTE-ALUNO deverá ter frequência não inferior a 75% (setenta e cinco porcento) e "
                        + "aproveitamento mínimo de 70% (setenta porcento) para que possa prosseguir para o estágio "
                        + "seguinte."),
                new BlocoContrato(BlocoContrato.ANTES_VALORES, BlocoContrato.CLAUSULA,
                        "É de responsabilidade da FLY HIGH IDIOMAS, a orientação pedagógica dos cursos, bem como a "
                        + "seleção de material didático, cabendo à unidade CONTRATADA definir preços, fixar data para "
                        + "início das aulas, dias, horários de aulas e provas. (Vale lembrar que não garantimos a "
                        + "exclusividade de professores, sendo assim, não há opção de escolha."),
                new BlocoContrato(BlocoContrato.ANTES_VALORES, BlocoContrato.CLAUSULA,
                        "Para aproveitamento dos descontos referentes a promoções, planos de incentivos e convênios, "
                        + "entre outros, é necessário que o CONTRATANTE-ALUNO efetue o pagamento até o dia do vencimento e "
                        + "comprove a condição de beneficiário a cada novo estágio."),
                new BlocoContrato(BlocoContrato.ANTES_VALORES, BlocoContrato.CLAUSULA,
                        "Compromete-se o CONTRATANTE-ALUNO a efetuar o pagamento das obrigações financeiras assumidas na "
                        + "forma e prazo abaixo estipulados, (vale lembrar que os valores mensais serão computados ao "
                        + "término de cada mês em número de horas (H) aulas (A) prestadas e multiplicado pelo valor "
                        + "vigente de R$ {VALOR_HORA_AULA} H/A - comprovado pelo registro no diário de classe do aluno)."),
                new BlocoContrato(BlocoContrato.DEPOIS_VALORES, BlocoContrato.PARAGRAFO,
                        "Parágrafo Único - Em caso de falta de pagamento no vencimento, o valor será acrescido de multa "
                        + "contratual de 2% (dois por cento), dos juros de mora diária de R$ 1,50 (um real e cinquenta "
                        + "centavos) e da correção monetária com base na tabela utilizada pelo Poder Judiciário ou outro "
                        + "índice inflacionário, até a data do efetivo pagamento."),
                new BlocoContrato(BlocoContrato.DEPOIS_VALORES, BlocoContrato.CLAUSULA,
                        "Em caso de desistência do curso antes do início das aulas, a quantia paga a título de "
                        + "matrícula/parcela será restituída ao CONTRATANTE-ALUNO, deduzido o percentual de 10% (dez por "
                        + "cento) correspondente às despesas administrativas incorridas pela CONTRATADA."),
                new BlocoContrato(BlocoContrato.DEPOIS_VALORES, BlocoContrato.CLAUSULA,
                        "O CONTRATANTE-ALUNO poderá cancelar unilateralmente o contrato, resguardado o direito da "
                        + "CONTRATADA de reter ou cobrar o valor correspondente às aulas dadas."),
                new BlocoContrato(BlocoContrato.DEPOIS_VALORES, BlocoContrato.CLAUSULA,
                        "Em caso de trancamento ou desistência, o valor das parcelas correspondentes às aulas não "
                        + "assistidas pelo CONTRATANTE-ALUNO será convertido em crédito de horas/aulas, devendo o mesmo "
                        + "submeter-se a teste de nivelamento caso o seu retorno ocorra após 06 (seis) meses."),
                new BlocoContrato(BlocoContrato.DEPOIS_VALORES, BlocoContrato.CLAUSULA,
                        "Os requerimentos de desistência e trancamento deverão ser formalizados por escrito pelo "
                        + "CONTRATANTE-ALUNO, mediante protocolo na secretaria da CONTRATADA, ocasião em que se apurarão "
                        + "os valores mencionados nas cláusulas precedentes."),
                new BlocoContrato(BlocoContrato.DEPOIS_VALORES, BlocoContrato.CLAUSULA,
                        "O CONTRATANTE-ALUNO, desde já, autoriza a divulgação de seu nome e imagem e/ou do próprio "
                        + "aluno(a), a título gratuito e por prazo indeterminado, sempre de forma honrosa, atrelada a "
                        + "divulgação da marca FLY HIGH IDIOMAS em eventos, website e murais das escolas FLY HIGH IDIOMAS."),
                new BlocoContrato(BlocoContrato.DEPOIS_VALORES, BlocoContrato.CLAUSULA,
                        "Poderão ser cobradas taxas de matrícula, rematrícula, transferência de turma, 2ª chamada, "
                        + "trancamento e desistência, referentes às despesas administrativas incorridas pela CONTRATADA, "
                        + "observada tabela vigente da unidade na ocasião do evento."),
                new BlocoContrato(BlocoContrato.DEPOIS_VALORES, BlocoContrato.CLAUSULA,
                        "Estando o CONTRATANTE-ALUNO adimplente com o plano de pagamento ajustado na cláusula "
                        + "{CLAUSULA_FINANCEIRA}, renovar-se-á automaticamente o presente contrato pela confirmação da "
                        + "matrícula e/ou aquisição do material didático para o estágio seguinte."),
                new BlocoContrato(BlocoContrato.DEPOIS_VALORES, BlocoContrato.CLAUSULA,
                        "Os valores do presente instrumento estão expressos em reais e poderão ser reajustados na forma "
                        + "da legislação vigente, de acordo com os índices indicados pelo Governo."),
                new BlocoContrato(BlocoContrato.DEPOIS_VALORES, BlocoContrato.CLAUSULA,
                        "Elegem as partes o Foro da Comarca de {ESCOLA_COMARCA} para conhecer e dirimir as dúvidas ou "
                        + "discussões oriundas deste contrato, preterindo qualquer outro por mais privilegiado que seja.")
        );
    }

    static ModeloContrato criar(String tipo) {
        boolean vip = "VIP".equals(tipo);
        ModeloContrato m = new ModeloContrato();
        m.setTipoContrato(tipo);
        m.setTitulo("Contrato de Prestação de Serviços");
        m.setSubtitulo(vip ? "de Ensino de Língua Estrangeira - VIP" : "de Ensino de Língua Estrangeira");
        m.setEscolaRazaoSocial("FLY HIGH IDIOMAS LTDA ME");
        m.setEscolaCnpj("28.715.122/0001-83");
        m.setEscolaEndereco("AVENIDA PADRE JOÃO SCHNEIDER - 915, CENTRO, MARTINÓPOLIS, 19.500-000");
        m.setEscolaCidade("Martinópolis - SP");
        m.setEscolaComarca("Martinópolis");
        m.setPreambulo(PREAMBULO);
        m.setRotuloAssinaturaContratante("O (A) Contratante");
        m.setRotuloAssinaturaContratada("Mantenedor (A) Contratado (A)");
        m.setBlocos(new ArrayList<>(vip ? blocosVip() : blocosNormal()));
        m.setTestemunhas(new ArrayList<>(List.of(
                new TestemunhaContrato("Maria Fernanda S. de Melo", "406.657.368-19"),
                new TestemunhaContrato("Antonio Tavares Junior", "446.578.258-60"),
                new TestemunhaContrato("Bruna Teixeira Souza", "458.218.838-90"),
                new TestemunhaContrato("Vitória Martins Silva", "434.633.788-09")
        )));
        return m;
    }
}
