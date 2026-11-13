package com.example.backend.repository;

import com.example.backend.model.Aluno;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface AlunoRepository extends JpaRepository<Aluno, Long> {

    Optional<Aluno> findByNumeroMatricula(String numeroMatricula);

    // Compara só os números, porque o CPF pode estar gravado com ou sem pontuação
    @Query("SELECT a FROM Aluno a WHERE REPLACE(REPLACE(REPLACE(a.cpf, '.', ''), '-', ''), ' ', '') = :cpf")
    List<Aluno> findByCpfSomenteNumeros(@Param("cpf") String cpf);

    @Query("SELECT a.numeroMatricula FROM Aluno a WHERE a.numeroMatricula LIKE :prefixo")
    List<String> matriculasComPrefixo(@Param("prefixo") String prefixo);

    // CPF gravado como texto vazio quebrava a coluna única (ver service/Cpf)
    @Modifying
    @Query("UPDATE Aluno a SET a.cpf = NULL WHERE TRIM(a.cpf) = ''")
    int limparCpfVazio();

    @Query("SELECT COUNT(a) FROM Aluno a WHERE a.endereco.id_endereco = :idEndereco")
    long contarPorEndereco(@Param("idEndereco") Long idEndereco);
}
