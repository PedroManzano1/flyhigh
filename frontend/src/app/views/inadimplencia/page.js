"use client";
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { InputField, SelectField, TituloPagina } from '../../../components/ui';
import api, { mensagemErro } from '../../../utils/api';
import { formatarMoeda, formatarData } from '../../../utils/formato';
import { corDaParcela } from '../../../utils/contrato';
import { FILTROS_STATUS, ROTULO_TIPO, rotuloParcela, rotuloAtraso } from '../../../utils/financeiro';

/**
 * Consulta de inadimplência e situação financeira. Somente leitura: baixa,
 * renegociação e exclusão de parcela ficam na tela do Financeiro.
 *
 * O responsável exibido é o marcado como "Responsável Financeiro" no vínculo
 * com o aluno, e não o contratante gravado no contrato.
 */

// --- Componentes de apoio (fora da página para não perder o foco dos inputs) ---

function Total({ titulo, valor, cor = 'text-zinc-900' }) {
  return (
    <div className="text-right">
      <div className="text-[10px] font-black uppercase tracking-widest text-zinc-500">{titulo}</div>
      <div className={`font-mono font-black text-lg ${cor}`}>{formatarMoeda(valor)}</div>
    </div>
  );
}

function Responsaveis({ lista }) {
  if (!lista || lista.length === 0) {
    return (
      <div className="inline-flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-800 px-3 py-2 rounded-xl text-xs font-black uppercase tracking-widest">
        ⚠ Sem responsável financeiro marcado no vínculo
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-1">
      {lista.map(r => (
        <div key={r.idResponsavel} className="text-sm">
          <span className="font-black uppercase text-zinc-900">{r.nome}</span>
          {r.parentesco && <span className="font-bold text-zinc-500"> · {r.parentesco}</span>}
          {r.telefone && <span className="font-mono font-bold text-zinc-600"> · {r.telefone}</span>}
        </div>
      ))}
    </div>
  );
}

function CartaoAluno({ aluno, onAbrirFinanceiro }) {
  const inadimplente = aluno.quantidadeAtrasadas > 0;

  return (
    <article className={`bg-white rounded-3xl border shadow-sm overflow-hidden break-inside-avoid ${
      inadimplente ? 'border-red-200' : 'border-zinc-200'
    }`}>
      <header className={`p-6 md:p-8 flex justify-between items-start flex-wrap gap-6 border-b ${
        inadimplente ? 'bg-red-50/60 border-red-100' : 'bg-zinc-50 border-zinc-100'
      }`}>
        <div className="space-y-3">
          <div>
            <span className="font-mono font-black text-zinc-500 text-xs">#{aluno.alunoMatricula || '---'}</span>
            <h3 className="font-black text-2xl uppercase tracking-tight text-zinc-900 leading-tight">{aluno.alunoNome}</h3>
          </div>
          <div>
            <div className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-1">Responsável financeiro</div>
            <Responsaveis lista={aluno.responsaveisFinanceiros} />
          </div>
        </div>

        <div className="flex flex-col items-end gap-4">
          {inadimplente && (
            <span className="bg-red-600 text-white px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest">
              {aluno.quantidadeAtrasadas} em atraso · {rotuloAtraso(aluno.maiorAtrasoDias)}
            </span>
          )}
          <div className="flex gap-6">
            <Total titulo="Em atraso" valor={aluno.totalAtrasado} cor={inadimplente ? 'text-red-600' : 'text-zinc-400'} />
            <Total titulo="A vencer" valor={aluno.totalAVencer} />
            <Total titulo="Pago" valor={aluno.totalPago} cor="text-emerald-700" />
          </div>
          <button
            onClick={() => onAbrirFinanceiro(aluno.idAluno)}
            className="print:hidden text-xs font-black uppercase tracking-widest text-zinc-600 hover:text-zinc-900 underline decoration-yellow-400 decoration-2"
          >
            Gerenciar no Financeiro →
          </button>
        </div>
      </header>

      <div className="overflow-x-auto">
        <table className="w-full text-left min-w-[720px]">
          <thead>
            <tr className="border-b border-zinc-100">
              <th className="px-6 md:px-8 py-4 font-black uppercase text-[11px] tracking-widest text-zinc-500">Parcela</th>
              <th className="px-4 py-4 font-black uppercase text-[11px] tracking-widest text-zinc-500">Contrato</th>
              <th className="px-4 py-4 font-black uppercase text-[11px] tracking-widest text-zinc-500">Vencimento</th>
              <th className="px-4 py-4 font-black uppercase text-[11px] tracking-widest text-zinc-500 text-right">Valor cobrado</th>
              <th className="px-4 py-4 font-black uppercase text-[11px] tracking-widest text-zinc-500 text-center">Status</th>
              <th className="px-6 md:px-8 py-4 font-black uppercase text-[11px] tracking-widest text-zinc-500">Pago em</th>
            </tr>
          </thead>
          <tbody>
            {aluno.parcelas.map(p => (
              <tr key={p.idLancamento} className="border-b border-zinc-50 last:border-0 hover:bg-yellow-50/50 transition-colors">
                <td className="px-6 md:px-8 py-4 whitespace-nowrap">
                  <span className="font-black text-zinc-900">{rotuloParcela(p)}</span>
                  <span className="ml-2 text-[10px] font-black uppercase tracking-widest text-zinc-500">{ROTULO_TIPO[p.tipo] || p.tipo}</span>
                </td>
                <td className="px-4 py-4 font-mono text-sm font-bold text-zinc-700 whitespace-nowrap">
                  {p.numeroContrato || `#${p.idContrato}`}
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <span className="font-mono font-black text-zinc-900">{formatarData(p.dataVencimento)}</span>
                  {p.diasEmAtraso > 0 && (
                    <span className="ml-2 text-[10px] font-black uppercase tracking-widest text-red-600">{rotuloAtraso(p.diasEmAtraso)}</span>
                  )}
                </td>
                <td className="px-4 py-4 text-right font-mono font-black text-zinc-900 whitespace-nowrap">{formatarMoeda(p.valor)}</td>
                <td className="px-4 py-4 text-center">
                  <span className={`px-3 py-1.5 rounded-lg font-black text-[10px] uppercase border tracking-widest ${corDaParcela(p.status)}`}>
                    {p.status}
                  </span>
                </td>
                <td className="px-6 md:px-8 py-4 whitespace-nowrap text-sm font-bold text-zinc-600">
                  {p.dataPagamento
                    ? <><span className="font-mono text-emerald-700 font-black">{formatarData(p.dataPagamento)}</span>{p.formaPagamento && <> · {p.formaPagamento}</>}</>
                    : <span className="text-zinc-300 font-black">—</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </article>
  );
}

// --- Página --------------------------------------------------------------------

export default function InadimplenciaPage() {
  const router = useRouter();

  const [resultado, setResultado] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);

  const [filtros, setFiltros] = useState({ nome: '', matricula: '', status: 'ATRASADA' });
  const [filtrosAplicados, setFiltrosAplicados] = useState(filtros);

  // Espera o usuário parar de digitar antes de consultar
  useEffect(() => {
    const t = setTimeout(() => setFiltrosAplicados(filtros), 350);
    return () => clearTimeout(t);
  }, [filtros]);

  const consultar = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (filtrosAplicados.nome.trim()) params.nome = filtrosAplicados.nome.trim();
      if (filtrosAplicados.matricula.trim()) params.matricula = filtrosAplicados.matricula.trim();
      if (filtrosAplicados.status) params.status = filtrosAplicados.status;

      const res = await api.get('/api/financeiro/inadimplencia', { params });
      setResultado(Array.isArray(res.data) ? res.data : []);
      setErro(null);
    } catch (err) {
      setErro(mensagemErro(err, "Erro de conexão com o servidor Fly High."));
    } finally {
      setLoading(false);
    }
  }, [filtrosAplicados]);

  useEffect(() => { consultar(); }, [consultar]);

  const alterarFiltro = (e) => setFiltros(atual => ({ ...atual, [e.target.name]: e.target.value }));

  const totais = useMemo(() => ({
    alunos: resultado.length,
    inadimplentes: resultado.filter(a => a.quantidadeAtrasadas > 0).length,
    parcelas: resultado.reduce((soma, a) => soma + a.parcelas.length, 0),
    atrasado: resultado.reduce((soma, a) => soma + (Number(a.totalAtrasado) || 0), 0),
    listado: resultado.reduce((soma, a) => soma + a.parcelas.reduce((s, p) => s + (Number(p.valor) || 0), 0), 0)
  }), [resultado]);

  const rotuloStatus = FILTROS_STATUS.find(f => f.valor === filtrosAplicados.status)?.rotulo || 'Todas';
  const abrirFinanceiro = (idAluno) => router.push(`/views/financeiro?aluno=${idAluno}`);

  return (
    <div className="p-10 print:p-0 bg-gray-50 print:bg-white min-h-screen text-zinc-900 font-sans">
      <TituloPagina
        titulo="Inadimplência"
        descricao="Situação financeira por aluno, do vencimento mais antigo para o mais recente. Somente consulta: baixas e ajustes são feitos no Financeiro."
      >
        <button
          onClick={() => window.print()}
          className="print:hidden px-8 py-4 bg-white text-zinc-900 border-2 border-zinc-200 rounded-2xl font-black text-sm uppercase tracking-[0.2em] hover:bg-zinc-900 hover:text-white transition-all shadow-md"
        >
          🖨 Imprimir
        </button>
        <button
          onClick={() => router.push('/')}
          className="print:hidden px-8 py-4 bg-zinc-900 text-white rounded-2xl font-black text-sm uppercase tracking-[0.2em] hover:bg-yellow-400 hover:text-zinc-900 transition-all shadow-xl"
        >
          Voltar ao Início
        </button>
      </TituloPagina>

      <section className="print:hidden bg-white p-8 rounded-3xl border border-zinc-200 shadow-sm mb-10">
        <h2 className="font-black text-lg uppercase text-yellow-600 tracking-widest border-b border-zinc-100 pb-4 mb-6">01. Filtros</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
          <InputField
            label="Nome do aluno" name="nome" value={filtros.nome} onChange={alterarFiltro}
            placeholder="Parte do nome"
          />
          <InputField
            label="Nº de matrícula" name="matricula" value={filtros.matricula} onChange={alterarFiltro}
            placeholder="Matrícula completa"
          />
          <SelectField label="Status da parcela" name="status" value={filtros.status} onChange={alterarFiltro}>
            {FILTROS_STATUS.map(f => <option key={f.valor || 'todas'} value={f.valor}>{f.rotulo}</option>)}
          </SelectField>
        </div>
        <p className="text-xs font-bold text-zinc-500 mt-4">
          O nome aceita busca parcial; a matrícula precisa ser digitada completa.
        </p>
      </section>

      {/* Cabeçalho que só aparece no papel */}
      <div className="hidden print:block mb-6 text-sm font-bold text-zinc-600">
        Fly High Idiomas · Consulta de inadimplência · Status: {rotuloStatus}
        {filtrosAplicados.nome && <> · Nome: {filtrosAplicados.nome}</>}
        {filtrosAplicados.matricula && <> · Matrícula: {filtrosAplicados.matricula}</>}
      </div>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className={`p-8 rounded-3xl print:border print:border-zinc-300 ${totais.atrasado > 0 ? 'bg-red-600 text-white shadow-xl' : 'bg-white border border-zinc-200 shadow-sm'}`}>
          <div className={`text-[10px] font-black uppercase tracking-widest ${totais.atrasado > 0 ? 'text-white/70' : 'text-zinc-500'}`}>Em atraso (alunos listados)</div>
          <div className="text-4xl font-black italic tracking-tighter mt-2">{formatarMoeda(totais.atrasado)}</div>
          <div className={`text-xs font-bold mt-2 ${totais.atrasado > 0 ? 'text-white/80' : 'text-zinc-500'}`}>{totais.inadimplentes} aluno(s) inadimplente(s)</div>
        </div>
        <div className="bg-white p-8 rounded-3xl border border-zinc-200 shadow-sm">
          <div className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Alunos listados</div>
          <div className="text-4xl font-black italic tracking-tighter mt-2">{totais.alunos}</div>
          <div className="text-xs font-bold mt-2 text-zinc-500">{totais.parcelas} parcela(s) · filtro: {rotuloStatus}</div>
        </div>
        <div className="bg-yellow-400 p-8 rounded-3xl shadow-xl print:shadow-none print:border print:border-zinc-300">
          <div className="text-[10px] font-black uppercase tracking-widest text-zinc-800">Valor das parcelas listadas</div>
          <div className="text-4xl font-black italic tracking-tighter mt-2 text-zinc-900">{formatarMoeda(totais.listado)}</div>
        </div>
      </section>

      <section className="space-y-8">
        {loading && (
          <div className="p-10 text-center uppercase italic font-black text-zinc-500 animate-pulse">Consultando...</div>
        )}
        {!loading && erro && (
          <div className="p-10 text-center uppercase font-black italic text-red-600 bg-white rounded-3xl border border-red-200">{erro}</div>
        )}
        {!loading && !erro && resultado.length === 0 && (
          <div className="p-10 text-center bg-white rounded-3xl border border-zinc-200">
            <span className="text-zinc-500 uppercase font-black italic">
              {filtrosAplicados.status === 'ATRASADA' && !filtrosAplicados.nome && !filtrosAplicados.matricula
                ? 'Nenhuma parcela em atraso.'
                : 'Nenhum aluno encontrado com esses filtros.'}
            </span>
          </div>
        )}
        {!loading && !erro && resultado.map(aluno => (
          <CartaoAluno key={aluno.idAluno} aluno={aluno} onAbrirFinanceiro={abrirFinanceiro} />
        ))}
      </section>
    </div>
  );
}
