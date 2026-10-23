"use client";
import { Suspense, useState, useEffect, useContext, useMemo, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useFeedback } from '../../../../components/feedback';
import api, { mensagemErro } from '../../../../utils/api';
import { formatarNumero } from '../../../../utils/formato';
import { AuthContext } from '../../../../context/authContext';
import { agruparPorCategoria, rotuloModelo } from '../../../../utils/notas';

/**
 * Planilha de notas no formato do "Student's Evaluation Chart" da escola:
 * uma linha por aluno, colunas agrupadas por atividade (1st a 4th), total de
 * pontos e a nota final (soma ÷ 4 ou ÷ 5).
 */

const NOTA_MINIMA = 70;
const chave = (idAvaliacao, idAluno) => `${idAvaliacao}-${idAluno}`;

function valorDaCelula(bruto) {
  if (bruto === undefined || bruto === null || String(bruto).trim() === '') return null;
  const numero = parseFloat(String(bruto).replace(',', '.'));
  return isNaN(numero) ? NaN : numero;
}

function PlanilhaConteudo() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const idTurma = searchParams.get('turma');
  const { notificar } = useFeedback();
  const { temPermissao } = useContext(AuthContext);
  const podeLancar = temPermissao('AVALIACOES_WRITE');

  const [turma, setTurma] = useState(null);
  const [avaliacoes, setAvaliacoes] = useState([]);
  const [matriculas, setMatriculas] = useState([]);
  const [valores, setValores] = useState({});
  const [originais, setOriginais] = useState({});
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState(null);

  const carregar = useCallback(async () => {
    if (!idTurma) return;
    setLoading(true);
    try {
      const [resTurma, resAvaliacoes, resMatriculas, resNotas] = await Promise.all([
        api.get(`/api/turmas/${idTurma}`),
        api.get(`/api/avaliacoes/turma/${idTurma}`),
        api.get(`/api/contratos/turma/${idTurma}`),
        api.get(`/api/notas/turma/${idTurma}`)
      ]);
      setTurma(resTurma.data);
      setAvaliacoes(Array.isArray(resAvaliacoes.data) ? resAvaliacoes.data : []);
      setMatriculas((Array.isArray(resMatriculas.data) ? resMatriculas.data : []).filter(m => m.aluno));

      const mapa = {};
      (Array.isArray(resNotas.data) ? resNotas.data : []).forEach(n => {
        const idAvaliacao = n.avaliacao?.id_avaliacao ?? n.id?.avaliacaoId;
        const idAluno = n.aluno?.id_aluno ?? n.id?.alunoId;
        if (idAvaliacao && idAluno && n.valorObtido !== null && n.valorObtido !== undefined) {
          mapa[chave(idAvaliacao, idAluno)] = String(n.valorObtido);
        }
      });
      setValores(mapa);
      setOriginais(mapa);
      setErro(null);
    } catch (err) {
      setErro(mensagemErro(err, "Erro ao carregar a planilha de notas."));
    } finally {
      setLoading(false);
    }
  }, [idTurma]);

  useEffect(() => {
    if (!idTurma) {
      router.replace('/views/notas');
      return;
    }
    carregar();
  }, [idTurma, carregar, router]);

  const grupos = useMemo(() => agruparPorCategoria(avaliacoes), [avaliacoes]);
  const pontosCadastrados = avaliacoes.reduce((s, a) => s + (Number(a.notaMaxima) || 0), 0);
  const pontuacaoTotal = turma?.pontuacaoTotal || pontosCadastrados;
  const divisor = pontuacaoTotal / 100;

  const alteradas = useMemo(() => {
    const todas = new Set([...Object.keys(valores), ...Object.keys(originais)]);
    return [...todas].filter(k => (valores[k] ?? '') !== (originais[k] ?? ''));
  }, [valores, originais]);

  const invalidas = useMemo(() => {
    const maximo = {};
    avaliacoes.forEach(a => { maximo[a.id_avaliacao] = Number(a.notaMaxima) || 0; });
    return new Set(Object.entries(valores).filter(([k, bruto]) => {
      const valor = valorDaCelula(bruto);
      if (valor === null) return false;
      const idAvaliacao = k.split('-')[0];
      return isNaN(valor) || valor < 0 || valor > (maximo[idAvaliacao] ?? 0);
    }).map(([k]) => k));
  }, [valores, avaliacoes]);

  // Avisa antes de sair da página com notas não gravadas
  useEffect(() => {
    if (alteradas.length === 0) return;
    const aviso = (e) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', aviso);
    return () => window.removeEventListener('beforeunload', aviso);
  }, [alteradas.length]);

  const definir = (idAvaliacao, idAluno, texto) => {
    setValores(atual => ({ ...atual, [chave(idAvaliacao, idAluno)]: texto }));
  };

  // Enter desce para o próximo aluno na mesma coluna, como numa planilha
  const aoTeclar = (e, linha, coluna) => {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    const proxima = document.getElementById(`celula-${linha + 1}-${coluna}`);
    if (proxima) proxima.focus();
  };

  const totaisDoAluno = (idAluno) => {
    let pontos = 0;
    let lancadas = 0;
    avaliacoes.forEach(a => {
      const valor = valorDaCelula(valores[chave(a.id_avaliacao, idAluno)]);
      if (valor !== null && !isNaN(valor)) {
        pontos += valor;
        lancadas++;
      }
    });
    const nota = lancadas > 0 && divisor > 0 ? pontos / divisor : null;
    return { pontos, lancadas, nota };
  };

  const salvar = async () => {
    if (invalidas.size > 0) {
      return notificar(`Existem ${invalidas.size} nota(s) fora do valor da atividade. Corrija as células em vermelho.`, 'alerta');
    }
    if (alteradas.length === 0) return notificar("Nenhuma nota foi alterada.", 'info');

    const payload = alteradas.map(k => {
      const [idAvaliacao, idAluno] = k.split('-').map(Number);
      return {
        avaliacao: { id_avaliacao: idAvaliacao },
        aluno: { id_aluno: idAluno },
        valorObtido: valorDaCelula(valores[k])
      };
    });

    setSalvando(true);
    try {
      await api.post('/api/notas/lote', payload);
      notificar(`${payload.length} nota(s) gravada(s).`, 'sucesso');
      setOriginais(valores);
    } catch (err) {
      notificar(mensagemErro(err, "Erro ao gravar as notas."), 'erro');
    } finally {
      setSalvando(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <span className="font-black uppercase tracking-widest animate-pulse text-zinc-800 text-xl">Carregando planilha...</span>
      </div>
    );
  }

  return (
    <div className="p-10 bg-gray-50 min-h-screen text-zinc-900 font-sans">
      <header className="mb-10 flex flex-col gap-4">
        <button onClick={() => router.push('/views/notas')} className="flex items-center gap-2 text-zinc-600 hover:text-zinc-900 transition-colors font-black text-sm uppercase tracking-widest w-fit">
          <span className="text-xl">←</span> Voltar para as atividades
        </button>
        <div className="flex items-end justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-5xl font-black uppercase tracking-tighter italic text-zinc-900">Evaluation Chart</h1>
            <div className="h-2 w-24 bg-yellow-400 mt-2 rounded-full"></div>
            <p className="text-zinc-500 font-bold mt-3">
              {turma?.codigoTurma || 'Turma'} · {turma?.curso?.nome || 'Sem curso'} · Prof. {turma?.professor?.nome || 'a definir'} · {rotuloModelo(turma?.pontuacaoTotal)}
            </p>
          </div>
          {podeLancar && (
            <button
              onClick={salvar}
              disabled={salvando || alteradas.length === 0}
              className="px-8 py-4 bg-yellow-400 text-zinc-900 rounded-2xl font-black text-sm uppercase tracking-[0.2em] hover:bg-zinc-900 hover:text-white transition-all shadow-xl disabled:bg-zinc-200 disabled:text-zinc-400 disabled:cursor-not-allowed"
            >
              {salvando ? 'Gravando...' : alteradas.length > 0 ? `Gravar ${alteradas.length} alteração(ões)` : 'Tudo gravado'}
            </button>
          )}
        </div>
      </header>

      {erro && (
        <div className="mb-8 bg-red-50 border border-red-200 text-red-700 rounded-3xl p-6 font-black uppercase tracking-widest text-sm">{erro}</div>
      )}

      {!turma?.pontuacaoTotal && avaliacoes.length > 0 && (
        <div className="mb-8 bg-amber-50 border border-amber-200 text-amber-800 rounded-3xl p-6 font-bold text-sm">
          Esta turma não tem modelo definido. A nota final está usando a soma das atividades cadastradas ({formatarNumero(pontosCadastrados, 0)} pontos)
          como total. Defina o Modelo 400 ou 500 na tela de Turmas.
        </div>
      )}

      {avaliacoes.length === 0 || matriculas.length === 0 ? (
        <div className="bg-white rounded-3xl border border-zinc-200 p-16 text-center">
          <span className="text-zinc-500 uppercase font-black italic">
            {avaliacoes.length === 0 ? 'Esta turma ainda não tem atividades.' : 'Esta turma não tem alunos com matrícula ativa.'}
          </span>
        </div>
      ) : (
        <section className="bg-white rounded-[2.5rem] shadow-md border border-zinc-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="border-collapse text-sm">
              <thead>
                <tr className="bg-zinc-50">
                  <th rowSpan={3} className="sticky left-0 z-10 bg-zinc-50 p-4 border-b border-r border-zinc-200 text-left font-black uppercase text-xs tracking-widest text-zinc-600 min-w-[240px]">
                    Student
                  </th>
                  {grupos.map(g => (
                    <th key={g.categoria} colSpan={g.itens.length} className="px-3 py-3 border-b border-r border-zinc-200 font-black text-sm text-zinc-900 text-center whitespace-nowrap">
                      {g.categoria}
                    </th>
                  ))}
                  <th rowSpan={3} className="px-4 py-3 border-b border-r border-zinc-200 font-black uppercase text-xs tracking-widest text-zinc-800 text-center">Total</th>
                  <th rowSpan={3} className="px-4 py-3 border-b border-zinc-200 font-black uppercase text-xs tracking-widest text-zinc-800 text-center bg-yellow-100">
                    Nota<br /><span className="text-[10px] text-zinc-500">÷ {formatarNumero(divisor, divisor % 1 === 0 ? 0 : 2)}</span>
                  </th>
                </tr>
                <tr className="bg-zinc-50">
                  {grupos.flatMap(g => g.itens).map(a => (
                    <th key={a.id_avaliacao} className="px-2 py-2 border-b border-r border-zinc-200 font-black text-zinc-800 text-center whitespace-nowrap" title={a.titulo}>
                      {a.etapa || a.titulo}
                    </th>
                  ))}
                </tr>
                <tr className="bg-white">
                  {grupos.flatMap(g => g.itens).map(a => (
                    <th key={a.id_avaliacao} className="px-2 py-1 border-b-2 border-r border-zinc-300 font-mono font-bold text-xs text-zinc-500 text-center">
                      {formatarNumero(a.notaMaxima, 0)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {matriculas.map((m, linha) => {
                  const aluno = m.aluno;
                  const totais = totaisDoAluno(aluno.id_aluno);
                  const abaixo = totais.nota !== null && totais.nota < NOTA_MINIMA;
                  let coluna = 0;
                  return (
                    <tr key={aluno.id_aluno} className="hover:bg-yellow-50/50 transition-colors">
                      <td className="sticky left-0 z-10 bg-white p-3 border-b border-r border-zinc-200">
                        <div className="font-mono font-black text-zinc-400 text-[10px]">{linha + 1}. #{aluno.numeroMatricula}</div>
                        <div className="font-black uppercase text-zinc-900 leading-tight">{aluno.nome}</div>
                      </td>
                      {grupos.flatMap(g => g.itens).map(a => {
                        const k = chave(a.id_avaliacao, aluno.id_aluno);
                        const indice = coluna++;
                        const invalida = invalidas.has(k);
                        const mudou = (valores[k] ?? '') !== (originais[k] ?? '');
                        return (
                          <td key={a.id_avaliacao} className="p-1 border-b border-r border-zinc-200">
                            <input
                              id={`celula-${linha}-${indice}`}
                              type="text"
                              inputMode="decimal"
                              value={valores[k] ?? ''}
                              disabled={!podeLancar}
                              onChange={e => definir(a.id_avaliacao, aluno.id_aluno, e.target.value)}
                              onKeyDown={e => aoTeclar(e, linha, indice)}
                              aria-label={`${aluno.nome} — ${a.titulo}`}
                              className={`w-14 p-2 rounded-lg text-center font-black outline-none border-2 transition-all disabled:bg-transparent ${
                                invalida
                                  ? 'border-red-400 bg-red-50 text-red-700'
                                  : mudou
                                    ? 'border-yellow-400 bg-yellow-50 text-zinc-900'
                                    : 'border-transparent bg-zinc-50 text-zinc-900 focus:border-zinc-900'
                              }`}
                            />
                          </td>
                        );
                      })}
                      <td className="px-4 py-2 border-b border-r border-zinc-200 text-center font-mono font-black text-zinc-900">
                        {totais.lancadas > 0 ? formatarNumero(totais.pontos, totais.pontos % 1 === 0 ? 0 : 1) : '—'}
                      </td>
                      <td className={`px-4 py-2 border-b border-zinc-200 text-center font-mono font-black text-lg ${
                        totais.nota === null ? 'text-zinc-300' : abaixo ? 'text-red-600 bg-red-50/60' : 'text-emerald-700 bg-emerald-50/60'
                      }`}>
                        {totais.nota === null ? '—' : formatarNumero(totais.nota, 1)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="bg-zinc-50 p-6 border-t border-zinc-200 flex justify-between items-center flex-wrap gap-4 text-xs font-black uppercase tracking-widest text-zinc-500 rounded-b-[2.5rem]">
            <span>Enter desce para o próximo aluno · em branco = sem nota · amarelo = não gravado</span>
            <span>Aprovado com {NOTA_MINIMA} ou mais · {matriculas.length} aluno(s)</span>
          </div>
        </section>
      )}
    </div>
  );
}

// useSearchParams exige um limite de Suspense no App Router do Next.
export default function PlanilhaNotasPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <span className="font-black uppercase tracking-widest animate-pulse text-zinc-800 text-xl">Carregando planilha...</span>
      </div>
    }>
      <PlanilhaConteudo />
    </Suspense>
  );
}
