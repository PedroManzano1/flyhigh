package com.example.backend.service;

import com.example.backend.model.Avaliacao;
import com.example.backend.repository.AvaliacaoRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
public class AvaliacaoService {

    private final AvaliacaoRepository avaliacaoRepository;

    public AvaliacaoService(AvaliacaoRepository avaliacaoRepository) {
        this.avaliacaoRepository = avaliacaoRepository;
    }

    public List<Avaliacao> buscarAvaliacoesPorTurma(Integer idTurma) {
        return avaliacaoRepository.findByTurma_IdTurma(idTurma);
    }

    public Avaliacao buscarPorId(Integer id) {
        return avaliacaoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Avaliação não encontrada"));
    }

    @Transactional
    public Avaliacao salvarAvaliacao(Avaliacao avaliacao) {
        return avaliacaoRepository.save(avaliacao);
    }

    @Transactional
    public void deletarAvaliacao(Integer id) {
        avaliacaoRepository.deleteById(id);
    }
}