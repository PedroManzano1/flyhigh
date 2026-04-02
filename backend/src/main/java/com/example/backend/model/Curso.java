package com.example.backend.model;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "cursos")
@Data
public class Curso {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id_curso;

    private String nome;

    private String tipo;

    @Column(name = "carga_horaria_total")
    private Integer cargaHorariaTotal;

    @Column(name = "valor_base")
    private Double valorBase;

    @Column(name = "faixa_etaria")
    private String faixaEtaria;

    private Boolean ativo;
}
