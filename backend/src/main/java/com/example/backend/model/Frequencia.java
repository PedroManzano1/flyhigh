package com.example.backend.model;

import jakarta.persistence.*;
import lombok.Data;

@Data
@Entity
@Table(name = "FREQUENCIA")
public class Frequencia {

    @EmbeddedId
    private FrequenciaKey id = new FrequenciaKey();

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("aulaId")
    @JoinColumn(name = "id_aula")
    private Aula aula;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("alunoId")
    @JoinColumn(name = "id_aluno")
    private Aluno aluno;

    @Column(name = "statusPresenca")
    private String statusPresenca; // Ex: "PRESENTE", "FALTA", "ATRASO"

    @Column(name = "observacao")
    private String observacao;
}