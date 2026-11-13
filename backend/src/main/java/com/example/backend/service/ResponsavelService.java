package com.example.backend.service;

import com.example.backend.model.Endereco;
import com.example.backend.model.Responsavel;
import com.example.backend.repository.ContratoRepository;
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

    @Autowired
    private ContratoRepository contratoRepo;

    @Transactional
    public Responsavel salvar(Responsavel responsavel) {
        if (responsavel.getNome() == null || responsavel.getNome().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Informe o nome do responsável.");
        }
        if (responsavel.getDataNascimento() != null && responsavel.getDataNascimento().isAfter(LocalDate.now())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "A data de nascimento não pode ser uma data futura.");
        }

        responsavel.setCpf(Cpf.normalizar(responsavel.getCpf()));
        validarCpfLivre(responsavel);

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

    private void validarCpfLivre(Responsavel responsavel) {
        if (responsavel.getCpf() == null) return;
        responsavelRepo.findByCpfSomenteNumeros(Cpf.somenteNumeros(responsavel.getCpf())).stream()
                .filter(outro -> !outro.getId_responsavel().equals(responsavel.getId_responsavel()))
                .findFirst()
                .ifPresent(outro -> {
                    throw new ResponseStatusException(HttpStatus.CONFLICT,
                            "Este CPF já está no cadastro do responsável " + outro.getNome() + ".");
                });
    }

    /** Mesma correção de cadastros antigos feita em AlunoService. */
    @Transactional
    public int corrigirCadastrosAntigos() {
        int corrigidos = responsavelRepo.limparCpfVazio();
        for (Responsavel r : responsavelRepo.findAll()) {
            String numeros = Cpf.somenteNumeros(r.getCpf());
            if (r.getCpf() == null || numeros.length() != 11) continue;
            String formatado = Cpf.normalizar(r.getCpf());
            if (!formatado.equals(r.getCpf()) && responsavelRepo.findByCpfSomenteNumeros(numeros).size() == 1) {
                r.setCpf(formatado);
                responsavelRepo.saveAndFlush(r);
                corrigidos++;
            }
        }
        return corrigidos;
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

        // Contratante de contrato fica no banco: o contrato assinado precisa dele
        long contratos = contratoRepo.contarPorResponsavel(id);
        if (contratos > 0) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Este responsável é o contratante de " + contratos + " contrato(s) e não pode ser excluído.");
        }

        Endereco endereco = responsavel.getEndereco();

        vinculoRepo.deleteByResponsavelId(id);
        responsavelRepo.delete(responsavel);
        responsavelRepo.flush();

        enderecoService.removerSeOrfao(endereco);
    }
}
