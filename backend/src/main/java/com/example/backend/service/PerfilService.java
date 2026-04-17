package com.example.backend.service;

import com.example.backend.model.Perfil;
import com.example.backend.model.Permissao;
import com.example.backend.repository.PerfilRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class PerfilService {

    @Autowired
    private PerfilRepository perfilRepository;

    public List<Perfil> listarTodos() {
        return perfilRepository.findAll();
    }

    public Optional<Perfil> buscarPorId(Integer id) {
        return perfilRepository.findById(id);
    }

    public Perfil salvar(Perfil perfil) {
        // Truque do JPA: Amarrar as permissões filhas ao perfil pai antes de salvar
        if (perfil.getPermissoes() != null) {
            for (Permissao p : perfil.getPermissoes()) {
                p.setPerfil(perfil);
            }
        }
        return perfilRepository.save(perfil);
    }

    public Perfil atualizar(Integer id, Perfil perfilAtualizado) {
        return perfilRepository.findById(id).map(perfilExistente -> {
            perfilExistente.setNomePerfil(perfilAtualizado.getNomePerfil());
            perfilExistente.setDescricao(perfilAtualizado.getDescricao());

            // Limpa as permissões antigas e adiciona as novas marcadas no React
            perfilExistente.getPermissoes().clear();
            if (perfilAtualizado.getPermissoes() != null) {
                for (Permissao p : perfilAtualizado.getPermissoes()) {
                    p.setPerfil(perfilExistente);
                    perfilExistente.getPermissoes().add(p);
                }
            }
            return perfilRepository.save(perfilExistente);
        }).orElseThrow(() -> new RuntimeException("Perfil não encontrado"));
    }

    public void excluir(Integer id) {
        perfilRepository.deleteById(id);
    }
}