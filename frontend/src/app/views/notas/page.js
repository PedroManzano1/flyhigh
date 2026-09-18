"use client";
import { useState, useEffect, useContext, useMemo } from 'react';
import { useFeedback } from '../../../components/feedback';
import { InputField, SelectField } from '../../../components/ui';
import api, { mensagemErro } from '../../../utils/api';
import { formatarNumero, formatarPeso } from '../../../utils/formato';
import { useRouter } from 'next/navigation';
import { AuthContext } from '../../../context/authContext';


const formatarData = (data) => data ? new Date(data).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : '---';

export default function NotasPage() {
  const router = useRouter();
  const { notificar, confirmar } = useFeedback();
  const { user, temPermissao } = useContext(AuthContext);

  const [turmas, setTurmas] = useState([]);
  const [turmaSelecionada, setTurmaSelecionada] = useState('');
  const [somenteMinhasTurmas, setSomenteMinhasTurmas] = useState(false);

  const [avaliacoes, setAvaliacoes] = useState([]);
  const [matriculas, setMatriculas] = useState([]);
  const [notas, setNotas] = useState([]);

  const [loading, setLoading] = useState(true);
  const [carregandoTurma, setCarregandoTurma] = useState(false);
  const [erro, setErro] = useState(null);

  const estadoInicial = { titulo: '', data: '', notaMaxima: '10', peso: '' };
  const [formData, setFormData] = useState(estadoInicial);

  const podeLancar = temPermissao('AVALIACOES_WRITE');
  const podeExcluir = temPermissao('AVALIACOES_DELETE');

  useEffect(() => {
    const carregarTurmas = async () => {
      setLoading(true);
      try {
        const res = await api.get('/api/turmas');
        setTurmas(Array.isArray(res.data) ? res.data : []);
        setErro(null);
      } catch (err) {
        setErro("Erro de conexão com o servidor Fly High.");
      } finally {
        setLoading(false);
      }
    };
    carregarTurmas();
  }, []);

  // Professor vê por padrão apenas as turmas em que está vinculado
  useEffect(() => {
    if (!user?.idUsuario || turmas.length === 0) return;
    const ehProfessor = turmas.some(t => t.professor?.idUsuario === user.idUsuario);
    if (ehProfessor && !user.permissoes?.includes('ROLE_DIRETOR')) setSomenteMinhasTurmas(true);
  }, [turmas, user]);

  const turmasVisiveis = useMemo(() => {
    if (!somenteMinhasTurmas || !user?.idUsuario) return turmas;
    return turmas.filter(t => t.professor?.idUsuario === user.idUsuario);
  }, [turmas, somenteMinhasTurmas, user]);

  const turma = useMemo(
    () => turmas.find(t => String(t.id_turma) === String(turmaSelecionada)) || null,
    [turmas, turmaSelecionada]
  );

  const totalAlunos = matriculas.length;
  const somaPesos = Math.round(avaliacoes.reduce((soma, a) => soma + (a.peso || 0), 0) * 100) / 100;
  const pesoDisponivel = Math.round((100 - somaPesos) * 100) / 100;
  const pesosFecham = Math.abs(somaPesos - 100) < 0.01;

  const carregarDadosDaTurma = async (idTurma) => {
    if (!idTurma) {
      setAvaliacoes([]); setMatriculas([]); setNotas([]);
      return;
    }
    setCarregandoTurma(true);
    try {
      const [resAvaliacoes, resMatriculas, resNotas] = await Promise.all([
        api.get(`/api/avaliacoes/turma/${idTurma}`),
        api.get(`/api/contratos/turma/${idTurma}`),
        api.get(`/api/notas/turma/${idTurma}`)
      ]);
      setAvaliacoes(Array.isArray(resAvaliacoes.data) ? resAvaliacoes.data : []);
      setMatriculas(Array.isArray(resMatriculas.data) ? resMatriculas.data : []);
      setNotas(Array.isArray(resNotas.data) ? resNotas.data : []);
      setErro(null);
    } catch (err) {
      setErro(mensagemErro(err, "Erro ao carregar as avaliações desta turma."));
    } finally {
      setCarregandoTurma(false);
    }
  };

  useEffect(() => { carregarDadosDaTurma(turmaSelecionada); }, [turmaSelecionada]);

  // Sugere no formulário o percentual de peso que ainda falta distribuir
  useEffect(() => {
    setFormData(atual => (atual.peso === '' || atual.peso === '0'
      ? { ...atual, peso: pesoDisponivel > 0 ? String(pesoDisponivel) : '' }
      : atual));
  }, [pesoDisponivel]);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleCriarAvaliacao = async (e) => {
    e.preventDefault();
    if (!turmaSelecionada) return notificar("Selecione uma turma antes de criar a avaliação.", 'alerta');
    if (!formData.titulo.trim()) return notificar("Informe o título da avaliação.", 'alerta');
    if (!formData.data) return notificar("Informe a data da avaliação.", 'alerta');

    const notaMaxima = parseFloat(formData.notaMaxima);
    const peso = parseFloat(formData.peso);
    if (!notaMaxima || notaMaxima <= 0) return notificar("A nota máxima deve ser maior que zero.", 'alerta');
    if (!peso || peso <= 0 || peso > 100) return notificar("O peso deve ser um percentual entre 0 e 100.", 'alerta');
    if (peso > pesoDisponivel + 0.01) {
      return notificar(`A soma dos pesos passaria de 100%. Ainda cabem ${formatarPeso(pesoDisponivel)}.`, 'alerta');
    }

    try {
      const res = await api.post('/api/avaliacoes', {
        titulo: formData.titulo.trim(),
        data: formData.data,
        notaMaxima,
        peso,
        turma: { id_turma: parseInt(turmaSelecionada) }
      });
      setFormData(estadoInicial);
      await carregarDadosDaTurma(turmaSelecionada);
      if (res.data?.id_avaliacao) router.push(`/views/notas/editar?id=${res.data.id_avaliacao}`);
    } catch (err) {
      notificar(mensagemErro(err, "Erro ao criar a avaliação."), 'erro');
    }
  };

  const handleExcluirAvaliacao = async (idAvaliacao) => {
    if (!(await confirmar("Atenção! Excluir esta avaliação também apaga as notas lançadas nela. Continuar?"))) return;
    try {
      await api.delete(`/api/avaliacoes/${idAvaliacao}`);
      carregarDadosDaTurma(turmaSelecionada);
    } catch (err) {
      notificar(mensagemErro(err, "Erro ao excluir a avaliação."), 'erro');
    }
  };

  // Resumo de cada avaliação: quantas notas lançadas e a média da turma nela
  const resumoPorAvaliacao = useMemo(() => {
    const mapa = {};
    notas.forEach(n => {
      const idAvaliacao = n.avaliacao?.id_avaliacao ?? n.id?.avaliacaoId;
      if (!idAvaliacao || n.valorObtido === null || n.valorObtido === undefined) return;
      if (!mapa[idAvaliacao]) mapa[idAvaliacao] = { lancadas: 0, soma: 0 };
      mapa[idAvaliacao].lancadas += 1;
      mapa[idAvaliacao].soma += n.valorObtido;
    });
    Object.keys(mapa).forEach(k => {
      mapa[k].media = mapa[k].lancadas > 0 ? mapa[k].soma / mapa[k].lancadas : null;
    });
    return mapa;
  }, [notas]);


  // Nota final média da turma: soma das notas calculadas (nota x peso%) de cada aluno
  const mediaGeralTurma = useMemo(() => {
    if (avaliacoes.length === 0) return null;
    const porAluno = {};
    notas.forEach(n => {
      const idAluno = n.aluno?.id_aluno ?? n.id?.alunoId;
      const idAvaliacao = n.avaliacao?.id_avaliacao ?? n.id?.avaliacaoId;
      if (!idAluno || !idAvaliacao || n.valorObtido === null || n.valorObtido === undefined) return;
      const avaliacao = avaliacoes.find(a => a.id_avaliacao === idAvaliacao);
      if (!avaliacao?.notaMaxima) return;
      const peso = avaliacao.peso || 0;
      porAluno[idAluno] = (porAluno[idAluno] || 0)
        + (n.valorObtido / avaliacao.notaMaxima) * 10 * (peso / 100);
    });
    const finais = Object.values(porAluno);
    if (finais.length === 0) return null;
    return finais.reduce((a, b) => a + b, 0) / finais.length;
  }, [notas, avaliacoes]);

  return (
    <div className="p-10 bg-gray-50 min-h-screen text-zinc-900 font-sans">
      <header className="mb-12 flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-5xl font-black uppercase tracking-tighter italic text-zinc-900">Notas & Avaliações</h1>
          <div className="h-2 w-24 bg-yellow-400 rounded-full mt-2"></div>
          <p className="text-zinc-500 font-bold mt-3">Cadastre as avaliações da turma e lance as notas dos alunos.</p>
        </div>
        <div className="flex flex-wrap gap-4">
          <button onClick={() => router.push('/views/boletim')} className="px-8 py-4 bg-sky-100 text-sky-800 border border-sky-200 rounded-2xl font-black text-sm uppercase tracking-[0.2em] hover:bg-sky-200 transition-all shadow-sm">
            📊 Ver Boletim
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

          {turma && (
            <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-6 space-y-2">
              <div className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Ficha da turma</div>
              <div className="font-black text-xl uppercase leading-tight">{turma.codigoTurma}</div>
              <div className="font-bold text-sm text-zinc-700 uppercase">{turma.curso?.nome || 'Sem curso'}</div>
              <div className="font-bold text-sm text-zinc-600">Prof.: {turma.professor?.nome || 'A definir'}</div>
              <div className="pt-2">
                <span className="bg-zinc-900 text-white px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest">
                  {totalAlunos} matriculado(s)
                </span>
              </div>
            </div>
          )}
        </div>

        {podeLancar ? (
          <form onSubmit={handleCriarAvaliacao} className="bg-white p-8 rounded-3xl border border-zinc-200 shadow-sm space-y-6 flex flex-col">
            <h2 className="font-black text-sm uppercase text-zinc-800 tracking-[0.2em] mb-4 border-b border-zinc-100 pb-2">02. Nova Avaliação</h2>

            <InputField label="Título" name="titulo" placeholder="Ex: Midterm Test, Final Exam, Trabalho Oral" onChange={handleChange} value={formData.titulo} disabled={!turmaSelecionada} />
            <InputField label="Data da Avaliação" name="data" type="date" onChange={handleChange} value={formData.data} disabled={!turmaSelecionada} />

            <div className="grid grid-cols-2 gap-6">
              <InputField label="Nota Máxima" name="notaMaxima" type="number" step="0.1" min="0.1" onChange={handleChange} value={formData.notaMaxima} disabled={!turmaSelecionada} />
              <InputField label="Peso (0-100)%" name="peso" type="number" step="0.1" min="0.1" max="100" onChange={handleChange} value={formData.peso} disabled={!turmaSelecionada} />
            </div>

            <div className={`rounded-2xl p-5 border font-bold text-sm leading-relaxed ${pesosFecham ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-amber-50 border-amber-200 text-amber-800'}`}>
              <span className="block font-black uppercase tracking-widest text-[10px] mb-1">
                Peso distribuído: {formatarPeso(somaPesos)} de 100%
              </span>
              {pesosFecham
                ? 'Os pesos da turma já fecham 100%.'
                : `Ainda faltam ${formatarPeso(pesoDisponivel)} para fechar os 100% da turma.`}
            </div>

            <p className="text-xs font-bold text-zinc-500 leading-relaxed">
              A nota calculada de cada avaliação é a nota do aluno multiplicada pelo peso.
              Ex.: 8,45 com peso 80% vale 6,76 na nota final.
            </p>

            <div className="flex flex-col gap-3 mt-auto">
              <button type="submit" disabled={!turmaSelecionada} className="bg-zinc-900 text-white p-5 rounded-2xl font-black uppercase text-sm tracking-widest hover:bg-yellow-400 hover:text-zinc-900 transition-all shadow-lg disabled:bg-zinc-300 disabled:cursor-not-allowed disabled:hover:text-white">
                Criar e Lançar Notas
              </button>
              <button type="button" onClick={() => setFormData(estadoInicial)} className="text-zinc-500 p-2 font-black uppercase text-xs hover:text-zinc-900 hover:underline">Limpar Campos</button>
            </div>
          </form>
        ) : (
          <div className="bg-white p-8 rounded-3xl border border-zinc-200 shadow-sm flex flex-col items-center justify-center text-center gap-3">
            <span className="text-5xl">👁️</span>
            <h2 className="font-black text-lg uppercase text-zinc-800 tracking-tighter">Modo Consulta</h2>
            <p className="text-zinc-500 font-bold text-sm">Seu perfil pode visualizar as notas, mas não criar avaliações ou lançar notas.</p>
          </div>
        )}

        <div className="bg-yellow-400 p-8 rounded-3xl shadow-xl flex flex-col justify-between">
          <div>
            <h2 className="font-black text-2xl uppercase mb-4 italic text-zinc-900">Desempenho da Turma</h2>
            <p className="font-black text-zinc-900 text-base leading-snug">
              A nota final é a soma das notas calculadas: cada avaliação entra com a nota do aluno
              multiplicada pelo seu peso em porcentagem.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 mt-8 text-zinc-900">
            <div className="bg-white/30 rounded-2xl p-4 text-center">
              <div className="text-3xl font-black">{avaliacoes.length}</div>
              <div className="text-[10px] font-black uppercase tracking-widest mt-1">Avaliações</div>
            </div>
            <div className="bg-white/30 rounded-2xl p-4 text-center">
              <div className="text-3xl font-black">{totalAlunos}</div>
              <div className="text-[10px] font-black uppercase tracking-widest mt-1">Alunos</div>
            </div>
            <div className="bg-white/30 rounded-2xl p-4 text-center">
              <div className="text-3xl font-black">{mediaGeralTurma !== null ? formatarNumero(mediaGeralTurma, 1) : '--'}</div>
              <div className="text-[10px] font-black uppercase tracking-widest mt-1">Nota final</div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white rounded-[2.5rem] shadow-md border border-zinc-200 overflow-hidden flex flex-col">
        <div className="p-8 border-b border-zinc-200 bg-zinc-100/30 flex justify-between items-center flex-wrap gap-4">
          <h2 className="font-black text-lg uppercase text-zinc-800 tracking-tighter">Avaliações da Turma</h2>
          {avaliacoes.length > 0 && (
            <span className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest border ${pesosFecham ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
              Soma dos pesos: {formatarPeso(somaPesos)}{pesosFecham ? '' : ` — faltam ${formatarPeso(pesoDisponivel)}`}
            </span>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[900px]">
            <thead>
              <tr className="bg-zinc-50 border-b border-zinc-200">
                <th className="p-6 font-black uppercase text-xs tracking-widest text-zinc-600">Avaliação</th>
                <th className="p-6 font-black uppercase text-xs tracking-widest text-zinc-800">Data</th>
                <th className="p-6 font-black uppercase text-xs tracking-widest text-zinc-800 text-center">Nota Máx.</th>
                <th className="p-6 font-black uppercase text-xs tracking-widest text-zinc-800 text-center">Peso (0-100)%</th>
                <th className="p-6 font-black uppercase text-xs tracking-widest text-zinc-800 text-center">Lançadas</th>
                <th className="p-6 font-black uppercase text-xs tracking-widest text-zinc-800 text-center">Média da Turma</th>
                <th className="p-6 font-black uppercase text-xs tracking-widest text-zinc-800 text-center">Gestão</th>
              </tr>
            </thead>
            <tbody>
              {!turmaSelecionada && (
                <tr><td colSpan="7" className="p-10 text-center text-zinc-500 uppercase font-black italic">Selecione uma turma para ver as avaliações.</td></tr>
              )}

              {turmaSelecionada && carregandoTurma && (
                <tr><td colSpan="7" className="p-10 text-center uppercase italic font-black text-zinc-500 animate-pulse">Carregando avaliações...</td></tr>
              )}

              {turmaSelecionada && !carregandoTurma && avaliacoes.map(a => {
                const resumo = resumoPorAvaliacao[a.id_avaliacao];
                const lancadas = resumo?.lancadas || 0;
                const completa = totalAlunos > 0 && lancadas >= totalAlunos;
                return (
                  <tr key={a.id_avaliacao} className="border-b border-zinc-100 hover:bg-yellow-50/50 transition-colors">
                    <td className="p-6 align-middle">
                      <span className="font-black text-zinc-900 uppercase text-lg leading-tight">{a.titulo}</span>
                    </td>
                    <td className="p-6 align-middle whitespace-nowrap">
                      <span className="bg-zinc-100 text-zinc-800 px-3 py-1.5 rounded-lg text-sm font-black border border-zinc-200 font-mono">
                        {formatarData(a.data)}
                      </span>
                    </td>
                    <td className="p-6 align-middle text-center font-mono font-bold text-lg text-zinc-900">
                      {a.notaMaxima ?? '---'}
                    </td>
                    <td className="p-6 align-middle text-center">
                      <span className="bg-zinc-900 text-white px-3 py-1.5 rounded-lg font-black text-sm font-mono">
                        {formatarPeso(a.peso ?? 0)}
                      </span>
                    </td>
                    <td className="p-6 align-middle text-center">
                      <span className={`px-3 py-1.5 rounded-lg font-black text-[10px] uppercase border tracking-widest ${completa ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : lancadas > 0 ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-zinc-100 text-zinc-500 border-zinc-200'}`}>
                        {lancadas} / {totalAlunos}
                      </span>
                    </td>
                    <td className="p-6 align-middle text-center">
                      {resumo?.media !== undefined && resumo?.media !== null ? (
                        <div className="flex flex-col items-center">
                          <span className="font-mono font-black text-lg text-zinc-900">{formatarNumero(resumo.media, 2)}</span>
                          <span className="font-mono text-[11px] font-bold text-zinc-500">
                            calc. {formatarNumero((resumo.media / (a.notaMaxima || 10)) * 10 * ((a.peso || 0) / 100), 2)}
                          </span>
                        </div>
                      ) : <span className="text-zinc-300 font-mono font-black">---</span>}
                    </td>
                    <td className="p-6 align-middle">
                      <div className="flex justify-center gap-3">
                        <button
                          onClick={() => router.push(`/views/notas/editar?id=${a.id_avaliacao}`)}
                          title={podeLancar ? "Lançar / editar notas" : "Visualizar notas"}
                          className="w-12 h-12 flex items-center justify-center bg-zinc-900 text-white hover:bg-yellow-400 hover:text-zinc-900 rounded-xl transition-all shadow-md text-xl"
                        >
                          {podeLancar ? '✎' : '👁'}
                        </button>
                        {podeExcluir && (
                          <button
                            onClick={() => handleExcluirAvaliacao(a.id_avaliacao)}
                            title="Excluir avaliação"
                            className="w-12 h-12 flex items-center justify-center bg-white text-zinc-900 border-2 border-zinc-200 hover:bg-red-600 hover:text-white rounded-xl transition-all shadow-md text-xl"
                          >
                            🗑
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {turmaSelecionada && !carregandoTurma && avaliacoes.length === 0 && (
                <tr><td colSpan="7" className="p-8 text-center text-zinc-500 uppercase font-black italic">Nenhuma avaliação cadastrada para esta turma.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="bg-zinc-50 p-6 border-t border-zinc-200 flex justify-between items-center text-xs font-black uppercase tracking-widest text-zinc-500 rounded-b-[2.5rem]">
          <span>Fly High Idiomas v1.0</span>
          <span>Total: {avaliacoes.length} Avaliações</span>
        </div>
      </section>
    </div>
  );
}
