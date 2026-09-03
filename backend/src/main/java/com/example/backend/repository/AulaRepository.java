package com.example.backend.repository;

import com.example.backend.model.Aula;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface AulaRepository extends JpaRepository<Aula, Long> {

    // Ordenado da aula mais recente para a mais antiga
    @Query("SELECT a FROM Aula a WHERE a.turma.id_turma = :idTurma ORDER BY a.dataAula DESC, a.id_aula DESC")
    List<Aula> findByTurmaId(@Param("idTurma") Long idTurma);
}
