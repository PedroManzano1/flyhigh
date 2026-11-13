package com.example.backend.service;

import com.example.backend.model.Turma;
import com.example.backend.model.Usuario;
import com.example.backend.repository.TurmaRepository;
import com.example.backend.repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * Quem pode lançar e quem pode ler o diário (notas, atividades, aulas e faltas).
 *
 * - Diretor: tudo.
 * - Quem é professor de alguma turma: lê e lança só nas próprias turmas.
 * - Quem não dá aula (secretaria, coordenação): lê todas as turmas; lançar continua
 *   sendo só do professor da turma.
 * - Turma encerrada: o diário fica travado, só o diretor altera.
 */
@Service
public class AcessoPedagogicoService {

    @Autowired
    private UsuarioRepository usuarioRepo;

    @Autowired
    private TurmaRepository turmaRepo;

    public void validarLancamentoNaTurma(Turma turma) {
        if (turma == null) return;

        Authentication auth = autenticacao();
        if (ehDiretor(auth)) return;

        if (TurmaService.estaEncerrada(turma)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "A turma " + turma.getCodigoTurma() + " foi encerrada. Só o diretor altera notas, faltas e atividades dela.");
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

    /**
     * Turmas que o usuário logado pode ler. Nulo quando ele lê todas (diretor ou
     * quem não é professor de nenhuma turma).
     */
    public Set<Long> turmasLiberadasParaLeitura() {
        Authentication auth = autenticacao();
        if (ehDiretor(auth)) return null;
        Optional<Usuario> logado = usuarioRepo.findByLogin(auth.getName());
        if (logado.isEmpty()) return Set.of();
        List<Long> minhas = turmaRepo.idsPorProfessor(logado.get().getIdUsuario());
        return minhas.isEmpty() ? null : new HashSet<>(minhas);
    }

    public void validarLeituraDaTurma(Long idTurma) {
        Set<Long> liberadas = turmasLiberadasParaLeitura();
        if (liberadas != null && (idTurma == null || !liberadas.contains(idTurma))) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Você só pode ver notas e faltas das turmas em que é o professor responsável.");
        }
    }

    /** Filtra uma lista pelo id da turma de cada item, conforme turmasLiberadasParaLeitura. */
    public <T> List<T> filtrarPorTurma(List<T> itens, Function<T, Turma> turmaDe) {
        Set<Long> liberadas = turmasLiberadasParaLeitura();
        if (liberadas == null) return itens;
        return itens.stream()
                .filter(item -> {
                    Turma t = turmaDe.apply(item);
                    return t != null && liberadas.contains(t.getId_turma());
                })
                .collect(Collectors.toList());
    }

    public boolean temAutoridade(String autoridade) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return auth != null && auth.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .anyMatch(a -> a.equals("ROLE_DIRETOR") || a.equals(autoridade));
    }

    private Authentication autenticacao() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Sessão inválida.");
        }
        return auth;
    }

    private static boolean ehDiretor(Authentication auth) {
        for (GrantedAuthority authority : auth.getAuthorities()) {
            if ("ROLE_DIRETOR".equals(authority.getAuthority())) return true;
        }
        return false;
    }
}
