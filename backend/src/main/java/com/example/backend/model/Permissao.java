package com.example.backend.model;

import jakarta.persistence.*;
import lombok.Data;
import com.fasterxml.jackson.annotation.JsonIgnore; // 1. Adicione este import aqui em cima

@Data
@Entity
@Table(name = "PERMISSAO")
public class Permissao {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer idPermissao;

    private String modulo;
    private boolean podeLer;
    private boolean podeEscrever;
    private boolean podeExcluir;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_perfil")
    @JsonIgnore
    private Perfil perfil;
}