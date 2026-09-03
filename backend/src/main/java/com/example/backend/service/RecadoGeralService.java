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

    public RecadoGeral salvar(RecadoGeral recado) {
        // Define a data de publicação caso não venha preenchida
        if (recado.getDataPublicacao() == null) {
            recado.setDataPublicacao(LocalDate.now());
        }

        // Pega o login (sub) do usuário que fez a requisição diretamente do Token validado pelo Spring Security
        String loginUsuarioLogado = SecurityContextHolder.getContext().getAuthentication().getName();

        // Busca esse usuário no banco de dados
        Usuario autorExistente = usuarioRepo.findByLogin(loginUsuarioLogado)
                .orElseThrow(() -> new RuntimeException("Erro: Usuário logado (" + loginUsuarioLogado + ") não encontrado no banco de dados."));

        // Injeta o autor real no recado, ignorando qualquer coisa que o Frontend tenha mandado
        recado.setUsuarioAutor(autorExistente);

        // Salva o recado vinculado ao autor correto!
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

    public Optional<RecadoGeral> buscarPorId(Long id) {
        return recadoRepo.findById(id);
    }

    public void excluir(Long id) {
        recadoRepo.deleteById(id);
    }
}