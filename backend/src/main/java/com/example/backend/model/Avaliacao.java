package com.example.backend.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDate;

@Data
@Entity
@Table(name = "AVALIACAO")
public class Avaliacao {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_avaliacao")
    private Integer idAvaliacao;

    @Column(name = "titulo")
    private String titulo;

    @Column(name = "notaMaxima")
    private Double notaMaxima;

    @Column(name = "data")
    private LocalDate data;

    // Relacionamento com Turma
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_turma", referencedColumnName = "id_turma")
    private Turma turma;
}