package com.example.backend.service;

import com.example.backend.model.Avaliacao;
import com.example.backend.model.Turma;
import com.example.backend.repository.AvaliacaoRepository;
import com.example.backend.repository.NotaRepository;
import com.example.backend.repository.TurmaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Optional;

@Service
public class AvaliacaoService {

    private static final double PESO_TOTAL = 100.0;
    private static final Long ID_INEXISTENTE = -1L;

    @Autowired
    private AvaliacaoRepository avaliacaoRepo;

    @Autowired
    private TurmaRepository turmaRepo;

    @Autowired
    private NotaRepository notaRepo;

    @Autowired
    private AcessoPedagogicoService acessoPedagogico;

    public Avaliacao salvar(Avaliacao avaliacao) {
        if (avaliacao.getTitulo() == null || avaliacao.getTitulo().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Informe o título da avaliação.");
        }
        if (avaliacao.getNotaMaxima() == null || avaliacao.getNotaMaxima() <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "A nota máxima deve ser maior que zero.");
        }
        if (avaliacao.getData() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Informe a data da avaliação.");
        }

        if (avaliacao.getTurma() == null || avaliacao.getTurma().getId_turma() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Informe a turma da avaliação.");
        }

        // Pega a turma no banco para não dar erro de entidade Transient
        Turma turmaReal = turmaRepo.findById(avaliacao.getTurma().getId_turma())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Turma não encontrada."));

        acessoPedagogico.validarLancamentoNaTurma(turmaReal);
        avaliacao.setTurma(turmaReal);
        avaliacao.setTitulo(avaliacao.getTitulo().trim());

        validarPeso(avaliacao, turmaReal.getId_turma());

        // Se a nota máxima diminuiu, notas já lançadas podem ficar acima do teto
        if (avaliacao.getId_avaliacao() != null) {
            boolean notaAcimaDoNovoTeto = notaRepo.findByAvaliacaoId(avaliacao.getId_avaliacao()).stream()
                    .anyMatch(n -> n.getValorObtido() != null && n.getValorObtido() > avaliacao.getNotaMaxima());
            if (notaAcimaDoNovoTeto) {
                throw new ResponseStatusException(HttpStatus.CONFLICT,
                        "Existem notas lançadas acima de " + avaliacao.getNotaMaxima()
                                + ". Ajuste as notas antes de reduzir a nota máxima.");
            }
        }

        return avaliacaoRepo.save(avaliacao);
    }

    public List<Avaliacao> listarTodos() {
        return avaliacaoRepo.findAll();
    }

    public Optional<Avaliacao> buscarPorId(Long id) {
        return avaliacaoRepo.findById(id);
    }

    @Transactional
    public void excluir(Long id) {
        Avaliacao avaliacao = avaliacaoRepo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Avaliação não encontrada."));

        acessoPedagogico.validarLancamentoNaTurma(avaliacao.getTurma());

        // Remove antes as notas, senão a FK de "notas" impede a exclusão
        notaRepo.deleteByAvaliacaoId(id);
        avaliacaoRepo.deleteById(id);
    }

    public List<Avaliacao> buscarPorTurma(Long idTurma) {
        return avaliacaoRepo.findByTurmaId(idTurma);
    }

    /**
     * O peso é percentual: a soma dos pesos das avaliações da turma fecha 100%.
     * Quando não informado, assume o percentual que ainda sobrou.
     */
    private void validarPeso(Avaliacao avaliacao, Long idTurma) {
        Long idIgnorado = avaliacao.getId_avaliacao() != null ? avaliacao.getId_avaliacao() : ID_INEXISTENTE;
        double jaDistribuido = arredondar(avaliacaoRepo.somarPesos(idTurma, idIgnorado));
        double disponivel = arredondar(PESO_TOTAL - jaDistribuido);

        if (avaliacao.getPeso() == null) {
            if (disponivel <= 0) {
                throw new ResponseStatusException(HttpStatus.CONFLICT,
                        "Os 100% de peso desta turma já foram distribuídos entre as outras avaliações.");
            }
            avaliacao.setPeso(disponivel);
            return;
        }

        double peso = arredondar(avaliacao.getPeso());
        if (peso <= 0 || peso > PESO_TOTAL) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "O peso deve ser um percentual entre 0 e 100.");
        }

        // Margem de 0,01 para não barrar arredondamento de casas decimais
        if (jaDistribuido + peso > PESO_TOTAL + 0.01) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "A soma dos pesos da turma passaria de 100%. As outras avaliações já usam "
                            + formatar(jaDistribuido) + "%, então ainda cabem "
                            + formatar(disponivel) + "%.");
        }

        avaliacao.setPeso(peso);
    }

    private double arredondar(double valor) {
        return Math.round(valor * 100.0) / 100.0;
    }

    private String formatar(double valor) {
        return valor == Math.floor(valor)
                ? String.valueOf((long) valor)
                : String.valueOf(arredondar(valor));
    }
}
