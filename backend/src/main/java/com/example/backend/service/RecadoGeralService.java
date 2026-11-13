package com.example.backend.service;

import com.example.backend.model.RecadoGeral;
import com.example.backend.model.Usuario;
import com.example.backend.repository.RecadoGeralRepository;
import com.example.backend.repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;

@Service
public class RecadoGeralService {

    @Autowired
    private RecadoGeralRepository recadoRepo;

    @Autowired
    private UsuarioRepository usuarioRepo;

    /** Recado novo: o autor é sempre quem está logado, ignorando o que veio da tela. */
    public RecadoGeral salvar(RecadoGeral recado) {
        // Um id no corpo sobrescreveria um recado existente
        recado.setId_recado(null);
        if (recado.getDataPublicacao() == null) {
            recado.setDataPublicacao(LocalDate.now());
        }
        recado.setUsuarioAutor(usuarioLogado());
        return recadoRepo.save(recado);
    }

    private Usuario usuarioLogado() {
        String login = SecurityContextHolder.getContext().getAuthentication().getName();
        return usuarioRepo.findByLogin(login)
                .orElseThrow(() -> new RuntimeException("Usuário logado (" + login + ") não encontrado."));
    }

    /** Edição: o autor continua sendo quem publicou, não quem corrigiu o texto. */
    public RecadoGeral atualizar(RecadoGeral recado, Usuario autorOriginal) {
        if (recado.getDataPublicacao() == null) recado.setDataPublicacao(LocalDate.now());
        recado.setUsuarioAutor(autorOriginal != null ? autorOriginal : usuarioLogado());
        return recadoRepo.save(recado);
    }

    public List<RecadoGeral> listarTodos() {
        List<RecadoGeral> recados = new ArrayList<>(recadoRepo.findAll());

        recados.sort(
                Comparator.comparing(RecadoGeral::getDataPublicacao,
                                Comparator.nullsLast(Comparator.naturalOrder()))
                        .thenComparing(RecadoGeral::getId_recado,
                                Comparator.nullsLast(Comparator.naturalOrder()))
                        .reversed()
        );

        return recados;
    }

    /** Mural de quem não é da equipe: já publicados e ainda não expirados. */
    public List<RecadoGeral> listarVisiveis(LocalDate hoje) {
        List<RecadoGeral> visiveis = new ArrayList<>();
        for (RecadoGeral r : listarTodos()) {
            boolean publicado = r.getDataPublicacao() == null || !r.getDataPublicacao().isAfter(hoje);
            boolean vigente = r.getDataExpiracao() == null || !r.getDataExpiracao().isBefore(hoje);
            if (publicado && vigente) visiveis.add(r);
        }
        return visiveis;
    }

    public Optional<RecadoGeral> buscarPorId(Long id) {
        return recadoRepo.findById(id);
    }

    public void excluir(Long id) {
        recadoRepo.deleteById(id);
    }
}