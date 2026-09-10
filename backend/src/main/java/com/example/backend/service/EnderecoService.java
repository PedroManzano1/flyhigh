package com.example.backend.service;

import com.example.backend.model.Endereco;
import com.example.backend.repository.AlunoRepository;
import com.example.backend.repository.EnderecoRepository;
import com.example.backend.repository.ResponsavelRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

/**
 * Cada aluno/responsável tem o seu próprio endereço.
 *
 * Antes o endereço era reaproveitado por CEP+número entre pessoas diferentes, então
 * corrigir o logradouro de um aluno alterava o de todos que dividiam aquele registro.
 * Agora o registro só é alterado no lugar quando ninguém mais aponta para ele.
 */
@Service
public class EnderecoService {

    @Autowired
    private EnderecoRepository enderecoRepo;

    @Autowired
    private AlunoRepository alunoRepo;

    @Autowired
    private ResponsavelRepository responsavelRepo;

    /**
     * @param informado endereço que veio do frontend
     * @param atual     endereço hoje vinculado à pessoa (nulo em um cadastro novo)
     */
    public Endereco resolver(Endereco informado, Endereco atual) {
        if (estaVazio(informado)) {
            return atual;
        }

        // Endereço exclusivo desta pessoa: pode ser corrigido no lugar
        if (atual != null && atual.getId_endereco() != null
                && contarReferencias(atual.getId_endereco()) <= 1) {
            copiarCampos(informado, atual);
            return enderecoRepo.save(atual);
        }

        Endereco novo = new Endereco();
        copiarCampos(informado, novo);
        return enderecoRepo.save(novo);
    }

    /** Chamar depois de salvar a pessoa, para não deixar endereço solto na tabela. */
    public void removerSeOrfao(Endereco endereco) {
        if (endereco == null || endereco.getId_endereco() == null) return;
        if (contarReferencias(endereco.getId_endereco()) == 0) {
            enderecoRepo.deleteById(endereco.getId_endereco());
        }
    }

    public boolean mudouDeEndereco(Endereco anterior, Endereco atual) {
        if (anterior == null || anterior.getId_endereco() == null) return false;
        if (atual == null || atual.getId_endereco() == null) return true;
        return !anterior.getId_endereco().equals(atual.getId_endereco());
    }

    private long contarReferencias(Long idEndereco) {
        return alunoRepo.contarPorEndereco(idEndereco) + responsavelRepo.contarPorEndereco(idEndereco);
    }

    private boolean estaVazio(Endereco e) {
        if (e == null) return true;
        return vazio(e.getLogradouro()) && vazio(e.getNumero()) && vazio(e.getCep())
                && vazio(e.getBairro()) && vazio(e.getCidade()) && vazio(e.getComplemento());
    }

    private boolean vazio(String valor) {
        return valor == null || valor.isBlank();
    }

    private void copiarCampos(Endereco origem, Endereco destino) {
        destino.setLogradouro(origem.getLogradouro());
        destino.setNumero(origem.getNumero());
        destino.setComplemento(origem.getComplemento());
        destino.setCep(origem.getCep());
        destino.setBairro(origem.getBairro());
        destino.setCidade(origem.getCidade());
    }
}
