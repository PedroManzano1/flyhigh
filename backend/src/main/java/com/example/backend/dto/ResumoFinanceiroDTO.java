package com.example.backend.dto;

import lombok.Data;

/** Indicadores do topo da tela do financeiro. */
@Data
public class ResumoFinanceiroDTO {
    private double valorPendente;
    private long quantidadePendentes;

    private double valorAtrasado;
    private long quantidadeAtrasadas;
    private long alunosInadimplentes;

    private double recebidoNoMes;
    private long quantidadePagasNoMes;

    private double previstoNoMes;
}
