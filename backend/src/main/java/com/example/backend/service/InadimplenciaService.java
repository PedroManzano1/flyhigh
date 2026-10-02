package com.example.backend.service;

import com.example.backend.dto.ParcelaFinanceiraDTO;
import com.example.backend.dto.SituacaoFinanceiraAlunoDTO;
import com.example.backend.dto.SituacaoFinanceiraAlunoDTO.ResponsavelFinanceiroDTO;
import com.example.backend.model.Aluno;
import com.example.backend.model.LancamentoFinanceiro;
import com.example.backend.model.Responsavel;
import com.example.backend.repository.LancamentoFinanceiroRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Consulta de inadimplência e situação financeira, somente leitura. Qualquer
 * alteração em parcela é feita no FinanceiroService.
 */
@Service
public class InadimplenciaService {

    @Autowired
    private LancamentoFinanceiroRepository lancamentoRepo;

    /**
     * @param nome      busca parcial no nome do aluno, sem diferenciar acento e caixa
     * @param matricula número de matrícula exato
     * @param status    PENDENTE, ATRASADA, PAGA, EM_ABERTO ou vazio para todas
     */
    @Transactional(readOnly = true)
    public List<SituacaoFinanceiraAlunoDTO> consultar(String nome, String matricula, String status) {
        LocalDate hoje = LocalDate.now();
        String termoNome = FinanceiroService.normalizar(nome);
        String matriculaExata = matricula == null ? "" : matricula.trim();
        String statusFiltro = status == null || status.isBlank() ? null : status.trim().toUpperCase();

        Map<Long, Grupo> grupos = new LinkedHashMap<>();

        // A query já vem ordenada por vencimento; a parcela se repete uma vez por
        // responsável financeiro, por isso o controle de ids já vistos
        for (Object[] linha : lancamentoRepo.findParcelasComResponsavelFinanceiro()) {
            LancamentoFinanceiro parcela = (LancamentoFinanceiro) linha[0];
            Responsavel responsavel = (Responsavel) linha[1];
            String parentesco = (String) linha[2];

            Aluno aluno = parcela.getContrato().getAluno();
            if (!alunoConfere(aluno, termoNome, matriculaExata)) continue;

            Grupo grupo = grupos.computeIfAbsent(aluno.getId_aluno(), id -> new Grupo(aluno));
            grupo.adicionarResponsavel(responsavel, parentesco);
            grupo.adicionarParcela(parcela, hoje);
        }

        List<SituacaoFinanceiraAlunoDTO> resultado = new ArrayList<>();
        for (Grupo grupo : grupos.values()) {
            SituacaoFinanceiraAlunoDTO dto = grupo.montar(statusFiltro);
            if (!dto.getParcelas().isEmpty()) resultado.add(dto);
        }

        // Quem tem o vencimento mais antigo aparece primeiro
        resultado.sort(Comparator
                .comparing((SituacaoFinanceiraAlunoDTO s) -> s.getParcelas().get(0).getDataVencimento(),
                        Comparator.nullsLast(Comparator.naturalOrder()))
                .thenComparing(s -> FinanceiroService.normalizar(s.getAlunoNome())));
        return resultado;
    }

    private boolean alunoConfere(Aluno aluno, String termoNome, String matriculaExata) {
        if (aluno == null) return false;
        if (!matriculaExata.isEmpty() && !matriculaExata.equalsIgnoreCase(
                aluno.getNumeroMatricula() == null ? "" : aluno.getNumeroMatricula().trim())) {
            return false;
        }
        return termoNome.isEmpty() || FinanceiroService.normalizar(aluno.getNome()).contains(termoNome);
    }

    /** Acumula as linhas de um aluno enquanto a consulta é percorrida. */
    private static class Grupo {
        private final Aluno aluno;
        private final Map<Long, ResponsavelFinanceiroDTO> responsaveis = new LinkedHashMap<>();
        private final Map<Long, ParcelaFinanceiraDTO> parcelas = new LinkedHashMap<>();

        Grupo(Aluno aluno) {
            this.aluno = aluno;
        }

        void adicionarResponsavel(Responsavel responsavel, String parentesco) {
            if (responsavel == null || responsaveis.containsKey(responsavel.getId_responsavel())) return;
            ResponsavelFinanceiroDTO dto = new ResponsavelFinanceiroDTO();
            dto.setIdResponsavel(responsavel.getId_responsavel());
            dto.setNome(responsavel.getNome());
            dto.setTelefone(responsavel.getTelefonePrincipal());
            dto.setParentesco(parentesco);
            responsaveis.put(responsavel.getId_responsavel(), dto);
        }

        void adicionarParcela(LancamentoFinanceiro parcela, LocalDate hoje) {
            parcelas.putIfAbsent(parcela.getIdLancamento(), ParcelaFinanceiraDTO.de(parcela, hoje));
        }

        SituacaoFinanceiraAlunoDTO montar(String statusFiltro) {
            SituacaoFinanceiraAlunoDTO dto = new SituacaoFinanceiraAlunoDTO();
            dto.setIdAluno(aluno.getId_aluno());
            dto.setAlunoNome(aluno.getNome());
            dto.setAlunoMatricula(aluno.getNumeroMatricula());
            dto.setResponsaveisFinanceiros(new ArrayList<>(responsaveis.values()));

            double atrasado = 0, aVencer = 0, pago = 0;
            long qtdAtrasadas = 0, maiorAtraso = 0;

            for (ParcelaFinanceiraDTO p : parcelas.values()) {
                double valor = p.getValor() != null ? p.getValor() : 0;
                switch (p.getStatus()) {
                    case LancamentoFinanceiro.PAGA -> pago += valor;
                    case LancamentoFinanceiro.ATRASADA -> {
                        atrasado += valor;
                        qtdAtrasadas++;
                        maiorAtraso = Math.max(maiorAtraso, p.getDiasEmAtraso() != null ? p.getDiasEmAtraso() : 0);
                    }
                    default -> aVencer += valor;
                }
                if (FinanceiroService.statusConfere(p.getStatus(), statusFiltro)) {
                    dto.getParcelas().add(p);
                }
            }

            dto.setTotalAtrasado(arredondar(atrasado));
            dto.setQuantidadeAtrasadas(qtdAtrasadas);
            dto.setMaiorAtrasoDias(maiorAtraso);
            dto.setTotalAVencer(arredondar(aVencer));
            dto.setTotalPago(arredondar(pago));
            return dto;
        }

        private static double arredondar(double valor) {
            return Math.round(valor * 100.0) / 100.0;
        }
    }
}
