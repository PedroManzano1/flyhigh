package com.example.backend.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

@Entity
@Table(name = "vinculo_aluno_responsavel")
@Data
public class VinculoAlunoResponsavel {

    @EmbeddedId
    private VinculoId id = new VinculoId();

    @ManyToOne
    @MapsId("id_aluno")
    @JoinColumn(name = "id_aluno")
    // Adicione esta anotação para cascatear a exclusão do Aluno
    @OnDelete(action = OnDeleteAction.CASCADE)
    private Aluno aluno;

    @ManyToOne
    @MapsId("id_responsavel")
    @JoinColumn(name = "id_responsavel")
    // Adicione esta anotação para cascatear a exclusão do Responsavel
    @OnDelete(action = OnDeleteAction.CASCADE)
    private Responsavel responsavel;

    private String grauParentesco;

    @JsonProperty("isResponsavelFinanceiro")
    @Column(name = "is_responsavel_financeiro")
    private boolean isResponsavelFinanceiro;
}