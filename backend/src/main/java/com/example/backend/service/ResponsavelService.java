package com.example.backend.service;

import com.example.backend.model.Endereco;
import com.example.backend.model.Responsavel;
import com.example.backend.repository.EnderecoRepository;
import com.example.backend.repository.ResponsavelRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class ResponsavelService {

    @Autowired
    private ResponsavelRepository responsavelRepo;

    @Autowired
    private EnderecoRepository enderecoRepo;

    // CREATE e UPDATE
    public Responsavel salvar(Responsavel responsavel) {
        if (responsavel.getEndereco() != null) {
            Endereco end = responsavel.getEndereco();

            // Tenta encontrar um endereço idêntico já cadastrado
            Optional<Endereco> enderecoExistente = enderecoRepo
                    .findByCepAndNumero(end.getCep(), end.getNumero());

            if (enderecoExistente.isPresent())
            {
                // Se achou, usa o que já está no banco em vez de criar um novo
                responsavel.setEndereco(enderecoExistente.get());
            }
            else
            {
                // Se não achou, salva o novo
                enderecoRepo.save(end);
            }
        }
        return responsavelRepo.save(responsavel);
    }

    // READ ALL
    public List<Responsavel> listarTodos() {
        return responsavelRepo.findAll();
    }

    // READ BY ID
    public Optional<Responsavel> buscarPorId(Long id) {
        return responsavelRepo.findById(id);
    }

    // DELETE
    public void excluir(Long id) {
        responsavelRepo.deleteById(id);
    }
}