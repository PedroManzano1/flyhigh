package com.example.backend.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDate;

@Data
@Entity
@Table(name = "AULA")
public class Aula {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_aula")
    private Integer idAula;

    @Column(name = "dataAula")
    private LocalDate dataAula;

    @Column(name = "conteudoLecionado")
    private String conteudoLecionado;

    // Relacionamento com Turma
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_turma", referencedColumnName = "id_turma")
    private Turma turma;
}