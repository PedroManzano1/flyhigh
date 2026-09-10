package com.example.backend.dto;

import lombok.Data;

import java.util.ArrayList;
import java.util.List;

/**
 * Linha do boletim: desempenho e assiduidade de um aluno na turma.
 * A nota final é a soma das notas calculadas (nota x peso%), não uma média simples.
 */
@Data
public class BoletimAlunoDTO {

    private Long idAluno;
    private String nome;
    private String numeroMatricula;

    // Uma entrada por avaliação da turma (valorObtido nulo = ainda não lançada)
    private List<ItemNota> notas = new ArrayList<>();

    private Double notaFinal;            // soma das notas calculadas, 2 casas
    private Double notaFinalArredondada; // mesma nota com 1 casa
    private Double pesoLancado;          // % de peso já lançado para este aluno
    private Double pesoTotal;            // % de peso cadastrado na turma

    private int avaliacoesLancadas;
    private int totalAvaliacoes;

    private int aulasRegistradas;
    private int presencas;
    private int faltas;
    private int faltasJustificadas;
    private int faltasConsecutivas;
    private Double percentualFrequencia;

    // APROVADO, REPROVADO, CURSANDO ou SEM_LANCAMENTOS
    private String situacao;
    private String observacao;

    @Data
    public static class ItemNota {
        private Long idAvaliacao;
        private String titulo;
        private Double notaMaxima;
        private Double peso;           // percentual da avaliação
        private Double valorObtido;    // nota lançada, na escala da avaliação
        private Double notaBase10;     // nota convertida para 0 a 10
        private Double notaCalculada;  // notaBase10 x peso%
    }
}
