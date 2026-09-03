package com.example.backend.service;

import com.example.backend.model.Curso;
import com.example.backend.model.Turma;
import com.example.backend.model.Usuario;
import com.example.backend.repository.CursoRepository;
import com.example.backend.repository.TurmaRepository;
import com.example.backend.repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Optional;

@Service
public class TurmaService {

    @Autowired
    private TurmaRepository turmaRepo;

    @Autowired
    private CursoRepository cursoRepo;

    @Autowired
    private UsuarioRepository usuarioRepo;

    public Turma salvar(Turma turma) {
        if (turma.getCodigoTurma() == null || turma.getCodigoTurma().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Informe o código da turma.");
        }

        // só é possível abrir turma para um curso ATIVO.
        if (turma.getCurso() != null && turma.getCurso().getId_curso() != null) {
            Curso cursoReal = cursoRepo.findById(turma.getCurso().getId_curso())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Curso não encontrado."));
            if (Boolean.FALSE.equals(cursoReal.getAtivo())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "O curso \"" + cursoReal.getNome() + "\" está inativo e não aceita novas turmas.");
            }
            turma.setCurso(cursoReal);
        } else {
            turma.setCurso(null);
        }

        //o professor vinculado precisa ser um usuário ATIVO.
        if (turma.getProfessor() != null && turma.getProfessor().getIdUsuario() != null) {
            Usuario professorReal = usuarioRepo.findById(turma.getProfessor().getIdUsuario())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Professor não encontrado."));
            if (professorReal.getStatus() != null && !"ATIVO".equalsIgnoreCase(professorReal.getStatus())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "O usuário selecionado como professor está inativo.");
            }
            turma.setProfessor(professorReal);
        } else {
            turma.setProfessor(null);
        }

        return turmaRepo.save(turma);
    }

    public List<Turma> listarTodos() {
        return turmaRepo.findAll();
    }

    public Optional<Turma> buscarPorId(Long id) {
        return turmaRepo.findById(id);
    }

    public void excluir(Long id) {
        turmaRepo.deleteById(id);
    }
}
