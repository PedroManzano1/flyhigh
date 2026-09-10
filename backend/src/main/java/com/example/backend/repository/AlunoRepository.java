package com.example.backend.repository;

import com.example.backend.model.Aluno;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface AlunoRepository extends JpaRepository<Aluno, Long> {

    Optional<Aluno> findByNumeroMatricula(String numeroMatricula);

    @Query("SELECT COUNT(a) FROM Aluno a WHERE a.endereco.id_endereco = :idEndereco")
    long contarPorEndereco(@Param("idEndereco") Long idEndereco);
}
