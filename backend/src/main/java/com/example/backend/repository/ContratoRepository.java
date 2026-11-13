package com.example.backend.repository;

import com.example.backend.model.Contrato;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ContratoRepository extends JpaRepository<Contrato, Integer> {

    @Query("SELECT c FROM Contrato c WHERE c.turma.id_turma = :idTurma ORDER BY c.aluno.nome ASC")
    List<Contrato> findByTurmaId(@Param("idTurma") Long idTurma);

    // Somente as matrículas válidas: alunos com contrato "Cancelado" ou "Trancado"
    @Query("SELECT c FROM Contrato c WHERE c.turma.id_turma = :idTurma "
            + "AND UPPER(c.status) = 'ATIVO' ORDER BY c.aluno.nome ASC")
    List<Contrato> findAtivosByTurmaId(@Param("idTurma") Long idTurma);

    @Query("SELECT c FROM Contrato c WHERE c.aluno.id_aluno = :idAluno")
    List<Contrato> findByAlunoId(@Param("idAluno") Long idAluno);

    @Query("SELECT COUNT(c) FROM Contrato c WHERE c.turma.id_turma = :idTurma AND UPPER(c.status) = 'ATIVO'")
    long contarAtivosNaTurma(@Param("idTurma") Long idTurma);

    @Query("SELECT COUNT(c) FROM Contrato c WHERE c.turma.id_turma = :idTurma "
            + "AND c.aluno.id_aluno = :idAluno AND UPPER(c.status) = 'ATIVO'")
    long contarMatriculaAtiva(@Param("idTurma") Long idTurma, @Param("idAluno") Long idAluno);

    // Ativos e concluídos: os alunos que aparecem no boletim da turma
    @Query("SELECT c FROM Contrato c WHERE c.turma.id_turma = :idTurma "
            + "AND (UPPER(c.status) = 'ATIVO' OR c.status IN ('Concluído', 'Concluido')) ORDER BY c.aluno.nome ASC")
    List<Contrato> findMatriculadosByTurmaId(@Param("idTurma") Long idTurma);

    // Quem pode receber nota e chamada na turma
    @Query("SELECT COUNT(c) FROM Contrato c WHERE c.turma.id_turma = :idTurma AND c.aluno.id_aluno = :idAluno "
            + "AND (UPPER(c.status) = 'ATIVO' OR c.status IN ('Concluído', 'Concluido'))")
    long contarMatriculaParaLancamento(@Param("idTurma") Long idTurma, @Param("idAluno") Long idAluno);

    // Mesmas contagens, sem o próprio contrato (edição de um contrato já gravado)
    @Query("SELECT COUNT(c) FROM Contrato c WHERE c.turma.id_turma = :idTurma AND UPPER(c.status) = 'ATIVO' "
            + "AND c.idContrato <> :idIgnorado")
    long contarOutrosAtivosNaTurma(@Param("idTurma") Long idTurma, @Param("idIgnorado") Integer idIgnorado);

    @Query("SELECT COUNT(c) FROM Contrato c WHERE c.turma.id_turma = :idTurma "
            + "AND c.aluno.id_aluno = :idAluno AND UPPER(c.status) = 'ATIVO' AND c.idContrato <> :idIgnorado")
    long contarOutraMatriculaAtiva(@Param("idTurma") Long idTurma, @Param("idAluno") Long idAluno,
                                   @Param("idIgnorado") Integer idIgnorado);

    // Matrículas trancadas ou canceladas antes de existir a data de interrupção
    @Query("SELECT c FROM Contrato c WHERE UPPER(COALESCE(c.status, 'ATIVO')) <> 'ATIVO' "
            + "AND c.status NOT IN ('Concluído', 'Concluido') AND c.dataInterrupcao IS NULL")
    List<Contrato> findInterrompidosSemData();

    @Query("SELECT COUNT(c) FROM Contrato c WHERE c.turma.curso.id_curso = :idCurso")
    long contarPorCurso(@Param("idCurso") Long idCurso);

    @Query("SELECT COUNT(c) FROM Contrato c WHERE c.turma.id_turma = :idTurma")
    long contarPorTurma(@Param("idTurma") Long idTurma);

    @Query("SELECT COUNT(c) FROM Contrato c WHERE c.responsavel.id_responsavel = :idResponsavel")
    long contarPorResponsavel(@Param("idResponsavel") Long idResponsavel);

    @Query("SELECT COUNT(c) FROM Contrato c WHERE c.aluno.id_aluno = :idAluno")
    long contarPorAluno(@Param("idAluno") Long idAluno);

    @Query("SELECT COUNT(c) FROM Contrato c WHERE c.idModeloContrato = :idModelo")
    long contarPorModelo(@Param("idModelo") Long idModelo);

    // Liga ao modelo os contratos feitos antes de os modelos existirem
    @Modifying
    @Query("UPDATE Contrato c SET c.idModeloContrato = :idModelo "
            + "WHERE c.idModeloContrato IS NULL AND UPPER(c.tipoContrato) = :tipo")
    int ligarAoModeloSemModelo(@Param("idModelo") Long idModelo, @Param("tipo") String tipo);

    @Modifying
    @Query("UPDATE Contrato c SET c.idModeloContrato = :idModelo "
            + "WHERE c.idModeloContrato IS NULL AND c.tipoContrato IS NULL")
    int ligarAoModeloSemTipo(@Param("idModelo") Long idModelo);
}
