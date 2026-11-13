package com.example.backend.service;

import com.example.backend.model.Aluno;
import com.example.backend.model.AtualizacaoAnoEscolar;
import com.example.backend.repository.AlunoRepository;
import com.example.backend.repository.AtualizacaoAnoEscolarRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.text.Normalizer;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Avança o ano escolar de todos os alunos na virada do ano (1º de janeiro).
 *
 * Quem chama é o AgendadorAnoEscolar (todo dia e quando o backend sobe). Cada ano
 * fica registrado em AtualizacaoAnoEscolar na mesma transação em que os alunos são
 * alterados, o que garante que um aluno nunca avance duas vezes no mesmo ano.
 */
@Service
public class AnoEscolarService {

    private static final Logger log = LoggerFactory.getLogger(AnoEscolarService.class);
    public static final ZoneId FUSO = ZoneId.of("America/Sao_Paulo");

    // Mesma lista de frontend/src/utils/alunos.js, na ordem em que o aluno avança
    public static final List<String> ANOS_ESCOLARES = List.of(
            "1º Ano Fundamental", "2º Ano Fundamental", "3º Ano Fundamental", "4º Ano Fundamental",
            "5º Ano Fundamental", "6º Ano Fundamental", "7º Ano Fundamental", "8º Ano Fundamental",
            "9º Ano Fundamental",
            "1º Ano Médio", "2º Ano Médio", "3º Ano Médio",
            "Ensino Superior", "Concluído / Não estudante");

    private static final String CONCLUIDO = "Concluído / Não estudante";
    private static final Pattern NUMERO_DO_ANO = Pattern.compile("(\\d+)");

    @Autowired
    private AlunoRepository alunoRepo;

    @Autowired
    private AtualizacaoAnoEscolarRepository atualizacaoRepo;

    /**
     * Avança os alunos uma vez para cada ano que começou desde a última atualização.
     * Na primeira vez que roda, só registra o ano atual como ponto de partida: os
     * anos escolares cadastrados hoje já estão certos.
     */
    @Transactional
    public synchronized int atualizarSeVirouOAno(int anoAtual) {
        Integer ultimo = atualizacaoRepo.ultimoAnoAtualizado();

        if (ultimo == null) {
            registrar(anoAtual, 0, "Ponto de partida: nenhum aluno alterado");
            log.info("Ano escolar: rotina ativada em {}. A primeira virada acontece em 1º/01/{}", anoAtual, anoAtual + 1);
            return 0;
        }
        if (ultimo >= anoAtual) return 0;

        int total = 0;
        for (int ano = ultimo + 1; ano <= anoAtual; ano++) {
            int alterados = avancarTodos();
            registrar(ano, alterados, null);
            log.info("Ano escolar avançado para o ano letivo de {}: {} aluno(s) atualizado(s)", ano, alterados);
            total += alterados;
        }
        return total;
    }

    @Transactional(readOnly = true)
    public List<AtualizacaoAnoEscolar> historico() {
        return atualizacaoRepo.historico();
    }

    private int avancarTodos() {
        List<Aluno> alterados = new ArrayList<>();
        for (Aluno aluno : alunoRepo.findAll()) {
            String proximo = proximoAno(aluno.getAnoEscolar());
            if (proximo != null && !proximo.equals(aluno.getAnoEscolar())) {
                aluno.setAnoEscolar(proximo);
                alterados.add(aluno);
            }
        }
        alunoRepo.saveAll(alterados);
        return alterados.size();
    }

    private void registrar(int ano, int alterados, String observacao) {
        AtualizacaoAnoEscolar registro = new AtualizacaoAnoEscolar();
        registro.setAno(ano);
        registro.setDataExecucao(LocalDateTime.now(FUSO));
        registro.setAlunosAtualizados(alterados);
        registro.setObservacao(observacao);
        atualizacaoRepo.save(registro);
    }

    /**
     * Próximo ano escolar. Devolve null quando não deve mudar: Ensino Superior,
     * Concluído, campo vazio ou texto que não dá para reconhecer (inclusive a antiga
     * "Educação Infantil"), para nunca trocar um dado que o sistema não entende.
     * Aceita grafias antigas como "5º ano", "5 ano fundamental" ou "2º EM".
     */
    public static String proximoAno(String atual) {
        if (atual == null || atual.isBlank()) return null;
        String texto = Normalizer.normalize(atual, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "").toLowerCase().trim();

        if (texto.contains("superior") || texto.contains("conclu") || texto.contains("infantil")) return null;

        Matcher m = NUMERO_DO_ANO.matcher(texto);
        if (!m.find()) return null;
        int numero = Integer.parseInt(m.group(1));

        boolean medio = texto.contains("medio") || texto.matches(".*\\bem\\b.*");
        if (medio) {
            if (numero >= 1 && numero <= 2) return (numero + 1) + "º Ano Médio";
            if (numero == 3) return CONCLUIDO;
            return null;
        }
        // Sem "médio" no texto, o número é do fundamental (1º a 9º)
        if (numero >= 1 && numero <= 8) return (numero + 1) + "º Ano Fundamental";
        if (numero == 9) return "1º Ano Médio";
        return null;
    }
}
