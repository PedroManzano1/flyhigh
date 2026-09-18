"use client";
import { useState, useEffect, useContext, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useFeedback } from '../../../components/feedback';
import { SelectField, CampoBusca, LinhaCarregando, LinhaVazia, LinhaErro, TituloPagina } from '../../../components/ui';
import api, { mensagemErro } from '../../../utils/api';
import { AuthContext } from '../../../context/authContext';
import { formatarMoeda, formatarData } from '../../../utils/formato';
import { STATUS_MATRICULA, corDoStatus, TIPO_VIP } from '../../../utils/contrato';

/**
 * Estória 7 — Contratos.
 * É o contrato que matricula o aluno na turma, por isso esta tela substituiu a
 * antiga tela provisória de matrículas.
 */

export default function ContratosPage() {
  const router = useRouter();
  const { notificar, confirmar } = useFeedback();
  const { temPermissao } = useContext(AuthContext);

  const [contratos, setContratos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);

  const [busca, setBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('');

  const podeEscrever = temPermissao('CONTRATOS_WRITE');
  const podeExcluir = temPermissao('CONTRATOS_DELETE');

  const carregar = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/contratos');
      setContratos(Array.isArray(res.data) ? res.data : []);
      setErro(null);
    } catch (err) {
      setErro(mensagemErro(err, "Erro de conexão com o servidor Fly High."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { carregar(); }, []);

  const contratosFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return contratos.filter(c => {
      if (filtroStatus && (c.status || '').toUpperCase() !== filtroStatus.toUpperCase()) return false;
      if (filtroTipo && (c.tipoContrato || '').toUpperCase() !== filtroTipo.toUpperCase()) return false;
      if (!termo) return true;
      const alvo = [
        c.numeroContrato,
        c.aluno?.nome,
        c.aluno?.numeroMatricula,
        c.responsavel?.nome,
        c.turma?.codigoTurma,
        c.cursoNome
      ].filter(Boolean).join(' ').toLowerCase();
      return alvo.includes(termo);
    });
  }, [contratos, busca, filtroStatus, filtroTipo]);

  const ativos = contratos.filter(c => (c.status || '').toUpperCase() === 'ATIVO').length;
  const aguardando = contratos.filter(c => (c.statusAssinatura || '').toUpperCase() !== 'ASSINADO').length;

  const handleExcluir = async (contrato) => {
    const nome = contrato.aluno?.nome || `#${contrato.idContrato}`;
    if (!(await confirmar(`Excluir o contrato de ${nome}? As parcelas geradas também serão apagadas.`))) return;
    try {
      await api.delete(`/api/contratos/${contrato.idContrato}`);
      notificar("Contrato excluído.", 'sucesso');
      carregar();
    } catch (err) {
      notificar(mensagemErro(err, "Erro ao excluir o contrato."), 'erro');
    }
  };

  return (
    <div className="p-10 bg-gray-50 min-h-screen text-zinc-900 font-sans">
      <TituloPagina
        titulo="Contratos"
        descricao="O contrato é o que matricula o aluno na turma e gera as parcelas do curso e do material."
      >
        {podeEscrever && (
          <button
            onClick={() => router.push('/views/contratos/editar')}
            className="px-8 py-4 bg-yellow-400 text-zinc-900 rounded-2xl font-black text-sm uppercase tracking-[0.2em] hover:bg-zinc-900 hover:text-white transition-all shadow-xl"
          >
            + Novo Contrato
          </button>
        )}
        <button
          onClick={() => router.push('/')}
          className="px-8 py-4 bg-zinc-900 text-white rounded-2xl font-black text-sm uppercase tracking-[0.2em] hover:bg-yellow-400 hover:text-zinc-900 transition-all shadow-xl"
        >
          Voltar ao Início
        </button>
      </TituloPagina>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="bg-white p-8 rounded-3xl border border-zinc-200 shadow-sm">
          <div className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Contratos cadastrados</div>
          <div className="text-5xl font-black italic tracking-tighter mt-2">{contratos.length}</div>
        </div>
        <div className="bg-white p-8 rounded-3xl border border-zinc-200 shadow-sm">
          <div className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Matrículas ativas</div>
          <div className="text-5xl font-black italic tracking-tighter mt-2 text-emerald-600">{ativos}</div>
        </div>
        <div className="bg-yellow-400 p-8 rounded-3xl shadow-xl">
          <div className="text-[10px] font-black uppercase tracking-widest text-zinc-800">Aguardando assinatura</div>
          <div className="text-5xl font-black italic tracking-tighter mt-2 text-zinc-900">{aguardando}</div>
        </div>
      </section>

      <section className="bg-white rounded-[2.5rem] shadow-md border border-zinc-200 overflow-hidden">
        <div className="p-8 border-b border-zinc-200 flex justify-between items-center flex-wrap gap-4 bg-zinc-100/30">
          <h2 className="font-black text-lg uppercase text-zinc-800 tracking-tighter">Database: Contratos</h2>
          <div className="flex flex-wrap gap-4 items-end">
            <SelectField label="Status" name="filtroStatus" value={filtroStatus} onChange={e => setFiltroStatus(e.target.value)}>
              <option value="">Todos</option>
              {STATUS_MATRICULA.map(s => <option key={s} value={s}>{s}</option>)}
            </SelectField>
            <SelectField label="Modelo" name="filtroTipo" value={filtroTipo} onChange={e => setFiltroTipo(e.target.value)}>
              <option value="">Todos</option>
              <option value="NORMAL">Normal</option>
              <option value="VIP">VIP</option>
            </SelectField>
            <CampoBusca
              value={busca}
              onChange={e => setBusca(e.target.value)}
              placeholder="Aluno, contratante, turma ou nº do contrato..."
              className="w-full max-w-sm"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[1100px]">
            <thead>
              <tr className="bg-zinc-50 border-b border-zinc-200">
                <th className="p-6 font-black uppercase text-xs tracking-widest text-zinc-600">Contrato</th>
                <th className="p-6 font-black uppercase text-xs tracking-widest text-zinc-800">Aluno</th>
                <th className="p-6 font-black uppercase text-xs tracking-widest text-zinc-800">Turma / Curso</th>
                <th className="p-6 font-black uppercase text-xs tracking-widest text-zinc-800">Contratante</th>
                <th className="p-6 font-black uppercase text-xs tracking-widest text-zinc-800 text-right">Curso (c/ desconto)</th>
                <th className="p-6 font-black uppercase text-xs tracking-widest text-zinc-800 text-center">Status</th>
                <th className="p-6 font-black uppercase text-xs tracking-widest text-zinc-800 text-center">Gestão</th>
              </tr>
            </thead>
            <tbody>
              {loading && <LinhaCarregando colunas={7} texto="Carregando contratos..." />}
              {!loading && erro && <LinhaErro colunas={7} texto={erro} />}

              {!loading && !erro && contratosFiltrados.map(c => (
                <tr key={c.idContrato} className="border-b border-zinc-100 hover:bg-yellow-50/50 transition-colors">
                  <td className="p-6 align-middle whitespace-nowrap">
                    <span className="bg-zinc-100 text-zinc-800 px-3 py-1.5 rounded-lg text-sm font-black border border-zinc-200 uppercase font-mono">
                      {c.numeroContrato || `#${c.idContrato}`}
                    </span>
                    <div className="mt-2 flex items-center gap-2">
                      <span className={`px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-widest border ${
                        (c.tipoContrato || '').toUpperCase() === TIPO_VIP
                          ? 'bg-zinc-900 text-yellow-400 border-zinc-900'
                          : 'bg-white text-zinc-600 border-zinc-300'
                      }`}>
                        {c.tipoContrato || 'NORMAL'}
                      </span>
                      <span className="text-[11px] font-bold text-zinc-500 font-mono">{formatarData(c.dataEmissao)}</span>
                    </div>
                  </td>

                  <td className="p-6 align-middle">
                    <div className="flex flex-col gap-1">
                      <span className="font-mono font-black text-zinc-500 text-xs">#{c.aluno?.numeroMatricula}</span>
                      <span className="font-black text-zinc-900 uppercase text-lg leading-tight">{c.aluno?.nome || 'Aluno removido'}</span>
                    </div>
                  </td>

                  <td className="p-6 align-middle">
                    <div className="font-bold uppercase text-zinc-900">{c.turma?.codigoTurma || '---'}</div>
                    <div className="text-sm text-zinc-600 font-bold">{c.cursoNome || c.turma?.curso?.nome || '---'}</div>
                  </td>

                  <td className="p-6 align-middle">
                    <span className="font-bold text-zinc-800 uppercase text-sm">
                      {c.responsavel?.nome || <span className="text-zinc-400 italic font-normal">Não informado</span>}
                    </span>
                  </td>

                  <td className="p-6 align-middle text-right font-mono font-bold text-zinc-900 whitespace-nowrap">
                    {formatarMoeda(c.valorComDesconto ?? c.valorTotalCurso)}
                    {c.descontoPercentual > 0 && (
                      <div className="text-[11px] font-black uppercase tracking-widest text-emerald-600 mt-1">
                        -{c.descontoPercentual}%
                      </div>
                    )}
                  </td>

                  <td className="p-6 align-middle text-center">
                    <span className={`px-3 py-1.5 rounded-lg font-black text-[10px] uppercase border tracking-widest ${corDoStatus(c.status)}`}>
                      {c.status || 'Ativo'}
                    </span>
                    <div className={`mt-2 text-[10px] font-black uppercase tracking-widest ${
                      (c.statusAssinatura || '').toUpperCase() === 'ASSINADO' ? 'text-emerald-600' : 'text-amber-600'
                    }`}>
                      {c.statusAssinatura || 'Aguardando Assinatura'}
                    </div>
                  </td>

                  <td className="p-6 align-middle">
                    <div className="flex justify-center gap-3">
                      <button
                        onClick={() => router.push(`/views/contratos/imprimir?id=${c.idContrato}`)}
                        title="Visualizar / imprimir"
                        className="w-12 h-12 flex items-center justify-center bg-white text-zinc-900 border-2 border-zinc-200 hover:bg-zinc-900 hover:text-white rounded-xl transition-all shadow-md text-xl"
                      >🖨</button>
                      {podeEscrever && (
                        <button
                          onClick={() => router.push(`/views/contratos/editar?id=${c.idContrato}`)}
                          title="Editar contrato"
                          className="w-12 h-12 flex items-center justify-center bg-zinc-900 text-white hover:bg-yellow-400 hover:text-zinc-900 rounded-xl transition-all shadow-md text-xl"
                        >✎</button>
                      )}
                      {podeExcluir && (
                        <button
                          onClick={() => handleExcluir(c)}
                          title="Excluir contrato"
                          className="w-12 h-12 flex items-center justify-center bg-white text-zinc-900 border-2 border-zinc-200 hover:bg-red-600 hover:text-white rounded-xl transition-all shadow-md text-xl"
                        >🗑</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}

              {!loading && !erro && contratosFiltrados.length === 0 && (
                <LinhaVazia colunas={7} texto="Nenhum contrato encontrado.">
                  {podeEscrever && (
                    <button
                      onClick={() => router.push('/views/contratos/editar')}
                      className="px-6 py-3 bg-zinc-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-yellow-400 hover:text-zinc-900 transition-all"
                    >
                      Cadastrar o primeiro contrato
                    </button>
                  )}
                </LinhaVazia>
              )}
            </tbody>
          </table>
        </div>

        <div className="bg-zinc-50 p-6 border-t border-zinc-200 flex justify-between items-center text-xs font-black uppercase tracking-widest text-zinc-500 rounded-b-[2.5rem]">
          <span>Fly High Idiomas v1.0 · Estória 7</span>
          <span>Exibindo {contratosFiltrados.length} de {contratos.length}</span>
        </div>
      </section>
    </div>
  );
}
