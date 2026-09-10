package com.example.backend.repository;

import com.example.backend.model.RecadoGeral;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface RecadoGeralRepository extends JpaRepository<RecadoGeral, Long> {

    @Query("SELECT COUNT(r) FROM RecadoGeral r WHERE r.usuarioAutor.idUsuario = :idUsuario")
    long contarPorAutor(@Param("idUsuario") Integer idUsuario);
}
