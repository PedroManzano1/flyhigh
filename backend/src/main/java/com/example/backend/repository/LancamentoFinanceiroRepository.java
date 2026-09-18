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
