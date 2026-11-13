package com.example.backend.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

/**
 * Ao subir o backend, garante a versão 1 dos modelos de contrato e liga a ela os
 * contratos antigos. Fica separado do service para o @Transactional valer.
 */
@Component
public class ModeloContratoInicializador {

    private static final Logger log = LoggerFactory.getLogger(ModeloContratoInicializador.class);

    @Autowired
    private ModeloContratoService modeloContratoService;

    @EventListener(ApplicationReadyEvent.class)
    public void aoIniciar() {
        try {
            modeloContratoService.garantirModelosIniciais();
        } catch (Exception e) {
            log.error("Não foi possível preparar os modelos de contrato", e);
        }
    }
}
