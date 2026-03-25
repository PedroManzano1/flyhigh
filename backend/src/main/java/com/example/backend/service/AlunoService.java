package com.example.backend.service;

import com.example.backend.model.Aluno;
import com.example.backend.model.Endereco;
import com.example.backend.repository.AlunoRepository;
import com.example.backend.repository.EnderecoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class AlunoService {

    @Autowired
    private AlunoRepository alunoRepo;

    @Autowired
    private EnderecoRepository enderecoRepo;

    public Aluno salvar(Aluno aluno) {
        if (aluno.getEndereco() != null) {
            Endereco end = aluno.getEndereco();
            Optional<Endereco> enderecoExistente = enderecoRepo
                    .findByCepAndNumero(end.getCep(), end.getNumero());

            if (enderecoExistente.isPresent()) {
                aluno.setEndereco(enderecoExistente.get());
            } else {
                enderecoRepo.save(end);
            }
        }
        return alunoRepo.save(aluno);
    }

    public List<Aluno> listarTodos() {
        return alunoRepo.findAll();
    }

    public Optional<Aluno> buscarPorId(Long id) {
        return alunoRepo.findById(id);
    }

    public void excluir(Long id) {
        alunoRepo.deleteById(id);
    }
}