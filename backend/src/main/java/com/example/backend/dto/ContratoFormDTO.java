package com.example.backend.dto;

import com.example.backend.model.Contrato;
import com.example.backend.model.LancamentoFinanceiro;
import lombok.Data;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

/**
 * Corpo usado para gravar e ler um contrato junto com as suas parcelas.
 *
 * Se as listas de parcelas vierem vazias, o backend gera as parcelas do curso e do
 * material a partir da quantidade e do primeiro vencimento informados.
 */
@Data
public class ContratoFormDTO {

    private Contrato contrato;

    private List<LancamentoFinanceiro> parcelasCurso = new ArrayList<>();
    private List<LancamentoFinanceiro> parcelasMaterial = new ArrayList<>();

    // Usados só quando as listas acima não vêm preenchidas
    private Integer quantidadeParcelasCurso;
    private LocalDate primeiroVencimentoCurso;
    private Integer quantidadeParcelasMaterial;
    private LocalDate primeiroVencimentoMaterial;
}
