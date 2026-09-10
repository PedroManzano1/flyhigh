package com.example.backend.repository;

import com.example.backend.model.Responsavel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ResponsavelRepository extends JpaRepository<Responsavel, Long> {

    @Query("SELECT COUNT(r) FROM Responsavel r WHERE r.endereco.id_endereco = :idEndereco")
    long contarPorEndereco(@Param("idEndereco") Long idEndereco);
}
