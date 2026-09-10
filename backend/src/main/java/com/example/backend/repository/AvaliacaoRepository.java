package com.example.backend.repository;

import com.example.backend.model.Avaliacao;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface AvaliacaoRepository extends JpaRepository<Avaliacao, Long> {

    @Query("SELECT a FROM Avaliacao a WHERE a.turma.id_turma = :idTurma "
            + "ORDER BY a.data ASC, a.id_avaliacao ASC")
    List<Avaliacao> findByTurmaId(@Param("idTurma") Long idTurma);

    @Query("SELECT COUNT(a) FROM Avaliacao a WHERE a.turma.id_turma = :idTurma")
    long contarPorTurma(@Param("idTurma") Long idTurma);

    // Soma dos pesos (%) já distribuídos na turma, podendo ignorar a avaliação em edição
    @Query("SELECT COALESCE(SUM(a.peso), 0) FROM Avaliacao a "
            + "WHERE a.turma.id_turma = :idTurma AND a.id_avaliacao <> :idIgnorado")
    double somarPesos(@Param("idTurma") Long idTurma, @Param("idIgnorado") Long idIgnorado);
}
