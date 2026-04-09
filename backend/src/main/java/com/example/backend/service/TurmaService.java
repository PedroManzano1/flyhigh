package com.example.backend.service;

import com.example.backend.model.Turma;
import com.example.backend.repository.TurmaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class TurmaService {

    @Autowired
    private TurmaRepository turmaRepo;

    public Turma salvar(Turma turma) {
        return turmaRepo.save(turma);
    }

    public List<Turma> listarTodos() {
        return turmaRepo.findAll();
    }

    public Optional<Turma> buscarPorId(Long id) {
        return turmaRepo.findById(id);
    }

    public void excluir(Long id) {
        turmaRepo.deleteById(id);
    }
}