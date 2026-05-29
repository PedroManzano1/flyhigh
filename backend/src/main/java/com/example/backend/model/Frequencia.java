package com.example.backend.model;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "frequencias")
@Data
public class Frequencia {

    @EmbeddedId
    private FrequenciaKey id = new FrequenciaKey();

    @ManyToOne
    @MapsId("aulaId")
    @JoinColumn(name = "id_aula")
    private Aula aula;

    @ManyToOne
    @MapsId("alunoId")
    @JoinColumn(name = "id_aluno")
    private Aluno aluno;

    @Column(name = "status_presenca")
    private String statusPresenca;

    @Column(name = "observacao")
    private String observacao;
}