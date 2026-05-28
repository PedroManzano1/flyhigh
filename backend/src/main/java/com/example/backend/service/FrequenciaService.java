package com.example.backend.service;

import com.example.backend.model.Frequencia;
import com.example.backend.repository.FrequenciaRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
public class FrequenciaService {

    private final FrequenciaRepository frequenciaRepository;

    public FrequenciaService(FrequenciaRepository frequenciaRepository) {
        this.frequenciaRepository = frequenciaRepository;
    }

    @Transactional
    public Frequencia registrarFrequencia(Frequencia frequencia) {
        return frequenciaRepository.save(frequencia);
    }

    // Salvar uma lista inteira de uma vez (ideal para quando o professor salva a chamada da turma toda de uma vez no frontend)
    @Transactional
    public List<Frequencia> registrarChamadaCompleta(List<Frequencia> frequencias) {
        return frequenciaRepository.saveAll(frequencias);
    }

    public List<Frequencia> buscarFrequenciaDaAula(Integer idAula) {
        return frequenciaRepository.findByAula_IdAula(idAula);
    }

    public List<Frequencia> buscarFrequenciaDoAluno(Integer idAluno) {
        return frequenciaRepository.findByAluno_IdAluno(idAluno);
    }
}