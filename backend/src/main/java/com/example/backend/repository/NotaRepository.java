package com.example.backend.repository;

import com.example.backend.model.Nota;
import com.example.backend.model.NotaKey;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface NotaRepository extends JpaRepository<Nota, NotaKey> {

    @Query("SELECT n FROM Nota n WHERE n.aluno.id_aluno = :idAluno")
    List<Nota> findByAlunoId(@Param("idAluno") Long idAluno);

    // Query corrigida: Busca pela AVALIACAO
    @Query("SELECT n FROM Nota n WHERE n.avaliacao.id_avaliacao = :idAvaliacao")
    List<Nota> findByAvaliacaoId(@Param("idAvaliacao") Long idAvaliacao);
}