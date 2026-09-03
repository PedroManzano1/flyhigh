package com.example.backend.service;

import com.example.backend.model.Curso;
import com.example.backend.repository.ContratoRepository;
import com.example.backend.repository.CursoRepository;
import com.example.backend.repository.TurmaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Optional;

@Service
public class CursoService {

    @Autowired
    private CursoRepository cursoRepo;

    @Autowired
    private TurmaRepository turmaRepo;

    @Autowired
    private ContratoRepository contratoRepo;

    public Curso salvar(Curso curso) {
        if (curso.getNome() == null || curso.getNome().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Informe o nome do curso.");
        }

        // Regra da Estória 5: o nome do curso é único.
        boolean nomeEmUso = cursoRepo.findByNomeIgnoreCase(curso.getNome().trim()).stream()
                .anyMatch(existente -> !existente.getId_curso().equals(curso.getId_curso()));
        if (nomeEmUso) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Já existe um curso cadastrado com o nome \"" + curso.getNome().trim() + "\".");
        }

        curso.setNome(curso.getNome().trim());
        if (curso.getAtivo() == null) {
            curso.setAtivo(true);
        }
        return cursoRepo.save(curso);
    }

    public List<Curso> listarTodos() {
        return cursoRepo.findAll();
    }

    public Optional<Curso> buscarPorId(Long id) {
        return cursoRepo.findById(id);
    }

    /**
     * Regra da Estória 5 (exclusão lógica): se o curso já foi usado em turma ou contrato,
     * ele não pode sair do banco — apenas ser inativado, preservando o histórico.
     */
    public void excluir(Long id) {
        Curso curso = cursoRepo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Curso não encontrado."));

        boolean emUso = turmaRepo.contarPorCurso(id) > 0 || contratoRepo.contarPorCurso(id) > 0;

        if (emUso) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Este curso já foi utilizado em turmas ou contratos e não pode ser excluído. "
                            + "Edite o curso e marque-o como Inativo.");
        }
        cursoRepo.delete(curso);
    }
}
