package com.example.backend.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;

/**
 * Dispara a virada do ano escolar. Fica separado do AnoEscolarService para a chamada
 * passar pelo proxy do Spring e o @Transactional valer.
 *
 * O servidor da escola pode estar desligado à meia-noite do dia 1º de janeiro, então
 * a conferência não depende daquele horário: roda todo dia e também quando o backend
 * sobe, e aplica as viradas que ainda faltam.
 */
@Component
public class AgendadorAnoEscolar {

    private static final Logger log = LoggerFactory.getLogger(AgendadorAnoEscolar.class);

    @Autowired
    private AnoEscolarService anoEscolarService;

    @EventListener(ApplicationReadyEvent.class)
    public void aoIniciar() {
        conferir();
    }

    // Todo dia às 00:05, horário de Brasília; só faz algo no primeiro dia de um ano novo
    @Scheduled(cron = "0 5 0 * * *", zone = "America/Sao_Paulo")
    public void conferenciaDiaria() {
        conferir();
    }

    private void conferir() {
        try {
            anoEscolarService.atualizarSeVirouOAno(LocalDate.now(AnoEscolarService.FUSO).getYear());
        } catch (Exception e) {
            // Uma falha aqui não pode impedir o backend de subir; tenta de novo no dia seguinte
            log.error("Não foi possível atualizar o ano escolar dos alunos", e);
        }
    }
}
