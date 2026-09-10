package com.example.backend.repository;

import com.example.backend.model.Contrato;
import org.springframework.data.jpa.repository.JpaRepository;
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

    @Query("SELECT COUNT(c) FROM Contrato c WHERE c.turma.curso.id_curso = :idCurso")
    long contarPorCurso(@Param("idCurso") Long idCurso);

    @Query("SELECT COUNT(c) FROM Contrato c WHERE c.turma.id_turma = :idTurma")
    long contarPorTurma(@Param("idTurma") Long idTurma);

    @Query("SELECT COUNT(c) FROM Contrato c WHERE c.aluno.id_aluno = :idAluno")
    long contarPorAluno(@Param("idAluno") Long idAluno);
}
