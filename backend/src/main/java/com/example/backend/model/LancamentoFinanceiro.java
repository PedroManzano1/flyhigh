package com.example.backend.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDate;

/**
 * Parcela gerada a partir do contrato (Estórias 7 e 8).
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
}
