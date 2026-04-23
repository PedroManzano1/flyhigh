package com.example.backend.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDate;

@Entity
@Table(name = "recado_geral")
@Data
public class RecadoGeral {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id_recado;

    @Column(nullable = false)
    private String titulo;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String mensagem;

    @Column(name = "data_publicacao", nullable = false)
    private LocalDate dataPublicacao;

    @Column(name = "data_expiracao")
    private LocalDate dataExpiracao;

    @Column(name = "arquivo_anexo")
    private String arquivoAnexo;

    // Relacionamento com a classe Usuario que você já criou
    @ManyToOne
    @JoinColumn(name = "id_usuario_autor", nullable = false)
    private Usuario usuarioAutor;
}