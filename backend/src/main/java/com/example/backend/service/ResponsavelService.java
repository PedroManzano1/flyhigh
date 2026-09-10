package com.example.backend.service;

import com.example.backend.model.Endereco;
import com.example.backend.model.Responsavel;
import com.example.backend.repository.ResponsavelRepository;
import com.example.backend.repository.VinculoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Service
public class ResponsavelService {

    @Autowired
    private ResponsavelRepository responsavelRepo;

    @Autowired
    private EnderecoService enderecoService;

    @Autowired
    private VinculoRepository vinculoRepo;

    @Transactional
    public Responsavel salvar(Responsavel responsavel) {
        if (responsavel.getNome() == null || responsavel.getNome().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Informe o nome do responsável.");
        }
        if (responsavel.getDataNascimento() != null && responsavel.getDataNascimento().isAfter(LocalDate.now())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "A data de nascimento não pode ser uma data futura.");
        }

        Endereco anterior = responsavel.getId_responsavel() == null
                ? null
                : responsavelRepo.findById(responsavel.getId_responsavel())
                        .map(Responsavel::getEndereco).orElse(null);

        responsavel.setEndereco(enderecoService.resolver(responsavel.getEndereco(), anterior));
        Responsavel salvo = responsavelRepo.saveAndFlush(responsavel);

        if (enderecoService.mudouDeEndereco(anterior, salvo.getEndereco())) {
            enderecoService.removerSeOrfao(anterior);
        }
        return salvo;
    }

    public List<Responsavel> listarTodos() {
        return responsavelRepo.findAll();
    }

    public Optional<Responsavel> buscarPorId(Long id) {
        return responsavelRepo.findById(id);
    }

    @Transactional
    public void excluir(Long id) {
        Responsavel responsavel = responsavelRepo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Responsável não encontrado."));

        Endereco endereco = responsavel.getEndereco();

        vinculoRepo.deleteByResponsavelId(id);
        responsavelRepo.delete(responsavel);
        responsavelRepo.flush();

        enderecoService.removerSeOrfao(endereco);
    }
}
