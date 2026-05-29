package com.example.backend.service;

import com.example.backend.model.Frequencia;
import com.example.backend.repository.FrequenciaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class FrequenciaService {

    @Autowired
    private FrequenciaRepository frequenciaRepo;

    @Transactional
    public Frequencia registrarFrequencia(Frequencia frequencia) {
        return frequenciaRepo.save(frequencia);
    }

    @Transactional
    public List<Frequencia> registrarChamadaCompleta(List<Frequencia> frequencias) {
        return frequenciaRepo.saveAll(frequencias);
    }

    public List<Frequencia> buscarFrequenciaDaAula(Long idAula) {
        // Chamada corrigida para usar findByAulaId
        return frequenciaRepo.findByAulaId(idAula);
    }

    public List<Frequencia> buscarFrequenciasPorAluno(Long idAluno) {
        return frequenciaRepo.findByAlunoId(idAluno);
    }
}