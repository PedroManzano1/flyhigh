package com.example.backend.service;

import com.example.backend.model.Aula;
import com.example.backend.model.Turma;
import com.example.backend.repository.AulaRepository;
import com.example.backend.repository.FrequenciaRepository;
import com.example.backend.repository.TurmaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Service
public class AulaService {

    @Autowired
    private AulaRepository aulaRepo;

    @Autowired
    private TurmaRepository turmaRepo;

    @Autowired
    private FrequenciaRepository frequenciaRepo;

    @Autowired
    private AcessoPedagogicoService acessoPedagogico;

    public Aula salvar(Aula aula) {
        // não é permitido registrar aula em data futura.
        if (aula.getDataAula() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Informe a data da aula.");
        }
        if (aula.getDataAula().isAfter(LocalDate.now())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Não é possível registrar frequência/aula em uma data futura.");
        }

        // busca a turma real no banco antes de salvar.
        if (aula.getTurma() == null || aula.getTurma().getId_turma() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Informe a turma da aula.");
        }
        Turma turmaReal = turmaRepo.findById(aula.getTurma().getId_turma())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Turma não encontrada."));
        // Professor só registra aula na turma em que está vinculado
        acessoPedagogico.validarLancamentoNaTurma(turmaReal);

        // Duas aulas da mesma turma no mesmo dia duplicariam a chamada e distorceriam a frequência
        boolean dataOcupada = aulaRepo
                .buscarPorTurmaEData(turmaReal.getId_turma(), aula.getDataAula()).stream()
                .anyMatch(existente -> !existente.getId_aula().equals(aula.getId_aula()));

        if (dataOcupada) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Já existe uma aula registrada para esta turma em "
                            + aula.getDataAula() + ". Edite a aula existente em vez de criar outra.");
        }

        aula.setTurma(turmaReal);

        return aulaRepo.save(aula);
    }

    public List<Aula> listarTodos() {
        return aulaRepo.findAll();
    }

    public Optional<Aula> buscarPorId(Long id) {
        return aulaRepo.findById(id);
    }

    @Transactional
    public void excluir(Long id) {
        // Remove antes a chamada da aula, senão a FK de "frequencias" impede a exclusão.
        frequenciaRepo.deleteByAulaId(id);
        aulaRepo.deleteById(id);
    }

    public List<Aula> buscarPorTurma(Long idTurma) {
        return aulaRepo.findByTurmaId(idTurma);
    }
}
