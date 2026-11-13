package com.example.backend.service;

import com.example.backend.dto.ContratoFormDTO;
import com.example.backend.model.Aluno;
import com.example.backend.model.Contrato;
import com.example.backend.model.LancamentoFinanceiro;
import com.example.backend.model.Responsavel;
import com.example.backend.model.Turma;
import com.example.backend.repository.AlunoRepository;
import com.example.backend.repository.ContratoRepository;
import com.example.backend.repository.LancamentoFinanceiroRepository;
import com.example.backend.repository.ResponsavelRepository;
import com.example.backend.repository.TurmaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/**
 * Contratos (Estória 7): formaliza a prestação de serviço, matricula o aluno na turma
 * e gera as parcelas de curso e de material.
 */
@Service
public class ContratoService {

    private static final int PARCELAS_MAXIMAS = 36;

    @Autowired
    private ContratoRepository contratoRepo;

    @Autowired
    private LancamentoFinanceiroRepository lancamentoRepo;

    @Autowired
    private AlunoRepository alunoRepo;

    @Autowired
    private TurmaRepository turmaRepo;

    @Autowired
    private ResponsavelRepository responsavelRepo;

    @Autowired
    private ModeloContratoService modeloContratoService;

    @Autowired
    private ControleAcessoService acesso;

    // --- Gravação ------------------------------------------------------------

    @Transactional
    public Contrato salvar(ContratoFormDTO form) {
        if (form == null || form.getContrato() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Informe os dados do contrato.");
        }

        Contrato contrato = form.getContrato();

        if (contrato.getAluno() == null || contrato.getAluno().getId_aluno() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Informe o aluno.");
        }
        if (contrato.getTurma() == null || contrato.getTurma().getId_turma() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Informe a turma.");
        }

        Aluno alunoReal = alunoRepo.findById(contrato.getAluno().getId_aluno())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Aluno não encontrado."));
        Turma turmaReal = turmaRepo.findById(contrato.getTurma().getId_turma())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Turma não encontrada."));

        boolean novoContrato = contrato.getIdContrato() == null;
        Situacao anterior = novoContrato ? null : contratoRepo.findById(contrato.getIdContrato())
                .map(Situacao::new)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Contrato não encontrado."));

        contrato.setAluno(alunoReal);
        contrato.setTurma(turmaReal);
        contrato.setResponsavel(resolverResponsavel(contrato));

        aplicarPadroes(contrato, turmaReal);
        boolean travado = aplicarTravaDeAssinatura(contrato, anterior);
        validarValores(contrato);
        validarMatricula(contrato, anterior);
        definirInterrupcao(contrato, anterior);
        definirModelo(contrato, anterior);

        Contrato salvo = contratoRepo.saveAndFlush(contrato);

        // Contrato assinado não tem as parcelas regravadas pelo formulário; ajuste
        // de parcela é feito pela renegociação no Financeiro
        if (!travado) gravarParcelas(salvo, form);
        sincronizarParcelas(salvo);
        return salvo;
    }

    static boolean estaAssinado(Contrato c) {
        return c.getStatusAssinatura() != null && "ASSINADO".equalsIgnoreCase(c.getStatusAssinatura().trim());
    }

    /**
     * Contrato assinado não muda: partes, curso, valores e parcelas voltam ao que
     * está gravado, e só a situação da matrícula e as observações são aceitas.
     * Só o diretor pode voltar a assinatura para "Aguardando Assinatura" para corrigir.
     *
     * @return true quando o contrato continua assinado (e travado)
     */
    private boolean aplicarTravaDeAssinatura(Contrato contrato, Situacao anterior) {
        if (anterior == null || !anterior.assinado) return false;
        if (!estaAssinado(contrato)) {
            if (!acesso.logadoEhDiretor()) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                        "Só o diretor pode voltar um contrato assinado para \"Aguardando Assinatura\".");
            }
            return false;
        }
        copiarCamposTravados(anterior.travados, contrato);
        return true;
    }

    private static void copiarCamposTravados(Contrato de, Contrato para) {
        para.setAluno(de.getAluno());
        para.setTurma(de.getTurma());
        para.setResponsavel(de.getResponsavel());
        para.setTipoContrato(de.getTipoContrato());
        para.setNomeConjuge(de.getNomeConjuge());
        para.setNumeroContrato(de.getNumeroContrato());
        para.setDataEmissao(de.getDataEmissao());
        para.setCursoNome(de.getCursoNome());
        para.setTipoCurso(de.getTipoCurso());
        para.setDiasSemana(de.getDiasSemana());
        para.setHorario(de.getHorario());
        para.setCargaHorariaEstagio(de.getCargaHorariaEstagio());
        para.setDescontoPercentual(de.getDescontoPercentual());
        para.setConvenio(de.getConvenio());
        para.setValorTotalCurso(de.getValorTotalCurso());
        para.setValorComDesconto(de.getValorComDesconto());
        para.setDiaVencimentoCurso(de.getDiaVencimentoCurso());
        para.setValorHoraAula(de.getValorHoraAula());
        para.setValorTotalMaterial(de.getValorTotalMaterial());
        para.setDiaVencimentoMaterial(de.getDiaVencimentoMaterial());
        para.setIdModeloContrato(de.getIdModeloContrato());
    }

    /**
     * Retrato do contrato como está no banco, tirado antes do save: o merge do
     * contrato que veio da tela sobrescreve a entidade gerenciada.
     */
    private static class Situacao {
        final boolean ativo;
        final Long idTurma;
        final Long idAluno;
        final String tipo;
        final Long idModelo;
        final LocalDate dataInterrupcao;
        final boolean assinado;
        final Contrato travados = new Contrato();

        Situacao(Contrato c) {
            this.assinado = estaAssinado(c);
            copiarCamposTravados(c, travados);
            this.ativo = estaAtivo(c);
            this.idTurma = c.getTurma() != null ? c.getTurma().getId_turma() : null;
            this.idAluno = c.getAluno() != null ? c.getAluno().getId_aluno() : null;
            this.tipo = c.getTipoContrato() == null || c.getTipoContrato().isBlank()
                    ? Contrato.NORMAL : c.getTipoContrato().trim().toUpperCase();
            this.idModelo = c.getIdModeloContrato();
            this.dataInterrupcao = c.getDataInterrupcao();
        }
    }

    static boolean estaAtivo(Contrato c) {
        return c.getStatus() == null || c.getStatus().isBlank() || "ATIVO".equalsIgnoreCase(c.getStatus().trim());
    }

    static boolean estaConcluido(Contrato c) {
        String s = c.getStatus() == null ? "" : c.getStatus().trim();
        return Contrato.CONCLUIDO.equalsIgnoreCase(s) || "CONCLUIDO".equalsIgnoreCase(s);
    }

    /** Trancado ou cancelado: o caso em que as parcelas futuras deixam de valer. */
    static boolean estaInterrompido(Contrato c) {
        return !estaAtivo(c) && !estaConcluido(c);
    }

    /**
     * Turma fechada não recebe matrícula, e vaga e matrícula repetida são conferidas
     * sempre que o contrato passa a ocupar um lugar na turma: contrato novo, troca de
     * turma ou de aluno, ou matrícula trancada/cancelada que volta a Ativo.
     */
    private void validarMatricula(Contrato contrato, Situacao anterior) {
        if (!estaAtivo(contrato)) return;

        Turma turma = contrato.getTurma();
        boolean mesmaTurma = anterior != null && turma.getId_turma().equals(anterior.idTurma);
        boolean mesmoAluno = anterior != null && contrato.getAluno().getId_aluno().equals(anterior.idAluno);
        boolean jaOcupavaEstaVaga = anterior != null && anterior.ativo && mesmaTurma;
        if (jaOcupavaEstaVaga && mesmoAluno) return;

        if (!jaOcupavaEstaVaga && TurmaService.naoAceitaMatricula(turma)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "A turma " + turma.getCodigoTurma()
                    + (TurmaService.estaEncerrada(turma) ? " já foi encerrada" : " está fechada") + " e não aceita matrículas.");
        }

        Integer idIgnorado = contrato.getIdContrato() != null ? contrato.getIdContrato() : -1;
        if (contratoRepo.contarOutraMatriculaAtiva(turma.getId_turma(), contrato.getAluno().getId_aluno(), idIgnorado) > 0) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Este aluno já possui matrícula ativa nesta turma.");
        }
        // Trocar só o aluno não muda a ocupação da turma
        if (!jaOcupavaEstaVaga && turma.getLimiteVagas() != null && turma.getLimiteVagas() > 0) {
            long ocupadas = contratoRepo.contarOutrosAtivosNaTurma(turma.getId_turma(), idIgnorado);
            if (ocupadas >= turma.getLimiteVagas()) {
                throw new ResponseStatusException(HttpStatus.CONFLICT,
                        "Turma sem vagas disponíveis (" + ocupadas + "/" + turma.getLimiteVagas() + ").");
            }
        }
    }

    /** Marca o dia em que a matrícula foi trancada ou cancelada; reativar limpa. */
    private void definirInterrupcao(Contrato contrato, Situacao anterior) {
        // Concluído (turma encerrada) não é interrupção: as parcelas continuam valendo
        if (!estaInterrompido(contrato)) {
            contrato.setDataInterrupcao(null);
        } else if (anterior != null && !anterior.ativo && anterior.dataInterrupcao != null) {
            // Trancado -> Cancelado, ou só uma correção: vale a data da primeira interrupção
            contrato.setDataInterrupcao(anterior.dataInterrupcao);
        } else {
            contrato.setDataInterrupcao(LocalDate.now());
        }
    }

    /**
     * Matrícula trancada ou cancelada: as parcelas em aberto que vencem a partir da
     * data de interrupção ficam CANCELADA; as que já tinham vencido continuam sendo
     * cobradas. Matrícula ativa: nenhuma parcela fica cancelada.
     */
    private void sincronizarParcelas(Contrato contrato) {
        LocalDate corte = estaInterrompido(contrato) ? contrato.getDataInterrupcao() : null;
        List<LancamentoFinanceiro> alteradas = new ArrayList<>();
        for (LancamentoFinanceiro parcela : lancamentoRepo.findByContratoId(contrato.getIdContrato())) {
            if (parcela.estaPaga()) continue;
            boolean cancelar = corte != null && parcela.getDataVencimento() != null
                    && !parcela.getDataVencimento().isBefore(corte);
            boolean estavaCancelada = LancamentoFinanceiro.CANCELADA.equalsIgnoreCase(parcela.getStatus());
            if (cancelar != estavaCancelada) {
                parcela.setStatus(cancelar ? LancamentoFinanceiro.CANCELADA : LancamentoFinanceiro.PENDENTE);
                alteradas.add(parcela);
            }
        }
        if (!alteradas.isEmpty()) lancamentoRepo.saveAll(alteradas);
    }

    /**
     * Contratos trancados ou cancelados antes desta regra não têm data de interrupção.
     * Usa o dia da correção: as parcelas futuras saem e as já vencidas continuam.
     */
    @Transactional
    public int corrigirInterrompidosAntigos() {
        List<Contrato> contratos = contratoRepo.findInterrompidosSemData();
        for (Contrato c : contratos) {
            c.setDataInterrupcao(LocalDate.now());
            contratoRepo.save(c);
            sincronizarParcelas(c);
        }
        return contratos.size();
    }

    /**
     * Contrato novo usa a versão vigente do modelo do seu tipo. Na edição a versão
     * fica como estava (o formulário nem a envia); só muda se o tipo mudar.
     */
    private void definirModelo(Contrato contrato, Situacao anterior) {
        Long idModelo = null;
        if (anterior != null && anterior.tipo.equals(contrato.getTipoContrato())) {
            idModelo = anterior.idModelo;
        }
        contrato.setIdModeloContrato(idModelo != null ? idModelo : modeloContratoService.idVigente(contrato.getTipoContrato()));
    }

    /**
     * Passa um contrato ainda não assinado para a versão vigente do modelo.
     * Contrato assinado mantém o texto com que foi assinado.
     */
    @Transactional
    public Contrato atualizarModelo(Integer id) {
        Contrato contrato = contratoRepo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Contrato não encontrado."));
        if ("ASSINADO".equalsIgnoreCase(contrato.getStatusAssinatura())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Este contrato já foi assinado e mantém o texto com que foi assinado.");
        }
        Long vigente = modeloContratoService.idVigente(contrato.getTipoContrato());
        if (vigente == null) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Não há modelo publicado para este tipo de contrato.");
        }
        contrato.setIdModeloContrato(vigente);
        return contratoRepo.save(contrato);
    }

    /** O contratante precisa ser um responsável já cadastrado (Estória 7). */
    private Responsavel resolverResponsavel(Contrato contrato) {
        if (contrato.getResponsavel() == null || contrato.getResponsavel().getId_responsavel() == null) {
            return null;
        }
        return responsavelRepo.findById(contrato.getResponsavel().getId_responsavel())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Responsável financeiro não encontrado."));
    }

    private void aplicarPadroes(Contrato contrato, Turma turma) {
        if (vazio(contrato.getTipoContrato())) {
            contrato.setTipoContrato(Contrato.NORMAL);
        }
        contrato.setTipoContrato(contrato.getTipoContrato().trim().toUpperCase());
        if (!Contrato.NORMAL.equals(contrato.getTipoContrato()) && !Contrato.VIP.equals(contrato.getTipoContrato())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "O tipo do contrato deve ser NORMAL ou VIP.");
        }

        if (vazio(contrato.getStatus())) contrato.setStatus("Ativo");
        if (vazio(contrato.getStatusAssinatura())) contrato.setStatusAssinatura("Aguardando Assinatura");
        if (contrato.getDataEmissao() == null) contrato.setDataEmissao(LocalDate.now());

        // Cópia dos dados da turma quando a secretaria não sobrescreveu
        if (vazio(contrato.getCursoNome()) && turma.getCurso() != null) {
            contrato.setCursoNome(turma.getCurso().getNome());
        }
        if (vazio(contrato.getDiasSemana())) contrato.setDiasSemana(turma.getDiasSemana());
        if (vazio(contrato.getHorario()) && turma.getHorarioInicio() != null && turma.getHorarioFim() != null) {
            contrato.setHorario(turma.getHorarioInicio() + " às " + turma.getHorarioFim());
        }
        if (vazio(contrato.getCargaHorariaEstagio()) && turma.getCurso() != null
                && turma.getCurso().getCargaHorariaTotal() != null) {
            contrato.setCargaHorariaEstagio(turma.getCurso().getCargaHorariaTotal() + " H/A");
        }

        if (contrato.getDescontoPercentual() == null) contrato.setDescontoPercentual(0.0);

        if (vazio(contrato.getNumeroContrato())) {
            contrato.setNumeroContrato(contrato.getDataEmissao().getYear()
                    + "-" + contrato.getTurma().getId_turma()
                    + "-" + contrato.getAluno().getId_aluno());
        }
    }

    private void validarValores(Contrato contrato) {
        if (contrato.getDescontoPercentual() < 0 || contrato.getDescontoPercentual() > 100) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "O desconto deve ficar entre 0 e 100%.");
        }
        if (contrato.getValorTotalCurso() != null && contrato.getValorTotalCurso() < 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "O valor do curso não pode ser negativo.");
        }
        if (contrato.getValorTotalMaterial() != null && contrato.getValorTotalMaterial() < 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "O valor do material não pode ser negativo.");
        }
        if (contrato.getValorComDesconto() == null && contrato.getValorTotalCurso() != null) {
            contrato.setValorComDesconto(valorComDescontoSugerido(contrato));
        }
        if (contrato.getDiaVencimentoCurso() != null
                && (contrato.getDiaVencimentoCurso() < 1 || contrato.getDiaVencimentoCurso() > 31)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "O dia de vencimento deve ficar entre 1 e 31.");
        }
        if (contrato.getDiaVencimentoMaterial() != null
                && (contrato.getDiaVencimentoMaterial() < 1 || contrato.getDiaVencimentoMaterial() > 31)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "O dia de vencimento deve ficar entre 1 e 31.");
        }
    }

    private double valorComDescontoSugerido(Contrato contrato) {
        double total = contrato.getValorTotalCurso();
        double desconto = contrato.getDescontoPercentual() != null ? contrato.getDescontoPercentual() : 0;
        return arredondar(total - (total * desconto / 100.0));
    }

    // --- Parcelas ------------------------------------------------------------

    /**
     * Regrava as parcelas do contrato. Parcelas já baixadas travam a regravação,
     * senão um acerto no contrato apagaria pagamento já recebido.
     */
    private void gravarParcelas(Contrato contrato, ContratoFormDTO form) {
        List<LancamentoFinanceiro> curso = form.getParcelasCurso() != null && !form.getParcelasCurso().isEmpty()
                ? form.getParcelasCurso()
                : gerarParcelas(contrato, LancamentoFinanceiro.MENSALIDADE,
                        contrato.getValorComDesconto(), contrato.getValorTotalCurso(),
                        form.getQuantidadeParcelasCurso(), form.getPrimeiroVencimentoCurso());

        List<LancamentoFinanceiro> material = form.getParcelasMaterial() != null && !form.getParcelasMaterial().isEmpty()
                ? form.getParcelasMaterial()
                : gerarParcelas(contrato, LancamentoFinanceiro.MATERIAL,
                        contrato.getValorTotalMaterial(), contrato.getValorTotalMaterial(),
                        form.getQuantidadeParcelasMaterial(), form.getPrimeiroVencimentoMaterial());

        substituirParcelas(contrato, LancamentoFinanceiro.MENSALIDADE, curso);
        substituirParcelas(contrato, LancamentoFinanceiro.MATERIAL, material);
    }

    private void substituirParcelas(Contrato contrato, String tipo, List<LancamentoFinanceiro> novas) {
        if (novas == null) return;

        // Contrato com parcela já baixada não tem as parcelas regravadas: apagá-las
        // apagaria um pagamento já recebido.
        if (lancamentoRepo.contarPagasDoContratoETipo(contrato.getIdContrato(), tipo) > 0) {
            return;
        }

        lancamentoRepo.deleteByContratoIdETipo(contrato.getIdContrato(), tipo);

        if (novas.isEmpty()) return;
        if (novas.size() > PARCELAS_MAXIMAS) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Um contrato aceita no máximo " + PARCELAS_MAXIMAS + " parcelas por tipo.");
        }

        int total = novas.size();
        int numero = 1;
        List<LancamentoFinanceiro> preparadas = new ArrayList<>();

        for (LancamentoFinanceiro parcela : novas) {
            if (parcela.getValor() == null || parcela.getValor() < 0) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Informe um valor válido para todas as parcelas.");
            }
            if (parcela.getDataVencimento() == null) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Informe a data de vencimento de todas as parcelas.");
            }

            parcela.setIdLancamento(null);
            parcela.setContrato(contrato);
            parcela.setTipo(tipo);
            parcela.setNumeroParcela(numero++);
            parcela.setTotalParcelas(total);
            if (parcela.getValorOriginal() == null) parcela.setValorOriginal(parcela.getValor());
            parcela.setDataPagamento(null);
            parcela.setStatus(LancamentoFinanceiro.PENDENTE);
            preparadas.add(parcela);
        }

        lancamentoRepo.saveAll(preparadas);
    }

    /** Divide o valor em parcelas iguais, jogando a sobra de centavos na última. */
    private List<LancamentoFinanceiro> gerarParcelas(Contrato contrato, String tipo, Double valorCobrado,
                                                     Double valorCheio, Integer quantidade, LocalDate primeiro) {
        List<LancamentoFinanceiro> parcelas = new ArrayList<>();

        if (valorCobrado == null || valorCobrado <= 0 || quantidade == null || quantidade <= 0) {
            return parcelas;
        }
        if (quantidade > PARCELAS_MAXIMAS) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Um contrato aceita no máximo " + PARCELAS_MAXIMAS + " parcelas por tipo.");
        }

        LocalDate vencimento = primeiro != null ? primeiro : LocalDate.now().plusMonths(1);

        double valorParcela = arredondar(valorCobrado / quantidade);
        double acumulado = 0;

        for (int i = 1; i <= quantidade; i++) {
            double valor = (i == quantidade) ? arredondar(valorCobrado - acumulado) : valorParcela;
            acumulado = arredondar(acumulado + valor);

            LancamentoFinanceiro parcela = new LancamentoFinanceiro();
            parcela.setValor(valor);
            parcela.setValorOriginal(valorCheio != null ? arredondar(valorCheio / quantidade) : valor);
            parcela.setDataVencimento(vencimento.plusMonths(i - 1L));
            parcelas.add(parcela);
        }
        return parcelas;
    }

    // --- Leitura -------------------------------------------------------------

    public List<Contrato> listarTodos() {
        return contratoRepo.findAll();
    }

    public Optional<Contrato> buscarPorId(Integer id) {
        return contratoRepo.findById(id);
    }

    public List<Contrato> buscarPorTurma(Long idTurma) {
        return contratoRepo.findByTurmaId(idTurma);
    }

    public List<Contrato> buscarAtivosPorTurma(Long idTurma) {
        return contratoRepo.findAtivosByTurmaId(idTurma);
    }

    public List<Contrato> buscarPorAluno(Long idAluno) {
        return contratoRepo.findByAlunoId(idAluno);
    }

    public long contarVagasOcupadas(Long idTurma) {
        return contratoRepo.contarAtivosNaTurma(idTurma);
    }

    /**
     * Contrato com as parcelas separadas por tipo, usado na edição e na impressão.
     * readOnly porque o atraso é calculado na leitura e não deve virar UPDATE.
     */
    @Transactional(readOnly = true)
    public ContratoFormDTO buscarCompleto(Integer id) {
        Contrato contrato = contratoRepo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Contrato não encontrado."));

        ContratoFormDTO dto = new ContratoFormDTO();
        dto.setContrato(contrato);
        dto.setParcelasCurso(atualizarAtrasos(
                lancamentoRepo.findByContratoIdETipo(id, LancamentoFinanceiro.MENSALIDADE)));
        dto.setParcelasMaterial(atualizarAtrasos(
                lancamentoRepo.findByContratoIdETipo(id, LancamentoFinanceiro.MATERIAL)));
        return dto;
    }

    @Transactional(readOnly = true)
    public List<LancamentoFinanceiro> buscarLancamentosDoContrato(Integer id) {
        return atualizarAtrasos(lancamentoRepo.findByContratoId(id));
    }

    @Transactional(readOnly = true)
    public List<LancamentoFinanceiro> buscarLancamentosDoAluno(Long idAluno) {
        return atualizarAtrasos(lancamentoRepo.findByAlunoId(idAluno));
    }

    /** Parcela vencida e sem baixa aparece como ATRASADA. */
    private List<LancamentoFinanceiro> atualizarAtrasos(List<LancamentoFinanceiro> parcelas) {
        LocalDate hoje = LocalDate.now();
        parcelas.forEach(parcela -> parcela.verificarAtraso(hoje));
        return parcelas;
    }

    // --- Exclusão ------------------------------------------------------------

    @Transactional
    public void excluir(Integer id) {
        Contrato contrato = contratoRepo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Contrato não encontrado."));

        if (estaAssinado(contrato)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Contrato assinado não pode ser excluído. Cancele a matrícula ou peça ao diretor para voltar a assinatura.");
        }
        if (lancamentoRepo.contarPagasDoContrato(id) > 0) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Este contrato possui parcelas já pagas e não pode ser excluído. Cancele a matrícula.");
        }

        lancamentoRepo.deleteByContratoId(id);
        contratoRepo.delete(contrato);
    }

    // --- Utilitários ---------------------------------------------------------

    private boolean vazio(String valor) {
        return valor == null || valor.isBlank();
    }

    private double arredondar(double valor) {
        return Math.round(valor * 100.0) / 100.0;
    }
}
