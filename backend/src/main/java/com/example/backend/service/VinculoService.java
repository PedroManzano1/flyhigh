package com.example.backend.service;

import com.example.backend.model.VinculoAlunoResponsavel;
import com.example.backend.model.VinculoId;
import com.example.backend.repository.VinculoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class VinculoService {

    @Autowired
    private VinculoRepository repository;

    public VinculoAlunoResponsavel vincular(VinculoAlunoResponsavel vinculo) {
        vinculo.getId().setId_aluno(vinculo.getAluno().getId_aluno());
        vinculo.getId().setId_responsavel(vinculo.getResponsavel().getId_responsavel());
        return repository.save(vinculo);
    }

    public List<VinculoAlunoResponsavel> listarTodos() {
        return repository.findAll();
    }

    //Método para desfazer o vínculo usando a chave composta
    public void desfazerVinculo(Long idAluno, Long idResponsavel) {
        VinculoId id = new VinculoId();
        id.setId_aluno(idAluno);
        id.setId_responsavel(idResponsavel);

        if (repository.existsById(id)) {
            repository.deleteById(id);
        } else {
            throw new RuntimeException("Vínculo não encontrado.");
        }
    }
}