package com.example.backend.service;

import com.example.backend.model.Turma;
import com.example.backend.model.Usuario;
import com.example.backend.repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.Optional;

@Service
public class AcessoPedagogicoService {

    @Autowired
    private UsuarioRepository usuarioRepo;

    public void validarLancamentoNaTurma(Turma turma) {
        if (turma == null) return;

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Sessão inválida.");
        }

        // Diretor passa direto
        for (GrantedAuthority authority : auth.getAuthorities()) {
            if ("ROLE_DIRETOR".equals(authority.getAuthority())) return;
        }

        // Turma sem professor definido: só o diretor lança
        if (turma.getProfessor() == null || turma.getProfessor().getIdUsuario() == null) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Esta turma não possui professor vinculado. Peça à direção para definir o responsável.");
        }

        Optional<Usuario> logado = usuarioRepo.findByLogin(auth.getName());
        if (logado.isEmpty()
                || !turma.getProfessor().getIdUsuario().equals(logado.get().getIdUsuario())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Você só pode lançar notas e faltas nas turmas em que é o professor responsável.");
        }
    }
}
