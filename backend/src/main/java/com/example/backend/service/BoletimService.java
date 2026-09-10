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
 * O peso de cada avaliação é percentual e a nota final é a SOMA das notas calculadas:
 *   nota calculada = (nota / nota máxima x 10) x peso%
 *   ex.: 8,45 com peso 80% = 6,76  |  10,00 com peso 20% = 2,00  |  final = 8,76 (8,8)
 *
 * A ERS não define nota mínima de aprovação nem frequência mínima, então os dois
 * critérios ficam em application.properties (padrão: média 6,0 e 75% de presença):
 *   flyhigh.pedagogico.media-minima=6.0
 *   flyhigh.pedagogico.frequencia-minima=75.0
 */
@Service
public class BoletimService {

    @Value("${flyhigh.pedagogico.media-minima:6.0}")
    private double mediaMinima;

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
        boletim.setPesoTotal(arredondar(avaliacoes.stream().mapToDouble(BoletimService::pesoDe).sum()));
        boletim.setMediaMinima(mediaMinima);
        boletim.setFrequenciaMinima(frequenciaMinima);

        for (Avaliacao a : avaliacoes) {
            BoletimTurmaDTO.AvaliacaoResumo resumo = new BoletimTurmaDTO.AvaliacaoResumo();
            resumo.setIdAvaliacao(a.getId_avaliacao());
            resumo.setTitulo(a.getTitulo());
            resumo.setNotaMaxima(a.getNotaMaxima());
            resumo.setPeso(pesoDe(a));
            resumo.setData(a.getData());
            resumo.setNotasLancadas(lancadasPorAvaliacao.getOrDefault(a.getId_avaliacao(), 0));
            boletim.getAvaliacoes().add(resumo);
        }

        for (Contrato matricula : matriculas) {
            Aluno aluno = matricula.getAluno();
            if (aluno == null) continue;
            boletim.getAlunos().add(montarLinha(aluno, avaliacoes, notaPorChave, historicoPorAluno));
        }

        return boletim;
    }

    private BoletimAlunoDTO montarLinha(Aluno aluno,
                                        List<Avaliacao> avaliacoes,
                                        Map<String, Nota> notaPorChave,
                                        Map<Long, List<String>> historicoPorAluno) {

        BoletimAlunoDTO linha = new BoletimAlunoDTO();
        linha.setIdAluno(aluno.getId_aluno());
        linha.setNome(aluno.getNome());
        linha.setNumeroMatricula(aluno.getNumeroMatricula());
        linha.setTotalAvaliacoes(avaliacoes.size());

        double notaFinal = 0;
        double pesoLancado = 0;
        double pesoTotal = 0;
        int lancadas = 0;

        for (Avaliacao a : avaliacoes) {
            double peso = pesoDe(a);
            pesoTotal += peso;

            BoletimAlunoDTO.ItemNota item = new BoletimAlunoDTO.ItemNota();
            item.setIdAvaliacao(a.getId_avaliacao());
            item.setTitulo(a.getTitulo());
            item.setNotaMaxima(a.getNotaMaxima());
            item.setPeso(peso);

            Nota nota = notaPorChave.get(a.getId_avaliacao() + "-" + aluno.getId_aluno());
            if (nota != null && nota.getValorObtido() != null) {
                item.setValorObtido(nota.getValorObtido());

                // Normaliza para 0 a 10 para que avaliações com tetos diferentes possam ser somadas
                double base10 = a.getNotaMaxima() != null && a.getNotaMaxima() > 0
                        ? (nota.getValorObtido() / a.getNotaMaxima()) * 10.0
                        : nota.getValorObtido();

                // Nota calculada = nota x peso%  (ex.: 8,45 com peso 80% => 6,76)
                double calculada = base10 * (peso / 100.0);

                item.setNotaBase10(arredondar(base10));
                item.setNotaCalculada(arredondar(calculada));

                notaFinal += calculada;
                pesoLancado += peso;
                lancadas++;
            }

            linha.getNotas().add(item);
        }

        linha.setAvaliacoesLancadas(lancadas);
        linha.setPesoLancado(arredondar(pesoLancado));
        linha.setPesoTotal(arredondar(pesoTotal));
        // Nota final é a soma das notas calculadas, não uma média
        linha.setNotaFinal(lancadas > 0 ? arredondar(notaFinal) : null);
        linha.setNotaFinalArredondada(lancadas > 0 ? arredondarUmaCasa(notaFinal) : null);

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

        definirSituacao(linha);
        return linha;
    }

    private void definirSituacao(BoletimAlunoDTO linha) {
        if (linha.getAvaliacoesLancadas() == 0 && linha.getAulasRegistradas() == 0) {
            linha.setSituacao("SEM_LANCAMENTOS");
            linha.setObservacao("Nenhuma nota ou presença registrada.");
            return;
        }

        boolean notaAbaixo = linha.getNotaFinal() != null && linha.getNotaFinal() < mediaMinima;
        boolean frequenciaAbaixo = linha.getPercentualFrequencia() != null
                && linha.getPercentualFrequencia() < frequenciaMinima;

        // Reprovação por frequência já é definitiva; por nota, só depois de todas as avaliações
        boolean todasLancadas = linha.getTotalAvaliacoes() > 0
                && linha.getAvaliacoesLancadas() == linha.getTotalAvaliacoes();

        if (frequenciaAbaixo) {
            linha.setSituacao("REPROVADO");
            linha.setObservacao("Frequência abaixo de " + frequenciaMinima + "%.");
            return;
        }
        if (todasLancadas && notaAbaixo) {
            linha.setSituacao("REPROVADO");
            linha.setObservacao("Nota final abaixo de " + mediaMinima + ".");
            return;
        }
        if (todasLancadas) {
            linha.setSituacao("APROVADO");
            linha.setObservacao("Nota final e frequência dentro do exigido.");
            return;
        }

        linha.setSituacao("CURSANDO");
        linha.setObservacao(linha.getAvaliacoesLancadas() + " de " + linha.getTotalAvaliacoes()
                + " avaliação(ões) lançada(s).");
    }

    private static double pesoDe(Avaliacao a) {
        return a.getPeso() != null && a.getPeso() > 0 ? a.getPeso() : 0.0;
    }

    private Double arredondar(double valor) {
        return Math.round(valor * 100.0) / 100.0;
    }

    private Double arredondarUmaCasa(double valor) {
        return Math.round(valor * 10.0) / 10.0;
    }
}
