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

    @Column(name = "titulo")
    private String titulo;

    @Column(name = "nota_maxima")
    private Double notaMaxima;

    @Column(name = "data")
    private LocalDate data;

    @ManyToOne
    @JoinColumn(name = "id_turma")
    private Turma turma;
}