package com.example.backend.service;

import com.example.backend.model.Aula;
import com.example.backend.repository.AulaRepository;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class AulaService {
    private final AulaRepository aulaRepository;

    public AulaService(AulaRepository aulaRepository) {
        this.aulaRepository = aulaRepository;
    }

    public Aula salvarAula(Aula aula) {
        return aulaRepository.save(aula);
    }

    public List<Aula> buscarPorTurma(Integer idTurma) {
        return aulaRepository.findByTurma_IdTurma(idTurma);
    }
}