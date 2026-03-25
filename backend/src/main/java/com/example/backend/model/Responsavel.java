package com.example.backend.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDate;

@Entity
@Table(name = "responsaveis")
@Data
public class Responsavel {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id_responsavel;

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

    // Mapeamento da FK id_endereco
    @ManyToOne
    @JoinColumn(name = "id_endereco")
    private Endereco endereco;
}