package com.example.backend.model;

import com.fasterxml.jackson.annotation.JsonIncludeProperties;
import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDate;
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

    // Aberta, Em Andamento, Fechada (não aceita matrícula) ou Concluída (encerrada:
    // matrículas concluídas e diário travado; só pelo botão Encerrar turma)
    private String status;

    @Column(name = "data_encerramento")
    private LocalDate dataEncerramento;

    // Pontuação máxima da turma: 400 (nota final = soma ÷ 4) ou 500 (soma ÷ 5)
    @Column(name = "pontuacao_total")
    private Integer pontuacaoTotal;

    @ManyToOne
    @JoinColumn(name = "id_curso")
    private Curso curso;

    // No JSON sai só id e nome: o usuário inteiro trazia login, perfil com as
    // permissões e o CPF informado no cadastro
    @JsonIncludeProperties({"idUsuario", "nome"})
    @ManyToOne
    @JoinColumn(name = "id_professor")
    private Usuario professor;
}