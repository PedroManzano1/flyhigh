package com.example.backend.repository;

import com.example.backend.model.AtualizacaoAnoEscolar;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface AtualizacaoAnoEscolarRepository extends JpaRepository<AtualizacaoAnoEscolar, Long> {

    @Query("SELECT MAX(a.ano) FROM AtualizacaoAnoEscolar a")
    Integer ultimoAnoAtualizado();

    @Query("SELECT a FROM AtualizacaoAnoEscolar a ORDER BY a.ano DESC")
    List<AtualizacaoAnoEscolar> historico();
}
