package com.example.backend.repository;

import com.example.backend.model.Endereco;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface EnderecoRepository extends JpaRepository<Endereco, Long> {

    // O Spring cria o SQL: SELECT * FROM enderecos WHERE cep = ? AND numero = ?
    Optional<Endereco> findByCepAndNumero(String cep, String numero);

}