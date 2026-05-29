package com.example.backend.service;

import com.example.backend.model.Aula;
import com.example.backend.repository.AulaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class AulaService {

    @Autowired
    private AulaRepository aulaRepo;

    public Aula salvar(Aula aula) {
        return aulaRepo.save(aula);
    }

    public List<Aula> listarTodos() {
        return aulaRepo.findAll();
    }

    public Optional<Aula> buscarPorId(Long id) {
        return aulaRepo.findById(id);
    }

    public void excluir(Long id) {
        aulaRepo.deleteById(id);
    }

    public List<Aula> buscarPorTurma(Long idTurma) {
        return aulaRepo.findByTurmaId(idTurma);
    }
}