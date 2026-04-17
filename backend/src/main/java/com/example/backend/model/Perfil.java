package com.example.backend.model;
import jakarta.persistence.*;
import lombok.Data;
import java.util.List;

@Data
@Entity
@Table(name = "PERFIL")
public class Perfil {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer idPerfil;

    private String nomePerfil; // Ex: "DIRETOR", "SECRETARIO"
    private String descricao;

    // Trazer as permissões junto com o perfil
    @OneToMany(mappedBy = "perfil", cascade = CascadeType.ALL, fetch = FetchType.EAGER, orphanRemoval = true)
    private List<Permissao> permissoes;
}