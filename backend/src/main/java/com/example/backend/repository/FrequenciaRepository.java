package com.example.backend.repository;

import com.example.backend.model.Frequencia;
import com.example.backend.model.FrequenciaKey;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface FrequenciaRepository extends JpaRepository<Frequencia, FrequenciaKey> {
    List<Frequencia> findByAula_IdAula(Integer idAula);
    List<Frequencia> findByAluno_IdAluno(Integer idAluno);
}