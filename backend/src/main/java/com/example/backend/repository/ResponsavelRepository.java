package com.example.backend.repository;

import com.example.backend.model.Responsavel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ResponsavelRepository extends JpaRepository<Responsavel, Long> {

    // Compara só os números, porque o CPF pode estar gravado com ou sem pontuação
    @Query("SELECT r FROM Responsavel r WHERE REPLACE(REPLACE(REPLACE(r.cpf, '.', ''), '-', ''), ' ', '') = :cpf")
    List<Responsavel> findByCpfSomenteNumeros(@Param("cpf") String cpf);

    @Modifying
    @Query("UPDATE Responsavel r SET r.cpf = NULL WHERE TRIM(r.cpf) = ''")
    int limparCpfVazio();

    @Query("SELECT COUNT(r) FROM Responsavel r WHERE r.endereco.id_endereco = :idEndereco")
    long contarPorEndereco(@Param("idEndereco") Long idEndereco);
}
