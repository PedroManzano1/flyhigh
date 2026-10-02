package com.example.backend.repository;

import com.example.backend.model.LancamentoFinanceiro;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface LancamentoFinanceiroRepository extends JpaRepository<LancamentoFinanceiro, Long> {

    @Query("SELECT l FROM LancamentoFinanceiro l WHERE l.contrato.idContrato = :idContrato "
            + "ORDER BY l.tipo ASC, l.numeroParcela ASC")
    List<LancamentoFinanceiro> findByContratoId(@Param("idContrato") Integer idContrato);

    @Query("SELECT l FROM LancamentoFinanceiro l WHERE l.contrato.idContrato = :idContrato "
            + "AND l.tipo = :tipo ORDER BY l.numeroParcela ASC")
    List<LancamentoFinanceiro> findByContratoIdETipo(@Param("idContrato") Integer idContrato,
                                                     @Param("tipo") String tipo);

    @Query("SELECT l FROM LancamentoFinanceiro l WHERE l.contrato.aluno.id_aluno = :idAluno "
            + "ORDER BY l.dataVencimento ASC")
    List<LancamentoFinanceiro> findByAlunoId(@Param("idAluno") Long idAluno);

    // Tela do financeiro: todas as parcelas com o contrato já carregado, sem N+1
    @Query("SELECT l FROM LancamentoFinanceiro l JOIN FETCH l.contrato c "
            + "LEFT JOIN FETCH c.aluno LEFT JOIN FETCH c.responsavel LEFT JOIN FETCH c.turma "
            + "ORDER BY l.dataVencimento ASC, l.idLancamento ASC")
    List<LancamentoFinanceiro> findAllComContrato();

    /**
     * Consulta de inadimplência: cada parcela junto com o(s) responsável(is) marcado(s)
     * como financeiro no vínculo do aluno. Devolve [parcela, responsável, grau de parentesco];
     * responsável e grau vêm nulos quando o aluno não tem ninguém marcado, e a parcela se
     * repete quando há mais de um marcado.
     */
    @Query("SELECT l, r, v.grauParentesco FROM LancamentoFinanceiro l "
            + "JOIN FETCH l.contrato c JOIN FETCH c.aluno a LEFT JOIN FETCH c.turma "
            + "LEFT JOIN VinculoAlunoResponsavel v ON v.aluno = a AND v.isResponsavelFinanceiro = true "
            + "LEFT JOIN v.responsavel r "
            + "ORDER BY l.dataVencimento ASC, l.idLancamento ASC")
    List<Object[]> findParcelasComResponsavelFinanceiro();

    @Query("SELECT COUNT(l) FROM LancamentoFinanceiro l WHERE l.contrato.idContrato = :idContrato "
            + "AND UPPER(l.status) = 'PAGA'")
    long contarPagasDoContrato(@Param("idContrato") Integer idContrato);

    @Query("SELECT COUNT(l) FROM LancamentoFinanceiro l WHERE l.contrato.idContrato = :idContrato "
            + "AND l.tipo = :tipo AND (UPPER(l.status) = 'PAGA' OR l.dataPagamento IS NOT NULL)")
    long contarPagasDoContratoETipo(@Param("idContrato") Integer idContrato, @Param("tipo") String tipo);

    // flushAutomatically para o DELETE sair antes dos INSERTs da regravação
    @Modifying(flushAutomatically = true)
    @Query("DELETE FROM LancamentoFinanceiro l WHERE l.contrato.idContrato = :idContrato")
    void deleteByContratoId(@Param("idContrato") Integer idContrato);

    @Modifying(flushAutomatically = true)
    @Query("DELETE FROM LancamentoFinanceiro l WHERE l.contrato.idContrato = :idContrato AND l.tipo = :tipo")
    void deleteByContratoIdETipo(@Param("idContrato") Integer idContrato, @Param("tipo") String tipo);
}
