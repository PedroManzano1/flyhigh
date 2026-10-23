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

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Atividades avaliativas da turma. Cada uma vale um número de pontos (nota máxima)
 * e a soma das atividades fecha a pontuação da turma: 400 ou 500. No fim a soma
 * do aluno é dividida por 4 ou 5 (ver BoletimService).
 */
@Service
public class AvaliacaoService {

    private static final Long ID_INEXISTENTE = -1L;

    private record ItemModelo(String categoria, String etapa, double pontos) {}

    // As duas planilhas da escola ("Student's Evaluation Chart")
    private static final Map<Integer, List<ItemModelo>> MODELOS = Map.of(
            400, montarModelo(
                    grupo("Written Check", 50, "1st", "2nd", "3rd", "4th"),
                    grupo("Project", 10, "1st", "2nd", "3rd", "4th"),
                    grupo("Homework", 10, "1st", "2nd", "3rd", "4th"),
                    grupo("Performance", 20, "1st", "2nd", "3rd", "4th"),
                    grupo("Attitude", 10, "1st", "2nd", "3rd", "4th")),
            500, montarModelo(
                    grupo("Written Check", 50, "1st", "2nd", "3rd", "4th"),
                    grupo("Oral Check", 50, "Mid", "Final"),
                    grupo("Homework", 10, "1st", "2nd", "3rd", "4th"),
                    grupo("Performance", 30, "1st", "2nd", "3rd", "4th"),
                    grupo("Attitude", 10, "1st", "2nd", "3rd", "4th")));

    @Autowired
    private AvaliacaoRepository avaliacaoRepo;

    @Autowired
    private TurmaRepository turmaRepo;

    @Autowired
    private NotaRepository notaRepo;

    @Autowired
    private AcessoPedagogicoService acessoPedagogico;

    public Avaliacao salvar(Avaliacao avaliacao) {
        if (avaliacao.getTurma() == null || avaliacao.getTurma().getId_turma() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Informe a turma da atividade.");
        }

        // Pega a turma no banco para não dar erro de entidade Transient
        Turma turmaReal = turmaRepo.findById(avaliacao.getTurma().getId_turma())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Turma não encontrada."));

        acessoPedagogico.validarLancamentoNaTurma(turmaReal);
        avaliacao.setTurma(turmaReal);

        // A tela de edição manda só título, pontos e data; o resto vem do que já está gravado
        if (avaliacao.getId_avaliacao() != null) {
            avaliacaoRepo.findById(avaliacao.getId_avaliacao()).ifPresent(existente -> {
                if (avaliacao.getCategoria() == null) avaliacao.setCategoria(existente.getCategoria());
                if (avaliacao.getEtapa() == null) avaliacao.setEtapa(existente.getEtapa());
                if (avaliacao.getOrdem() == null) avaliacao.setOrdem(existente.getOrdem());
            });
        }

        avaliacao.setCategoria(limpar(avaliacao.getCategoria()));
        avaliacao.setEtapa(limpar(avaliacao.getEtapa()));
        String titulo = limpar(avaliacao.getTitulo());
        if (titulo == null && avaliacao.getCategoria() != null) {
            titulo = avaliacao.getEtapa() != null
                    ? avaliacao.getCategoria() + " " + avaliacao.getEtapa()
                    : avaliacao.getCategoria();
        }
        if (titulo == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Informe o nome da atividade.");
        }
        avaliacao.setTitulo(titulo);

        if (avaliacao.getNotaMaxima() == null || avaliacao.getNotaMaxima() <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Informe quantos pontos a atividade vale.");
        }
        avaliacao.setNotaMaxima(arredondar(avaliacao.getNotaMaxima()));

        validarPontos(avaliacao, turmaReal);

        // Se os pontos diminuíram, notas já lançadas podem ficar acima do teto
        if (avaliacao.getId_avaliacao() != null) {
            boolean notaAcimaDoNovoTeto = notaRepo.findByAvaliacaoId(avaliacao.getId_avaliacao()).stream()
                    .anyMatch(n -> n.getValorObtido() != null && n.getValorObtido() > avaliacao.getNotaMaxima());
            if (notaAcimaDoNovoTeto) {
                throw new ResponseStatusException(HttpStatus.CONFLICT,
                        "Existem notas lançadas acima de " + formatar(avaliacao.getNotaMaxima())
                                + " pontos. Ajuste as notas antes de reduzir o valor da atividade.");
            }
        } else if (avaliacao.getOrdem() == null) {
            avaliacao.setOrdem(avaliacaoRepo.maiorOrdem(turmaReal.getId_turma()) + 1);
        }

        return avaliacaoRepo.save(avaliacao);
    }

    /**
     * Cria de uma vez todas as atividades da planilha da escola (Modelo 400 ou 500)
     * e grava o modelo na turma. Só para turma ainda sem atividades.
     */
    @Transactional
    public List<Avaliacao> aplicarModelo(Long idTurma, Integer pontuacao) {
        List<ItemModelo> modelo = MODELOS.get(pontuacao);
        if (modelo == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Modelo inválido. Use o Modelo 400 ou o Modelo 500.");
        }

        Turma turma = turmaRepo.findById(idTurma)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Turma não encontrada."));
        acessoPedagogico.validarLancamentoNaTurma(turma);

        long existentes = avaliacaoRepo.contarPorTurma(idTurma);
        if (existentes > 0) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Esta turma já tem " + existentes + " atividade(s). O modelo só pode ser aplicado numa turma sem atividades.");
        }

        turma.setPontuacaoTotal(pontuacao);
        turmaRepo.save(turma);

        List<Avaliacao> criadas = new ArrayList<>();
        int ordem = 1;
        for (ItemModelo item : modelo) {
            Avaliacao a = new Avaliacao();
            a.setTurma(turma);
            a.setCategoria(item.categoria());
            a.setEtapa(item.etapa());
            a.setTitulo(item.categoria() + " " + item.etapa());
            a.setNotaMaxima(item.pontos());
            a.setOrdem(ordem++);
            criadas.add(a);
        }
        return avaliacaoRepo.saveAll(criadas);
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
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Atividade não encontrada."));

        acessoPedagogico.validarLancamentoNaTurma(avaliacao.getTurma());

        // Remove antes as notas, senão a FK de "notas" impede a exclusão
        notaRepo.deleteByAvaliacaoId(id);
        avaliacaoRepo.deleteById(id);
    }

    public List<Avaliacao> buscarPorTurma(Long idTurma) {
        return avaliacaoRepo.findByTurmaId(idTurma);
    }

    /** A soma dos pontos das atividades não pode passar da pontuação da turma (400 ou 500). */
    private void validarPontos(Avaliacao avaliacao, Turma turma) {
        if (turma.getPontuacaoTotal() == null) return;

        Long idIgnorado = avaliacao.getId_avaliacao() != null ? avaliacao.getId_avaliacao() : ID_INEXISTENTE;
        double jaDistribuido = arredondar(avaliacaoRepo.somarPontos(turma.getId_turma(), idIgnorado));
        double disponivel = arredondar(turma.getPontuacaoTotal() - jaDistribuido);

        // Margem de 0,01 para não barrar arredondamento de casas decimais
        if (jaDistribuido + avaliacao.getNotaMaxima() > turma.getPontuacaoTotal() + 0.01) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "A soma dos pontos da turma passaria de " + turma.getPontuacaoTotal()
                            + ". As outras atividades já valem " + formatar(jaDistribuido)
                            + " ponto(s), então ainda cabem " + formatar(Math.max(disponivel, 0)) + ".");
        }
    }

    private static List<ItemModelo> grupo(String categoria, double pontos, String... etapas) {
        List<ItemModelo> itens = new ArrayList<>();
        for (String etapa : etapas) itens.add(new ItemModelo(categoria, etapa, pontos));
        return itens;
    }

    @SafeVarargs
    private static List<ItemModelo> montarModelo(List<ItemModelo>... grupos) {
        List<ItemModelo> todos = new ArrayList<>();
        for (List<ItemModelo> g : grupos) todos.addAll(g);
        return List.copyOf(todos);
    }

    private String limpar(String texto) {
        return texto == null || texto.isBlank() ? null : texto.trim();
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
