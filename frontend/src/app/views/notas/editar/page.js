"use client";
import { Suspense, useState, useEffect, useContext, useMemo } from 'react';
import { useFeedback } from '../../../../components/feedback';
import { InputField } from '../../../../components/ui';
import api, { mensagemErro } from '../../../../utils/api';
import { formatarNumero, formatarPeso } from '../../../../utils/formato';
import { useRouter, useSearchParams } from 'next/navigation';
import { AuthContext } from '../../../../context/authContext';


const formatarData = (data) => data ? new Date(data).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : '---';

function LancamentoConteudo() {
  const router = useRouter();
  const { notificar } = useFeedback();
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  const { temPermissao } = useContext(AuthContext);

  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [avaliacao, setAvaliacao] = useState(null);
  const [matriculas, setMatriculas] = useState([]);
  // { [idAluno]: "8.5" }  — string para permitir campo vazio
  const [lancamentos, setLancamentos] = useState({});
  const [formAvaliacao, setFormAvaliacao] = useState({ titulo: '', data: '', notaMaxima: '', peso: '' });

  const podeLancar = temPermissao('AVALIACOES_WRITE');
  const notaMaximaAtual = parseFloat(formAvaliacao.notaMaxima) || 0;
  const pesoAtual = parseFloat(formAvaliacao.peso) || 0;

  // Nota calculada = nota convertida para base 10 multiplicada pelo peso%
  const calcularContribuicao = (valor) => {
    if (valor === null || isNaN(valor) || notaMaximaAtual <= 0) return null;
    return (valor / notaMaximaAtual) * 10 * (pesoAtual / 100);
  };

  useEffect(() => {
    if (!id) {
      router.push('/views/notas');
      return;
    }

    const carregarDados = async () => {
      try {
        const resAvaliacao = await api.get(`/api/avaliacoes/${id}`);
        const carregada = resAvaliacao.data;
        setAvaliacao(carregada);
        setFormAvaliacao({
          titulo: carregada.titulo || '',
          data: carregada.data || '',
          notaMaxima: carregada.notaMaxima != null ? String(carregada.notaMaxima) : '',
          peso: carregada.peso != null ? String(carregada.peso) : ''
        });

        const idTurma = carregada.turma?.id_turma;
        const [resMatriculas, resNotas] = await Promise.all([
          idTurma ? api.get(`/api/contratos/turma/${idTurma}`) : Promise.resolve({ data: [] }),
          api.get(`/api/notas/avaliacao/${id}`)
        ]);

        const listaMatriculas = Array.isArray(resMatriculas.data) ? resMatriculas.data : [];
        setMatriculas(listaMatriculas);

        const registradas = {};
        (Array.isArray(resNotas.data) ? resNotas.data : []).forEach(n => {
          const idAluno = n.aluno?.id_aluno ?? n.id?.alunoId;
          if (idAluno && n.valorObtido !== null && n.valorObtido !== undefined) {
            registradas[idAluno] = String(n.valorObtido);
          }
        });
        setLancamentos(registradas);
      } catch (err) {
        notificar(mensagemErro(err, "Erro ao carregar os dados da avaliação."), 'erro');
        router.push('/views/notas');
      } finally {
        setLoading(false);
      }
    };

    carregarDados();
  }, [id, router]);

  const handleAvaliacaoChange = (e) => setFormAvaliacao({ ...formAvaliacao, [e.target.name]: e.target.value });

  const definirNota = (idAluno, valor) => {
    setLancamentos(prev => ({ ...prev, [idAluno]: valor }));
  };

  const limparTodas = () => setLancamentos({});

  const notasInvalidas = useMemo(() => {
    if (!notaMaximaAtual) return [];
    return matriculas.filter(m => {
      const bruto = lancamentos[m.aluno?.id_aluno];
      if (bruto === undefined || bruto === '') return false;
      const valor = parseFloat(bruto);
      return isNaN(valor) || valor < 0 || valor > notaMaximaAtual;
    });
  }, [lancamentos, matriculas, notaMaximaAtual]);

  const resumo = useMemo(() => {
    const valores = matriculas
      .map(m => lancamentos[m.aluno?.id_aluno])
      .filter(v => v !== undefined && v !== '')
      .map(v => parseFloat(v))
      .filter(v => !isNaN(v));

    const media = valores.length > 0 ? valores.reduce((a, b) => a + b, 0) / valores.length : null;
    return { lancadas: valores.length, pendentes: matriculas.length - valores.length, media };
  }, [lancamentos, matriculas]);

  const handleSalvarTudo = async (e) => {
    e.preventDefault();
    if (!podeLancar) return;

    if (!formAvaliacao.titulo.trim()) return notificar("Informe o título da avaliação.", 'alerta');
    if (!formAvaliacao.data) return notificar("Informe a data da avaliação.", 'alerta');
    if (!notaMaximaAtual || notaMaximaAtual <= 0) return notificar("A nota máxima deve ser maior que zero.", 'alerta');

    const peso = parseFloat(formAvaliacao.peso);
    if (!peso || peso <= 0 || peso > 100) return notificar("O peso deve ser um percentual entre 0 e 100.", 'alerta');

    if (notasInvalidas.length > 0) {
      return notificar(`Existem ${notasInvalidas.length} nota(s) fora do intervalo permitido (0 a ${notaMaximaAtual}).`, 'alerta');
    }
    if (matriculas.length === 0) {
      return notificar("Esta turma não possui alunos com matrícula ativa.", 'alerta');
    }

    setSalvando(true);
    try {
      await api.put(`/api/avaliacoes/editar/${id}`, {
        titulo: formAvaliacao.titulo.trim(),
        data: formAvaliacao.data,
        notaMaxima: notaMaximaAtual,
        peso,
        turma: { id_turma: avaliacao.turma?.id_turma }
      });

      const payload = matriculas
        .filter(m => m.aluno?.id_aluno)
        .map(m => {
          const bruto = lancamentos[m.aluno.id_aluno];
          const valor = bruto === undefined || bruto === '' ? null : parseFloat(bruto);
          return {
            avaliacao: { id_avaliacao: parseInt(id) },
            aluno: { id_aluno: m.aluno.id_aluno },
            valorObtido: valor
          };
        });

      await api.post('/api/notas/lote', payload);
      notificar("Notas lançadas com sucesso!", 'sucesso');
      router.push('/views/notas');
    } catch (err) {
      notificar(mensagemErro(err, "Erro ao lançar as notas."), 'erro');
    } finally {
      setSalvando(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <span className="font-black uppercase tracking-widest animate-pulse text-zinc-800 text-xl">Carregando Espelho de Notas...</span>
    </div>
  );

  return (
    <div className="p-10 bg-gray-50 min-h-screen text-zinc-900 font-sans">
      <header className="mb-10 flex flex-col gap-4">
        <button onClick={() => router.push('/views/notas')} className="flex items-center gap-2 text-zinc-600 hover:text-zinc-900 transition-colors font-black text-sm uppercase tracking-widest w-fit">
          <span className="text-xl">←</span> Voltar para as avaliações
        </button>
        <div>
          <h1 className="text-5xl font-black uppercase tracking-tighter italic text-zinc-900">Lançar Notas</h1>
          <div className="h-2 w-24 bg-yellow-400 mt-2 rounded-full"></div>
          <p className="text-zinc-500 font-bold mt-3">
            {avaliacao?.turma?.codigoTurma || 'Turma'} · {avaliacao?.turma?.curso?.nome || 'Sem curso'} · {avaliacao?.titulo} de {formatarData(avaliacao?.data)}
          </p>
        </div>
      </header>

      <form onSubmit={handleSalvarTudo} className="grid grid-cols-1 xl:grid-cols-3 gap-8 mb-12">

        <div className="bg-white p-8 rounded-3xl shadow-sm border border-zinc-200 space-y-8 h-fit">
          <h2 className="font-black text-lg uppercase text-yellow-600 tracking-widest border-b border-zinc-100 pb-4">01. Dados da Avaliação</h2>

          <InputField label="Título" name="titulo" onChange={handleAvaliacaoChange} value={formAvaliacao.titulo} disabled={!podeLancar} />
          <InputField label="Data" name="data" type="date" onChange={handleAvaliacaoChange} value={formAvaliacao.data} disabled={!podeLancar} />

          <div className="grid grid-cols-2 gap-6">
            <InputField label="Nota Máxima" name="notaMaxima" type="number" step="0.1" min="0.1" onChange={handleAvaliacaoChange} value={formAvaliacao.notaMaxima} disabled={!podeLancar} />
            <InputField label="Peso (0-100)%" name="peso" type="number" step="0.1" min="0.1" max="100" onChange={handleAvaliacaoChange} value={formAvaliacao.peso} disabled={!podeLancar} />
          </div>

          <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-6">
            <div className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-3">Resumo do lançamento</div>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <div className="text-2xl font-black text-emerald-600">{resumo.lancadas}</div>
                <div className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mt-1">Lançadas</div>
              </div>
              <div>
                <div className="text-2xl font-black text-amber-500">{resumo.pendentes}</div>
                <div className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mt-1">Pendentes</div>
              </div>
              <div>
                <div className="text-2xl font-black text-zinc-900">{resumo.media !== null ? formatarNumero(resumo.media, 2) : '--'}</div>
                <div className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mt-1">Média</div>
              </div>
            </div>
          </div>

          <div className="bg-zinc-900 text-white rounded-2xl p-6">
            <div className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2">Peso desta avaliação</div>
            <div className="text-4xl font-black">{formatarPeso(pesoAtual)}</div>
            <p className="text-zinc-400 font-bold text-xs mt-3 leading-relaxed">
              Cada nota lançada entra na nota final do aluno multiplicada por este peso.
            </p>
          </div>

          {notasInvalidas.length > 0 && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl p-5 font-bold text-sm">
              {notasInvalidas.length} nota(s) fora do intervalo de 0 a {notaMaximaAtual}.
            </div>
          )}
        </div>

        <div className="bg-white p-8 rounded-3xl shadow-sm border border-zinc-200 space-y-6 xl:col-span-2 flex flex-col">
          <div className="flex justify-between items-center flex-wrap gap-4 border-b border-zinc-100 pb-4">
            <h2 className="font-black text-lg uppercase text-zinc-700 tracking-widest">02. Espelho de Notas</h2>
            {podeLancar && matriculas.length > 0 && (
              <button type="button" onClick={limparTodas} className="px-4 py-2 rounded-xl bg-zinc-100 text-zinc-700 border border-zinc-200 font-black uppercase text-[10px] tracking-widest hover:bg-zinc-200 transition-all">
                Limpar todas
              </button>
            )}
          </div>

          {matriculas.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
              <span className="text-6xl opacity-50">📝</span>
              <h3 className="font-black text-xl text-zinc-400 uppercase tracking-widest">Nenhum aluno matriculado</h3>
              <p className="text-zinc-500 font-bold max-w-md">
                O espelho de notas usa as matrículas ativas da turma. Matricule os alunos para liberar o lançamento.
              </p>
              {temPermissao('CONTRATOS_READ') && (
                <button type="button" onClick={() => router.push('/views/contratos')} className="px-6 py-3 bg-zinc-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-yellow-400 hover:text-zinc-900 transition-all shadow-md">
                  Ir para Contratos
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto border border-zinc-200 rounded-2xl flex-grow">
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead className="bg-zinc-50 border-b border-zinc-200">
                  <tr>
                    <th className="p-4 font-black uppercase text-xs tracking-widest text-zinc-600">Aluno</th>
                    <th className="p-4 font-black uppercase text-xs tracking-widest text-center text-zinc-600 w-48">Nota Ativ. (0 a {notaMaximaAtual || '?'})</th>
                    <th className="p-4 font-black uppercase text-xs tracking-widest text-center text-zinc-600 w-32">Peso</th>
                    <th className="p-4 font-black uppercase text-xs tracking-widest text-center text-zinc-600 w-40">Nota Calc.</th>
                  </tr>
                </thead>
                <tbody>
                  {matriculas.map((m, index) => {
                    const aluno = m.aluno;
                    if (!aluno) return null;
                    const bruto = lancamentos[aluno.id_aluno] ?? '';
                    const valor = bruto === '' ? null : parseFloat(bruto);
                    const invalida = valor !== null && (isNaN(valor) || valor < 0 || (notaMaximaAtual > 0 && valor > notaMaximaAtual));
                    const calculada = calcularContribuicao(valor);

                    return (
                      <tr key={aluno.id_aluno} className={`border-b border-zinc-100 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'} hover:bg-yellow-50/50 transition-colors`}>
                        <td className="p-4">
                          <div className="flex flex-col">
                            <span className="font-mono font-black text-zinc-500 text-xs">#{aluno.numeroMatricula}</span>
                            <span className="font-black text-zinc-900 uppercase text-base leading-tight">{aluno.nome}</span>
                          </div>
                        </td>
                        <td className="p-4">
                          <input
                            type="number"
                            step="0.1"
                            min="0"
                            max={notaMaximaAtual || undefined}
                            value={bruto}
                            disabled={!podeLancar}
                            onChange={e => definirNota(aluno.id_aluno, e.target.value)}
                            placeholder="—"
                            className={`w-full p-3 border-2 rounded-xl text-center text-lg font-black text-zinc-900 outline-none bg-white transition-all disabled:bg-zinc-100 ${invalida ? 'border-red-400 focus:ring-4 focus:ring-red-200' : 'border-zinc-300 focus:ring-4 focus:ring-yellow-400/20'}`}
                          />
                        </td>
                        <td className="p-4 text-center">
                          <span className="font-mono font-bold text-sm text-zinc-500">{formatarPeso(pesoAtual)}</span>
                        </td>
                        <td className="p-4 text-center">
                          {calculada === null ? (
                            <span className="text-zinc-300 font-mono font-black">---</span>
                          ) : (
                            <span className="font-mono font-black text-lg text-zinc-900">
                              {formatarNumero(calculada, 2)}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          <div className="flex items-center justify-between flex-wrap gap-4 mt-6">
            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 max-w-sm leading-relaxed">
              Nota Calc. = nota do aluno x peso da avaliação. Campo em branco significa sem lançamento,
              e apagar uma nota já gravada remove o lançamento.
            </p>

            <div className="flex flex-row justify-end gap-4">
              <button type="button" onClick={() => router.push('/views/notas')} className="text-zinc-500 p-4 font-black uppercase text-sm hover:text-zinc-900 transition-all tracking-widest underline decoration-zinc-300 decoration-2">
                Cancelar
              </button>
              {podeLancar && (
                <button type="submit" disabled={salvando || matriculas.length === 0 || notasInvalidas.length > 0} className="bg-yellow-400 text-zinc-900 px-8 py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-zinc-900 hover:text-white transition-all shadow-md disabled:bg-zinc-200 disabled:text-zinc-400 disabled:cursor-not-allowed">
                  {salvando ? 'Gravando...' : 'Gravar Notas'}
                </button>
              )}
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

// useSearchParams exige um limite de Suspense no App Router do Next.
export default function LancamentoNotasPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <span className="font-black uppercase tracking-widest animate-pulse text-zinc-800 text-xl">Carregando Espelho de Notas...</span>
      </div>
    }>
      <LancamentoConteudo />
    </Suspense>
  );
}
