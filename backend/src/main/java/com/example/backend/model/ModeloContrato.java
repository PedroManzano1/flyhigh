package com.example.backend.model;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Uma versão do texto de um modelo de contrato (NORMAL ou VIP).
 *
 * Versão publicada nunca é alterada: para mudar uma cláusula cria-se uma versão
 * nova (rascunho), edita-se e publica-se. Cada contrato guarda o id da versão em que
 * foi feito, então a reimpressão de um contrato antigo sai com o texto original.
 */
@Entity
@Table(name = "modelo_contrato")
@Data
public class ModeloContrato {

    public static final String RASCUNHO = "RASCUNHO";
    public static final String VIGENTE = "VIGENTE";
    public static final String ARQUIVADO = "ARQUIVADO";

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_modelo_contrato")
    private Long idModeloContrato;

    // NORMAL ou VIP
    @Column(name = "tipo_contrato", nullable = false)
    private String tipoContrato;

    private Integer versao;

    // RASCUNHO, VIGENTE (só uma por tipo) ou ARQUIVADO
    private String status;

    // "O que mudou nesta versão", para o histórico
    @Column(name = "descricao_alteracao", length = 500)
    private String descricaoAlteracao;

    private LocalDateTime criadoEm;
    private String criadoPor;
    private LocalDateTime publicadoEm;
    private String publicadoPor;

    // --- Texto do contrato ---------------------------------------------------

    private String titulo;
    private String subtitulo;

    // Dados da escola ficam na versão porque saem impressos: trocar o CNPJ ou uma
    // testemunha não pode mudar a reimpressão de um contrato já assinado
    private String escolaRazaoSocial;
    private String escolaCnpj;
    @Column(length = 300)
    private String escolaEndereco;
    private String escolaCidade;
    private String escolaComarca;

    @Column(columnDefinition = "TEXT")
    private String preambulo;

    private String rotuloAssinaturaContratante;
    private String rotuloAssinaturaContratada;

    // Cláusulas e parágrafos na ordem do documento. A numeração é calculada na hora
    // de montar o contrato, por isso o texto não leva "Cláusula N."
    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "modelo_contrato_bloco", joinColumns = @JoinColumn(name = "id_modelo_contrato"))
    @OrderColumn(name = "posicao")
    private List<BlocoContrato> blocos = new ArrayList<>();

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "modelo_contrato_testemunha", joinColumns = @JoinColumn(name = "id_modelo_contrato"))
    @OrderColumn(name = "posicao")
    private List<TestemunhaContrato> testemunhas = new ArrayList<>();

    // Só para a tela de modelos: quantos contratos usam esta versão
    @Transient
    private Long contratosVinculados;
}
