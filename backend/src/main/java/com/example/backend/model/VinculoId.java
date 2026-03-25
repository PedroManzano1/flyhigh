package com.example.backend.model;

import jakarta.persistence.Embeddable;
import lombok.Data;
import java.io.Serializable;

@Embeddable
@Data
public class VinculoId implements Serializable {
    private Long id_aluno;
    private Long id_responsavel;
}