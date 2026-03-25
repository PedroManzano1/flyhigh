package com.example.backend.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDate;

@Entity
@Table(name = "alunos")
@Data
public class Aluno {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id_aluno;

    @Column(unique = true, nullable = false)
    private String numeroMatricula;

    private String nome;

    @Column(name = "data_nascimento")
    private LocalDate dataNascimento;

    private String rg;

    @Column(unique = true)
    private String cpf;

    @Column(name = "telefone_principal")
    private String telefonePrincipal;

    @Column(name = "telefone_secundario")
    private String telefoneSecundario;

    private String anoEscolar;

    @ManyToOne
    @JoinColumn(name = "id_endereco")
    private Endereco endereco;
}