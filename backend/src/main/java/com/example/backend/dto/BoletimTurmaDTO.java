package com.example.backend.dto;

import lombok.Data;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

/**
 * Boletim completo de uma turma: cabeçalho, atividades e a linha de cada aluno.
 */
@Data
public class BoletimTurmaDTO {

    private Long idTurma;
    private String codigoTurma;
    private String curso;
    private String professor;
    private String semestreAno;

    private int totalAulas;
    private int totalAvaliacoes;
    private int totalAlunos;

    // Modelo da turma (400 ou 500), quanto as atividades cadastradas já somam
    // e o divisor que leva a soma para a escala de 0 a 100 (4 ou 5)
    private Double pontuacaoTotal;
    private Double pontosCadastrados;
    private Double divisor;
    private boolean modeloDefinido;

    // Critérios de aprovação (configuráveis no application.properties)
    private Double notaMinima;
    private Double frequenciaMinima;

    private List<AvaliacaoResumo> avaliacoes = new ArrayList<>();
    private List<BoletimAlunoDTO> alunos = new ArrayList<>();

    @Data
    public static class AvaliacaoResumo {
        private Long idAvaliacao;
        private String titulo;
        private String categoria;
        private String etapa;
        private Double notaMaxima;
        private LocalDate data;
        private int notasLancadas;
    }
}
