"use client";
import { useState, useEffect, useContext, useMemo, useCallback } from 'react';
import { useFeedback } from '../../../components/feedback';
import { InputField, SelectField } from '../../../components/ui';
import api, { mensagemErro } from '../../../utils/api';
import { formatarNumero, formatarData } from '../../../utils/formato';
import {
  MODELOS_AVALIACAO, CATEGORIAS, ETAPAS, rotuloModelo, rotuloAvaliacao, pontosDisponiveis
} from '../../../utils/notas';
import { useRouter } from 'next/navigation';
import { AuthContext } from '../../../context/authContext';

/**
 * Atividades avaliativas da turma. Cada atividade vale pontos e a turma soma até
 * 400 ou 500 (modelo da turma); a nota final é a soma ÷ 4 ou ÷ 5.
 */

const OUTRA = '__outra__';
const formInicial = { categoria: CATEGORIAS[0], etapa: '1st', titulo: '', notaMaxima: '', data: '' };

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
  const [aplicandoModelo, setAplicandoModelo] = useState(false);
  const [erro, setErro] = useState(null);

  const [formData, setFormData] = useState(formInicial);

  const podeLancar = temPermissao('AVALIACOES_WRITE');
  const podeExcluir = temPermissao('AVALIACOES_DELETE');

  const carregarTurmas = useCallback(async () => {
    try {
      const res = await api.get('/api/turmas');
      setTurmas(Array.isArray(res.data) ? res.data : []);
      setErro(null);
    } catch (err) {
      setErro(mensagemErro(err, "Erro de conexão com o servidor Fly High."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { carregarTurmas(); }, [carregarTurmas]);

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
  const pontuacaoTotal = turma?.pontuacaoTotal || null;
  const somaPontos = Math.round(avaliacoes.reduce((soma, a) => soma + (Number(a.notaMaxima) || 0), 0) * 100) / 100;
  const disponivel = pontosDisponiveis(pontuacaoTotal, avaliacoes);
  const pontosFecham = pontuacaoTotal !== null && Math.abs(somaPontos - pontuacaoTotal) < 0.01;
  // Sem modelo definido, a soma das atividades faz o papel do total
  const divisor = (pontuacaoTotal || somaPontos) / 100;

  const carregarDadosDaTurma = useCallback(async (idTurma) => {
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
      setErro(mensagemErro(err, "Erro ao carregar as atividades desta turma."));
    } finally {
      setCarregandoTurma(false);
    }
  }, []);

  useEffect(() => { carregarDadosDaTurma(turmaSelecionada); }, [turmaSelecionada, carregarDadosDaTurma]);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleCriarAvaliacao = async (e) => {
    e.preventDefault();
    if (!turmaSelecionada) return notificar("Selecione uma turma antes de criar a atividade.", 'alerta');

    const livre = formData.categoria === OUTRA;
    if (livre && !formData.titulo.trim()) return notificar("Informe o nome da atividade.", 'alerta');

    const pontos = parseFloat(formData.notaMaxima);
    if (!pontos || pontos <= 0) return notificar("Informe quantos pontos a atividade vale.", 'alerta');
    if (disponivel !== null && pontos > disponivel + 0.01) {
      return notificar(`A soma passaria de ${pontuacaoTotal} pontos. Ainda cabem ${formatarNumero(Math.max(disponivel, 0), 0)}.`, 'alerta');
    }

    try {
      await api.post('/api/avaliacoes', {
        titulo: livre ? formData.titulo.trim() : null,
        categoria: livre ? null : formData.categoria,
        etapa: livre ? null : (formData.etapa || null),
        notaMaxima: pontos,
        data: formData.data || null,
        turma: { id_turma: parseInt(turmaSelecionada) }
      });
      notificar("Atividade criada.", 'sucesso');
      setFormData(formInicial);
      carregarDadosDaTurma(turmaSelecionada);
    } catch (err) {
      notificar(mensagemErro(err, "Erro ao criar a atividade."), 'erro');
    }
  };

  const aplicarModelo = async (pontos) => {
    const descricao = pontos === 400
      ? "Written Check (4 × 50), Project (4 × 10), Homework (4 × 10), Performance (4 × 20) e Attitude (4 × 10)."
      : "Written Check (4 × 50), Oral Check (Mid e Final × 50), Homework (4 × 10), Performance (4 × 30) e Attitude (4 × 10).";
    const ok = await confirmar(
      `Criar as atividades do Modelo ${pontos} nesta turma?\n\n${descricao}\n\nA nota final será a soma dos pontos ÷ ${pontos / 100}.`,
      { titulo: `Aplicar Modelo ${pontos}`, rotuloConfirmar: 'Criar atividades', perigoso: false }
    );
    if (!ok) return;

    setAplicandoModelo(true);
    try {
      await api.post(`/api/avaliacoes/turma/${turmaSelecionada}/modelo/${pontos}`);
      notificar(`Modelo ${pontos} aplicado.`, 'sucesso');
      await carregarTurmas();
      await carregarDadosDaTurma(turmaSelecionada);
    } catch (err) {
      notificar(mensagemErro(err, "Erro ao aplicar o modelo."), 'erro');
    } finally {
      setAplicandoModelo(false);
    }
  };

  const handleExcluirAvaliacao = async (a) => {
    if (!(await confirmar(`Excluir "${rotuloAvaliacao(a)}"? As notas lançadas nela também serão apagadas.`))) return;
    try {
      await api.delete(`/api/avaliacoes/${a.id_avaliacao}`);
      carregarDadosDaTurma(turmaSelecionada);
    } catch (err) {
      notificar(mensagemErro(err, "Erro ao excluir a atividade."), 'erro');
    }
  };

  // Resumo de cada atividade: quantas notas lançadas e a média de pontos da turma nela
  const resumoPorAvaliacao = useMemo(() => {
    const mapa = {};
    notas.forEach(n => {
      const idAvaliacao = n.avaliacao?.id_avaliacao ?? n.id?.avaliacaoId;
      if (!idAvaliacao || n.valorObtido === null || n.valorObtido === undefined) return;
      if (!mapa[idAvaliacao]) mapa[idAvaliacao] = { lancadas: 0, soma: 0 };
      mapa[idAvaliacao].lancadas += 1;
      mapa[idAvaliacao].soma += n.valorObtido;
    });
    Object.values(mapa).forEach(r => { r.media = r.lancadas > 0 ? r.soma / r.lancadas : null; });
    return mapa;
  }, [notas]);

  // Média da nota final da turma até agora: soma dos pontos de cada aluno ÷ divisor
  const mediaGeralTurma = useMemo(() => {
    if (avaliacoes.length === 0 || !divisor) return null;
    const porAluno = {};
    notas.forEach(n => {
      const idAluno = n.aluno?.id_aluno ?? n.id?.alunoId;
      if (!idAluno || n.valorObtido === null || n.valorObtido === undefined) return;
      porAluno[idAluno] = (porAluno[idAluno] || 0) + n.valorObtido;
    });
    const finais = Object.values(porAluno).map(p => p / divisor);
    if (finais.length === 0) return null;
    return finais.reduce((a, b) => a + b, 0) / finais.length;
  }, [notas, avaliacoes, divisor]);

  return (
    <div className="p-10 bg-gray-50 min-h-screen text-zinc-900 font-sans">
      <header className="mb-12 flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-5xl font-black uppercase tracking-tighter italic text-zinc-900">Notas & Avaliações</h1>
          <div className="h-2 w-24 bg-yellow-400 rounded-full mt-2"></div>
          <p className="text-zinc-500 font-bold mt-3">Cada atividade vale pontos; a nota final é a soma ÷ 4 (Modelo 400) ou ÷ 5 (Modelo 500).</p>
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
              <div className="pt-2 flex flex-wrap gap-2">
                <span className="bg-zinc-900 text-white px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest">
                  {totalAlunos} matriculado(s)
                </span>
                <span className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border ${
                  pontuacaoTotal ? 'bg-yellow-100 text-zinc-900 border-yellow-300' : 'bg-amber-50 text-amber-800 border-amber-200'
                }`}>
                  {rotuloModelo(pontuacaoTotal)}
                </span>
              </div>
            </div>
          )}
        </div>

        {podeLancar ? (
          <form onSubmit={handleCriarAvaliacao} className="bg-white p-8 rounded-3xl border border-zinc-200 shadow-sm space-y-6 flex flex-col">
            <h2 className="font-black text-sm uppercase text-zinc-800 tracking-[0.2em] mb-4 border-b border-zinc-100 pb-2">02. Atividades</h2>

            {turmaSelecionada && !carregandoTurma && avaliacoes.length === 0 && (
              <div className="bg-yellow-50 border-2 border-yellow-300 rounded-2xl p-5 space-y-4">
                <div>
                  <div className="font-black uppercase text-sm text-zinc-900">Começar por um modelo</div>
                  <p className="text-xs font-bold text-zinc-600 mt-1">Cria todas as atividades da planilha da escola de uma vez. Dá para ajustar depois.</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {MODELOS_AVALIACAO.map(m => (
                    <button
                      key={m.valor} type="button" disabled={aplicandoModelo}
                      onClick={() => aplicarModelo(m.valor)}
                      className="bg-zinc-900 text-white p-4 rounded-xl font-black uppercase text-xs tracking-widest hover:bg-yellow-400 hover:text-zinc-900 transition-all disabled:opacity-50"
                    >
                      Modelo {m.valor}
                      <span className="block text-[10px] opacity-70 mt-1 normal-case tracking-normal">soma ÷ {m.valor / 100}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <SelectField label="Atividade" name="categoria" onChange={handleChange} value={formData.categoria} disabled={!turmaSelecionada}>
              {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
              <option value={OUTRA}>Outra (nome livre)</option>
            </SelectField>

            {formData.categoria === OUTRA ? (
              <InputField label="Nome da atividade" name="titulo" placeholder="Ex: Trabalho extra" onChange={handleChange} value={formData.titulo} disabled={!turmaSelecionada} />
            ) : (
              <SelectField label="Etapa" name="etapa" onChange={handleChange} value={formData.etapa} disabled={!turmaSelecionada}>
                {ETAPAS.map(e => <option key={e} value={e}>{e}</option>)}
              </SelectField>
            )}

            <div className="grid grid-cols-2 gap-6">
              <InputField label="Vale (pontos)" name="notaMaxima" type="number" step="0.5" min="0.5" placeholder="Ex: 50" onChange={handleChange} value={formData.notaMaxima} disabled={!turmaSelecionada} />
              <InputField label="Data (opcional)" name="data" type="date" onChange={handleChange} value={formData.data} disabled={!turmaSelecionada} />
            </div>

            {turmaSelecionada && (
              <div className={`rounded-2xl p-5 border font-bold text-sm leading-relaxed ${
                pontosFecham ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-amber-50 border-amber-200 text-amber-800'
              }`}>
                <span className="block font-black uppercase tracking-widest text-[10px] mb-1">
                  Pontos distribuídos: {formatarNumero(somaPontos, 0)}{pontuacaoTotal ? ` de ${pontuacaoTotal}` : ''}
                </span>
                {!pontuacaoTotal
                  ? 'Defina o modelo da turma (400 ou 500) na tela de Turmas ou aplique um modelo acima.'
                  : pontosFecham
                    ? 'As atividades já fecham a pontuação da turma.'
                    : `Ainda faltam ${formatarNumero(Math.max(disponivel, 0), 0)} ponto(s) para fechar a turma.`}
              </div>
            )}

            <div className="flex flex-col gap-3 mt-auto">
              <button type="submit" disabled={!turmaSelecionada} className="bg-zinc-900 text-white p-5 rounded-2xl font-black uppercase text-sm tracking-widest hover:bg-yellow-400 hover:text-zinc-900 transition-all shadow-lg disabled:bg-zinc-300 disabled:cursor-not-allowed disabled:hover:text-white">
                Adicionar Atividade
              </button>
            </div>
          </form>
        ) : (
          <div className="bg-white p-8 rounded-3xl border border-zinc-200 shadow-sm flex flex-col items-center justify-center text-center gap-3">
            <span className="text-5xl">👁️</span>
            <h2 className="font-black text-lg uppercase text-zinc-800 tracking-tighter">Modo Consulta</h2>
            <p className="text-zinc-500 font-bold text-sm">Seu perfil pode visualizar as notas, mas não criar atividades ou lançar notas.</p>
          </div>
        )}

        <div className="bg-yellow-400 p-8 rounded-3xl shadow-xl flex flex-col justify-between gap-6">
          <div>
            <h2 className="font-black text-2xl uppercase mb-4 italic text-zinc-900">Desempenho da Turma</h2>
            <p className="font-black text-zinc-900 text-base leading-snug">
              A nota final é a soma dos pontos ÷ {pontuacaoTotal ? pontuacaoTotal / 100 : '4 ou 5'}. Aprova quem chega a 70.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 text-zinc-900">
            <div className="bg-white/30 rounded-2xl p-4 text-center">
              <div className="text-3xl font-black">{avaliacoes.length}</div>
              <div className="text-[10px] font-black uppercase tracking-widest mt-1">Atividades</div>
            </div>
            <div className="bg-white/30 rounded-2xl p-4 text-center">
              <div className="text-3xl font-black">{totalAlunos}</div>
              <div className="text-[10px] font-black uppercase tracking-widest mt-1">Alunos</div>
            </div>
            <div className="bg-white/30 rounded-2xl p-4 text-center">
              <div className="text-3xl font-black">{mediaGeralTurma !== null ? formatarNumero(mediaGeralTurma, 1) : '--'}</div>
              <div className="text-[10px] font-black uppercase tracking-widest mt-1">Média final</div>
            </div>
          </div>

          <button
            disabled={!turmaSelecionada || avaliacoes.length === 0}
            onClick={() => router.push(`/views/notas/planilha?turma=${turmaSelecionada}`)}
            className="bg-zinc-900 text-white p-5 rounded-2xl font-black uppercase text-sm tracking-widest hover:bg-white hover:text-zinc-900 transition-all shadow-lg disabled:opacity-40 disabled:cursor-not-allowed"
          >
            📝 {podeLancar ? 'Lançar notas na planilha' : 'Ver planilha de notas'}
          </button>
        </div>
      </section>

      <section className="bg-white rounded-[2.5rem] shadow-md border border-zinc-200 overflow-hidden flex flex-col">
        <div className="p-8 border-b border-zinc-200 bg-zinc-100/30 flex justify-between items-center flex-wrap gap-4">
          <h2 className="font-black text-lg uppercase text-zinc-800 tracking-tighter">Atividades da Turma</h2>
          {avaliacoes.length > 0 && (
            <span className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest border ${
              pontosFecham ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'
            }`}>
              {formatarNumero(somaPontos, 0)}{pontuacaoTotal ? ` de ${pontuacaoTotal}` : ''} pontos
            </span>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[900px]">
            <thead>
              <tr className="bg-zinc-50 border-b border-zinc-200">
                <th className="p-6 font-black uppercase text-xs tracking-widest text-zinc-600">Atividade</th>
                <th className="p-6 font-black uppercase text-xs tracking-widest text-zinc-800">Data</th>
                <th className="p-6 font-black uppercase text-xs tracking-widest text-zinc-800 text-center">Vale</th>
                <th className="p-6 font-black uppercase text-xs tracking-widest text-zinc-800 text-center">Lançadas</th>
                <th className="p-6 font-black uppercase text-xs tracking-widest text-zinc-800 text-center">Média da Turma</th>
                <th className="p-6 font-black uppercase text-xs tracking-widest text-zinc-800 text-center">Gestão</th>
              </tr>
            </thead>
            <tbody>
              {!turmaSelecionada && (
                <tr><td colSpan="6" className="p-10 text-center text-zinc-500 uppercase font-black italic">Selecione uma turma para ver as atividades.</td></tr>
              )}

              {turmaSelecionada && carregandoTurma && (
                <tr><td colSpan="6" className="p-10 text-center uppercase italic font-black text-zinc-500 animate-pulse">Carregando atividades...</td></tr>
              )}

              {turmaSelecionada && !carregandoTurma && avaliacoes.map(a => {
                const resumo = resumoPorAvaliacao[a.id_avaliacao];
                const lancadas = resumo?.lancadas || 0;
                const completa = totalAlunos > 0 && lancadas >= totalAlunos;
                return (
                  <tr key={a.id_avaliacao} className="border-b border-zinc-100 hover:bg-yellow-50/50 transition-colors">
                    <td className="p-6 align-middle">
                      {a.categoria && <div className="text-[10px] font-black uppercase tracking-widest text-zinc-500">{a.categoria}</div>}
                      <span className="font-black text-zinc-900 uppercase text-lg leading-tight">{a.etapa || a.titulo}</span>
                    </td>
                    <td className="p-6 align-middle whitespace-nowrap font-mono text-sm font-bold text-zinc-700">
                      {a.data ? formatarData(a.data) : <span className="text-zinc-300">—</span>}
                    </td>
                    <td className="p-6 align-middle text-center">
                      <span className="bg-zinc-900 text-white px-3 py-1.5 rounded-lg font-black text-sm font-mono">
                        {formatarNumero(a.notaMaxima, 0)} pts
                      </span>
                    </td>
                    <td className="p-6 align-middle text-center">
                      <span className={`px-3 py-1.5 rounded-lg font-black text-[10px] uppercase border tracking-widest ${completa ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : lancadas > 0 ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-zinc-100 text-zinc-500 border-zinc-200'}`}>
                        {lancadas} / {totalAlunos}
                      </span>
                    </td>
                    <td className="p-6 align-middle text-center font-mono font-black text-lg text-zinc-900">
                      {resumo?.media !== undefined && resumo?.media !== null
                        ? <>{formatarNumero(resumo.media, 1)} <span className="text-xs text-zinc-400">/ {formatarNumero(a.notaMaxima, 0)}</span></>
                        : <span className="text-zinc-300">---</span>}
                    </td>
                    <td className="p-6 align-middle">
                      <div className="flex justify-center gap-3">
                        <button
                          onClick={() => router.push(`/views/notas/editar?id=${a.id_avaliacao}`)}
                          title={podeLancar ? "Editar a atividade e lançar as notas dela" : "Visualizar notas"}
                          className="w-12 h-12 flex items-center justify-center bg-zinc-900 text-white hover:bg-yellow-400 hover:text-zinc-900 rounded-xl transition-all shadow-md text-xl"
                        >
                          {podeLancar ? '✎' : '👁'}
                        </button>
                        {podeExcluir && (
                          <button
                            onClick={() => handleExcluirAvaliacao(a)}
                            title="Excluir atividade"
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
                <tr><td colSpan="6" className="p-8 text-center text-zinc-500 uppercase font-black italic">Nenhuma atividade cadastrada para esta turma.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="bg-zinc-50 p-6 border-t border-zinc-200 flex justify-between items-center text-xs font-black uppercase tracking-widest text-zinc-500 rounded-b-[2.5rem]">
          <span>Fly High Idiomas v1.0</span>
          <span>Total: {avaliacoes.length} atividade(s)</span>
        </div>
      </section>
    </div>
  );
}
