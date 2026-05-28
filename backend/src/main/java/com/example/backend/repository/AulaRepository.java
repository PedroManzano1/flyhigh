package com.example.backend.repository;

import com.example.backend.model.Aula;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface AulaRepository extends JpaRepository<Aula, Integer> {
    List<Aula> findByTurma_IdTurma(Integer idTurma);
}