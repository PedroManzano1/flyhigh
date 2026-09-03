package com.example.backend.repository;

import com.example.backend.model.Frequencia;
import com.example.backend.model.FrequenciaKey;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface FrequenciaRepository extends JpaRepository<Frequencia, FrequenciaKey> {

    @Query("SELECT f FROM Frequencia f WHERE f.aluno.id_aluno = :idAluno ORDER BY f.aula.dataAula ASC")
    List<Frequencia> findByAlunoId(@Param("idAluno") Long idAluno);

    // Busca pela AULA
    @Query("SELECT f FROM Frequencia f WHERE f.aula.id_aula = :idAula")
    List<Frequencia> findByAulaId(@Param("idAula") Long idAula);

    // Usado no mapa de frequência da turma inteira (relatório e alerta de evasão)
    @Query("SELECT f FROM Frequencia f WHERE f.aula.turma.id_turma = :idTurma "
            + "ORDER BY f.aula.dataAula ASC, f.aula.id_aula ASC")
    List<Frequencia> findByTurmaId(@Param("idTurma") Long idTurma);

    @Modifying
    @Query("DELETE FROM Frequencia f WHERE f.aula.id_aula = :idAula")
    void deleteByAulaId(@Param("idAula") Long idAula);
}
