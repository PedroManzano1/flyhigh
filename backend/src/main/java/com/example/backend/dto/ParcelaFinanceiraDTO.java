package com.example.backend.dto;

import com.example.backend.model.Contrato;
import com.example.backend.model.LancamentoFinanceiro;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;

/**
 * Linha da tela do financeiro. A entidade esconde aluno e responsável no JSON
 * para não repetir o grafo do contrato; aqui o que a secretaria precisa ver
 * para cobrar vem achatado numa linha só.
 */
@Data
public class ParcelaFinanceiraDTO {

    private Long idLancamento;
    private String tipo;
    private Integer numeroParcela;
    private Integer totalParcelas;
    private Integer numeroAulas;
    private Double valorOriginal;
    private Double valor;
    private LocalDate dataVencimento;
    private LocalDate dataPagamento;
    private String status;
    private Long diasEmAtraso;

    private String formaPagamento;
    private String observacaoPagamento;
    private String usuarioBaixa;
    private LocalDateTime dataRegistroBaixa;

    private Integer idContrato;
    private String numeroContrato;
    private String tipoContrato;
    private String statusContrato;

    private Long idAluno;
    private String alunoNome;
    private String alunoMatricula;

    private String responsavelNome;
    private String responsavelTelefone;

    private String turmaCodigo;
    private String cursoNome;

    /** Calcula o status de leitura sem mexer na entidade, que pode estar gerenciada. */
    public static ParcelaFinanceiraDTO de(LancamentoFinanceiro parcela, LocalDate hoje) {
        ParcelaFinanceiraDTO dto = new ParcelaFinanceiraDTO();
        dto.setIdLancamento(parcela.getIdLancamento());
        dto.setTipo(parcela.getTipo());
        dto.setNumeroParcela(parcela.getNumeroParcela());
        dto.setTotalParcelas(parcela.getTotalParcelas());
        dto.setNumeroAulas(parcela.getNumeroAulas());
        dto.setValorOriginal(parcela.getValorOriginal());
        dto.setValor(parcela.getValor());
        dto.setDataVencimento(parcela.getDataVencimento());
        dto.setDataPagamento(parcela.getDataPagamento());
        dto.setStatus(parcela.statusEm(hoje));
        dto.setFormaPagamento(parcela.getFormaPagamento());
        dto.setObservacaoPagamento(parcela.getObservacaoPagamento());
        dto.setUsuarioBaixa(parcela.getUsuarioBaixa());
        dto.setDataRegistroBaixa(parcela.getDataRegistroBaixa());

        if (LancamentoFinanceiro.ATRASADA.equals(dto.getStatus()) && parcela.getDataVencimento() != null) {
            dto.setDiasEmAtraso(ChronoUnit.DAYS.between(parcela.getDataVencimento(), hoje));
        } else {
            dto.setDiasEmAtraso(0L);
        }

        Contrato contrato = parcela.getContrato();
        if (contrato != null) {
            dto.setIdContrato(contrato.getIdContrato());
            dto.setNumeroContrato(contrato.getNumeroContrato());
            dto.setTipoContrato(contrato.getTipoContrato());
            dto.setStatusContrato(contrato.getStatus());
            dto.setCursoNome(contrato.getCursoNome());

            if (contrato.getAluno() != null) {
                dto.setIdAluno(contrato.getAluno().getId_aluno());
                dto.setAlunoNome(contrato.getAluno().getNome());
                dto.setAlunoMatricula(contrato.getAluno().getNumeroMatricula());
            }
            if (contrato.getResponsavel() != null) {
                dto.setResponsavelNome(contrato.getResponsavel().getNome());
                dto.setResponsavelTelefone(contrato.getResponsavel().getTelefonePrincipal());
            }
            if (contrato.getTurma() != null) {
                dto.setTurmaCodigo(contrato.getTurma().getCodigoTurma());
            }
        }
        return dto;
    }
}
