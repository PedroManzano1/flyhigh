package com.example.backend.repository;

import com.example.backend.model.Avaliacao;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface AvaliacaoRepository extends JpaRepository<Avaliacao, Long> {

    @Query("SELECT a FROM Avaliacao a WHERE a.turma.id_turma = :idTurma")
    List<Avaliacao> findByTurmaId(@Param("idTurma") Long idTurma);
}