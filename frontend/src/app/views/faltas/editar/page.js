"use client";
import { Suspense, useState, useEffect, useContext, useMemo } from 'react';
import api, { mensagemErro } from '../../../../utils/api';
import { useRouter, useSearchParams } from 'next/navigation';
import { AuthContext } from '../../../../context/authContext';

const InputField = ({ label, name, placeholder, type = "text", onChange, value, className = "", max, disabled = false }) => (
  <div className={className}>
    <label className="block text-sm font-black text-zinc-700 uppercase tracking-wider mb-2">{label}</label>
    <input type={type} name={name} value={value || ''} onChange={onChange} placeholder={placeholder} max={max} disabled={disabled} className="w-full p-4 border border-zinc-300 rounded-xl text-lg font-bold text-zinc-900 focus:ring-4 focus:ring-yellow-400/30 focus:border-yellow-400 bg-white transition-all outline-none shadow-sm disabled:bg-zinc-100 disabled:text-zinc-400" />
  </div>
);

const STATUS = [
  { valor: 'PRESENTE', rotulo: 'Presente', curto: 'P', ativo: 'bg-emerald-500 text-white border-emerald-500', inativo: 'bg-white text-emerald-700 border-emerald-200 hover:bg-emerald-50' },
  { valor: 'FALTA', rotulo: 'Falta', curto: 'F', ativo: 'bg-red-600 text-white border-red-600', inativo: 'bg-white text-red-700 border-red-200 hover:bg-red-50' },
  { valor: 'FALTA_JUSTIFICADA', rotulo: 'Justificada', curto: 'J', ativo: 'bg-amber-400 text-zinc-900 border-amber-400', inativo: 'bg-white text-amber-700 border-amber-200 hover:bg-amber-50' }
];

// Data de hoje no fuso local
const hoje = () => {
  const d = new Date();
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const dia = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mes}-${dia}`;
};
const formatarData = (data) => data ? new Date(data).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : '---';

function ChamadaConteudo() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  const { temPermissao } = useContext(AuthContext);

  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [aula, setAula] = useState(null);
  const [matriculas, setMatriculas] = useState([]);
  // { [idAluno]: { statusPresenca, observacao } }
  const [chamada, setChamada] = useState({});
  const [formAula, setFormAula] = useState({ dataAula: '', conteudoLecionado: '' });

  const podeLancar = temPermissao('FREQUENCIAS_WRITE');

  useEffect(() => {
    if (!id) {
      router.push('/views/faltas');
      return;
    }

    const carregarDados = async () => {
      try {
        const resAula = await api.get(`/api/aulas/${id}`);
        const aulaCarregada = resAula.data;
        setAula(aulaCarregada);
        setFormAula({
          dataAula: aulaCarregada.dataAula || '',
          conteudoLecionado: aulaCarregada.conteudoLecionado || ''
        });

        const idTurma = aulaCarregada.turma?.id_turma;
        const [resMatriculas, resFrequencias] = await Promise.all([
          idTurma ? api.get(`/api/contratos/turma/${idTurma}`) : Promise.resolve({ data: [] }),
          api.get(`/api/frequencias/aula/${id}`)
        ]);

        const listaMatriculas = Array.isArray(resMatriculas.data) ? resMatriculas.data : [];
        setMatriculas(listaMatriculas);

        // Pré-carrega a chamada já registrada; quem ainda não tem registro entra como Presente
        const registradas = {};
        (Array.isArray(resFrequencias.data) ? resFrequencias.data : []).forEach(f => {
          const idAluno = f.aluno?.id_aluno ?? f.id?.alunoId;
          if (idAluno) registradas[idAluno] = { statusPresenca: f.statusPresenca, observacao: f.observacao || '' };
        });

        const inicial = {};
        listaMatriculas.forEach(m => {
          const idAluno = m.aluno?.id_aluno;
          if (!idAluno) return;
          inicial[idAluno] = registradas[idAluno] || { statusPresenca: 'PRESENTE', observacao: '' };
        });
        setChamada(inicial);
      } catch (err) {
        alert(mensagemErro(err, "Erro ao carregar os dados da aula."));
        router.push('/views/faltas');
      } finally {
        setLoading(false);
      }
    };

    carregarDados();
  }, [id, router]);

  const handleAulaChange = (e) => setFormAula({ ...formAula, [e.target.name]: e.target.value });

  const definirStatus = (idAluno, status) => {
    setChamada(prev => ({ ...prev, [idAluno]: { ...prev[idAluno], statusPresenca: status } }));
  };

  const definirObservacao = (idAluno, texto) => {
    setChamada(prev => ({ ...prev, [idAluno]: { ...prev[idAluno], observacao: texto } }));
  };

  const marcarTodos = (status) => {
    const novo = {};
    matriculas.forEach(m => {
      const idAluno = m.aluno?.id_aluno;
      if (!idAluno) return;
      novo[idAluno] = { ...chamada[idAluno], statusPresenca: status };
    });
    setChamada(novo);
  };

  const contadores = useMemo(() => {
    const valores = Object.values(chamada);
    return {
      presentes: valores.filter(v => v.statusPresenca === 'PRESENTE').length,
      faltas: valores.filter(v => v.statusPresenca === 'FALTA').length,
      justificadas: valores.filter(v => v.statusPresenca === 'FALTA_JUSTIFICADA').length
    };
  }, [chamada]);

  const salvarAula = async () => {
    if (!formAula.dataAula) { alert("Informe a data da aula."); return false; }
    if (formAula.dataAula > hoje()) { alert("Não é possível registrar uma aula em data futura."); return false; }

    await api.put(`/api/aulas/editar/${id}`, {
      dataAula: formAula.dataAula,
      conteudoLecionado: formAula.conteudoLecionado,
      turma: { id_turma: aula.turma?.id_turma }
    });
    return true;
  };

  const handleSalvarTudo = async (e) => {
    e.preventDefault();
    if (!podeLancar) return;
    if (matriculas.length === 0) {
      alert("Esta turma não possui alunos com matrícula ativa. Matricule os alunos antes de fazer a chamada.");
      return;
    }

    setSalvando(true);
    try {
      await salvarAula();

      const payload = matriculas
        .filter(m => m.aluno?.id_aluno)
        .map(m => ({
          aula: { id_aula: parseInt(id) },
          aluno: { id_aluno: m.aluno.id_aluno },
          statusPresenca: chamada[m.aluno.id_aluno]?.statusPresenca || 'PRESENTE',
          observacao: chamada[m.aluno.id_aluno]?.observacao || null
        }));

      await api.post('/api/frequencias/chamada', payload);
      alert("Chamada registrada com sucesso!");
      router.push('/views/faltas');
    } catch (err) {
      alert(mensagemErro(err, "Erro ao registrar a chamada."));
    } finally {
      setSalvando(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <span className="font-black uppercase tracking-widest animate-pulse text-zinc-800 text-xl">Carregando Lista de Chamada...</span>
    </div>
  );

  return (
    <div className="p-10 bg-gray-50 min-h-screen text-zinc-900 font-sans">
      <header className="mb-10 flex flex-col gap-4">
        <button onClick={() => router.push('/views/faltas')} className="flex items-center gap-2 text-zinc-600 hover:text-zinc-900 transition-colors font-black text-sm uppercase tracking-widest w-fit">
          <span className="text-xl">←</span> Voltar para o diário
        </button>
        <div>
          <h1 className="text-5xl font-black uppercase tracking-tighter italic text-zinc-900">Lista de Chamada</h1>
          <div className="h-2 w-24 bg-yellow-400 mt-2 rounded-full"></div>
          <p className="text-zinc-500 font-bold mt-3">
            {aula?.turma?.codigoTurma || 'Turma'} · {aula?.turma?.curso?.nome || 'Sem curso'} · Aula de {formatarData(aula?.dataAula)}
          </p>
        </div>
      </header>

      <form onSubmit={handleSalvarTudo} className="grid grid-cols-1 xl:grid-cols-3 gap-8 mb-12">

        {/* ------- 01. DADOS DA AULA ------- */}
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-zinc-200 space-y-8 h-fit">
          <h2 className="font-black text-lg uppercase text-yellow-600 tracking-widest border-b border-zinc-100 pb-4">01. Dados da Aula</h2>

          <InputField label="Data da Aula" name="dataAula" type="date" max={hoje()} onChange={handleAulaChange} value={formAula.dataAula} disabled={!podeLancar} />

          <div>
            <label className="block text-sm font-black text-zinc-700 uppercase tracking-wider mb-2">Conteúdo Lecionado</label>
            <textarea
              name="conteudoLecionado"
              value={formAula.conteudoLecionado || ''}
              onChange={handleAulaChange}
              disabled={!podeLancar}
              placeholder="Ex: Unit 4 — Past Continuous, listening e speaking em duplas."
              className="w-full p-4 h-40 resize-none border border-zinc-300 rounded-xl text-lg font-bold text-zinc-900 focus:ring-4 focus:ring-yellow-400/30 focus:border-yellow-400 bg-white transition-all outline-none shadow-sm disabled:bg-zinc-100 disabled:text-zinc-400"
            />
          </div>

          <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-6">
            <div className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-3">Resumo da chamada</div>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <div className="text-2xl font-black text-emerald-600">{contadores.presentes}</div>
                <div className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mt-1">Presentes</div>
              </div>
              <div>
                <div className="text-2xl font-black text-red-600">{contadores.faltas}</div>
                <div className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mt-1">Faltas</div>
              </div>
              <div>
                <div className="text-2xl font-black text-amber-500">{contadores.justificadas}</div>
                <div className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mt-1">Justif.</div>
              </div>
            </div>
          </div>
        </div>

        {/* ------- 02. CHAMADA ------- */}
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-zinc-200 space-y-6 xl:col-span-2 flex flex-col">
          <div className="flex justify-between items-center flex-wrap gap-4 border-b border-zinc-100 pb-4">
            <h2 className="font-black text-lg uppercase text-zinc-700 tracking-widest">02. Frequência dos Alunos</h2>
            {podeLancar && matriculas.length > 0 && (
              <div className="flex gap-2">
                <button type="button" onClick={() => marcarTodos('PRESENTE')} className="px-4 py-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 font-black uppercase text-[10px] tracking-widest hover:bg-emerald-100 transition-all">
                  Todos presentes
                </button>
                <button type="button" onClick={() => marcarTodos('FALTA')} className="px-4 py-2 rounded-xl bg-red-50 text-red-700 border border-red-200 font-black uppercase text-[10px] tracking-widest hover:bg-red-100 transition-all">
                  Todos ausentes
                </button>
              </div>
            )}
          </div>

          {matriculas.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
              <span className="text-6xl opacity-50">🗒️</span>
              <h3 className="font-black text-xl text-zinc-400 uppercase tracking-widest">Nenhum aluno matriculado</h3>
              <p className="text-zinc-500 font-bold max-w-md">
                A lista de chamada usa as matrículas ativas da turma. Matricule os alunos nesta turma para liberar o registro de frequência.
              </p>
              {temPermissao('CONTRATOS_READ') && (
                <button type="button" onClick={() => router.push('/views/matriculas')} className="px-6 py-3 bg-zinc-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-yellow-400 hover:text-zinc-900 transition-all shadow-md">
                  Ir para Matrículas
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto border border-zinc-200 rounded-2xl flex-grow">
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead className="bg-zinc-50 border-b border-zinc-200">
                  <tr>
                    <th className="p-4 font-black uppercase text-xs tracking-widest text-zinc-600">Aluno</th>
                    <th className="p-4 font-black uppercase text-xs tracking-widest text-center text-zinc-600">Presença</th>
                    <th className="p-4 font-black uppercase text-xs tracking-widest text-zinc-600 w-64">Observação</th>
                  </tr>
                </thead>
                <tbody>
                  {matriculas.map((m, index) => {
                    const aluno = m.aluno;
                    if (!aluno) return null;
                    const registro = chamada[aluno.id_aluno] || { statusPresenca: 'PRESENTE', observacao: '' };
                    return (
                      <tr key={aluno.id_aluno} className={`border-b border-zinc-100 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'} hover:bg-yellow-50/50 transition-colors`}>
                        <td className="p-4">
                          <div className="flex flex-col">
                            <span className="font-mono font-black text-zinc-500 text-xs">#{aluno.numeroMatricula}</span>
                            <span className="font-black text-zinc-900 uppercase text-base leading-tight">{aluno.nome}</span>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex justify-center gap-2">
                            {STATUS.map(s => {
                              const ativo = registro.statusPresenca === s.valor;
                              return (
                                <button
                                  key={s.valor}
                                  type="button"
                                  disabled={!podeLancar}
                                  onClick={() => definirStatus(aluno.id_aluno, s.valor)}
                                  title={s.rotulo}
                                  className={`w-12 h-12 rounded-xl border-2 font-black text-lg transition-all shadow-sm disabled:opacity-60 disabled:cursor-not-allowed ${ativo ? s.ativo : s.inativo}`}
                                >
                                  {s.curto}
                                </button>
                              );
                            })}
                          </div>
                        </td>
                        <td className="p-4">
                          <input
                            type="text"
                            value={registro.observacao || ''}
                            disabled={!podeLancar}
                            onChange={e => definirObservacao(aluno.id_aluno, e.target.value)}
                            placeholder="Ex: atestado médico"
                            className="w-full p-3 border border-zinc-300 rounded-xl text-sm font-bold text-zinc-900 focus:ring-4 focus:ring-yellow-400/20 outline-none bg-white disabled:bg-zinc-100"
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          <div className="flex items-center justify-between flex-wrap gap-4 mt-6">
            <div className="flex gap-3 text-[10px] font-black uppercase tracking-widest text-zinc-500">
              <span className="flex items-center gap-2"><span className="w-4 h-4 rounded bg-emerald-500 inline-block"></span> P = Presente</span>
              <span className="flex items-center gap-2"><span className="w-4 h-4 rounded bg-red-600 inline-block"></span> F = Falta</span>
              <span className="flex items-center gap-2"><span className="w-4 h-4 rounded bg-amber-400 inline-block"></span> J = Justificada</span>
            </div>

            <div className="flex flex-row justify-end gap-4">
              <button type="button" onClick={() => router.push('/views/faltas')} className="text-zinc-500 p-4 font-black uppercase text-sm hover:text-zinc-900 transition-all tracking-widest underline decoration-zinc-300 decoration-2">
                Cancelar
              </button>
              {podeLancar && (
                <button type="submit" disabled={salvando || matriculas.length === 0} className="bg-yellow-400 text-zinc-900 px-8 py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-zinc-900 hover:text-white transition-all shadow-md disabled:bg-zinc-200 disabled:text-zinc-400 disabled:cursor-not-allowed">
                  {salvando ? 'Gravando...' : 'Gravar Chamada'}
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
export default function ChamadaPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <span className="font-black uppercase tracking-widest animate-pulse text-zinc-800 text-xl">Carregando Lista de Chamada...</span>
      </div>
    }>
      <ChamadaConteudo />
    </Suspense>
  );
}
