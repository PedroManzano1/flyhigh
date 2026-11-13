package com.example.backend.model;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * Uma linha por ano letivo em que o ano escolar dos alunos já foi avançado.
 * É o que impede a rotina de rodar duas vezes no mesmo ano e o que permite
 * recuperar a virada quando o servidor estava desligado em 1º de janeiro.
 */
@Entity
@Table(name = "atualizacao_ano_escolar")
@Data
public class AtualizacaoAnoEscolar {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_atualizacao")
    private Long idAtualizacao;

    // Ano que começou (ex.: 2027 = alunos avançados na virada de 2026 para 2027)
    @Column(name = "ano", unique = true, nullable = false)
    private Integer ano;

    @Column(name = "data_execucao")
    private LocalDateTime dataExecucao;

    @Column(name = "alunos_atualizados")
    private Integer alunosAtualizados;

    @Column(name = "observacao")
    private String observacao;
}
