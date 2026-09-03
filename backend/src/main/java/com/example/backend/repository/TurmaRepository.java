package com.example.backend.repository;

import com.example.backend.model.Turma;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface TurmaRepository extends JpaRepository<Turma, Long> {

    @Query("SELECT COUNT(t) FROM Turma t WHERE t.curso.id_curso = :idCurso")
    long contarPorCurso(@Param("idCurso") Long idCurso);
}
