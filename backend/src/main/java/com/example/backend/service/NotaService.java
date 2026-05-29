package com.example.backend.service;

import com.example.backend.model.Nota;
import com.example.backend.repository.NotaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class NotaService {

    @Autowired
    private NotaRepository notaRepo;

    public List<Nota> buscarNotasPorAluno(Long idAluno) {
        return notaRepo.findByAlunoId(idAluno);
    }

    public List<Nota> buscarNotasPorAvaliacao(Long idAvaliacao) {
        // Bug corrigido: agora chama a query certa
        return notaRepo.findByAvaliacaoId(idAvaliacao);
    }

    @Transactional
    public Nota salvarNota(Nota nota) {
        return notaRepo.save(nota);
    }

    // Método extra: Ideal para salvar o boletim da turma inteira de uma vez
    @Transactional
    public List<Nota> salvarNotasEmLote(List<Nota> notas) {
        return notaRepo.saveAll(notas);
    }
}