"use client";
import { useState, useEffect, useContext, useMemo } from 'react';
import { useFeedback } from '../../../components/feedback';
import { InputField, SelectField, TextareaField } from '../../../components/ui';
import api, { mensagemErro } from '../../../utils/api';
import { useRouter } from 'next/navigation';
import { AuthContext } from '../../../context/authContext';


// Data de hoje no fuso local (toISOString devolveria a data em UTC,
// o que adiantaria um dia no fim da noite no Brasil).
const hoje = () => {
  const d = new Date();
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const dia = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mes}-${dia}`;
};
const formatarData = (data) => data ? new Date(data).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : '---';

export default function FaltasPage() {
  const router = useRouter();
  const { notificar, confirmar } = useFeedback();
  const { user, temPermissao } = useContext(AuthContext);

  const [turmas, setTurmas] = useState([]);
  const [turmaSelecionada, setTurmaSelecionada] = useState('');
  const [somenteMinhasTurmas, setSomenteMinhasTurmas] = useState(false);

  const [aulas, setAulas] = useState([]);
  const [matriculas, setMatriculas] = useState([]);
  const [frequencias, setFrequencias] = useState([]);

  const [loading, setLoading] = useState(true);
  const [carregandoTurma, setCarregandoTurma] = useState(false);
  const [erro, setErro] = useState(null);
  const [busca, setBusca] = useState('');

  const estadoInicialAula = { dataAula: hoje(), conteudoLecionado: '' };
  const [formAula, setFormAula] = useState(estadoInicialAula);

  const podeLancar = temPermissao('FREQUENCIAS_WRITE');
  const podeExcluir = temPermissao('FREQUENCIAS_DELETE');

  // --- CARGA INICIAL: TURMAS -------------------------------------------------
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

  // Se o usuário logado é professor de alguma turma, o padrão é mostrar só as dele (Estória 9)
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

  // --- CARGA DA TURMA: AULAS + MATRÍCULAS + FREQUÊNCIAS ----------------------
  const carregarDadosDaTurma = async (idTurma) => {
    if (!idTurma) {
      setAulas([]); setMatriculas([]); setFrequencias([]);
      return;
    }
    setCarregandoTurma(true);
    try {
      const [resAulas, resMatriculas, resFrequencias] = await Promise.all([
        api.get(`/api/aulas/turma/${idTurma}`),
        api.get(`/api/contratos/turma/${idTurma}`),
        api.get(`/api/frequencias/turma/${idTurma}`)
      ]);
      setAulas(Array.isArray(resAulas.data) ? resAulas.data : []);
      setMatriculas(Array.isArray(resMatriculas.data) ? resMatriculas.data : []);
      setFrequencias(Array.isArray(resFrequencias.data) ? resFrequencias.data : []);
      setErro(null);
    } catch (err) {
      setErro(mensagemErro(err, "Erro ao carregar o diário desta turma."));
    } finally {
      setCarregandoTurma(false);
    }
  };

  useEffect(() => { carregarDadosDaTurma(turmaSelecionada); }, [turmaSelecionada]);

  // --- REGISTRO DE NOVA AULA -------------------------------------------------
  const handleAulaChange = (e) => setFormAula({ ...formAula, [e.target.name]: e.target.value });

  const handleCriarAula = async (e) => {
    e.preventDefault();
    if (!turmaSelecionada) return notificar("Selecione uma turma antes de registrar a aula.", 'alerta');
    if (!formAula.dataAula) return notificar("Informe a data da aula.", 'alerta');
    // Regra da Estória 12: não é permitido registrar frequência em data futura
    if (formAula.dataAula > hoje()) return notificar("Não é possível registrar uma aula em data futura.", 'alerta');
    if (!formAula.conteudoLecionado.trim()) return notificar("Descreva o conteúdo lecionado na aula.", 'alerta');

    try {
      const payload = {
        dataAula: formAula.dataAula,
        conteudoLecionado: formAula.conteudoLecionado.trim(),
        turma: { id_turma: parseInt(turmaSelecionada) }
      };
      const res = await api.post('/api/aulas', payload);
      setFormAula(estadoInicialAula);
      await carregarDadosDaTurma(turmaSelecionada);
      // Já leva o professor direto para a chamada da aula recém-criada
      if (res.data?.id_aula) router.push(`/views/faltas/editar?id=${res.data.id_aula}`);
    } catch (err) {
      notificar(mensagemErro(err, "Erro ao registrar a aula."), 'erro');
    }
  };

  const handleExcluirAula = async (idAula) => {
    if (!(await confirmar("Atenção! Excluir esta aula também apaga a chamada registrada nela. Continuar?"))) return;
    try {
      await api.delete(`/api/aulas/${idAula}`);
      carregarDadosDaTurma(turmaSelecionada);
    } catch (err) {
      notificar(mensagemErro(err, "Erro ao excluir a aula."), 'erro');
    }
  };

  // --- CÁLCULOS DO DIÁRIO ----------------------------------------------------
  // Chamada por aula: quantos registros, presentes e faltas
  const resumoPorAula = useMemo(() => {
    const mapa = {};
    frequencias.forEach(f => {
      const idAula = f.aula?.id_aula ?? f.id?.aulaId;
      if (!idAula) return;
      if (!mapa[idAula]) mapa[idAula] = { total: 0, presentes: 0, faltas: 0, justificadas: 0 };
      mapa[idAula].total += 1;
      if (f.statusPresenca === 'PRESENTE') mapa[idAula].presentes += 1;
      else if (f.statusPresenca === 'FALTA_JUSTIFICADA') mapa[idAula].justificadas += 1;
      else mapa[idAula].faltas += 1;
    });
    return mapa;
  }, [frequencias]);

  // Frequência acumulada por aluno + alerta de evasão (Estória 12)
  const resumoPorAluno = useMemo(() => {
    const alunos = matriculas
      .map(m => m.aluno)
      .filter(Boolean);

    // As frequências já chegam ordenadas por data da aula (mais antiga primeiro)
    const porAluno = {};
    frequencias.forEach(f => {
      const idAluno = f.aluno?.id_aluno ?? f.id?.alunoId;
      if (!idAluno) return;
      if (!porAluno[idAluno]) porAluno[idAluno] = [];
      porAluno[idAluno].push(f.statusPresenca);
    });

    return alunos.map(aluno => {
      const historico = porAluno[aluno.id_aluno] || [];
      const presencas = historico.filter(s => s === 'PRESENTE').length;
      const justificadas = historico.filter(s => s === 'FALTA_JUSTIFICADA').length;
      const faltas = historico.filter(s => s === 'FALTA').length;

      // Faltas consecutivas no fim do histórico (as mais recentes)
      let consecutivas = 0;
      for (let i = historico.length - 1; i >= 0; i--) {
        if (historico[i] === 'FALTA') consecutivas += 1;
        else break;
      }

      const totalRegistrado = historico.length;
      const percentual = totalRegistrado > 0
        ? Math.round(((presencas + justificadas) / totalRegistrado) * 100)
        : null;

      return { aluno, presencas, faltas, justificadas, totalRegistrado, percentual, consecutivas };
    });
  }, [matriculas, frequencias]);

  const alunosEmAlerta = resumoPorAluno.filter(r => r.consecutivas > 3);

  const resumoFiltrado = resumoPorAluno.filter(r =>
    r.aluno?.nome?.toLowerCase().includes(busca.toLowerCase()) ||
    r.aluno?.numeroMatricula?.includes(busca)
  );

  const totalAulas = aulas.length;
  const totalAlunos = matriculas.length;
  const mediaPresenca = useMemo(() => {
    const comRegistro = resumoPorAluno.filter(r => r.percentual !== null);
    if (comRegistro.length === 0) return null;
    return Math.round(comRegistro.reduce((soma, r) => soma + r.percentual, 0) / comRegistro.length);
  }, [resumoPorAluno]);

  return (
    <div className="p-10 bg-gray-50 min-h-screen text-zinc-900 font-sans">
      <header className="mb-12 flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-5xl font-black uppercase tracking-tighter italic text-zinc-900">Controle de Faltas</h1>
          <div className="h-2 w-24 bg-yellow-400 rounded-full mt-2"></div>
          <p className="text-zinc-500 font-bold mt-3">Diário de classe, chamada e acompanhamento de assiduidade.</p>
        </div>
        <button onClick={() => router.push('/')} className="px-8 py-4 bg-zinc-900 text-white rounded-2xl font-black text-sm uppercase tracking-[0.2em] hover:bg-yellow-400 hover:text-zinc-900 transition-all shadow-xl">
          Voltar ao Início
        </button>
      </header>

      {erro && (
        <div className="mb-8 bg-red-50 border border-red-200 text-red-700 rounded-3xl p-6 font-black uppercase tracking-widest text-sm">
          {erro}
        </div>
      )}

      {/* ------- BLOCO 01/02/03: TURMA, NOVA AULA E INDICADORES ------- */}
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
              <div className="font-bold text-sm text-zinc-600 font-mono">
                {turma.diasSemana || '---'} · {turma.horarioInicio || '--:--'} às {turma.horarioFim || '--:--'}
              </div>
              <div className="pt-2">
                <span className="bg-zinc-900 text-white px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest">
                  {totalAlunos} matriculado(s){turma.limiteVagas ? ` / ${turma.limiteVagas} vagas` : ''}
                </span>
              </div>
            </div>
          )}
        </div>

        {podeLancar ? (
          <form onSubmit={handleCriarAula} className="bg-white p-8 rounded-3xl border border-zinc-200 shadow-sm space-y-6">
            <h2 className="font-black text-sm uppercase text-zinc-800 tracking-[0.2em] mb-4 border-b border-zinc-100 pb-2">02. Registrar Aula</h2>
            <InputField label="Data da Aula" name="dataAula" type="date" max={hoje()} onChange={handleAulaChange} value={formAula.dataAula} disabled={!turmaSelecionada} />
            <TextareaField label="Conteúdo Lecionado" name="conteudoLecionado" placeholder="Ex: Unit 4 — Past Continuous, listening e speaking em duplas." onChange={handleAulaChange} value={formAula.conteudoLecionado} />
            <div className="flex flex-col gap-3">
              <button type="submit" disabled={!turmaSelecionada} className="bg-zinc-900 text-white p-5 rounded-2xl font-black uppercase text-sm tracking-widest hover:bg-yellow-400 hover:text-zinc-900 transition-all shadow-lg disabled:bg-zinc-300 disabled:cursor-not-allowed disabled:hover:text-white">
                Abrir Aula e Fazer Chamada
              </button>
              <button type="button" onClick={() => setFormAula(estadoInicialAula)} className="text-zinc-500 p-2 font-black uppercase text-xs hover:text-zinc-900 hover:underline">Limpar Campos</button>
            </div>
          </form>
        ) : (
          <div className="bg-white p-8 rounded-3xl border border-zinc-200 shadow-sm flex flex-col items-center justify-center text-center gap-3">
            <span className="text-5xl">👁️</span>
            <h2 className="font-black text-lg uppercase text-zinc-800 tracking-tighter">Modo Consulta</h2>
            <p className="text-zinc-500 font-bold text-sm">Seu perfil pode visualizar a frequência, mas não registrar aulas ou chamadas.</p>
          </div>
        )}

        <div className={`p-8 rounded-3xl shadow-xl flex flex-col justify-between ${alunosEmAlerta.length > 0 ? 'bg-red-500' : 'bg-yellow-400'}`}>
          <div>
            <h2 className={`font-black text-2xl uppercase mb-6 italic ${alunosEmAlerta.length > 0 ? 'text-white' : 'text-zinc-900'}`}>
              {alunosEmAlerta.length > 0 ? 'Alerta de Evasão' : 'Panorama da Turma'}
            </h2>

            {alunosEmAlerta.length > 0 ? (
              <div className="space-y-3">
                <p className="font-black text-white text-base leading-snug">
                  {alunosEmAlerta.length} aluno(s) com mais de 3 faltas consecutivas. A secretaria deve entrar em contato.
                </p>
                <ul className="space-y-2">
                  {alunosEmAlerta.slice(0, 4).map(r => (
                    <li key={r.aluno.id_aluno} className="bg-white/20 text-white rounded-xl px-4 py-2 font-black uppercase text-sm">
                      {r.aluno.nome} · {r.consecutivas} faltas seguidas
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className="font-black text-zinc-900 text-lg leading-snug">
                Registre a aula com o conteúdo lecionado e em seguida faça a chamada. Alunos com mais de 3 faltas seguidas aparecem aqui automaticamente.
              </p>
            )}
          </div>

          <div className={`grid grid-cols-3 gap-3 mt-8 ${alunosEmAlerta.length > 0 ? 'text-white' : 'text-zinc-900'}`}>
            <div className="bg-white/30 rounded-2xl p-4 text-center">
              <div className="text-3xl font-black">{totalAulas}</div>
              <div className="text-[10px] font-black uppercase tracking-widest mt-1">Aulas</div>
            </div>
            <div className="bg-white/30 rounded-2xl p-4 text-center">
              <div className="text-3xl font-black">{totalAlunos}</div>
              <div className="text-[10px] font-black uppercase tracking-widest mt-1">Alunos</div>
            </div>
            <div className="bg-white/30 rounded-2xl p-4 text-center">
              <div className="text-3xl font-black">{mediaPresenca !== null ? `${mediaPresenca}%` : '--'}</div>
              <div className="text-[10px] font-black uppercase tracking-widest mt-1">Presença</div>
            </div>
          </div>
        </div>
      </section>

      {/* ------- DIÁRIO DE CLASSE: AULAS DA TURMA ------- */}
      <section className="bg-white rounded-[2.5rem] shadow-md border border-zinc-200 overflow-hidden mb-12">
        <div className="p-8 border-b border-zinc-200 bg-zinc-100/30">
          <h2 className="font-black text-lg uppercase text-zinc-800 tracking-tighter">Diário de Classe: Aulas Registradas</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[900px]">
            <thead>
              <tr className="bg-zinc-50 border-b border-zinc-200">
                <th className="p-6 font-black uppercase text-xs tracking-widest text-zinc-600">Data</th>
                <th className="p-6 font-black uppercase text-xs tracking-widest text-zinc-800 w-1/2">Conteúdo Lecionado</th>
                <th className="p-6 font-black uppercase text-xs tracking-widest text-zinc-800 text-center">Chamada</th>
                <th className="p-6 font-black uppercase text-xs tracking-widest text-zinc-800 text-center">Presenças / Faltas</th>
                <th className="p-6 font-black uppercase text-xs tracking-widest text-zinc-800 text-center">Gestão</th>
              </tr>
            </thead>
            <tbody>
              {!turmaSelecionada && (
                <tr><td colSpan="5" className="p-10 text-center text-zinc-500 uppercase font-black italic">Selecione uma turma para abrir o diário.</td></tr>
              )}

              {turmaSelecionada && carregandoTurma && (
                <tr><td colSpan="5" className="p-10 text-center uppercase italic font-black text-zinc-500 animate-pulse">Carregando diário da turma...</td></tr>
              )}

              {turmaSelecionada && !carregandoTurma && aulas.map(aula => {
                const resumo = resumoPorAula[aula.id_aula];
                const chamadaFeita = !!resumo && resumo.total > 0;
                return (
                  <tr key={aula.id_aula} className="border-b border-zinc-100 hover:bg-yellow-50/50 transition-colors">
                    <td className="p-6 align-middle whitespace-nowrap">
                      <span className="bg-zinc-100 text-zinc-800 px-3 py-1.5 rounded-lg text-base font-black border border-zinc-200 font-mono">
                        {formatarData(aula.dataAula)}
                      </span>
                    </td>
                    <td className="p-6 align-middle font-bold text-zinc-800 leading-relaxed">
                      {aula.conteudoLecionado || <span className="italic text-zinc-400 font-normal">Sem conteúdo informado</span>}
                    </td>
                    <td className="p-6 align-middle text-center">
                      {chamadaFeita ? (
                        <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1.5 rounded-lg font-black text-[10px] uppercase tracking-widest">
                          Registrada ({resumo.total})
                        </span>
                      ) : (
                        <span className="bg-amber-50 text-amber-700 border border-amber-200 px-3 py-1.5 rounded-lg font-black text-[10px] uppercase tracking-widest">
                          Pendente
                        </span>
                      )}
                    </td>
                    <td className="p-6 align-middle text-center font-mono font-black text-lg">
                      {chamadaFeita ? (
                        <span>
                          <span className="text-emerald-600">{resumo.presentes}</span>
                          <span className="text-zinc-300"> / </span>
                          <span className="text-red-600">{resumo.faltas}</span>
                          {resumo.justificadas > 0 && <span className="text-amber-500 text-sm"> (+{resumo.justificadas} J)</span>}
                        </span>
                      ) : <span className="text-zinc-300">---</span>}
                    </td>
                    <td className="p-6 align-middle">
                      <div className="flex justify-center gap-3">
                        <button
                          onClick={() => router.push(`/views/faltas/editar?id=${aula.id_aula}`)}
                          title={podeLancar ? "Fazer / editar chamada" : "Visualizar chamada"}
                          className="w-12 h-12 flex items-center justify-center bg-zinc-900 text-white hover:bg-yellow-400 hover:text-zinc-900 rounded-xl transition-all shadow-md text-xl"
                        >
                          {podeLancar ? '✎' : '👁'}
                        </button>
                        {podeExcluir && (
                          <button
                            onClick={() => handleExcluirAula(aula.id_aula)}
                            title="Excluir aula"
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

              {turmaSelecionada && !carregandoTurma && aulas.length === 0 && (
                <tr><td colSpan="5" className="p-8 text-center text-zinc-500 uppercase font-black italic">Nenhuma aula registrada para esta turma.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* ------- FREQUÊNCIA ACUMULADA POR ALUNO ------- */}
      <section className="bg-white rounded-[2.5rem] shadow-md border border-zinc-200 overflow-hidden flex flex-col">
        <div className="p-8 border-b border-zinc-200 flex justify-between items-center flex-wrap gap-4 bg-zinc-100/30">
          <h2 className="font-black text-lg uppercase text-zinc-800 tracking-tighter">Assiduidade por Aluno</h2>
          <div className="relative w-full max-w-md">
            <input type="text" placeholder="Pesquisar aluno ou matrícula..." value={busca} onChange={e => setBusca(e.target.value)} className="w-full px-6 py-4 rounded-2xl border border-zinc-300 text-sm font-bold text-zinc-900 focus:outline-none focus:ring-4 focus:ring-yellow-400/20" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[900px]">
            <thead>
              <tr className="bg-zinc-50 border-b border-zinc-200">
                <th className="p-6 font-black uppercase text-xs tracking-widest text-zinc-600">Aluno</th>
                <th className="p-6 font-black uppercase text-xs tracking-widest text-zinc-800 text-center">Presenças</th>
                <th className="p-6 font-black uppercase text-xs tracking-widest text-zinc-800 text-center">Faltas</th>
                <th className="p-6 font-black uppercase text-xs tracking-widest text-zinc-800 text-center">Justificadas</th>
                <th className="p-6 font-black uppercase text-xs tracking-widest text-zinc-800 text-center">Frequência</th>
                <th className="p-6 font-black uppercase text-xs tracking-widest text-zinc-800 text-center">Situação</th>
              </tr>
            </thead>
            <tbody>
              {!turmaSelecionada && (
                <tr><td colSpan="6" className="p-10 text-center text-zinc-500 uppercase font-black italic">Selecione uma turma.</td></tr>
              )}

              {turmaSelecionada && !carregandoTurma && resumoFiltrado.map(r => (
                <tr key={r.aluno.id_aluno} className={`border-b border-zinc-100 transition-colors ${r.consecutivas > 3 ? 'bg-red-50/60 hover:bg-red-50' : 'hover:bg-yellow-50/50'}`}>
                  <td className="p-6 align-middle">
                    <div className="flex flex-col gap-1">
                      <span className="font-mono font-black text-zinc-500 text-sm">#{r.aluno.numeroMatricula}</span>
                      <span className="font-black text-zinc-900 uppercase text-lg leading-tight">{r.aluno.nome}</span>
                    </div>
                  </td>
                  <td className="p-6 align-middle text-center font-mono font-black text-xl text-emerald-600">{r.presencas}</td>
                  <td className="p-6 align-middle text-center font-mono font-black text-xl text-red-600">{r.faltas}</td>
                  <td className="p-6 align-middle text-center font-mono font-black text-xl text-amber-500">{r.justificadas}</td>
                  <td className="p-6 align-middle text-center">
                    {r.percentual === null ? (
                      <span className="text-zinc-300 font-mono font-black">---</span>
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <span className={`font-mono font-black text-xl ${r.percentual >= 75 ? 'text-zinc-900' : 'text-red-600'}`}>{r.percentual}%</span>
                        <div className="w-24 h-2 bg-zinc-200 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${r.percentual >= 75 ? 'bg-emerald-500' : 'bg-red-500'}`} style={{ width: `${r.percentual}%` }}></div>
                        </div>
                      </div>
                    )}
                  </td>
                  <td className="p-6 align-middle text-center">
                    {r.consecutivas > 3 ? (
                      <span className="bg-red-600 text-white px-3 py-1.5 rounded-lg font-black text-[10px] uppercase tracking-widest">
                        ⚠ Risco de evasão
                      </span>
                    ) : r.totalRegistrado === 0 ? (
                      <span className="bg-zinc-100 text-zinc-500 border border-zinc-200 px-3 py-1.5 rounded-lg font-black text-[10px] uppercase tracking-widest">Sem registros</span>
                    ) : (
                      <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1.5 rounded-lg font-black text-[10px] uppercase tracking-widest">Regular</span>
                    )}
                  </td>
                </tr>
              ))}

              {turmaSelecionada && !carregandoTurma && resumoFiltrado.length === 0 && (
                <tr>
                  <td colSpan="6" className="p-10 text-center">
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

        <div className="bg-zinc-50 p-6 border-t border-zinc-200 flex justify-between items-center text-xs font-black uppercase tracking-widest text-zinc-500 rounded-b-[2.5rem]">
          <span>FlyHigh Idiomas v1.0</span>
          <span>Total: {resumoFiltrado.length} Alunos</span>
        </div>
      </section>
    </div>
  );
}
