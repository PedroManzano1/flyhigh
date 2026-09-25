package com.example.backend.dto;

import lombok.Data;

import java.time.LocalDate;

/** Renegociação de uma parcela em aberto: novo valor e/ou novo vencimento. */
@Data
public class AjusteParcelaDTO {
    private Double valor;
    private LocalDate dataVencimento;
}
