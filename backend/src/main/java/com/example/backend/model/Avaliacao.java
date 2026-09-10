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

    // Peso da avaliação em porcentagem (0 a 100). A soma dos pesos da turma fecha 100%.
    @Column(name = "peso")
    private Double peso;

    @Column(name = "data")
    private LocalDate data;

    @ManyToOne
    @JoinColumn(name = "id_turma")
    private Turma turma;
}
