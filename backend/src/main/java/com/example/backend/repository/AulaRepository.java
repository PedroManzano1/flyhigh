package com.example.backend.repository;

import com.example.backend.model.Aula;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface AulaRepository extends JpaRepository<Aula, Long> {

    // Como a sua classe Turma usa id_turma, a JPQL precisa refletir isso
    @Query("SELECT a FROM Aula a WHERE a.turma.id_turma = :idTurma")
    List<Aula> findByTurmaId(@Param("idTurma") Long idTurma);
}