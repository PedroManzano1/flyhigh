package com.example.backend.dto;

import lombok.Data;

import java.util.ArrayList;
import java.util.List;

/**
 * Uma linha da consulta de inadimplência: o aluno, quem responde pelo financeiro
 * dele e as parcelas que passaram no filtro. Os totais consideram todas as
 * parcelas do aluno, não só as filtradas, para mostrar a situação completa.
 */
@Data
public class SituacaoFinanceiraAlunoDTO {

    private Long idAluno;
    private String alunoNome;
    private String alunoMatricula;

    // Só quem está marcado como "Responsável Financeiro" no vínculo com o aluno
    private List<ResponsavelFinanceiroDTO> responsaveisFinanceiros = new ArrayList<>();

    private double totalAtrasado;
    private long quantidadeAtrasadas;
    private long maiorAtrasoDias;
    private double totalAVencer;
    private double totalPago;

    private List<ParcelaFinanceiraDTO> parcelas = new ArrayList<>();

    @Data
    public static class ResponsavelFinanceiroDTO {
        private Long idResponsavel;
        private String nome;
        private String telefone;
        private String parentesco;
    }
}
