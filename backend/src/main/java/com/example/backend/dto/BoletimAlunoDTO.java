package com.example.backend.dto;

import lombok.Data;

import java.util.ArrayList;
import java.util.List;

/**
 * Linha do boletim: desempenho e assiduidade de um aluno na turma.
 * A nota final é a soma dos pontos dividida por 4 (Modelo 400) ou 5 (Modelo 500).
 */
@Data
public class BoletimAlunoDTO {

    private Long idAluno;
    private String nome;
    private String numeroMatricula;

    // Uma entrada por atividade da turma (valorObtido nulo = ainda não lançada)
    private List<ItemNota> notas = new ArrayList<>();

    private Double pontosObtidos;        // soma dos pontos do aluno
    private Double pontosLancados;       // quanto valiam as atividades já lançadas
    private Double notaFinal;            // pontosObtidos ÷ divisor, de 0 a 100, 2 casas
    private Double notaFinalArredondada; // mesma nota com 1 casa
    private Double aproveitamento;       // % dos pontos lançados que o aluno conseguiu
    private Double notaMaximaPossivel;   // nota final se tirar o máximo no que falta

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
        private String categoria;
        private String etapa;
        private Double notaMaxima;     // pontos que a atividade vale
        private Double valorObtido;    // pontos do aluno
    }
}
