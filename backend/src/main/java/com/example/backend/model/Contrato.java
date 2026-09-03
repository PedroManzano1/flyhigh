package com.example.backend.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDate;

@Entity
@Table(name = "CONTRATO")
@Data
public class Contrato {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_contrato")
    private Integer idContrato;

    @Column(name = "numeroContrato")
    private String numeroContrato;

    // Relacionamento com Aluno
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "id_aluno", referencedColumnName = "id_aluno")
    private Aluno aluno;

    // Relacionamento com Turma
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "id_turma", referencedColumnName = "id_turma")
    private Turma turma;

    @Column(name = "data_emissao")
    private LocalDate dataEmissao;

    // Outros campos do contrato vao ser adicionados depois quando o financeiro for desenvolvido
    @Column(name = "status")
    private String status;
}
