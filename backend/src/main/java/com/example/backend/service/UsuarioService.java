package com.example.backend.service;

import com.example.backend.model.Usuario;
import com.example.backend.repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class UsuarioService {

    @Autowired
    private UsuarioRepository repository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    public List<Usuario> listarTodos() {
        return repository.findAll();
    }

    public Optional<Usuario> buscarPorId(Integer id) {
        return repository.findById(id);
    }

    public Usuario salvar(Usuario usuario) {
        // Regra de negócio: Criptografar senha
        usuario.setSenha(passwordEncoder.encode(usuario.getSenha()));
        usuario.setStatus("ATIVO");
        return repository.save(usuario);
    }

    public Usuario atualizar(Integer id, Usuario dadosNovos) {
        return repository.findById(id).map(usuario -> {
            usuario.setNome(dadosNovos.getNome());
            usuario.setLogin(dadosNovos.getLogin());
            usuario.setPerfil(dadosNovos.getPerfil());

            // Regra: Só muda a senha se vier algo no campo
            if (dadosNovos.getSenha() != null && !dadosNovos.getSenha().isEmpty()) {
                usuario.setSenha(passwordEncoder.encode(dadosNovos.getSenha()));
            }

            return repository.save(usuario);
        }).orElseThrow(() -> new RuntimeException("Usuário não encontrado"));
    }

    public void deletar(Integer id) {
        repository.deleteById(id);
    }
}