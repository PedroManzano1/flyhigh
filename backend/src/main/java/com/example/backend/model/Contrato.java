package com.example.backend.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDate;

/**
 * Contrato de prestação de serviços (Estória 7). É ele que matricula o aluno na turma.
 *
 * Dois modelos: NORMAL (parcelas fixas do curso) e VIP (cobrança por hora/aula).
 * Os dados da cláusula 1 ficam gravados aqui como cópia, e não apenas por referência,
 * porque o contrato assinado não pode mudar se o curso ou a turma forem editados depois.
 */
@Entity
@Table(name = "CONTRATO")
@Data
public class Contrato {

    public static final String NORMAL = "NORMAL";
    public static final String VIP = "VIP";

    // Situação da matrícula quando a turma é encerrada
    public static final String CONCLUIDO = "Concluído";

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_contrato")
    private Integer idContrato;

    @Column(name = "numeroContrato")
    private String numeroContrato;

    @Column(name = "tipo_contrato")
    private String tipoContrato;

    // Relacionamento com Aluno
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "id_aluno", referencedColumnName = "id_aluno")
    private Aluno aluno;

    // Relacionamento com Turma
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "id_turma", referencedColumnName = "id_turma")
    private Turma turma;

    // Contratante: o responsável financeiro do aluno
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "id_responsavel", referencedColumnName = "id_responsavel")
    private Responsavel responsavel;

    @Column(name = "nome_conjuge")
    private String nomeConjuge;

    @Column(name = "data_emissao")
    private LocalDate dataEmissao;

    // Situação da matrícula: Ativo, Trancado, Cancelado ou Concluído
    @Column(name = "status")
    private String status;

    // Dia em que a matrícula deixou de estar ativa (trancada ou cancelada).
    // As parcelas que vencem a partir dele ficam CANCELADA; as anteriores continuam
    // sendo dívida. Volta a nulo quando a matrícula é reativada.
    @Column(name = "data_interrupcao")
    private LocalDate dataInterrupcao;

    // Situação da assinatura: Aguardando Assinatura ou Assinado
    @Column(name = "status_assinatura")
    private String statusAssinatura;

    // --- Cláusula 1: cópia do que foi contratado -----------------------------

    @Column(name = "curso_nome")
    private String cursoNome;

    @Column(name = "tipo_curso")
    private String tipoCurso;

    @Column(name = "dias_semana")
    private String diasSemana;

    @Column(name = "horario")
    private String horario;

    @Column(name = "carga_horaria_estagio")
    private String cargaHorariaEstagio;

    @Column(name = "desconto_percentual")
    private Double descontoPercentual;

    @Column(name = "convenio")
    private String convenio;

    // --- Financeiro do curso -------------------------------------------------

    @Column(name = "valor_total_curso")
    private Double valorTotalCurso;

    @Column(name = "valor_com_desconto")
    private Double valorComDesconto;

    @Column(name = "dia_vencimento_curso")
    private Integer diaVencimentoCurso;

    // Valor da hora/aula citado na cláusula 7 do contrato VIP
    @Column(name = "valor_hora_aula")
    private Double valorHoraAula;

    // --- Financeiro do material ----------------------------------------------

    @Column(name = "valor_total_material")
    private Double valorTotalMaterial;

    @Column(name = "dia_vencimento_material")
    private Integer diaVencimentoMaterial;

    @Column(name = "observacoes", columnDefinition = "TEXT")
    private String observacoes;

    // Versão do modelo de contrato (texto das cláusulas) usada neste contrato.
    // Só o id, para a listagem de contratos não carregar o texto inteiro.
    @Column(name = "id_modelo_contrato")
    private Long idModeloContrato;
}
