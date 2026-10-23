package com.example.backend.dto;

import lombok.Data;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

/** Tudo o que a área do aluno mostra, numa chamada só. */
@Data
public class MinhaAreaDTO {

    private String alunoNome;
    private String alunoMatricula;

    // Um boletim por matrícula ativa, só com a linha do próprio aluno
    private List<BoletimTurmaDTO> boletins = new ArrayList<>();

    private List<ParcelaFinanceiraDTO> parcelas = new ArrayList<>();

    private List<Recado> recados = new ArrayList<>();

    @Data
    public static class Recado {
        private Long idRecado;
        private String titulo;
        private String mensagem;
        private LocalDate dataPublicacao;
        private LocalDate dataExpiracao;
        private String autor;
    }
}
