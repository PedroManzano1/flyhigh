package com.example.backend.model;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.Data;

/** Uma cláusula ou um parágrafo do modelo de contrato. */
@Embeddable
@Data
public class BlocoContrato {

    public static final String CLAUSULA = "CLAUSULA";
    public static final String PARAGRAFO = "PARAGRAFO";

    // Onde o bloco aparece no documento
    public static final String ABERTURA = "ABERTURA";             // antes do quadro do curso
    public static final String ANTES_VALORES = "ANTES_VALORES";   // antes dos quadros de material e curso
    public static final String DEPOIS_VALORES = "DEPOIS_VALORES"; // depois dos quadros de valores

    private String secao;

    // CLAUSULA recebe número automático; PARAGRAFO sai como está escrito
    private String tipo;

    @Column(columnDefinition = "TEXT")
    private String texto;

    public BlocoContrato() {
    }

    public BlocoContrato(String secao, String tipo, String texto) {
        this.secao = secao;
        this.tipo = tipo;
        this.texto = texto;
    }
}
