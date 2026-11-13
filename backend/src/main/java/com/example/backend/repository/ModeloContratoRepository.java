package com.example.backend.repository;

import com.example.backend.model.ModeloContrato;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ModeloContratoRepository extends JpaRepository<ModeloContrato, Long> {

    @Query("SELECT m FROM ModeloContrato m WHERE m.tipoContrato = :tipo AND m.status = :status ORDER BY m.versao DESC")
    List<ModeloContrato> findByTipoEStatus(@Param("tipo") String tipo, @Param("status") String status);

    @Query("SELECT COALESCE(MAX(m.versao), 0) FROM ModeloContrato m WHERE m.tipoContrato = :tipo")
    int maiorVersao(@Param("tipo") String tipo);

    @Query("SELECT COUNT(m) FROM ModeloContrato m WHERE m.tipoContrato = :tipo")
    long contarPorTipo(@Param("tipo") String tipo);

    @Query("SELECT m FROM ModeloContrato m ORDER BY m.tipoContrato ASC, m.versao DESC")
    List<ModeloContrato> listarTodos();
}
