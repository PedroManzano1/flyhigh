package com.example.backend.repository;

import com.example.backend.model.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface UsuarioRepository extends JpaRepository<Usuario, Integer> {

    Optional<Usuario> findByLogin(String login);

    @Query("SELECT COUNT(u) FROM Usuario u WHERE u.perfil.idPerfil = :idPerfil")
    long contarPorPerfil(@Param("idPerfil") Integer idPerfil);

    // Uma conta por aluno: usado para impedir duas contas ligadas ao mesmo aluno
    @Query("SELECT u FROM Usuario u WHERE u.aluno.id_aluno = :idAluno")
    List<Usuario> findByAlunoId(@Param("idAluno") Long idAluno);

    // Impede que o sistema fique sem nenhum diretor ativo
    @Query("SELECT COUNT(u) FROM Usuario u WHERE UPPER(u.perfil.nomePerfil) = 'DIRETOR' "
            + "AND UPPER(u.status) = 'ATIVO' AND u.idUsuario <> :idIgnorado")
    long contarOutrosDiretoresAtivos(@Param("idIgnorado") Integer idIgnorado);
}
