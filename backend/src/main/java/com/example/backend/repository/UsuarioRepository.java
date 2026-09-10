package com.example.backend.repository;

import com.example.backend.model.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface UsuarioRepository extends JpaRepository<Usuario, Integer> {

    Optional<Usuario> findByLogin(String login);

    @Query("SELECT COUNT(u) FROM Usuario u WHERE u.perfil.idPerfil = :idPerfil")
    long contarPorPerfil(@Param("idPerfil") Integer idPerfil);

    // Impede que o sistema fique sem nenhum diretor ativo
    @Query("SELECT COUNT(u) FROM Usuario u WHERE UPPER(u.perfil.nomePerfil) = 'DIRETOR' "
            + "AND UPPER(u.status) = 'ATIVO' AND u.idUsuario <> :idIgnorado")
    long contarOutrosDiretoresAtivos(@Param("idIgnorado") Integer idIgnorado);
}
