package com.example.backend.repository;

import com.example.backend.model.Avaliacao;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface AvaliacaoRepository extends JpaRepository<Avaliacao, Long> {

    // Ordem da planilha; atividades avulsas sem ordem vão para o fim, por data
    @Query("SELECT a FROM Avaliacao a WHERE a.turma.id_turma = :idTurma "
            + "ORDER BY COALESCE(a.ordem, 99999) ASC, a.data ASC, a.id_avaliacao ASC")
    List<Avaliacao> findByTurmaId(@Param("idTurma") Long idTurma);

    @Query("SELECT COUNT(a) FROM Avaliacao a WHERE a.turma.id_turma = :idTurma")
    long contarPorTurma(@Param("idTurma") Long idTurma);

    // Pontos já distribuídos na turma, podendo ignorar a atividade em edição
    @Query("SELECT COALESCE(SUM(a.notaMaxima), 0) FROM Avaliacao a "
            + "WHERE a.turma.id_turma = :idTurma AND a.id_avaliacao <> :idIgnorado")
    double somarPontos(@Param("idTurma") Long idTurma, @Param("idIgnorado") Long idIgnorado);

    @Query("SELECT COALESCE(MAX(a.ordem), 0) FROM Avaliacao a WHERE a.turma.id_turma = :idTurma")
    int maiorOrdem(@Param("idTurma") Long idTurma);
}
