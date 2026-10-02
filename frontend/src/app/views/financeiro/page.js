"use client";
import { Suspense, useState, useEffect, useContext, useCallback, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useFeedback } from '../../../components/feedback';
import {
  InputField, SelectField, TextareaField, CampoBusca,
  LinhaCarregando, LinhaVazia, LinhaErro, TituloPagina
} from '../../../components/ui';
import api, { mensagemErro } from '../../../utils/api';
import { AuthContext } from '../../../context/authContext';
import { formatarMoeda, formatarData } from '../../../utils/formato';
import { corDaParcela, corDoStatus, TIPO_VIP } from '../../../utils/contrato';
import {
  FORMAS_PAGAMENTO, FILTROS_STATUS, ROTULO_TIPO, hojeISO, rotuloParcela, rotuloAtraso
} from '../../../utils/financeiro';

/**
 * Lançamentos financeiros: acompanhamento das parcelas de todos os contratos e
 * baixa manual. As parcelas nascem no contrato; aqui elas só são cobradas.
 */

const COLUNAS = 8;

// --- Componentes de apoio (fora da página para não perder o foco dos inputs) ---

function Indicador({ titulo, valor, detalhe, estilo = 'claro' }) {
  const estilos = {
    claro: 'bg-white border border-zinc-200 shadow-sm',
    alerta: 'bg-red-600 text-white shadow-xl',
    destaque: 'bg-yellow-400 shadow-xl',
    escuro: 'bg-zinc-900 text-white shadow-xl'
  };
  const corTitulo = estilo === 'claro' ? 'text-zinc-500' : estilo === 'destaque' ? 'text-zinc-800' : 'text-white/70';
  const corDetalhe = estilo === 'claro' ? 'text-zinc-500' : estilo === 'destaque' ? 'text-zinc-800' : 'text-white/80';

  return (
    <div className={`p-8 rounded-3xl ${estilos[estilo]}`}>
      <div className={`text-[10px] font-black uppercase tracking-widest ${corTitulo}`}>{titulo}</div>
      <div className="text-3xl xl:text-4xl font-black italic tracking-tighter mt-2 whitespace-nowrap">{valor}</div>
      {detalhe && <div className={`text-xs font-bold mt-2 ${corDetalhe}`}>{detalhe}</div>}
    </div>
  );
}

function Modal({ titulo, onFechar, children }) {
  useEffect(() => {
    const aoTeclar = (e) => { if (e.key === 'Escape') onFechar(); };
    window.addEventListener('keydown', aoTeclar);
    return () => window.removeEventListener('keydown', aoTeclar);
  }, [onFechar]);

  // z abaixo do feedback, para toasts e confirmações aparecerem por cima.
  // Clicar fora não fecha: perderia o que já foi digitado
  return (
    <div className="fixed inset-0 z-[90] bg-zinc-900/60 flex items-center justify-center p-6">
      <div className="bg-white border-4 border-zinc-900 rounded-3xl shadow-[8px_8px_0px_0px_rgba(24,24,27,1)] w-full max-w-xl p-8 max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-black uppercase tracking-tighter italic text-zinc-900">{titulo}</h2>
        <div className="h-2 w-16 bg-yellow-400 rounded-full mt-2 mb-6"></div>
        {children}
      </div>
    </div>
  );
}

function ResumoParcela({ parcela }) {
  return (
    <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-5 mb-6 grid grid-cols-2 gap-4 text-sm">
      <div className="col-span-2">
        <div className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Aluno</div>
        <div className="font-black uppercase text-zinc-900">{parcela.alunoNome || '---'}</div>
        <div className="text-xs font-bold text-zinc-500">
          Contrato {parcela.numeroContrato || `#${parcela.idContrato}`}
          {parcela.responsavelNome && <> · Responsável: {parcela.responsavelNome}</>}
        </div>
      </div>
      <div>
        <div className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Parcela</div>
        <div className="font-black text-zinc-900">{ROTULO_TIPO[parcela.tipo] || parcela.tipo} {rotuloParcela(parcela)}</div>
      </div>
      <div>
        <div className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Vencimento</div>
        <div className="font-black text-zinc-900 font-mono">{formatarData(parcela.dataVencimento)}</div>
      </div>
      <div className="col-span-2">
        <div className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Valor cobrado</div>
        <div className="text-2xl font-black italic tracking-tighter text-zinc-900">{formatarMoeda(parcela.valor)}</div>
      </div>
    </div>
  );
}

function ModalBaixa({ parcela, salvando, onCancelar, onConfirmar }) {
  const [dados, setDados] = useState({ dataPagamento: hojeISO(), formaPagamento: 'PIX', observacao: '' });
  const alterar = (e) => setDados(atual => ({ ...atual, [e.target.name]: e.target.value }));

  const enviar = (e) => {
    e.preventDefault();
    onConfirmar(dados);
  };

  return (
    <Modal titulo="Marcar como paga" onFechar={onCancelar}>
      <ResumoParcela parcela={parcela} />
      <form onSubmit={enviar} className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <InputField
            label="Recebido em" name="dataPagamento" type="date" required
            value={dados.dataPagamento} max={hojeISO()} onChange={alterar}
          />
          <SelectField label="Forma" name="formaPagamento" required value={dados.formaPagamento} onChange={alterar}>
            {FORMAS_PAGAMENTO.map(f => <option key={f} value={f}>{f}</option>)}
          </SelectField>
        </div>
        <TextareaField
          label="Observação (opcional)" name="observacao" altura="h-24" maxLength={500}
          placeholder="Ex.: pago pela avó, comprovante no WhatsApp da secretaria"
          value={dados.observacao} onChange={alterar}
        />
        <div className="flex justify-end gap-4 pt-2">
          <button
            type="button" onClick={onCancelar}
            className="px-6 py-4 font-black uppercase text-sm tracking-widest text-zinc-500 hover:text-zinc-900 transition-all underline decoration-zinc-300 decoration-2"
          >
            Cancelar
          </button>
          <button
            type="submit" disabled={salvando}
            className="px-8 py-4 rounded-2xl font-black uppercase text-sm tracking-widest transition-all shadow-md bg-emerald-500 text-white hover:bg-zinc-900 disabled:opacity-50 disabled:cursor-wait"
          >
            {salvando ? 'Registrando...' : 'Confirmar baixa'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function ModalAjuste({ parcela, salvando, onCancelar, onConfirmar }) {
  const [dados, setDados] = useState({
    valor: parcela.valor ?? '',
    dataVencimento: parcela.dataVencimento ? String(parcela.dataVencimento).substring(0, 10) : ''
  });
  const alterar = (e) => setDados(atual => ({ ...atual, [e.target.name]: e.target.value }));

  const enviar = (e) => {
    e.preventDefault();
    onConfirmar({ valor: Number(dados.valor), dataVencimento: dados.dataVencimento });
  };

  return (
    <Modal titulo="Renegociar parcela" onFechar={onCancelar}>
      <ResumoParcela parcela={parcela} />
      <p className="text-sm font-bold text-zinc-500 mb-6">
        Altera só esta parcela. As demais parcelas do contrato continuam como estão.
      </p>
      <form onSubmit={enviar} className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <InputField
            label="Novo valor (R$)" name="valor" type="number" step="0.01" min="0.01" required
            value={dados.valor} onChange={alterar}
          />
          <InputField
            label="Novo vencimento" name="dataVencimento" type="date" required
            value={dados.dataVencimento} onChange={alterar}
          />
        </div>
        <div className="flex justify-end gap-4 pt-2">
          <button
            type="button" onClick={onCancelar}
            className="px-6 py-4 font-black uppercase text-sm tracking-widest text-zinc-500 hover:text-zinc-900 transition-all underline decoration-zinc-300 decoration-2"
          >
            Cancelar
          </button>
          <button
            type="submit" disabled={salvando}
            className="px-8 py-4 rounded-2xl font-black uppercase text-sm tracking-widest transition-all shadow-md bg-yellow-400 text-zinc-900 hover:bg-zinc-900 hover:text-white disabled:opacity-50 disabled:cursor-wait"
          >
            {salvando ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function LinhaParcela({ p, podeBaixar, podeEstornar, onBaixar, onAjustar, onEstornar, onExcluir }) {
  const paga = (p.status || '').toUpperCase() === 'PAGA';
  const atrasada = (p.status || '').toUpperCase() === 'ATRASADA';
  const temDesconto = p.valorOriginal != null && p.valor != null && p.valorOriginal - p.valor > 0.009;
  const contratoInativo = p.statusContrato && p.statusContrato.toUpperCase() !== 'ATIVO';

  return (
    <tr className={`border-b border-zinc-100 hover:bg-yellow-50/50 transition-colors ${atrasada ? 'bg-red-50/40' : ''}`}>
      <td className="p-6 align-middle whitespace-nowrap">
        <div className="font-mono font-black text-zinc-900">{formatarData(p.dataVencimento)}</div>
        {atrasada && (
          <div className="text-[11px] font-black uppercase tracking-widest text-red-600 mt-1">{rotuloAtraso(p.diasEmAtraso)}</div>
        )}
      </td>

      <td className="p-6 align-middle">
        <div className="flex flex-col gap-1">
          <span className="font-mono font-black text-zinc-500 text-xs">#{p.alunoMatricula || '---'}</span>
          <span className="font-black text-zinc-900 uppercase leading-tight">{p.alunoNome || 'Aluno removido'}</span>
          <span className="text-xs font-bold text-zinc-500 uppercase">
            {[p.turmaCodigo, p.cursoNome].filter(Boolean).join(' · ') || '---'}
          </span>
        </div>
      </td>

      <td className="p-6 align-middle">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="bg-zinc-100 text-zinc-800 px-2 py-1 rounded-lg text-xs font-black border border-zinc-200 uppercase font-mono">
            {p.numeroContrato || `#${p.idContrato}`}
          </span>
          {(p.tipoContrato || '').toUpperCase() === TIPO_VIP && (
            <span className="px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-widest border bg-zinc-900 text-yellow-400 border-zinc-900">VIP</span>
          )}
          {contratoInativo && (
            <span className={`px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-widest border ${corDoStatus(p.statusContrato)}`}>
              {p.statusContrato}
            </span>
          )}
        </div>
        <div className="mt-2 text-sm font-bold text-zinc-800 uppercase">
          {p.responsavelNome || <span className="text-zinc-400 italic font-normal normal-case">Sem responsável</span>}
        </div>
        {p.responsavelTelefone && <div className="text-xs font-bold text-zinc-500 font-mono">{p.responsavelTelefone}</div>}
      </td>

      <td className="p-6 align-middle whitespace-nowrap">
        <div className="text-[10px] font-black uppercase tracking-widest text-zinc-500">{ROTULO_TIPO[p.tipo] || p.tipo}</div>
        <div className="font-black text-xl text-zinc-900">{rotuloParcela(p)}</div>
        {p.numeroAulas ? <div className="text-[11px] font-bold text-zinc-500">{p.numeroAulas} H/A</div> : null}
      </td>

      <td className="p-6 align-middle text-right whitespace-nowrap">
        <div className="font-mono font-black text-zinc-900">{formatarMoeda(p.valor)}</div>
        {temDesconto && (
          <div className="text-[11px] font-bold text-zinc-400 line-through font-mono">{formatarMoeda(p.valorOriginal)}</div>
        )}
      </td>

      <td className="p-6 align-middle">
        {paga ? (
          <div className="flex flex-col gap-0.5">
            <span className="font-mono font-black text-emerald-700">{formatarData(p.dataPagamento)}</span>
            <span className="text-xs font-black uppercase tracking-widest text-zinc-600">{p.formaPagamento || '---'}</span>
            {p.usuarioBaixa && <span className="text-[11px] font-bold text-zinc-400">por {p.usuarioBaixa}</span>}
            {p.observacaoPagamento && (
              <span className="text-[11px] font-bold text-zinc-500 italic max-w-[14rem] truncate" title={p.observacaoPagamento}>
                “{p.observacaoPagamento}”
              </span>
            )}
          </div>
        ) : (
          <span className="text-zinc-300 font-black">—</span>
        )}
      </td>

      <td className="p-6 align-middle text-center">
        <span className={`px-3 py-1.5 rounded-lg font-black text-[10px] uppercase border tracking-widest ${corDaParcela(p.status)}`}>
          {p.status || 'PENDENTE'}
        </span>
      </td>

      <td className="p-6 align-middle">
        <div className="flex justify-center gap-3">
          {!paga && podeBaixar && (
            <>
              <button
                onClick={() => onBaixar(p)} title="Marcar como paga"
                className="w-12 h-12 flex items-center justify-center bg-emerald-500 text-white hover:bg-zinc-900 rounded-xl transition-all shadow-md text-xl"
              >💰</button>
              <button
                onClick={() => onAjustar(p)} title="Renegociar valor ou vencimento"
                className="w-12 h-12 flex items-center justify-center bg-zinc-900 text-white hover:bg-yellow-400 hover:text-zinc-900 rounded-xl transition-all shadow-md text-xl"
              >✎</button>
            </>
          )}
          {!paga && podeEstornar && (
            <button
              onClick={() => onExcluir(p)} title="Excluir parcela em aberto"
              className="w-12 h-12 flex items-center justify-center bg-white text-zinc-900 border-2 border-zinc-200 hover:bg-red-600 hover:text-white rounded-xl transition-all shadow-md text-xl"
            >🗑</button>
          )}
          {paga && podeEstornar && (
            <button
              onClick={() => onEstornar(p)} title="Estornar baixa"
              className="w-12 h-12 flex items-center justify-center bg-white text-zinc-900 border-2 border-zinc-200 hover:bg-red-600 hover:text-white rounded-xl transition-all shadow-md text-xl"
            >↺</button>
          )}
          {((paga && !podeEstornar) || (!paga && !podeBaixar && !podeEstornar)) && (
            <span className="text-zinc-300 font-black">—</span>
          )}
        </div>
      </td>
    </tr>
  );
}

// --- Página --------------------------------------------------------------------

function FinanceiroConteudo() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { notificar, confirmar } = useFeedback();
  const { temPermissao } = useContext(AuthContext);

  const podeBaixar = temPermissao('FINANCEIRO_WRITE');
  const podeEstornar = temPermissao('FINANCEIRO_DELETE');

  // Vindo do contrato (?contrato=ID) ou da inadimplência (?aluno=ID), mostra todas
  // as parcelas daquele contrato ou aluno
  const idContrato = searchParams.get('contrato');
  const idAluno = searchParams.get('aluno');
  const filtroFixo = Boolean(idContrato || idAluno);

  const [parcelas, setParcelas] = useState([]);
  const [resumo, setResumo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);

  const [busca, setBusca] = useState('');
  const [buscaAplicada, setBuscaAplicada] = useState('');
  const [status, setStatus] = useState(filtroFixo ? '' : 'EM_ABERTO');
  const [tipo, setTipo] = useState('');
  const [vencimentoDe, setVencimentoDe] = useState('');
  const [vencimentoAte, setVencimentoAte] = useState('');

  const [parcelaBaixa, setParcelaBaixa] = useState(null);
  const [parcelaAjuste, setParcelaAjuste] = useState(null);
  const [salvando, setSalvando] = useState(false);

  // Espera o usuário parar de digitar antes de consultar
  useEffect(() => {
    const t = setTimeout(() => setBuscaAplicada(busca.trim()), 350);
    return () => clearTimeout(t);
  }, [busca]);

  const carregarParcelas = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (buscaAplicada) params.busca = buscaAplicada;
      if (status) params.status = status;
      if (tipo) params.tipo = tipo;
      if (idContrato) params.idContrato = idContrato;
      if (idAluno) params.idAluno = idAluno;
      if (vencimentoDe) params.vencimentoDe = vencimentoDe;
      if (vencimentoAte) params.vencimentoAte = vencimentoAte;

      const res = await api.get('/api/financeiro/parcelas', { params });
      setParcelas(Array.isArray(res.data) ? res.data : []);
      setErro(null);
    } catch (err) {
      setErro(mensagemErro(err, "Erro de conexão com o servidor Fly High."));
    } finally {
      setLoading(false);
    }
  }, [buscaAplicada, status, tipo, idContrato, idAluno, vencimentoDe, vencimentoAte]);

  const carregarResumo = useCallback(async () => {
    try {
      const res = await api.get('/api/financeiro/resumo');
      setResumo(res.data);
    } catch {
      setResumo(null);
    }
  }, []);

  useEffect(() => { carregarParcelas(); }, [carregarParcelas]);
  useEffect(() => { carregarResumo(); }, [carregarResumo]);

  const recarregar = () => {
    carregarParcelas();
    carregarResumo();
  };

  const totalListado = useMemo(
    () => parcelas.reduce((soma, p) => soma + (Number(p.valor) || 0), 0),
    [parcelas]
  );

  const primeiraParcela = filtroFixo && parcelas.length > 0 ? parcelas[0] : null;

  const limparFiltros = () => {
    setBusca('');
    setStatus('EM_ABERTO');
    setTipo('');
    setVencimentoDe('');
    setVencimentoAte('');
  };

  // --- Ações -----------------------------------------------------------------

  const confirmarBaixa = async (dados) => {
    setSalvando(true);
    try {
      await api.patch(`/api/financeiro/parcelas/${parcelaBaixa.idLancamento}/baixa`, dados);
      notificar(`Baixa registrada: ${parcelaBaixa.alunoNome || 'parcela'} ${rotuloParcela(parcelaBaixa)}.`, 'sucesso');
      setParcelaBaixa(null);
      recarregar();
    } catch (err) {
      notificar(mensagemErro(err, "Erro ao registrar a baixa."), 'erro');
    } finally {
      setSalvando(false);
    }
  };

  const confirmarAjuste = async (dados) => {
    setSalvando(true);
    try {
      await api.put(`/api/financeiro/parcelas/${parcelaAjuste.idLancamento}`, dados);
      notificar("Parcela atualizada.", 'sucesso');
      setParcelaAjuste(null);
      recarregar();
    } catch (err) {
      notificar(mensagemErro(err, "Erro ao atualizar a parcela."), 'erro');
    } finally {
      setSalvando(false);
    }
  };

  const estornar = async (p) => {
    const ok = await confirmar(
      `Estornar a baixa de ${p.alunoNome || 'este aluno'} (${ROTULO_TIPO[p.tipo] || p.tipo} ${rotuloParcela(p)}), ` +
      `paga em ${formatarData(p.dataPagamento)}?\n\nUse só quando a baixa foi lançada por engano. A parcela volta a ficar em aberto.`,
      { titulo: 'Estornar baixa', rotuloConfirmar: 'Estornar' }
    );
    if (!ok) return;
    try {
      await api.patch(`/api/financeiro/parcelas/${p.idLancamento}/estorno`);
      notificar("Baixa estornada.", 'sucesso');
      recarregar();
    } catch (err) {
      notificar(mensagemErro(err, "Erro ao estornar a baixa."), 'erro');
    }
  };

  const excluir = async (p) => {
    const ok = await confirmar(
      `Excluir a parcela ${ROTULO_TIPO[p.tipo] || p.tipo} ${rotuloParcela(p)} de ${p.alunoNome || 'este aluno'} ` +
      `(${formatarMoeda(p.valor)}, vencimento ${formatarData(p.dataVencimento)})?\n\n` +
      `Use quando a matrícula foi cancelada e esse valor não será mais cobrado.`,
      { titulo: 'Excluir parcela', rotuloConfirmar: 'Excluir' }
    );
    if (!ok) return;
    try {
      await api.delete(`/api/financeiro/parcelas/${p.idLancamento}`);
      notificar("Parcela excluída.", 'sucesso');
      recarregar();
    } catch (err) {
      notificar(mensagemErro(err, "Erro ao excluir a parcela."), 'erro');
    }
  };

  const fecharBaixa = useCallback(() => setParcelaBaixa(null), []);
  const fecharAjuste = useCallback(() => setParcelaAjuste(null), []);

  // --- Tela ------------------------------------------------------------------

  return (
    <div className="p-10 bg-gray-50 min-h-screen text-zinc-900 font-sans">
      <TituloPagina
        titulo="Financeiro"
        descricao="Parcelas de mensalidade e material geradas pelos contratos. A baixa é manual: registre a data em que o dinheiro ou o PIX entrou."
      >
        {filtroFixo && (
          <button
            onClick={() => router.push(idAluno ? '/views/inadimplencia' : '/views/contratos')}
            className="px-8 py-4 bg-white text-zinc-900 border-2 border-zinc-200 rounded-2xl font-black text-sm uppercase tracking-[0.2em] hover:bg-zinc-900 hover:text-white transition-all shadow-md"
          >
            ← {idAluno ? 'Inadimplência' : 'Contratos'}
          </button>
        )}
        <button
          onClick={() => router.push('/')}
          className="px-8 py-4 bg-zinc-900 text-white rounded-2xl font-black text-sm uppercase tracking-[0.2em] hover:bg-yellow-400 hover:text-zinc-900 transition-all shadow-xl"
        >
          Voltar ao Início
        </button>
      </TituloPagina>

      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-12">
        <Indicador
          estilo={resumo?.quantidadeAtrasadas > 0 ? 'alerta' : 'claro'}
          titulo="Em atraso"
          valor={resumo ? formatarMoeda(resumo.valorAtrasado) : '---'}
          detalhe={resumo ? `${resumo.quantidadeAtrasadas} parcela(s) · ${resumo.alunosInadimplentes} aluno(s)` : null}
        />
        <Indicador
          titulo="A vencer"
          valor={resumo ? formatarMoeda(resumo.valorPendente) : '---'}
          detalhe={resumo ? `${resumo.quantidadePendentes} parcela(s) em dia` : null}
        />
        <Indicador
          estilo="destaque"
          titulo="Recebido este mês"
          valor={resumo ? formatarMoeda(resumo.recebidoNoMes) : '---'}
          detalhe={resumo ? `${resumo.quantidadePagasNoMes} baixa(s) no mês` : null}
        />
        <Indicador
          estilo="escuro"
          titulo="Previsto para o mês"
          valor={resumo ? formatarMoeda(resumo.previstoNoMes) : '---'}
          detalhe="Tudo que vence neste mês, pago ou não"
        />
      </section>

      <section className="bg-white rounded-[2.5rem] shadow-md border border-zinc-200 overflow-hidden">
        <div className="p-8 border-b border-zinc-200 bg-zinc-100/30 space-y-6">
          <div className="flex justify-between items-center flex-wrap gap-4">
            <h2 className="font-black text-lg uppercase text-zinc-800 tracking-tighter">Database: Parcelas</h2>

            {filtroFixo && (
              <div className="flex items-center gap-3 bg-yellow-400 text-zinc-900 px-4 py-2 rounded-xl font-black text-xs uppercase tracking-widest">
                {idContrato
                  ? <>Contrato {primeiraParcela?.numeroContrato || `#${idContrato}`}</>
                  : <>Aluno {primeiraParcela?.alunoMatricula ? `#${primeiraParcela.alunoMatricula}` : `#${idAluno}`}</>}
                {primeiraParcela?.alunoNome && <span className="opacity-70">· {primeiraParcela.alunoNome}</span>}
                <button
                  onClick={() => router.push('/views/financeiro')}
                  title="Ver todas as parcelas"
                  className="ml-1 w-6 h-6 rounded-md bg-zinc-900 text-white hover:bg-white hover:text-zinc-900 transition-all"
                >✕</button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-4 items-end">
            <div className="md:col-span-2">
              <CampoBusca
                value={busca}
                onChange={e => setBusca(e.target.value)}
                placeholder="Aluno, matrícula, responsável ou nº do contrato..."
                className="w-full"
              />
            </div>
            <SelectField label="Status" name="status" value={status} onChange={e => setStatus(e.target.value)}>
              {FILTROS_STATUS.map(f => <option key={f.valor || 'todas'} value={f.valor}>{f.rotulo}</option>)}
            </SelectField>
            <SelectField label="Tipo" name="tipo" value={tipo} onChange={e => setTipo(e.target.value)}>
              <option value="">Todos</option>
              <option value="MENSALIDADE">Mensalidade</option>
              <option value="MATERIAL">Material</option>
            </SelectField>
            <InputField label="Vence de" name="vencimentoDe" type="date" value={vencimentoDe} onChange={e => setVencimentoDe(e.target.value)} />
            <InputField label="Vence até" name="vencimentoAte" type="date" value={vencimentoAte} onChange={e => setVencimentoAte(e.target.value)} />
          </div>

          <div className="flex justify-end">
            <button
              onClick={limparFiltros}
              className="text-xs font-black uppercase tracking-widest text-zinc-500 hover:text-zinc-900 underline decoration-zinc-300 decoration-2"
            >
              Limpar filtros
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[1250px]">
            <thead>
              <tr className="bg-zinc-50 border-b border-zinc-200">
                <th className="p-6 font-black uppercase text-xs tracking-widest text-zinc-600">Vencimento</th>
                <th className="p-6 font-black uppercase text-xs tracking-widest text-zinc-800">Aluno</th>
                <th className="p-6 font-black uppercase text-xs tracking-widest text-zinc-800">Contrato / Responsável</th>
                <th className="p-6 font-black uppercase text-xs tracking-widest text-zinc-800">Parcela</th>
                <th className="p-6 font-black uppercase text-xs tracking-widest text-zinc-800 text-right">Valor</th>
                <th className="p-6 font-black uppercase text-xs tracking-widest text-zinc-800">Pagamento</th>
                <th className="p-6 font-black uppercase text-xs tracking-widest text-zinc-800 text-center">Status</th>
                <th className="p-6 font-black uppercase text-xs tracking-widest text-zinc-800 text-center">Gestão</th>
              </tr>
            </thead>
            <tbody>
              {loading && <LinhaCarregando colunas={COLUNAS} texto="Carregando parcelas..." />}
              {!loading && erro && <LinhaErro colunas={COLUNAS} texto={erro} />}

              {!loading && !erro && parcelas.map(p => (
                <LinhaParcela
                  key={p.idLancamento}
                  p={p}
                  podeBaixar={podeBaixar}
                  podeEstornar={podeEstornar}
                  onBaixar={setParcelaBaixa}
                  onAjustar={setParcelaAjuste}
                  onEstornar={estornar}
                  onExcluir={excluir}
                />
              ))}

              {!loading && !erro && parcelas.length === 0 && (
                <LinhaVazia colunas={COLUNAS} texto="Nenhuma parcela encontrada com esses filtros." />
              )}
            </tbody>
          </table>
        </div>

        <div className="bg-zinc-50 p-6 border-t border-zinc-200 flex justify-between items-center flex-wrap gap-2 text-xs font-black uppercase tracking-widest text-zinc-500 rounded-b-[2.5rem]">
          <span>Fly High Idiomas v1.0 · Financeiro</span>
          <span>{parcelas.length} parcela(s) · Total {formatarMoeda(totalListado)}</span>
        </div>
      </section>

      {parcelaBaixa && (
        <ModalBaixa
          parcela={parcelaBaixa}
          salvando={salvando}
          onCancelar={fecharBaixa}
          onConfirmar={confirmarBaixa}
        />
      )}

      {parcelaAjuste && (
        <ModalAjuste
          parcela={parcelaAjuste}
          salvando={salvando}
          onCancelar={fecharAjuste}
          onConfirmar={confirmarAjuste}
        />
      )}
    </div>
  );
}

// useSearchParams exige um limite de Suspense no App Router do Next.
export default function FinanceiroPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <span className="font-black uppercase tracking-widest animate-pulse text-zinc-800 text-xl">Carregando financeiro...</span>
      </div>
    }>
      <FinanceiroConteudo />
    </Suspense>
  );
}
