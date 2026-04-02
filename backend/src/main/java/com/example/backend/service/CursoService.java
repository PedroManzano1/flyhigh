package com.example.backend.service;

import com.example.backend.model.Curso;
import com.example.backend.repository.CursoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class CursoService {

    @Autowired
    private CursoRepository cursoRepo;

    public Curso salvar(Curso curso) {
        return cursoRepo.save(curso);
    }

    public List<Curso> listarTodos() {
        return cursoRepo.findAll();
    }

    public Optional<Curso> buscarPorId(Long id) {
        return cursoRepo.findById(id);
    }

    public void excluir(Long id) {
        cursoRepo.deleteById(id);
    }
}