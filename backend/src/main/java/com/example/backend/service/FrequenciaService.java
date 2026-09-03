package com.example.backend.service;

import com.example.backend.model.Aluno;
import com.example.backend.model.Aula;
import com.example.backend.model.Frequencia;
import com.example.backend.model.FrequenciaKey;
import com.example.backend.repository.AlunoRepository;
import com.example.backend.repository.AulaRepository;
import com.example.backend.repository.FrequenciaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

@Service
public class FrequenciaService {

    // Status aceitos pelo diário de classe (Estória 12)
    public static final List<String> STATUS_VALIDOS =
            Arrays.asList("PRESENTE", "FALTA", "FALTA_JUSTIFICADA");

    @Autowired
    private FrequenciaRepository frequenciaRepo;

    @Autowired
    private AulaRepository aulaRepo;

    @Autowired
    private AlunoRepository alunoRepo;

    @Autowired
    private AcessoPedagogicoService acessoPedagogico;

    @Transactional
    public Frequencia registrarFrequencia(Frequencia frequencia) {
        return frequenciaRepo.save(prepararParaSalvar(frequencia));
    }

    @Transactional
    public List<Frequencia> registrarChamadaCompleta(List<Frequencia> frequencias) {
        if (frequencias == null || frequencias.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Nenhum registro de chamada foi enviado.");
        }
        List<Frequencia> preparadas = new ArrayList<>();
        for (Frequencia f : frequencias) {
            preparadas.add(prepararParaSalvar(f));
        }
        return frequenciaRepo.saveAll(preparadas);
    }

    /**
     * Resolve as entidades reais (Aula/Aluno), valida o status e preenche a chave composta.
     * Preencher a chave é o que permite REFAZER a chamada de uma aula sem estourar
     * erro de chave duplicada: o JPA passa a fazer merge (update) em vez de insert.
     */
    private Frequencia prepararParaSalvar(Frequencia frequencia) {
        if (frequencia.getAula() == null || frequencia.getAula().getId_aula() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Informe a aula da chamada.");
        }
        if (frequencia.getAluno() == null || frequencia.getAluno().getId_aluno() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Informe o aluno da chamada.");
        }

        String status = frequencia.getStatusPresenca() == null
                ? null
                : frequencia.getStatusPresenca().trim().toUpperCase().replace(' ', '_');

        if (status == null || !STATUS_VALIDOS.contains(status)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Status inválido. Use PRESENTE, FALTA ou FALTA_JUSTIFICADA.");
        }

        Aula aulaReal = aulaRepo.findById(frequencia.getAula().getId_aula())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Aula não encontrada."));

        // Professor só faz a chamada da própria turma (Estória 9)
        acessoPedagogico.validarLancamentoNaTurma(aulaReal.getTurma());
        Aluno alunoReal = alunoRepo.findById(frequencia.getAluno().getId_aluno())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Aluno não encontrado."));

        frequencia.setAula(aulaReal);
        frequencia.setAluno(alunoReal);
        frequencia.setStatusPresenca(status);
        if (frequencia.getId() == null) {
            frequencia.setId(new FrequenciaKey());
        }
        frequencia.getId().setAulaId(aulaReal.getId_aula());
        frequencia.getId().setAlunoId(alunoReal.getId_aluno());

        return frequencia;
    }

    public List<Frequencia> buscarFrequenciaDaAula(Long idAula) {
        return frequenciaRepo.findByAulaId(idAula);
    }

    public List<Frequencia> buscarFrequenciasPorAluno(Long idAluno) {
        return frequenciaRepo.findByAlunoId(idAluno);
    }

    public List<Frequencia> buscarFrequenciasPorTurma(Long idTurma) {
        return frequenciaRepo.findByTurmaId(idTurma);
    }

    @Transactional
    public void excluirPorAula(Long idAula) {
        frequenciaRepo.deleteByAulaId(idAula);
    }
}
