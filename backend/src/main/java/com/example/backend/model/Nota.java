package com.example.backend.model;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "notas")
@Data
public class Nota {

    @EmbeddedId
    private NotaKey id = new NotaKey();

    @ManyToOne
    @MapsId("avaliacaoId")
    @JoinColumn(name = "id_avaliacao")
    private Avaliacao avaliacao;

    @ManyToOne
    @MapsId("alunoId")
    @JoinColumn(name = "id_aluno")
    private Aluno aluno;

    @Column(name = "valor_obtido")
    private Double valorObtido;
}