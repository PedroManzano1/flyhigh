package com.example.backend.service;

import com.example.backend.dto.BoletimAlunoDTO;
import com.example.backend.dto.BoletimTurmaDTO;
import com.example.backend.model.*;
import com.example.backend.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Monta o boletim da turma cruzando notas e frequência.
 *
 * Cada atividade vale pontos e a turma soma até 400 ou 500 (modelo da turma).
 * A nota final é a soma dos pontos do aluno dividida por 4 ou 5, ficando de 0 a 100:
 *   ex.: 352 pontos no Modelo 400 = 352 ÷ 4 = 88,0
 * Aprova quem termina com 70 ou mais e com a frequência mínima. Os dois critérios
 * ficam em application.properties:
 *   flyhigh.pedagogico.nota-minima=70
 *   flyhigh.pedagogico.frequencia-minima=75.0
 */
@Service
public class BoletimService {

    @Value("${flyhigh.pedagogico.nota-minima:70.0}")
    private double notaMinima;

    @Value("${flyhigh.pedagogico.frequencia-minima:75.0}")
    private double frequenciaMinima;

    @Autowired
    private TurmaRepository turmaRepo;

    @Autowired
    private ContratoRepository contratoRepo;

    @Autowired
    private AvaliacaoRepository avaliacaoRepo;

    @Autowired
    private NotaRepository notaRepo;

    @Autowired
    private AulaRepository aulaRepo;

    @Autowired
    private FrequenciaRepository frequenciaRepo;

    /** Boletim da turma com uma linha só, a do próprio aluno (área do aluno). */
    public BoletimTurmaDTO gerarBoletimDoAluno(Long idTurma, Long idAluno) {
        BoletimTurmaDTO boletim = gerarBoletimDaTurma(idTurma);
        boletim.getAlunos().removeIf(linha -> !idAluno.equals(linha.getIdAluno()));
        return boletim;
    }

    public BoletimTurmaDTO gerarBoletimDaTurma(Long idTurma) {
        Turma turma = turmaRepo.findById(idTurma)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Turma não encontrada."));

        List<Contrato> matriculas = contratoRepo.findAtivosByTurmaId(idTurma);
        List<Avaliacao> avaliacoes = avaliacaoRepo.findByTurmaId(idTurma);
        List<Nota> notas = notaRepo.findByTurmaId(idTurma);
        List<Aula> aulas = aulaRepo.findByTurmaId(idTurma);
        List<Frequencia> frequencias = frequenciaRepo.findByTurmaId(idTurma);

        // Notas indexadas por avaliação + aluno
        Map<String, Nota> notaPorChave = new HashMap<>();
        Map<Long, Integer> lancadasPorAvaliacao = new HashMap<>();
        for (Nota n : notas) {
            Long idAvaliacao = n.getAvaliacao() != null ? n.getAvaliacao().getId_avaliacao() : null;
            Long idAluno = n.getAluno() != null ? n.getAluno().getId_aluno() : null;
            if (idAvaliacao == null || idAluno == null) continue;
            notaPorChave.put(idAvaliacao + "-" + idAluno, n);
            if (n.getValorObtido() != null) {
                lancadasPorAvaliacao.merge(idAvaliacao, 1, Integer::sum);
            }
        }

        // Histórico de presença por aluno, na ordem das aulas (a query já vem ordenada por data)
        Map<Long, List<String>> historicoPorAluno = new HashMap<>();
        for (Frequencia f : frequencias) {
            Long idAluno = f.getAluno() != null ? f.getAluno().getId_aluno() : null;
            if (idAluno == null) continue;
            historicoPorAluno.computeIfAbsent(idAluno, k -> new ArrayList<>()).add(f.getStatusPresenca());
        }

        BoletimTurmaDTO boletim = new BoletimTurmaDTO();
        boletim.setIdTurma(turma.getId_turma());
        boletim.setCodigoTurma(turma.getCodigoTurma());
        boletim.setCurso(turma.getCurso() != null ? turma.getCurso().getNome() : null);
        boletim.setProfessor(turma.getProfessor() != null ? turma.getProfessor().getNome() : null);
        boletim.setSemestreAno(turma.getSemestreAno());
        boletim.setTotalAulas(aulas.size());
        boletim.setTotalAvaliacoes(avaliacoes.size());
        boletim.setTotalAlunos(matriculas.size());
        double pontosCadastrados = avaliacoes.stream().mapToDouble(BoletimService::pontosDe).sum();
        // Turma antiga, sem modelo: usa a soma das atividades cadastradas como total
        double pontuacaoTotal = turma.getPontuacaoTotal() != null ? turma.getPontuacaoTotal() : pontosCadastrados;
        double divisor = pontuacaoTotal / 100.0;

        boletim.setPontuacaoTotal(arredondar(pontuacaoTotal));
        boletim.setPontosCadastrados(arredondar(pontosCadastrados));
        boletim.setDivisor(arredondar(divisor));
        boletim.setModeloDefinido(turma.getPontuacaoTotal() != null);
        boletim.setNotaMinima(notaMinima);
        boletim.setFrequenciaMinima(frequenciaMinima);

        for (Avaliacao a : avaliacoes) {
            BoletimTurmaDTO.AvaliacaoResumo resumo = new BoletimTurmaDTO.AvaliacaoResumo();
            resumo.setIdAvaliacao(a.getId_avaliacao());
            resumo.setTitulo(a.getTitulo());
            resumo.setCategoria(a.getCategoria());
            resumo.setEtapa(a.getEtapa());
            resumo.setNotaMaxima(a.getNotaMaxima());
            resumo.setData(a.getData());
            resumo.setNotasLancadas(lancadasPorAvaliacao.getOrDefault(a.getId_avaliacao(), 0));
            boletim.getAvaliacoes().add(resumo);
        }

        for (Contrato matricula : matriculas) {
            Aluno aluno = matricula.getAluno();
            if (aluno == null) continue;
            BoletimAlunoDTO linha = montarLinha(aluno, avaliacoes, notaPorChave, historicoPorAluno,
                    pontuacaoTotal, divisor);
            definirSituacao(linha, pontosCadastrados, pontuacaoTotal);
            boletim.getAlunos().add(linha);
        }

        return boletim;
    }

    private BoletimAlunoDTO montarLinha(Aluno aluno,
                                        List<Avaliacao> avaliacoes,
                                        Map<String, Nota> notaPorChave,
                                        Map<Long, List<String>> historicoPorAluno,
                                        double pontuacaoTotal,
                                        double divisor) {

        BoletimAlunoDTO linha = new BoletimAlunoDTO();
        linha.setIdAluno(aluno.getId_aluno());
        linha.setNome(aluno.getNome());
        linha.setNumeroMatricula(aluno.getNumeroMatricula());
        linha.setTotalAvaliacoes(avaliacoes.size());

        double pontosObtidos = 0;
        double pontosLancados = 0;
        int lancadas = 0;

        for (Avaliacao a : avaliacoes) {
            BoletimAlunoDTO.ItemNota item = new BoletimAlunoDTO.ItemNota();
            item.setIdAvaliacao(a.getId_avaliacao());
            item.setTitulo(a.getTitulo());
            item.setCategoria(a.getCategoria());
            item.setEtapa(a.getEtapa());
            item.setNotaMaxima(a.getNotaMaxima());

            Nota nota = notaPorChave.get(a.getId_avaliacao() + "-" + aluno.getId_aluno());
            if (nota != null && nota.getValorObtido() != null) {
                item.setValorObtido(nota.getValorObtido());
                pontosObtidos += nota.getValorObtido();
                pontosLancados += pontosDe(a);
                lancadas++;
            }

            linha.getNotas().add(item);
        }

        linha.setAvaliacoesLancadas(lancadas);
        linha.setPontosObtidos(arredondar(pontosObtidos));
        linha.setPontosLancados(arredondar(pontosLancados));

        if (lancadas > 0 && divisor > 0) {
            // Nota final = soma dos pontos ÷ 4 (Modelo 400) ou ÷ 5 (Modelo 500)
            double notaFinal = pontosObtidos / divisor;
            linha.setNotaFinal(arredondar(notaFinal));
            linha.setNotaFinalArredondada(arredondarUmaCasa(notaFinal));

            // O que ainda pode entrar: o que não foi lançado das atividades cadastradas
            // mais o que ainda nem foi cadastrado até fechar o modelo
            double pontosEmAberto = Math.max(pontuacaoTotal - pontosLancados, 0);
            linha.setNotaMaximaPossivel(arredondar((pontosObtidos + pontosEmAberto) / divisor));
        }
        linha.setAproveitamento(pontosLancados > 0 ? arredondar(pontosObtidos * 100.0 / pontosLancados) : null);

        List<String> historico = historicoPorAluno.getOrDefault(aluno.getId_aluno(), List.of());
        int presencas = 0;
        int faltas = 0;
        int justificadas = 0;
        for (String status : historico) {
            if ("PRESENTE".equals(status)) presencas++;
            else if ("FALTA_JUSTIFICADA".equals(status)) justificadas++;
            else faltas++;
        }

        int consecutivas = 0;
        for (int i = historico.size() - 1; i >= 0; i--) {
            if ("FALTA".equals(historico.get(i))) consecutivas++;
            else break;
        }

        linha.setAulasRegistradas(historico.size());
        linha.setPresencas(presencas);
        linha.setFaltas(faltas);
        linha.setFaltasJustificadas(justificadas);
        linha.setFaltasConsecutivas(consecutivas);
        linha.setPercentualFrequencia(historico.isEmpty()
                ? null
                : arredondar(((presencas + justificadas) * 100.0) / historico.size()));

        return linha;
    }

    private void definirSituacao(BoletimAlunoDTO linha, double pontosCadastrados, double pontuacaoTotal) {
        if (linha.getAvaliacoesLancadas() == 0 && linha.getAulasRegistradas() == 0) {
            linha.setSituacao("SEM_LANCAMENTOS");
            linha.setObservacao("Nenhuma nota ou presença registrada.");
            return;
        }

        boolean notaAbaixo = linha.getNotaFinal() != null && linha.getNotaFinal() < notaMinima;
        boolean frequenciaAbaixo = linha.getPercentualFrequencia() != null
                && linha.getPercentualFrequencia() < frequenciaMinima;

        // Fechou quando todas as atividades foram lançadas e elas cobrem o modelo inteiro
        boolean todasLancadas = linha.getTotalAvaliacoes() > 0
                && linha.getAvaliacoesLancadas() == linha.getTotalAvaliacoes();
        boolean modeloCompleto = pontosCadastrados >= pontuacaoTotal - 0.01;
        boolean semChance = linha.getNotaMaximaPossivel() != null && linha.getNotaMaximaPossivel() < notaMinima;

        if (frequenciaAbaixo) {
            linha.setSituacao("REPROVADO");
            linha.setObservacao("Frequência abaixo de " + formatar(frequenciaMinima) + "%.");
            return;
        }
        if (semChance) {
            linha.setSituacao("REPROVADO");
            linha.setObservacao(todasLancadas && modeloCompleto
                    ? "Nota final abaixo de " + formatar(notaMinima) + "."
                    : "Mesmo com nota máxima no que falta, não chega a " + formatar(notaMinima) + ".");
            return;
        }
        if (todasLancadas && modeloCompleto) {
            linha.setSituacao(notaAbaixo ? "REPROVADO" : "APROVADO");
            linha.setObservacao(notaAbaixo
                    ? "Nota final abaixo de " + formatar(notaMinima) + "."
                    : "Nota final e frequência dentro do exigido.");
            return;
        }

        linha.setSituacao("CURSANDO");
        if (todasLancadas) {
            linha.setObservacao("As atividades cadastradas somam " + formatar(pontosCadastrados)
                    + " de " + formatar(pontuacaoTotal) + " pontos.");
        } else {
            linha.setObservacao(linha.getAvaliacoesLancadas() + " de " + linha.getTotalAvaliacoes()
                    + " atividade(s) lançada(s).");
        }
    }

    private static double pontosDe(Avaliacao a) {
        return a.getNotaMaxima() != null && a.getNotaMaxima() > 0 ? a.getNotaMaxima() : 0.0;
    }

    private String formatar(double valor) {
        return valor == Math.floor(valor) ? String.valueOf((long) valor) : String.valueOf(arredondarUmaCasa(valor));
    }

    private Double arredondar(double valor) {
        return Math.round(valor * 100.0) / 100.0;
    }

    private Double arredondarUmaCasa(double valor) {
        return Math.round(valor * 10.0) / 10.0;
    }
}
