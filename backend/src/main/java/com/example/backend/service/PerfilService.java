package com.example.backend.service;

import com.example.backend.model.Perfil;
import com.example.backend.model.Permissao;
import com.example.backend.repository.PerfilRepository;
import com.example.backend.repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Optional;

@Service
public class PerfilService {

    @Autowired
    private PerfilRepository perfilRepository;

    @Autowired
    private UsuarioRepository usuarioRepository;

    public List<Perfil> listarTodos() {
        return perfilRepository.findAll();
    }

    public Optional<Perfil> buscarPorId(Integer id) {
        return perfilRepository.findById(id);
    }

    public Perfil salvar(Perfil perfil) {
        prepararNome(perfil);
        validarNomeUnico(perfil);

        // Amarra as permissões filhas ao perfil pai antes de salvar
        if (perfil.getPermissoes() != null) {
            for (Permissao p : perfil.getPermissoes()) {
                p.setPerfil(perfil);
            }
        }
        return perfilRepository.save(perfil);
    }

    public Perfil atualizar(Integer id, Perfil perfilAtualizado) {
        return perfilRepository.findById(id).map(perfilExistente -> {
            prepararNome(perfilAtualizado);
            perfilAtualizado.setIdPerfil(id);
            validarNomeUnico(perfilAtualizado);

            // O perfil DIRETOR é a base do controle de acesso e não pode ser renomeado
            if ("DIRETOR".equals(perfilExistente.getNomePerfil())
                    && !"DIRETOR".equals(perfilAtualizado.getNomePerfil())) {
                throw new ResponseStatusException(HttpStatus.CONFLICT,
                        "O perfil DIRETOR não pode ser renomeado, pois é usado nas regras de acesso do sistema.");
            }

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
        }).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Perfil não encontrado."));
    }

    /**
     * Exclusão protegida: perfil com usuários vinculados deixaria esses acessos sem permissão.
     */
    public void excluir(Integer id) {
        Perfil perfil = perfilRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Perfil não encontrado."));

        if ("DIRETOR".equalsIgnoreCase(perfil.getNomePerfil())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "O perfil DIRETOR não pode ser excluído, pois é usado nas regras de acesso do sistema.");
        }

        long usuarios = usuarioRepository.contarPorPerfil(id);
        if (usuarios > 0) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Este perfil não pode ser excluído porque está atribuído a " + usuarios
                            + " usuário(s). Troque o perfil desses usuários primeiro.");
        }

        perfilRepository.delete(perfil);
    }

    private void prepararNome(Perfil perfil) {
        if (perfil.getNomePerfil() == null || perfil.getNomePerfil().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Informe o nome do perfil.");
        }
        perfil.setNomePerfil(perfil.getNomePerfil().trim().toUpperCase());
    }

    // Nome duplicado quebraria o mapeamento de ROLE_ no login
    private void validarNomeUnico(Perfil perfil) {
        boolean emUso = perfilRepository.findByNomePerfilIgnoreCase(perfil.getNomePerfil()).stream()
                .anyMatch(existente -> !existente.getIdPerfil().equals(perfil.getIdPerfil()));

        if (emUso) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Já existe um perfil chamado \"" + perfil.getNomePerfil() + "\".");
        }
    }
}
