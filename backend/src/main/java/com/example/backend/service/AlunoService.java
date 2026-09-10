package com.example.backend.service;

import com.example.backend.model.Aluno;
import com.example.backend.model.Endereco;
import com.example.backend.repository.AlunoRepository;
import com.example.backend.repository.ContratoRepository;
import com.example.backend.repository.FrequenciaRepository;
import com.example.backend.repository.NotaRepository;
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
public class AlunoService {

    @Autowired
    private AlunoRepository alunoRepo;

    @Autowired
    private EnderecoService enderecoService;

    @Autowired
    private ContratoRepository contratoRepo;

    @Autowired
    private NotaRepository notaRepo;

    @Autowired
    private FrequenciaRepository frequenciaRepo;

    @Autowired
    private VinculoRepository vinculoRepo;

    @Transactional
    public Aluno salvar(Aluno aluno) {
        if (aluno.getNome() == null || aluno.getNome().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Informe o nome do aluno.");
        }
        if (aluno.getDataNascimento() != null && aluno.getDataNascimento().isAfter(LocalDate.now())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "A data de nascimento não pode ser uma data futura.");
        }

        Endereco anterior = aluno.getId_aluno() == null
                ? null
                : alunoRepo.findById(aluno.getId_aluno()).map(Aluno::getEndereco).orElse(null);

        aluno.setEndereco(enderecoService.resolver(aluno.getEndereco(), anterior));
        Aluno salvo = alunoRepo.saveAndFlush(aluno);

        if (enderecoService.mudouDeEndereco(anterior, salvo.getEndereco())) {
            enderecoService.removerSeOrfao(anterior);
        }
        return salvo;
    }

    public List<Aluno> listarTodos() {
        return alunoRepo.findAll();
    }

    public Optional<Aluno> buscarPorId(Long id) {
        return alunoRepo.findById(id);
    }

    /**
     * Exclusão protegida: aluno com histórico pedagógico ou financeiro não sai do banco,
     * senão o histórico da escola fica quebrado (e a FK derruba a requisição).
     */
    @Transactional
    public void excluir(Long id) {
        Aluno aluno = alunoRepo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Aluno não encontrado."));

        long matriculas = contratoRepo.contarPorAluno(id);
        long notas = notaRepo.contarPorAluno(id);
        long frequencias = frequenciaRepo.contarPorAluno(id);

        if (matriculas > 0 || notas > 0 || frequencias > 0) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, montarMensagem(matriculas, notas, frequencias));
        }

        Endereco endereco = aluno.getEndereco();

        // Os vínculos com responsáveis são só de ligação, podem sair junto
        vinculoRepo.deleteByAlunoId(id);
        alunoRepo.delete(aluno);
        alunoRepo.flush();

        enderecoService.removerSeOrfao(endereco);
    }

    private String montarMensagem(long matriculas, long notas, long frequencias) {
        StringBuilder sb = new StringBuilder("Este aluno não pode ser excluído porque possui ");
        StringBuilder itens = new StringBuilder();

        if (matriculas > 0) itens.append(matriculas).append(" matrícula(s)");
        if (notas > 0) {
            if (itens.length() > 0) itens.append(", ");
            itens.append(notas).append(" nota(s)");
        }
        if (frequencias > 0) {
            if (itens.length() > 0) itens.append(" e ");
            itens.append(frequencias).append(" registro(s) de frequência");
        }

        sb.append(itens).append(". Cancele a matrícula do aluno em vez de excluir o cadastro.");
        return sb.toString();
    }
}
