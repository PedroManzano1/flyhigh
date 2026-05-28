package com.example.backend.repository;

import com.example.backend.model.Avaliacao;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface AvaliacaoRepository extends JpaRepository<Avaliacao, Integer> {

    // Busca todas as avaliações de uma turma específica
    List<Avaliacao> findByTurma_IdTurma(Integer idTurma);
}