package com.example.backend.dto;

import lombok.Data;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

/**
 * Boletim completo de uma turma: cabeçalho, avaliações aplicadas e a linha de cada aluno.
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

    // Soma dos pesos cadastrados. Deve fechar 100% para o boletim estar completo.
    private Double pesoTotal;

    // Critérios de aprovação aplicados (configuráveis no application.properties)
    private Double mediaMinima;
    private Double frequenciaMinima;

    private List<AvaliacaoResumo> avaliacoes = new ArrayList<>();
    private List<BoletimAlunoDTO> alunos = new ArrayList<>();

    @Data
    public static class AvaliacaoResumo {
        private Long idAvaliacao;
        private String titulo;
        private Double notaMaxima;
        private Double peso;
        private LocalDate data;
        private int notasLancadas;
    }
}
