"use client";
import { useState, useEffect, useContext, useMemo } from 'react';
import { useFeedback } from '../../../components/feedback';
import { SelectField } from '../../../components/ui';
import api, { mensagemErro } from '../../../utils/api';
import { useRouter } from 'next/navigation';
import { AuthContext } from '../../../context/authContext';

/**
 * TELA PROVISÓRIA DE MATRÍCULAS.
 *
 * Serve apenas para ligar Aluno <-> Turma (tabela CONTRATO) e assim liberar
 * o teste da chamada (Faltas) e do lançamento de notas.
 * A Estória 7 (contrato completo: responsável financeiro, desconto, convênio,
 * geração do PDF e parcelas) ainda será implementada e vai substituir esta tela.
 */


const STATUS_MATRICULA = ['Ativo', 'Trancado', 'Cancelado'];

const corDoStatus = (status) => {
  const s = (status || '').toUpperCase();
  if (s === 'ATIVO') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  if (s === 'TRANCADO') return 'bg-amber-50 text-amber-700 border-amber-200';
  return 'bg-red-50 text-red-700 border-red-200';
};

export default function MatriculasPage() {
  const router = useRouter();
  const { notificar, confirmar } = useFeedback();
  const { temPermissao } = useContext(AuthContext);

  const [turmas, setTurmas] = useState([]);
  const [alunos, setAlunos] = useState([]);
  const [matriculas, setMatriculas] = useState([]);

  const [turmaSelecionada, setTurmaSelecionada] = useState('');
  const [alunoSelecionado, setAlunoSelecionado] = useState('');

  const [loading, setLoading] = useState(true);
  const [carregandoTurma, setCarregandoTurma] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState(null);

  const podeMatricular = temPermissao('CONTRATOS_WRITE');
  const podeExcluir = temPermissao('CONTRATOS_DELETE');

  useEffect(() => {
    const carregar = async () => {
      setLoading(true);
      try {
        const [resTurmas, resAlunos] = await Promise.all([
          api.get('/api/turmas'),
          api.get('/api/alunos')
        ]);
        setTurmas(Array.isArray(resTurmas.data) ? resTurmas.data : []);
        setAlunos(Array.isArray(resAlunos.data) ? resAlunos.data : []);
        setErro(null);
      } catch (err) {
        setErro(mensagemErro(err, "Erro de conexão com o servidor FlyHigh."));
      } finally {
        setLoading(false);
      }
    };
    carregar();
  }, []);

  const carregarMatriculas = async (idTurma) => {
    if (!idTurma) { setMatriculas([]); return; }
    setCarregandoTurma(true);
    try {
      // somenteAtivos=false para enxergar também trancados/cancelados
      const res = await api.get(`/api/contratos/turma/${idTurma}?somenteAtivos=false`);
      setMatriculas(Array.isArray(res.data) ? res.data : []);
      setErro(null);
    } catch (err) {
      setErro(mensagemErro(err, "Erro ao carregar as matrículas desta turma."));
    } finally {
      setCarregandoTurma(false);
    }
  };

  useEffect(() => { carregarMatriculas(turmaSelecionada); }, [turmaSelecionada]);

  const turma = useMemo(
    () => turmas.find(t => String(t.id_turma) === String(turmaSelecionada)) || null,
    [turmas, turmaSelecionada]
  );

  const ativos = matriculas.filter(m => (m.status || '').toUpperCase() === 'ATIVO').length;

  // Alunos que ainda não estão nesta turma
  const alunosDisponiveis = useMemo(() => {
    const jaMatriculados = new Set(matriculas.map(m => m.aluno?.id_aluno));
    return alunos.filter(a => !jaMatriculados.has(a.id_aluno));
  }, [alunos, matriculas]);

  const handleMatricular = async (e) => {
    e.preventDefault();
    if (!turmaSelecionada) return notificar("Selecione a turma.", 'alerta');
    if (!alunoSelecionado) return notificar("Selecione o aluno.", 'alerta');

    setSalvando(true);
    try {
      await api.post('/api/contratos', {
        aluno: { id_aluno: parseInt(alunoSelecionado) },
        turma: { id_turma: parseInt(turmaSelecionada) },
        status: 'Ativo'
      });
      setAlunoSelecionado('');
      await carregarMatriculas(turmaSelecionada);
    } catch (err) {
      notificar(mensagemErro(err, "Erro ao matricular o aluno."), 'erro');
    } finally {
      setSalvando(false);
    }
  };

  const handleAlterarStatus = async (matricula, novoStatus) => {
    try {
      await api.put(`/api/contratos/editar/${matricula.idContrato}`, {
        numeroContrato: matricula.numeroContrato,
        aluno: { id_aluno: matricula.aluno?.id_aluno },
        turma: { id_turma: matricula.turma?.id_turma },
        dataEmissao: matricula.dataEmissao,
        status: novoStatus
      });
      carregarMatriculas(turmaSelecionada);
    } catch (err) {
      notificar(mensagemErro(err, "Erro ao alterar o status da matrícula."), 'erro');
    }
  };

  const handleExcluir = async (idContrato) => {
    if (!(await confirmar("Remover esta matrícula da turma?"))) return;
    try {
      await api.delete(`/api/contratos/${idContrato}`);
      carregarMatriculas(turmaSelecionada);
    } catch (err) {
      notificar(mensagemErro(err, "Erro ao remover a matrícula."), 'erro');
    }
  };

  return (
    <div className="p-10 bg-gray-50 min-h-screen text-zinc-900 font-sans">
      <header className="mb-12 flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-5xl font-black uppercase tracking-tighter italic text-zinc-900">Matrículas</h1>
          <div className="h-2 w-24 bg-yellow-400 rounded-full mt-2"></div>
          <p className="text-zinc-500 font-bold mt-3">Vincule alunos às turmas para liberar a chamada e o lançamento de notas.</p>
        </div>
        <button onClick={() => router.push('/')} className="px-8 py-4 bg-zinc-900 text-white rounded-2xl font-black text-sm uppercase tracking-[0.2em] hover:bg-yellow-400 hover:text-zinc-900 transition-all shadow-xl">
          Voltar ao Início
        </button>
      </header>

      <div className="mb-8 bg-amber-50 border border-amber-200 text-amber-800 rounded-3xl p-6 font-bold text-sm leading-relaxed">
        <span className="font-black uppercase tracking-widest text-xs block mb-1">⚠ Tela provisória</span>
        Cadastro simplificado de matrícula, criado para testar os módulos pedagógicos. O contrato completo
        (responsável financeiro, desconto, convênio, PDF e parcelas) será feito na Estória 7 e substituirá esta tela.
      </div>

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
            {turmas.map(t => (
              <option key={t.id_turma} value={t.id_turma}>
                {t.codigoTurma} — {t.curso ? t.curso.nome : 'Sem curso'} ({t.semestreAno || 's/ semestre'})
              </option>
            ))}
          </SelectField>

          {turma && (
            <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-6 space-y-2">
              <div className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Ficha da turma</div>
              <div className="font-black text-xl uppercase leading-tight">{turma.codigoTurma}</div>
              <div className="font-bold text-sm text-zinc-700 uppercase">{turma.curso?.nome || 'Sem curso'}</div>
              <div className="font-bold text-sm text-zinc-600">Prof.: {turma.professor?.nome || 'A definir'}</div>
              <div className="pt-2">
                <span className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border ${turma.limiteVagas && ativos >= turma.limiteVagas ? 'bg-red-50 text-red-700 border-red-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
                  {ativos} ativo(s){turma.limiteVagas ? ` / ${turma.limiteVagas} vagas` : ''}
                </span>
              </div>
            </div>
          )}
        </div>

        {podeMatricular ? (
          <form onSubmit={handleMatricular} className="bg-white p-8 rounded-3xl border border-zinc-200 shadow-sm space-y-6 flex flex-col">
            <h2 className="font-black text-sm uppercase text-zinc-800 tracking-[0.2em] mb-4 border-b border-zinc-100 pb-2">02. Matricular Aluno</h2>

            <SelectField label="Aluno" name="aluno" onChange={e => setAlunoSelecionado(e.target.value)} value={alunoSelecionado}>
              <option value="">{turmaSelecionada ? 'Selecione o aluno...' : 'Escolha a turma primeiro'}</option>
              {alunosDisponiveis.map(a => (
                <option key={a.id_aluno} value={a.id_aluno}>
                  #{a.numeroMatricula} — {a.nome}
                </option>
              ))}
            </SelectField>

            <p className="text-xs font-bold text-zinc-500 leading-relaxed">
              A matrícula é criada com status <strong>Ativo</strong>. Alunos já vinculados a esta turma não aparecem na lista.
            </p>

            <button type="submit" disabled={!turmaSelecionada || !alunoSelecionado || salvando} className="mt-auto bg-zinc-900 text-white p-5 rounded-2xl font-black uppercase text-sm tracking-widest hover:bg-yellow-400 hover:text-zinc-900 transition-all shadow-lg disabled:bg-zinc-300 disabled:cursor-not-allowed disabled:hover:text-white">
              {salvando ? 'Matriculando...' : 'Matricular na Turma'}
            </button>
          </form>
        ) : (
          <div className="bg-white p-8 rounded-3xl border border-zinc-200 shadow-sm flex flex-col items-center justify-center text-center gap-3">
            <span className="text-5xl">👁️</span>
            <h2 className="font-black text-lg uppercase text-zinc-800 tracking-tighter">Modo Consulta</h2>
            <p className="text-zinc-500 font-bold text-sm">Seu perfil pode ver as matrículas, mas não criar novas.</p>
          </div>
        )}

        <div className="bg-yellow-400 p-8 rounded-3xl shadow-xl flex flex-col justify-between">
          <div>
            <h2 className="font-black text-2xl uppercase mb-4 italic text-zinc-900">Como testar</h2>
            <ol className="font-black text-zinc-900 text-sm leading-relaxed space-y-2 list-decimal list-inside">
              <li>Cadastre alunos em <strong>Gestão de Alunos</strong>.</li>
              <li>Abra uma turma em <strong>Gestão de Turmas</strong>.</li>
              <li>Matricule os alunos aqui.</li>
              <li>Vá em <strong>Controle de Faltas</strong>, registre a aula e faça a chamada.</li>
            </ol>
          </div>
          <button
            type="button"
            onClick={() => router.push('/views/faltas')}
            className="mt-8 bg-zinc-900 text-white p-4 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-white hover:text-zinc-900 transition-all shadow-lg"
          >
            Ir para o Controle de Faltas →
          </button>
        </div>
      </section>

      <section className="bg-white rounded-[2.5rem] shadow-md border border-zinc-200 overflow-hidden flex flex-col">
        <div className="p-8 border-b border-zinc-200 bg-zinc-100/30">
          <h2 className="font-black text-lg uppercase text-zinc-800 tracking-tighter">Alunos Matriculados na Turma</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[800px]">
            <thead>
              <tr className="bg-zinc-50 border-b border-zinc-200">
                <th className="p-6 font-black uppercase text-xs tracking-widest text-zinc-600">Aluno</th>
                <th className="p-6 font-black uppercase text-xs tracking-widest text-zinc-800">Contrato</th>
                <th className="p-6 font-black uppercase text-xs tracking-widest text-zinc-800 text-center">Status</th>
                <th className="p-6 font-black uppercase text-xs tracking-widest text-zinc-800 text-center">Gestão</th>
              </tr>
            </thead>
            <tbody>
              {!turmaSelecionada && (
                <tr><td colSpan="4" className="p-10 text-center text-zinc-500 uppercase font-black italic">Selecione uma turma.</td></tr>
              )}

              {turmaSelecionada && carregandoTurma && (
                <tr><td colSpan="4" className="p-10 text-center uppercase italic font-black text-zinc-500 animate-pulse">Carregando matrículas...</td></tr>
              )}

              {turmaSelecionada && !carregandoTurma && matriculas.map(m => (
                <tr key={m.idContrato} className="border-b border-zinc-100 hover:bg-yellow-50/50 transition-colors">
                  <td className="p-6 align-middle">
                    <div className="flex flex-col gap-1">
                      <span className="font-mono font-black text-zinc-500 text-sm">#{m.aluno?.numeroMatricula}</span>
                      <span className="font-black text-zinc-900 uppercase text-lg leading-tight">{m.aluno?.nome || 'Aluno removido'}</span>
                    </div>
                  </td>
                  <td className="p-6 align-middle">
                    <span className="font-mono font-bold text-zinc-600 bg-zinc-100 px-3 py-1.5 rounded-lg border border-zinc-200 text-sm">
                      {m.numeroContrato || `#${m.idContrato}`}
                    </span>
                  </td>
                  <td className="p-6 align-middle text-center">
                    {podeMatricular ? (
                      <select
                        value={STATUS_MATRICULA.find(s => s.toUpperCase() === (m.status || '').toUpperCase()) || 'Ativo'}
                        onChange={e => handleAlterarStatus(m, e.target.value)}
                        className={`px-3 py-2 rounded-lg font-black text-[11px] uppercase border tracking-widest cursor-pointer outline-none ${corDoStatus(m.status)}`}
                      >
                        {STATUS_MATRICULA.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    ) : (
                      <span className={`px-3 py-1.5 rounded-lg font-black text-[10px] uppercase border tracking-widest ${corDoStatus(m.status)}`}>
                        {m.status}
                      </span>
                    )}
                  </td>
                  <td className="p-6 align-middle">
                    <div className="flex justify-center gap-3">
                      {podeExcluir && (
                        <button onClick={() => handleExcluir(m.idContrato)} title="Remover matrícula" className="w-12 h-12 flex items-center justify-center bg-white text-zinc-900 border-2 border-zinc-200 hover:bg-red-600 hover:text-white rounded-xl transition-all shadow-md text-xl">🗑</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}

              {turmaSelecionada && !carregandoTurma && matriculas.length === 0 && (
                <tr><td colSpan="4" className="p-8 text-center text-zinc-500 uppercase font-black italic">Nenhum aluno matriculado nesta turma.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="bg-zinc-50 p-6 border-t border-zinc-200 flex justify-between items-center text-xs font-black uppercase tracking-widest text-zinc-500 rounded-b-[2.5rem]">
          <span>FlyHigh Idiomas v1.0 · Matrícula provisória</span>
          <span>Total: {matriculas.length} ({ativos} ativos)</span>
        </div>
      </section>
    </div>
  );
}
