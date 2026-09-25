package com.example.backend.dto;

import lombok.Data;

import java.time.LocalDate;

/** Corpo do "Marcar como paga": a data em que o dinheiro/PIX entrou de fato. */
@Data
public class BaixaParcelaDTO {
    private LocalDate dataPagamento;
    private String formaPagamento;
    private String observacao;
}
