package com.example.backend.service;

import com.example.backend.dto.AjusteParcelaDTO;
import com.example.backend.dto.BaixaParcelaDTO;
import com.example.backend.dto.ParcelaFinanceiraDTO;
import com.example.backend.dto.ResumoFinanceiroDTO;
import com.example.backend.model.LancamentoFinanceiro;
import com.example.backend.repository.LancamentoFinanceiroRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.text.Normalizer;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

/**
 * Lançamentos financeiros: consulta das parcelas de todos os contratos, baixa
 * manual, estorno, renegociação e exclusão de parcela em aberto.
 *
 * As parcelas nascem no ContratoService; aqui elas só são acompanhadas e baixadas.
 */
@Service
public class FinanceiroService {

    private static final Logger log = LoggerFactory.getLogger(FinanceiroService.class);

    // Mesma lista de utils/financeiro.js no frontend
    public static final List<String> FORMAS_PAGAMENTO = List.of(
            "Dinheiro", "PIX", "Cartão de débito", "Cartão de crédito", "Transferência", "Boleto");

    // Filtro de status que junta PENDENTE e ATRASADA
    public static final String EM_ABERTO = "EM_ABERTO";

    private static final int OBSERVACAO_MAXIMA = 500;
    private static final DateTimeFormatter DATA_BR = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    @Autowired
    private LancamentoFinanceiroRepository lancamentoRepo;

    // --- Consulta ------------------------------------------------------------

    /** Filtra em memória porque o status ATRASADA não existe no banco: é calculado na leitura. */
    @Transactional(readOnly = true)
    public List<ParcelaFinanceiraDTO> listar(String busca, String status, String tipo, Integer idContrato,
                                             Long idAluno, LocalDate vencimentoDe, LocalDate vencimentoAte) {
        LocalDate hoje = LocalDate.now();
        String termo = normalizar(busca);
        String statusFiltro = vazio(status) ? null : status.trim().toUpperCase();
        String tipoFiltro = vazio(tipo) ? null : tipo.trim().toUpperCase();

        return lancamentoRepo.findAllComContrato().stream()
                .filter(p -> tipoFiltro == null || tipoFiltro.equalsIgnoreCase(p.getTipo()))
                .filter(p -> statusConfere(p.statusEm(hoje), statusFiltro))
                .filter(p -> idContrato == null
                        || (p.getContrato() != null && idContrato.equals(p.getContrato().getIdContrato())))
                .filter(p -> idAluno == null
                        || (p.getContrato() != null && p.getContrato().getAluno() != null
                            && idAluno.equals(p.getContrato().getAluno().getId_aluno())))
                .filter(p -> vencimentoDe == null
                        || (p.getDataVencimento() != null && !p.getDataVencimento().isBefore(vencimentoDe)))
                .filter(p -> vencimentoAte == null
                        || (p.getDataVencimento() != null && !p.getDataVencimento().isAfter(vencimentoAte)))
                .map(p -> ParcelaFinanceiraDTO.de(p, hoje))
                .filter(dto -> termo.isEmpty() || textoDeBusca(dto).contains(termo))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ResumoFinanceiroDTO resumo() {
        LocalDate hoje = LocalDate.now();
        YearMonth mesAtual = YearMonth.from(hoje);
        ResumoFinanceiroDTO resumo = new ResumoFinanceiroDTO();

        List<LancamentoFinanceiro> parcelas = lancamentoRepo.findAllComContrato();

        double pendente = 0, atrasado = 0, recebidoMes = 0, previstoMes = 0;
        long qtdPendentes = 0, qtdAtrasadas = 0, qtdPagasMes = 0;

        for (LancamentoFinanceiro p : parcelas) {
            double valor = p.getValor() != null ? p.getValor() : 0;

            if (p.getDataVencimento() != null && YearMonth.from(p.getDataVencimento()).equals(mesAtual)) {
                previstoMes += valor;
            }

            switch (p.statusEm(hoje)) {
                case LancamentoFinanceiro.PAGA -> {
                    if (p.getDataPagamento() != null && YearMonth.from(p.getDataPagamento()).equals(mesAtual)) {
                        recebidoMes += valor;
                        qtdPagasMes++;
                    }
                }
                case LancamentoFinanceiro.ATRASADA -> {
                    atrasado += valor;
                    qtdAtrasadas++;
                }
                default -> {
                    pendente += valor;
                    qtdPendentes++;
                }
            }
        }

        long inadimplentes = parcelas.stream()
                .filter(p -> LancamentoFinanceiro.ATRASADA.equals(p.statusEm(hoje)))
                .filter(p -> p.getContrato() != null && p.getContrato().getAluno() != null)
                .map(p -> p.getContrato().getAluno().getId_aluno())
                .filter(Objects::nonNull)
                .distinct()
                .count();

        resumo.setValorPendente(arredondar(pendente));
        resumo.setQuantidadePendentes(qtdPendentes);
        resumo.setValorAtrasado(arredondar(atrasado));
        resumo.setQuantidadeAtrasadas(qtdAtrasadas);
        resumo.setAlunosInadimplentes(inadimplentes);
        resumo.setRecebidoNoMes(arredondar(recebidoMes));
        resumo.setQuantidadePagasNoMes(qtdPagasMes);
        resumo.setPrevistoNoMes(arredondar(previstoMes));
        return resumo;
    }

    // --- Baixa e estorno -----------------------------------------------------

    @Transactional
    public ParcelaFinanceiraDTO darBaixa(Long id, BaixaParcelaDTO baixa) {
        LancamentoFinanceiro parcela = buscar(id);

        if (parcela.estaPaga()) {
            String quando = parcela.getDataPagamento() != null
                    ? " (baixa em " + parcela.getDataPagamento().format(DATA_BR) + ")" : "";
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Esta parcela já está paga" + quando + ".");
        }
        if (baixa == null || baixa.getDataPagamento() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Informe a data em que o pagamento foi recebido.");
        }
        if (baixa.getDataPagamento().isAfter(LocalDate.now())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "A data do pagamento não pode ser futura.");
        }

        String forma = resolverForma(baixa.getFormaPagamento());
        String observacao = vazio(baixa.getObservacao()) ? null : baixa.getObservacao().trim();
        if (observacao != null && observacao.length() > OBSERVACAO_MAXIMA) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "A observação aceita no máximo " + OBSERVACAO_MAXIMA + " caracteres.");
        }

        parcela.registrarPagamento(baixa.getDataPagamento(), forma, observacao, usuarioLogado());
        lancamentoRepo.save(parcela);

        log.info("Baixa da parcela {} registrada por {} (pagamento em {})",
                id, parcela.getUsuarioBaixa(), parcela.getDataPagamento());
        return ParcelaFinanceiraDTO.de(parcela, LocalDate.now());
    }

    /** Desfaz uma baixa lançada por engano. A parcela volta a ficar em aberto. */
    @Transactional
    public ParcelaFinanceiraDTO estornar(Long id) {
        LancamentoFinanceiro parcela = buscar(id);

        if (!parcela.estaPaga()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Esta parcela não está paga, não há baixa para estornar.");
        }

        log.warn("Baixa da parcela {} estornada por {} (pagamento de {} registrado por {})",
                id, usuarioLogado(), parcela.getDataPagamento(), parcela.getUsuarioBaixa());

        parcela.estornarPagamento();
        lancamentoRepo.save(parcela);

        // O DTO já traz o status de leitura: pode voltar como ATRASADA
        return ParcelaFinanceiraDTO.de(parcela, LocalDate.now());
    }

    // --- Ajuste e exclusão de parcela em aberto ------------------------------

    @Transactional
    public ParcelaFinanceiraDTO ajustar(Long id, AjusteParcelaDTO ajuste) {
        LancamentoFinanceiro parcela = buscar(id);
        exigirEmAberto(parcela, "alterada");

        if (ajuste == null || (ajuste.getValor() == null && ajuste.getDataVencimento() == null)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Informe o novo valor ou o novo vencimento.");
        }
        if (ajuste.getValor() != null) {
            if (ajuste.getValor() <= 0) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "O valor da parcela deve ser maior que zero.");
            }
            parcela.setValor(arredondar(ajuste.getValor()));
        }
        if (ajuste.getDataVencimento() != null) {
            parcela.setDataVencimento(ajuste.getDataVencimento());
        }

        // O status gravado de parcela em aberto é sempre PENDENTE; atraso é só leitura
        parcela.setStatus(LancamentoFinanceiro.PENDENTE);
        lancamentoRepo.save(parcela);
        return ParcelaFinanceiraDTO.de(parcela, LocalDate.now());
    }

    /**
     * Usado quando a matrícula é cancelada e o restante não será cobrado. A edição do
     * contrato não resolve esse caso: com uma parcela paga, as demais ficam travadas.
     */
    @Transactional
    public void excluir(Long id) {
        LancamentoFinanceiro parcela = buscar(id);
        exigirEmAberto(parcela, "excluída");

        log.warn("Parcela {} ({} {}/{}) do contrato {} excluída por {}", id, parcela.getTipo(),
                parcela.getNumeroParcela(), parcela.getTotalParcelas(),
                parcela.getContrato() != null ? parcela.getContrato().getIdContrato() : null, usuarioLogado());

        lancamentoRepo.delete(parcela);
    }

    // --- Utilitários ---------------------------------------------------------

    private LancamentoFinanceiro buscar(Long id) {
        return lancamentoRepo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Parcela não encontrada."));
    }

    private void exigirEmAberto(LancamentoFinanceiro parcela, String acao) {
        if (parcela.estaPaga()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Parcela paga não pode ser " + acao + ". Estorne a baixa primeiro, se ela foi lançada por engano.");
        }
    }

    private boolean statusConfere(String status, String filtro) {
        if (filtro == null) return true;
        if (EM_ABERTO.equals(filtro)) return !LancamentoFinanceiro.PAGA.equals(status);
        return filtro.equals(status);
    }

    // Aceita a forma com qualquer caixa e devolve a grafia oficial da lista
    private String resolverForma(String forma) {
        if (vazio(forma)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Informe a forma de pagamento.");
        }
        String procurada = normalizar(forma);
        return FORMAS_PAGAMENTO.stream()
                .filter(f -> normalizar(f).equals(procurada))
                .findFirst()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Forma de pagamento inválida. Use: " + String.join(", ", FORMAS_PAGAMENTO) + "."));
    }

    private String textoDeBusca(ParcelaFinanceiraDTO dto) {
        return normalizar(String.join(" ",
                Objects.toString(dto.getAlunoNome(), ""),
                Objects.toString(dto.getAlunoMatricula(), ""),
                Objects.toString(dto.getNumeroContrato(), ""),
                Objects.toString(dto.getResponsavelNome(), ""),
                Objects.toString(dto.getTurmaCodigo(), "")));
    }

    // Sem acento e em minúsculas, para "joao" achar "João"
    private String normalizar(String texto) {
        if (texto == null) return "";
        return Normalizer.normalize(texto, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .toLowerCase()
                .trim();
    }

    private String usuarioLogado() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return auth != null && auth.getName() != null ? auth.getName() : "sistema";
    }

    private boolean vazio(String valor) {
        return valor == null || valor.isBlank();
    }

    private double arredondar(double valor) {
        return Math.round(valor * 100.0) / 100.0;
    }
}
