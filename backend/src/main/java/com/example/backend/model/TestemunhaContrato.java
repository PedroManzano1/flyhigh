package com.example.backend.model;

import jakarta.persistence.Embeddable;
import lombok.Data;

/** Testemunha impressa no rodapé do contrato. */
@Embeddable
@Data
public class TestemunhaContrato {

    private String nome;
    private String documento;

    public TestemunhaContrato() {
    }

    public TestemunhaContrato(String nome, String documento) {
        this.nome = nome;
        this.documento = documento;
    }
}
