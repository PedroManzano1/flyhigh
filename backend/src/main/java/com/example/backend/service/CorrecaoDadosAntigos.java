package com.example.backend.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

/**
 * Ao subir o backend, acerta dados gravados antes das regras atuais:
 * - CPF vazio vira nulo e matrícula vazia ganha um número (alunos e responsáveis);
 * - contrato já trancado ou cancelado ganha a data de interrupção, e as parcelas
 *   que vencem a partir dela deixam de ser cobradas.
 *
 * Fica separado dos services para a chamada passar pelo proxy do Spring e o
 * @Transactional valer. Rodar de novo não muda nada.
 */
@Component
public class CorrecaoDadosAntigos {

    private static final Logger log = LoggerFactory.getLogger(CorrecaoDadosAntigos.class);

    @Autowired
    private AlunoService alunoService;

    @Autowired
    private ResponsavelService responsavelService;

    @Autowired
    private ContratoService contratoService;

    @EventListener(ApplicationReadyEvent.class)
    public void corrigir() {
        executar("cadastros de alunos", alunoService::corrigirCadastrosAntigos);
        executar("cadastros de responsáveis", responsavelService::corrigirCadastrosAntigos);
        executar("contratos trancados/cancelados", contratoService::corrigirInterrompidosAntigos);
    }

    private void executar(String descricao, java.util.function.IntSupplier correcao) {
        try {
            int corrigidos = correcao.getAsInt();
            if (corrigidos > 0) {
                log.info("Correção de dados antigos: {} registro(s) em {}.", corrigidos, descricao);
            }
        } catch (RuntimeException e) {
            // Não impede o sistema de subir; a correção é tentada de novo no próximo início
            log.error("Não foi possível corrigir os {}", descricao, e);
        }
    }
}
