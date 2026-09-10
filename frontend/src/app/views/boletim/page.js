"use client";
import { useState, useEffect, useContext, useMemo } from 'react';
import { SelectField } from '../../../components/ui';
import api, { mensagemErro } from '../../../utils/api';
import { formatarNumero, formatarPeso, formatarNotaFinal } from '../../../utils/formato';
import { useRouter } from 'next/navigation';
import { AuthContext } from '../../../context/authContext';


const ESTILO_SITUACAO = {
  APROVADO: { rotulo: 'Aprovado', classe: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  REPROVADO: { rotulo: 'Reprovado', classe: 'bg-red-600 text-white border-red-600' },
  CURSANDO: { rotulo: 'Cursando', classe: 'bg-blue-50 text-blue-700 border-blue-200' },
  SEM_LANCAMENTOS: { rotulo: 'Sem lançamentos', classe: 'bg-zinc-100 text-zinc-500 border-zinc-200' }
};

export default function BoletimPage() {
  const router = useRouter();
  const { user, temPermissao } = useContext(AuthContext);

  const [turmas, setTurmas] = useState([]);
  const [turmaSelecionada, setTurmaSelecionada] = useState('');
  const [somenteMinhasTurmas, setSomenteMinhasTurmas] = useState(false);

  const [boletim, setBoletim] = useState(null);
  const [loading, setLoading] = useState(true);
  const [carregandoBoletim, setCarregandoBoletim] = useState(false);
  const [erro, setErro] = useState(null);
  const [busca, setBusca] = useState('');

  useEffect(() => {
    const carregarTurmas = async () => {
      setLoading(true);
      try {
        const res = await api.get('/api/turmas');
        setTurmas(Array.isArray(res.data) ? res.data : []);
        setErro(null);
      } catch (err) {
        setErro("Erro de conexão com o servidor FlyHigh.");
      } finally {
        setLoading(false);
      }
    };
    carregarTurmas();
  }, []);

  useEffect(() => {
    if (!user?.idUsuario || turmas.length === 0) return;
    const ehProfessor = turmas.some(t => t.professor?.idUsuario === user.idUsuario);
    if (ehProfessor && !user.permissoes?.includes('ROLE_DIRETOR')) setSomenteMinhasTurmas(true);
  }, [turmas, user]);

  const turmasVisiveis = useMemo(() => {
    if (!somenteMinhasTurmas || !user?.idUsuario) return turmas;
    return turmas.filter(t => t.professor?.idUsuario === user.idUsuario);
  }, [turmas, somenteMinhasTurmas, user]);

  useEffect(() => {
    const carregarBoletim = async () => {
      if (!turmaSelecionada) { setBoletim(null); return; }
      setCarregandoBoletim(true);
      try {
        const res = await api.get(`/api/boletim/turma/${turmaSelecionada}`);
        setBoletim(res.data);
        setErro(null);
      } catch (err) {
        setBoletim(null);
        setErro(mensagemErro(err, "Erro ao gerar o boletim desta turma."));
      } finally {
        setCarregandoBoletim(false);
      }
    };
    carregarBoletim();
  }, [turmaSelecionada]);

  const avaliacoes = boletim?.avaliacoes || [];
  const alunos = boletim?.alunos || [];
  const pesoTotal = boletim?.pesoTotal ?? 0;
  const pesosFecham = Math.abs(pesoTotal - 100) < 0.01;

  const alunosFiltrados = alunos.filter(a =>
    a.nome?.toLowerCase().includes(busca.toLowerCase()) ||
    a.numeroMatricula?.includes(busca)
  );

  const contagem = useMemo(() => ({
    aprovados: alunos.filter(a => a.situacao === 'APROVADO').length,
    reprovados: alunos.filter(a => a.situacao === 'REPROVADO').length,
    cursando: alunos.filter(a => a.situacao === 'CURSANDO').length
  }), [alunos]);

  const imprimir = () => window.print();

  return (
    <div className="p-10 bg-gray-50 min-h-screen text-zinc-900 font-sans">
      <header className="mb-12 flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-5xl font-black uppercase tracking-tighter italic text-zinc-900">Boletim da Turma</h1>
          <div className="h-2 w-24 bg-yellow-400 rounded-full mt-2"></div>
          <p className="text-zinc-500 font-bold mt-3">Notas, peso, nota calculada, frequência e situação de cada aluno.</p>
        </div>
        <div className="flex flex-wrap gap-4">
          {boletim && (
            <button onClick={imprimir} className="px-8 py-4 bg-white text-zinc-900 border-2 border-zinc-200 rounded-2xl font-black text-sm uppercase tracking-[0.2em] hover:bg-zinc-100 transition-all shadow-sm">
              🖨 Imprimir
            </button>
          )}
          <button onClick={() => router.push('/views/notas')} className="px-8 py-4 bg-sky-100 text-sky-800 border border-sky-200 rounded-2xl font-black text-sm uppercase tracking-[0.2em] hover:bg-sky-200 transition-all shadow-sm">
            📝 Lançar Notas
          </button>
          <button onClick={() => router.push('/')} className="px-8 py-4 bg-zinc-900 text-white rounded-2xl font-black text-sm uppercase tracking-[0.2em] hover:bg-yellow-400 hover:text-zinc-900 transition-all shadow-xl">
            Voltar ao Início
          </button>
        </div>
      </header>

      {erro && (
        <div className="mb-8 bg-red-50 border border-red-200 text-red-700 rounded-3xl p-6 font-black uppercase tracking-widest text-sm">
          {erro}
        </div>
      )}

      {boletim && avaliacoes.length > 0 && !pesosFecham && (
        <div className="mb-8 bg-amber-50 border border-amber-200 text-amber-800 rounded-3xl p-6 font-bold text-sm leading-relaxed">
          <span className="font-black uppercase tracking-widest text-xs block mb-1">⚠ Pesos incompletos</span>
          Os pesos das avaliações desta turma somam {formatarPeso(pesoTotal)} em vez de 100%.
          Enquanto isso, a nota final mostrada não chega ao valor cheio. Ajuste os pesos em Notas &amp; Avaliações.
        </div>
      )}

      <section className="grid grid-cols-1 xl:grid-cols-3 gap-8 mb-16">

        <div className="bg-white p-8 rounded-3xl border border-zinc-200 shadow-sm space-y-6">
          <h2 className="font-black text-sm uppercase text-zinc-800 tracking-[0.2em] mb-4 border-b border-zinc-100 pb-2">01. Turma</h2>

          <SelectField label="Selecione a Turma" name="turma" onChange={e => setTurmaSelecionada(e.target.value)} value={turmaSelecionada}>
            <option value="">{loading ? 'Carregando turmas...' : 'Selecione a turma...'}</option>
            {turmasVisiveis.map(t => (
              <option key={t.id_turma} value={t.id_turma}>
                {t.codigoTurma} — {t.curso ? t.curso.nome : 'Sem curso'} ({t.semestreAno || 's/ semestre'})
              </option>
            ))}
          </SelectField>

          {user?.idUsuario && (
            <label className="flex items-center gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={somenteMinhasTurmas}
                onChange={() => { setSomenteMinhasTurmas(!somenteMinhasTurmas); setTurmaSelecionada(''); }}
                className="w-6 h-6 accent-zinc-900 cursor-pointer"
              />
              <span className="text-xs font-black uppercase tracking-widest text-zinc-600">Somente minhas turmas</span>
            </label>
          )}

          {boletim && (
            <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-6 space-y-2">
              <div className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Identificação</div>
              <div className="font-black text-xl uppercase leading-tight">{boletim.codigoTurma}</div>
              <div className="font-bold text-sm text-zinc-700 uppercase">{boletim.curso || 'Sem curso'}</div>
              <div className="font-bold text-sm text-zinc-600">Prof.: {boletim.professor || 'A definir'}</div>
              <div className="font-bold text-sm text-zinc-600 font-mono">Semestre: {boletim.semestreAno || '---'}</div>
            </div>
          )}
        </div>

        <div className="bg-white p-8 rounded-3xl border border-zinc-200 shadow-sm space-y-6">
          <h2 className="font-black text-sm uppercase text-zinc-800 tracking-[0.2em] mb-4 border-b border-zinc-100 pb-2">02. Critérios Aplicados</h2>

          {boletim ? (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-5 text-center">
                  <div className="text-3xl font-black text-zinc-900">{boletim.mediaMinima?.toFixed(1)}</div>
                  <div className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mt-1">Média mínima</div>
                </div>
                <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-5 text-center">
                  <div className="text-3xl font-black text-zinc-900">{boletim.frequenciaMinima?.toFixed(0)}%</div>
                  <div className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mt-1">Frequência mínima</div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-4 text-center">
                  <div className="text-2xl font-black">{boletim.totalAulas}</div>
                  <div className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mt-1">Aulas</div>
                </div>
                <div className={`border rounded-2xl p-4 text-center ${pesosFecham ? 'bg-zinc-50 border-zinc-200' : 'bg-amber-50 border-amber-200'}`}>
                  <div className="text-2xl font-black">{boletim.totalAvaliacoes}</div>
                  <div className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mt-1">
                    Aval. ({formatarPeso(pesoTotal)})
                  </div>
                </div>
                <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-4 text-center">
                  <div className="text-2xl font-black">{boletim.totalAlunos}</div>
                  <div className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mt-1">Alunos</div>
                </div>
              </div>

              <p className="text-xs font-bold text-zinc-500 leading-relaxed">
                A nota final é a soma das notas calculadas (nota x peso%). A ERS não fixou a nota mínima
                nem a frequência mínima; os dois valores ficam no application.properties
                (flyhigh.pedagogico.media-minima e flyhigh.pedagogico.frequencia-minima).
              </p>
            </>
          ) : (
            <p className="text-zinc-500 font-bold text-sm">Selecione uma turma para ver os critérios de aprovação em uso.</p>
          )}
        </div>

        <div className="bg-zinc-900 p-8 rounded-3xl shadow-xl flex flex-col justify-between text-white">
          <div>
            <h2 className="font-black text-2xl uppercase mb-4 italic">Panorama Final</h2>
            <p className="font-bold text-zinc-400 text-sm leading-relaxed">
              A reprovação por frequência é imediata. A reprovação por nota só é considerada depois que todas as avaliações da turma forem lançadas.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 mt-8">
            <div className="bg-emerald-500/20 border border-emerald-500/30 rounded-2xl p-4 text-center">
              <div className="text-3xl font-black text-emerald-400">{contagem.aprovados}</div>
              <div className="text-[10px] font-black uppercase tracking-widest mt-1 text-emerald-200">Aprovados</div>
            </div>
            <div className="bg-red-500/20 border border-red-500/30 rounded-2xl p-4 text-center">
              <div className="text-3xl font-black text-red-400">{contagem.reprovados}</div>
              <div className="text-[10px] font-black uppercase tracking-widest mt-1 text-red-200">Reprovados</div>
            </div>
            <div className="bg-blue-500/20 border border-blue-500/30 rounded-2xl p-4 text-center">
              <div className="text-3xl font-black text-blue-300">{contagem.cursando}</div>
              <div className="text-[10px] font-black uppercase tracking-widest mt-1 text-blue-200">Cursando</div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white rounded-[2.5rem] shadow-md border border-zinc-200 overflow-hidden flex flex-col">
        <div className="p-8 border-b border-zinc-200 flex justify-between items-center flex-wrap gap-4 bg-zinc-100/30">
          <h2 className="font-black text-lg uppercase text-zinc-800 tracking-tighter">Boletim Consolidado</h2>
          <div className="relative w-full max-w-md">
            <input type="text" placeholder="Pesquisar aluno ou matrícula..." value={busca} onChange={e => setBusca(e.target.value)} className="w-full px-6 py-4 rounded-2xl border border-zinc-300 text-sm font-bold text-zinc-900 focus:outline-none focus:ring-4 focus:ring-yellow-400/20" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left" style={{ minWidth: `${700 + avaliacoes.length * 110}px` }}>
            <thead>
              <tr className="bg-zinc-50 border-b border-zinc-200">
                <th className="p-6 font-black uppercase text-xs tracking-widest text-zinc-600 sticky left-0 bg-zinc-50">Aluno</th>
                {avaliacoes.map(a => (
                  <th key={a.idAvaliacao} className="p-4 font-black uppercase text-[10px] tracking-widest text-zinc-800 text-center">
                    <div className="leading-tight">{a.titulo}</div>
                    <div className="text-zinc-400 font-mono mt-1 normal-case">máx {formatarNumero(a.notaMaxima, 1)} · peso {formatarPeso(a.peso)}</div>
                  </th>
                ))}
                <th className="p-6 font-black uppercase text-xs tracking-widest text-zinc-800 text-center">Nota Final</th>
                <th className="p-6 font-black uppercase text-xs tracking-widest text-zinc-800 text-center">Frequência</th>
                <th className="p-6 font-black uppercase text-xs tracking-widest text-zinc-800 text-center">Situação</th>
              </tr>
            </thead>
            <tbody>
              {!turmaSelecionada && (
                <tr><td colSpan={avaliacoes.length + 4} className="p-10 text-center text-zinc-500 uppercase font-black italic">Selecione uma turma para gerar o boletim.</td></tr>
              )}

              {turmaSelecionada && carregandoBoletim && (
                <tr><td colSpan={avaliacoes.length + 4} className="p-10 text-center uppercase italic font-black text-zinc-500 animate-pulse">Gerando boletim...</td></tr>
              )}

              {turmaSelecionada && !carregandoBoletim && alunosFiltrados.map(aluno => {
                const situacao = ESTILO_SITUACAO[aluno.situacao] || ESTILO_SITUACAO.SEM_LANCAMENTOS;
                const reprovado = aluno.situacao === 'REPROVADO';
                return (
                  <tr key={aluno.idAluno} className={`border-b border-zinc-100 transition-colors ${reprovado ? 'bg-red-50/60 hover:bg-red-50' : 'hover:bg-yellow-50/50'}`}>
                    <td className="p-6 align-middle sticky left-0 bg-inherit">
                      <div className="flex flex-col gap-1">
                        <span className="font-mono font-black text-zinc-500 text-sm">#{aluno.numeroMatricula}</span>
                        <span className="font-black text-zinc-900 uppercase text-lg leading-tight">{aluno.nome}</span>
                        {aluno.faltasConsecutivas > 3 && (
                          <span className="mt-1 w-fit bg-red-600 text-white px-2 py-1 rounded-md font-black text-[9px] uppercase tracking-widest">
                            ⚠ {aluno.faltasConsecutivas} faltas seguidas
                          </span>
                        )}
                      </div>
                    </td>

                    {aluno.notas?.map(item => (
                      <td key={item.idAvaliacao} className="p-4 align-middle text-center">
                        {item.valorObtido === null || item.valorObtido === undefined ? (
                          <span className="text-zinc-300 font-mono font-black">—</span>
                        ) : (
                          <div className="flex flex-col items-center">
                            <span className="font-mono font-black text-lg text-zinc-900">{formatarNumero(item.valorObtido, 2)}</span>
                            <span className="font-mono text-[11px] font-bold text-zinc-500" title="Nota calculada (nota x peso)">
                              calc. {formatarNumero(item.notaCalculada, 2)}
                            </span>
                          </div>
                        )}
                      </td>
                    ))}

                    <td className="p-6 align-middle text-center">
                      {aluno.notaFinal === null || aluno.notaFinal === undefined ? (
                        <span className="text-zinc-300 font-mono font-black">---</span>
                      ) : (
                        <span className={`font-mono font-black text-2xl ${aluno.notaFinal >= (boletim?.mediaMinima ?? 6) ? 'text-emerald-600' : 'text-red-600'}`}>
                          {formatarNotaFinal(aluno.notaFinal, aluno.notaFinalArredondada)}
                        </span>
                      )}
                      <div className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mt-1">
                        {aluno.avaliacoesLancadas}/{aluno.totalAvaliacoes} aval. · peso {formatarPeso(aluno.pesoLancado)}
                      </div>
                    </td>

                    <td className="p-6 align-middle text-center">
                      {aluno.percentualFrequencia === null || aluno.percentualFrequencia === undefined ? (
                        <span className="text-zinc-300 font-mono font-black">---</span>
                      ) : (
                        <div className="flex flex-col items-center gap-2">
                          <span className={`font-mono font-black text-lg ${aluno.percentualFrequencia >= (boletim?.frequenciaMinima ?? 75) ? 'text-zinc-900' : 'text-red-600'}`}>
                            {aluno.percentualFrequencia.toFixed(0)}%
                          </span>
                          <div className="w-20 h-2 bg-zinc-200 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${aluno.percentualFrequencia >= (boletim?.frequenciaMinima ?? 75) ? 'bg-emerald-500' : 'bg-red-500'}`} style={{ width: `${Math.min(aluno.percentualFrequencia, 100)}%` }}></div>
                          </div>
                          <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                            {aluno.presencas}P · {aluno.faltas}F · {aluno.faltasJustificadas}J
                          </span>
                        </div>
                      )}
                    </td>

                    <td className="p-6 align-middle text-center">
                      <span className={`px-3 py-1.5 rounded-lg font-black text-[10px] uppercase border tracking-widest ${situacao.classe}`}>
                        {situacao.rotulo}
                      </span>
                      {aluno.observacao && (
                        <div className="text-[10px] font-bold text-zinc-500 mt-2 max-w-[160px] mx-auto leading-snug">
                          {aluno.observacao}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}

              {turmaSelecionada && !carregandoBoletim && alunosFiltrados.length === 0 && (
                <tr>
                  <td colSpan={avaliacoes.length + 4} className="p-10 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <span className="text-zinc-500 uppercase font-black italic">Nenhum aluno com matrícula ativa nesta turma.</span>
                      {temPermissao('CONTRATOS_READ') && (
                        <button type="button" onClick={() => router.push('/views/matriculas')} className="px-6 py-3 bg-zinc-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-yellow-400 hover:text-zinc-900 transition-all shadow-md">
                          Ir para Matrículas
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="bg-zinc-50 p-6 border-t border-zinc-200 flex justify-between items-center flex-wrap gap-3 text-xs font-black uppercase tracking-widest text-zinc-500 rounded-b-[2.5rem]">
          <span>FlyHigh Idiomas v1.0 · Nota final = soma de (nota x peso%)</span>
          <span>Total: {alunosFiltrados.length} Alunos</span>
        </div>
      </section>
    </div>
  );
}
