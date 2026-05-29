package com.example.backend.repository;

import com.example.backend.model.Frequencia;
import com.example.backend.model.FrequenciaKey;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface FrequenciaRepository extends JpaRepository<Frequencia, FrequenciaKey> {

    @Query("SELECT f FROM Frequencia f WHERE f.aluno.id_aluno = :idAluno")
    List<Frequencia> findByAlunoId(@Param("idAluno") Long idAluno);

    // Query corrigida: Busca pela AULA em vez da TURMA
    @Query("SELECT f FROM Frequencia f WHERE f.aula.id_aula = :idAula")
    List<Frequencia> findByAulaId(@Param("idAula") Long idAula);
}