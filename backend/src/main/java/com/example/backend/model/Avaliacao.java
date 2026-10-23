package com.example.backend.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDate;

@Entity
@Table(name = "avaliacoes")
@Data
public class Avaliacao {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id_avaliacao;

    // "Written Check 1st", "Homework 2nd"... ou um título livre
    @Column(name = "titulo")
    private String titulo;

    // Coluna da planilha da escola (Written Check, Oral Check, Project, Homework,
    // Performance, Attitude) e a etapa dentro dela (1st a 4th, Mid, Final)
    @Column(name = "categoria")
    private String categoria;

    @Column(name = "etapa")
    private String etapa;

    // Quantos pontos a atividade vale. A soma das atividades fecha a pontuação da turma.
    @Column(name = "nota_maxima")
    private Double notaMaxima;

    // Posição na planilha; as atividades do modelo já nascem na ordem certa
    @Column(name = "ordem")
    private Integer ordem;

    // Opcional: as atividades do modelo são criadas sem data
    @Column(name = "data")
    private LocalDate data;

    @ManyToOne
    @JoinColumn(name = "id_turma")
    private Turma turma;
}
