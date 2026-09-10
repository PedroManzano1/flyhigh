package com.example.backend.repository;

import com.example.backend.model.VinculoAlunoResponsavel;
import com.example.backend.model.VinculoId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface VinculoRepository extends JpaRepository<VinculoAlunoResponsavel, VinculoId> {

    @Modifying
    @Query("DELETE FROM VinculoAlunoResponsavel v WHERE v.aluno.id_aluno = :idAluno")
    void deleteByAlunoId(@Param("idAluno") Long idAluno);

    @Modifying
    @Query("DELETE FROM VinculoAlunoResponsavel v WHERE v.responsavel.id_responsavel = :idResponsavel")
    void deleteByResponsavelId(@Param("idResponsavel") Long idResponsavel);
}
