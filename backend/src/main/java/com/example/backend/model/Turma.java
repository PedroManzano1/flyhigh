package com.example.backend.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalTime;

@Entity
@Table(name = "turmas")
@Data
public class Turma {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id_turma;

    @Column(name = "codigo_turma")
    private String codigoTurma;

    @Column(name = "dias_semana")
    private String diasSemana;

    @Column(name = "horario_inicio")
    private LocalTime horarioInicio;

    @Column(name = "horario_fim")
    private LocalTime horarioFim;

    @Column(name = "limite_vagas")
    private Integer limiteVagas;

    @Column(name = "semestre_ano")
    private String semestreAno;

    private String status;

    @ManyToOne
    @JoinColumn(name = "id_curso")
    private Curso curso;

    @ManyToOne
    @JoinColumn(name = "id_professor")
    private Usuario professor;
}