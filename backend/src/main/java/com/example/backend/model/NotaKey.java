package com.example.backend.model;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.io.Serializable;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Embeddable
public class NotaKey implements Serializable {

    @Column(name = "id_avaliacao")
    private Integer avaliacaoId;

    @Column(name = "id_aluno")
    private Integer alunoId;
}