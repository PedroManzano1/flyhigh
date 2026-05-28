package com.example.backend.model;

import com.example.backend.model.Aluno;
import com.example.backend.model.NotaKey;
import jakarta.persistence.*;
import lombok.Data;

@Data
@Entity
@Table(name = "NOTA")
public class Nota {

    @EmbeddedId
    private NotaKey id = new NotaKey();

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("avaliacaoId")
    @JoinColumn(name = "id_avaliacao")
    private Avaliacao avaliacao; // Assumindo que você já tem a entidade Avaliacao

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("alunoId")
    @JoinColumn(name = "id_aluno")
    private Aluno aluno;

    @Column(name = "valorObtido")
    private Double valorObtido;
}