package com.example.backend.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDate;

@Entity
@Table(name = "aulas") // Padronizado no plural minúsculo como "turmas", ou mude para "AULA" se preferir
@Data
public class Aula {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id_aula; // Mudado para Long e com underline para seguir o seu padrão

    @Column(name = "data_aula")
    private LocalDate dataAula;

    @Column(name = "conteudo_lecionado")
    private String conteudoLecionado;

    @ManyToOne
    @JoinColumn(name = "id_turma")
    private Turma turma;
}