package com.example.backend.repository;

import com.example.backend.model.Perfil;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PerfilRepository extends JpaRepository<Perfil, Integer> {

    // Lista (e não Optional) para não estourar se houver nomes duplicados na base antiga
    List<Perfil> findByNomePerfilIgnoreCase(String nomePerfil);
}
