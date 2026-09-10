package com.example.backend.repository;

import com.example.backend.model.Nota;
import com.example.backend.model.NotaKey;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface NotaRepository extends JpaRepository<Nota, NotaKey> {

    @Query("SELECT n FROM Nota n WHERE n.aluno.id_aluno = :idAluno")
    List<Nota> findByAlunoId(@Param("idAluno") Long idAluno);

    @Query("SELECT n FROM Nota n WHERE n.avaliacao.id_avaliacao = :idAvaliacao")
    List<Nota> findByAvaliacaoId(@Param("idAvaliacao") Long idAvaliacao);

    // Espelho de notas da turma inteira: alimenta o boletim
    @Query("SELECT n FROM Nota n WHERE n.avaliacao.turma.id_turma = :idTurma")
    List<Nota> findByTurmaId(@Param("idTurma") Long idTurma);

    @Modifying
    @Query("DELETE FROM Nota n WHERE n.avaliacao.id_avaliacao = :idAvaliacao")
    void deleteByAvaliacaoId(@Param("idAvaliacao") Long idAvaliacao);

    @Query("SELECT COUNT(n) FROM Nota n WHERE n.aluno.id_aluno = :idAluno")
    long contarPorAluno(@Param("idAluno") Long idAluno);
}
