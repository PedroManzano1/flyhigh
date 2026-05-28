package com.example.backend.repository;

import com.example.backend.model.Nota;
import com.example.backend.model.NotaKey;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface NotaRepository extends JpaRepository<Nota, NotaKey> {

    // Busca todas as notas de um aluno específico
    List<Nota> findByAluno_IdAluno(Integer idAluno);

    // Busca todas as notas de uma avaliação específica
    List<Nota> findByAvaliacao_IdAvaliacao(Integer idAvaliacao);
}