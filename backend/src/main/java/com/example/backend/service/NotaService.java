package com.example.backend.service;

import com.example.backend.model.Nota;
import com.example.backend.repository.NotaRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
public class NotaService {

    private final NotaRepository notaRepository;

    public NotaService(NotaRepository notaRepository) {
        this.notaRepository = notaRepository;
    }

    public List<Nota> buscarNotasPorAluno(Integer idAluno) {
        return notaRepository.findByAluno_IdAluno(idAluno);
    }

    public List<Nota> buscarNotasPorAvaliacao(Integer idAvaliacao) {
        return notaRepository.findByAvaliacao_IdAvaliacao(idAvaliacao);
    }

    @Transactional
    public Nota salvarNota(Nota nota) {
        // Regra de negócio opcional: verificar se a nota não ultrapassa a notaMaxima da Avaliacao
        return notaRepository.save(nota);
    }
}