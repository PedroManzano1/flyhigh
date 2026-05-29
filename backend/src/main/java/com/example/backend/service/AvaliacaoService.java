package com.example.backend.service;

import com.example.backend.model.Avaliacao;
import com.example.backend.model.Turma;
import com.example.backend.repository.AvaliacaoRepository;
import com.example.backend.repository.TurmaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class AvaliacaoService {

    @Autowired
    private AvaliacaoRepository avaliacaoRepo;

    @Autowired
    private TurmaRepository turmaRepo;

    public Avaliacao salvar(Avaliacao avaliacao) {
        // Validação crucial: Pega o ID, busca no banco e atrela à avaliação para não dar erro Transient
        if (avaliacao.getTurma() != null && avaliacao.getTurma().getId_turma() != null) {
            Turma turmaReal = turmaRepo.findById(avaliacao.getTurma().getId_turma())
                    .orElseThrow(() -> new RuntimeException("Turma não encontrada no banco de dados."));
            avaliacao.setTurma(turmaReal);
        }
        return avaliacaoRepo.save(avaliacao);
    }

    public List<Avaliacao> listarTodos() {
        return avaliacaoRepo.findAll();
    }

    public Optional<Avaliacao> buscarPorId(Long id) {
        return avaliacaoRepo.findById(id);
    }

    public void excluir(Long id) {
        avaliacaoRepo.deleteById(id);
    }

    public List<Avaliacao> buscarPorTurma(Long idTurma) {
        return avaliacaoRepo.findByTurmaId(idTurma);
    }
}