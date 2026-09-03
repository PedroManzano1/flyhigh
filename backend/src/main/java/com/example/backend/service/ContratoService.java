package com.example.backend.service;

import com.example.backend.model.Aluno;
import com.example.backend.model.Contrato;
import com.example.backend.model.Turma;
import com.example.backend.repository.AlunoRepository;
import com.example.backend.repository.ContratoRepository;
import com.example.backend.repository.TurmaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

/**
 * Matrículas (Contrato) — camada de persistência que faltava para ligar Aluno e Turma.
 * É dela que a lista de chamada (Estória 12) e o lançamento de notas (Estória 11) tiram
 * os alunos da turma. A parte financeira/geração do PDF do contrato (Estória 7) segue pendente.
 */
@Service
public class ContratoService {

    @Autowired
    private ContratoRepository contratoRepo;

    @Autowired
    private AlunoRepository alunoRepo;

    @Autowired
    private TurmaRepository turmaRepo;

    @Transactional
    public Contrato matricular(Contrato contrato) {
        if (contrato.getAluno() == null || contrato.getAluno().getId_aluno() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Informe o aluno.");
        }
        if (contrato.getTurma() == null || contrato.getTurma().getId_turma() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Informe a turma.");
        }

        Aluno alunoReal = alunoRepo.findById(contrato.getAluno().getId_aluno())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Aluno não encontrado."));
        Turma turmaReal = turmaRepo.findById(contrato.getTurma().getId_turma())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Turma não encontrada."));

        boolean novaMatricula = contrato.getIdContrato() == null;

        if (novaMatricula) {
            // Regra da Estória 6: não matricular o mesmo aluno duas vezes na mesma turma.
            if (contratoRepo.contarMatriculaAtiva(turmaReal.getId_turma(), alunoReal.getId_aluno()) > 0) {
                throw new ResponseStatusException(HttpStatus.CONFLICT,
                        "Este aluno já possui matrícula ativa nesta turma.");
            }
            // Regra da Estória 6: bloquear a matrícula quando o limite de vagas for atingido.
            if (turmaReal.getLimiteVagas() != null && turmaReal.getLimiteVagas() > 0) {
                long ocupadas = contratoRepo.contarAtivosNaTurma(turmaReal.getId_turma());
                if (ocupadas >= turmaReal.getLimiteVagas()) {
                    throw new ResponseStatusException(HttpStatus.CONFLICT,
                            "Turma sem vagas disponíveis (" + ocupadas + "/" + turmaReal.getLimiteVagas() + ").");
                }
            }
        }

        contrato.setAluno(alunoReal);
        contrato.setTurma(turmaReal);

        if (contrato.getStatus() == null || contrato.getStatus().isBlank()) {
            contrato.setStatus("Ativo");
        }
        if (contrato.getDataEmissao() == null) {
            contrato.setDataEmissao(LocalDate.now());
        }
        if (contrato.getNumeroContrato() == null || contrato.getNumeroContrato().isBlank()) {
            contrato.setNumeroContrato(LocalDate.now().getYear() + "-"
                    + turmaReal.getId_turma() + "-" + alunoReal.getId_aluno());
        }

        return contratoRepo.save(contrato);
    }

    public List<Contrato> listarTodos() {
        return contratoRepo.findAll();
    }

    public Optional<Contrato> buscarPorId(Integer id) {
        return contratoRepo.findById(id);
    }

    public List<Contrato> buscarPorTurma(Long idTurma) {
        return contratoRepo.findByTurmaId(idTurma);
    }

    public List<Contrato> buscarAtivosPorTurma(Long idTurma) {
        return contratoRepo.findAtivosByTurmaId(idTurma);
    }

    public List<Contrato> buscarPorAluno(Long idAluno) {
        return contratoRepo.findByAlunoId(idAluno);
    }

    public long contarVagasOcupadas(Long idTurma) {
        return contratoRepo.contarAtivosNaTurma(idTurma);
    }

    public void excluir(Integer id) {
        contratoRepo.deleteById(id);
    }
}
