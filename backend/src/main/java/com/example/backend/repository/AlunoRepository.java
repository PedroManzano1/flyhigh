package com.example.backend.repository;

import com.example.backend.model.Aluno;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface AlunoRepository extends JpaRepository<Aluno, Long> {
    Optional<Aluno> findByNumeroMatricula(String numeroMatricula);
}