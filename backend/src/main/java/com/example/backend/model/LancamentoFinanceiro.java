package com.example.backend.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Parcela gerada a partir do contrato. A baixa é sempre manual: a escola não
 * processa cartão nem boleto, só registra o que já recebeu.
 *
 * No contrato NORMAL as parcelas do curso têm valor fixo; no VIP cada parcela
 * corresponde a um número de horas/aula, por isso o campo numeroAulas.
 */
@Entity
@Table(name = "lancamentos_financeiros")
@Data
public class LancamentoFinanceiro {

    public static final String MENSALIDADE = "MENSALIDADE";
    public static final String MATERIAL = "MATERIAL";

    public static final String PENDENTE = "PENDENTE";
    public static final String PAGA = "PAGA";
    public static final String ATRASADA = "ATRASADA";

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_lancamento")
    private Long idLancamento;

    // Sem aluno/turma/responsável no JSON: eles já vêm no contrato e repetir o
    // grafo inteiro em cada parcela deixaria a resposta enorme
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "id_contrato")
    @JsonIgnoreProperties({"aluno", "turma", "responsavel"})
    private Contrato contrato;

    // MENSALIDADE ou MATERIAL
    @Column(name = "tipo")
    private String tipo;

    @Column(name = "numero_parcela")
    private Integer numeroParcela;

    @Column(name = "total_parcelas")
    private Integer totalParcelas;

    // Somente no VIP: quantas horas/aula esta parcela cobre
    @Column(name = "numero_aulas")
    private Integer numeroAulas;

    @Column(name = "valor_original")
    private Double valorOriginal;

    // Valor efetivamente cobrado (já com o desconto aplicado)
    @Column(name = "valor")
    private Double valor;

    @Column(name = "data_vencimento")
    private LocalDate dataVencimento;

    @Column(name = "data_pagamento")
    private LocalDate dataPagamento;

    // PENDENTE, PAGA ou ATRASADA
    @Column(name = "status")
    private String status;

    // --- Dados da baixa manual -----------------------------------------------

    // Dinheiro, PIX, cartão... só para conferência do caixa
    @Column(name = "forma_pagamento")
    private String formaPagamento;

    @Column(name = "observacao_pagamento", length = 500)
    private String observacaoPagamento;

    // Login de quem deu a baixa e quando: é dinheiro, então precisa de rastro
    @Column(name = "usuario_baixa")
    private String usuarioBaixa;

    @Column(name = "data_registro_baixa")
    private LocalDateTime dataRegistroBaixa;

    // --- Regras da parcela ---------------------------------------------------

    public boolean estaPaga() {
        return PAGA.equalsIgnoreCase(status) || dataPagamento != null;
    }

    public void registrarPagamento(LocalDate data, String forma, String observacao, String usuario) {
        this.dataPagamento = data;
        this.formaPagamento = forma;
        this.observacaoPagamento = observacao;
        this.usuarioBaixa = usuario;
        this.dataRegistroBaixa = LocalDateTime.now();
        this.status = PAGA;
    }

    public void estornarPagamento() {
        this.dataPagamento = null;
        this.formaPagamento = null;
        this.observacaoPagamento = null;
        this.usuarioBaixa = null;
        this.dataRegistroBaixa = null;
        this.status = PENDENTE;
    }

    /** Status de leitura: vencida e sem baixa é ATRASADA. Não altera a parcela. */
    public String statusEm(LocalDate hoje) {
        if (estaPaga()) return PAGA;
        return dataVencimento != null && dataVencimento.isBefore(hoje) ? ATRASADA : PENDENTE;
    }

    /**
     * Grava o status de leitura no objeto, para ele sair certo no JSON. Quem chama
     * precisa estar em transação readOnly, senão o Hibernate transforma isso em UPDATE.
     */
    public void verificarAtraso(LocalDate hoje) {
        this.status = statusEm(hoje);
    }
}
