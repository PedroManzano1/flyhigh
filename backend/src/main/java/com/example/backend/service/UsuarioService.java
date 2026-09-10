package com.example.backend.service;

import com.example.backend.model.Usuario;
import com.example.backend.repository.RecadoGeralRepository;
import com.example.backend.repository.TurmaRepository;
import com.example.backend.repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Optional;

@Service
public class UsuarioService {

    public static final String ATIVO = "ATIVO";
    public static final String INATIVO = "INATIVO";

    @Autowired
    private UsuarioRepository repository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private TurmaRepository turmaRepo;

    @Autowired
    private RecadoGeralRepository recadoRepo;

    public List<Usuario> listarTodos() {
        return repository.findAll();
    }

    public Optional<Usuario> buscarPorId(Integer id) {
        return repository.findById(id);
    }

    public Usuario salvar(Usuario usuario) {
        if (usuario.getLogin() == null || usuario.getLogin().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Informe o login do usuário.");
        }
        if (usuario.getSenha() == null || usuario.getSenha().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Informe a senha do usuário.");
        }

        usuario.setSenha(passwordEncoder.encode(usuario.getSenha()));
        usuario.setStatus(normalizarStatus(usuario.getStatus()));
        return repository.save(usuario);
    }

    public Usuario atualizar(Integer id, Usuario dadosNovos) {
        return repository.findById(id).map(usuario -> {
            usuario.setNome(dadosNovos.getNome());
            usuario.setLogin(dadosNovos.getLogin());
            usuario.setPerfil(dadosNovos.getPerfil());

            // Status só muda quando vem preenchido, para não inativar sem querer
            if (dadosNovos.getStatus() != null && !dadosNovos.getStatus().isBlank()) {
                String novoStatus = normalizarStatus(dadosNovos.getStatus());
                if (INATIVO.equals(novoStatus)) {
                    validarInativacao(usuario);
                }
                usuario.setStatus(novoStatus);
            }

            // Regra: só muda a senha se vier algo no campo
            if (dadosNovos.getSenha() != null && !dadosNovos.getSenha().isEmpty()) {
                usuario.setSenha(passwordEncoder.encode(dadosNovos.getSenha()));
            }

            return repository.save(usuario);
        }).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuário não encontrado."));
    }

    /** Usado pelo botão de ativar/inativar da listagem. */
    public Usuario alterarStatus(Integer id, String status) {
        Usuario usuario = repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuário não encontrado."));

        String novoStatus = normalizarStatus(status);
        if (INATIVO.equals(novoStatus)) {
            validarInativacao(usuario);
        }

        usuario.setStatus(novoStatus);
        return repository.save(usuario);
    }

    /**
     * Exclusão protegida: usuário vinculado a turma ou autor de recado permanece no banco,
     * senão o histórico perde a referência. Nesse caso o caminho é inativar.
     */
    public void deletar(Integer id) {
        Usuario usuario = repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuário não encontrado."));

        if (ehUsuarioLogado(usuario)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Você não pode excluir o seu próprio usuário.");
        }
        validarUltimoDiretor(usuario);

        long turmas = turmaRepo.contarPorProfessor(id);
        long recados = recadoRepo.contarPorAutor(id);

        if (turmas > 0 || recados > 0) {
            StringBuilder itens = new StringBuilder();
            if (turmas > 0) itens.append(turmas).append(" turma(s) como professor");
            if (recados > 0) {
                if (itens.length() > 0) itens.append(" e ");
                itens.append(recados).append(" recado(s) publicado(s)");
            }
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Este usuário não pode ser excluído porque possui " + itens
                            + ". Inative o acesso em vez de excluir.");
        }

        repository.delete(usuario);
    }

    private void validarInativacao(Usuario usuario) {
        if (ehUsuarioLogado(usuario)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Você não pode inativar o seu próprio usuário.");
        }
        validarUltimoDiretor(usuario);
    }

    private void validarUltimoDiretor(Usuario usuario) {
        boolean ehDiretor = usuario.getPerfil() != null
                && "DIRETOR".equalsIgnoreCase(usuario.getPerfil().getNomePerfil());
        boolean estaAtivo = ATIVO.equalsIgnoreCase(usuario.getStatus());

        if (ehDiretor && estaAtivo && repository.contarOutrosDiretoresAtivos(usuario.getIdUsuario()) == 0) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Este é o último diretor ativo do sistema. Cadastre outro diretor antes de remover este acesso.");
        }
    }

    private boolean ehUsuarioLogado(Usuario usuario) {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        return auth != null && usuario.getLogin() != null && usuario.getLogin().equals(auth.getName());
    }

    private String normalizarStatus(String status) {
        if (status == null || status.isBlank()) return ATIVO;

        String limpo = status.trim().toUpperCase();
        if (!ATIVO.equals(limpo) && !INATIVO.equals(limpo)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Status deve ser ATIVO ou INATIVO.");
        }
        return limpo;
    }
}
