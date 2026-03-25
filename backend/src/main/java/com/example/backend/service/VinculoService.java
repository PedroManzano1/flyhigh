package com.example.backend.service;

import com.example.backend.model.VinculoAlunoResponsavel;
import com.example.backend.repository.VinculoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class VinculoService {

    @Autowired
    private VinculoRepository repository;

    public VinculoAlunoResponsavel vincular(VinculoAlunoResponsavel vinculo) {
        // O JPA precisa que a PK composta seja preenchida antes de salvar
        vinculo.getId().setId_aluno(vinculo.getAluno().getId_aluno());
        vinculo.getId().setId_responsavel(vinculo.getResponsavel().getId_responsavel());
        return repository.save(vinculo);
    }

    public List<VinculoAlunoResponsavel> listarTodos() {
        return repository.findAll();
    }
}