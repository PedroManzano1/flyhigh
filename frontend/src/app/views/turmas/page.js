"use client";
import { useState, useEffect, useContext } from 'react';
import api from '../../../utils/api';
import { useRouter } from 'next/navigation'; 
import { AuthContext } from '../../../context/authContext'; 

const InputField = ({ label, name, placeholder, type = "text", onChange, value, className = "" }) => (
  <div className={className}>
    <label className="block text-xs font-black text-zinc-800 uppercase tracking-widest mb-1">{label}</label>
    <input type={type} name={name} value={value || ''} onChange={onChange} placeholder={placeholder} className="w-full p-3 border-2 border-zinc-900 rounded-none text-sm focus:ring-0 focus:border-yellow-400 bg-white shadow-[4px_4px_0px_0px_rgba(24,24,27,1)] transition-all focus:translate-x-[2px] focus:translate-y-[2px] focus:shadow-none outline-none" />
  </div>
);

const SelectField = ({ label, name, children, onChange, value, className = "" }) => (
  <div className={className}>
    <label className="block text-xs font-black text-zinc-800 uppercase tracking-widest mb-1">{label}</label>
    <select name={name} value={value || ''} onChange={onChange} className="w-full p-3 border-2 border-zinc-900 rounded-none text-sm focus:ring-0 focus:border-yellow-400 bg-white shadow-[4px_4px_0px_0px_rgba(24,24,27,1)] transition-all outline-none appearance-none">{children}</select>
  </div>
);

export default function TurmasPage() {
  const router = useRouter();
  const { user } = useContext(AuthContext);

  const [turmas, setTurmas] = useState([]);
  const [cursos, setCursos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const estadoInicial = { codigoTurma: '', id_curso: '', diasSemana: '', horarioInicio: '', horarioFim: '', limiteVagas: '', semestreAno: '', status: 'Aberta', idProfessor: '' };
  const [formData, setFormData] = useState(estadoInicial);

  const temPermissao = (permissaoNecessaria) => {
    if (!user || !user.permissoes) return false;
    return user.permissoes.includes('ROLE_DIRETOR') || user.permissoes.includes(permissaoNecessaria);
  };

  const carregarDados = async () => {
    setLoading(true);
    try {
      const [resTurmas, resCursos] = await Promise.all([
        api.get('/api/turmas'), api.get('/api/cursos')
      ]);
      setTurmas(resTurmas.data);
      setCursos(resCursos.data);
      setError(null);
    } catch (err) { setError("Erro de conexão."); } finally { setLoading(false); }
  };

  useEffect(() => { carregarDados(); }, []);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = { ...formData, limiteVagas: formData.limiteVagas ? parseInt(formData.limiteVagas) : 0, curso: formData.id_curso ? { id_curso: parseInt(formData.id_curso) } : null, idProfessor: formData.idProfessor ? parseInt(formData.idProfessor) : null };
    try {
      await api.post('/api/turmas', payload);
      alert("Turma salva com sucesso!");
      carregarDados(); setFormData(estadoInicial);
    } catch (err) { alert("Erro ao salvar turma."); }
  };

  const handleExcluir = async (id) => {
    if (window.confirm("Atenção! Deseja excluir esta turma?")) {
      try {
        await api.delete(`/api/turmas/${id}`);
        alert("Turma removida."); carregarDados(); 
      } catch (err) { alert("Erro ao excluir."); }
    }
  };

  const turmasFiltradas = turmas.filter(turma => turma.codigoTurma?.toLowerCase().includes(searchTerm.toLowerCase()) || turma.semestreAno?.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="p-10 bg-gray-100 min-h-screen text-zinc-900 font-sans">
      <header className="mb-12 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black uppercase tracking-tighter italic">Gerenciar Turmas</h1>
          <div className="h-2 w-24 bg-yellow-400 mt-2"></div>
        </div>
        <button onClick={() => router.push('/')} className="flex items-center gap-2 px-6 py-3 bg-zinc-900 text-white font-bold uppercase text-xs tracking-widest hover:bg-yellow-400 hover:text-zinc-900 transition-all shadow-[4px_4px_0px_0px_rgba(250,204,21,1)] active:shadow-none active:translate-x-1 active:translate-y-1">
          <span>⌂</span> Voltar ao Início
        </button>
      </header>
      
      {temPermissao('TURMAS_WRITE') && (
        <form onSubmit={handleSubmit} className="grid grid-cols-1 xl:grid-cols-3 gap-10 mb-16">
          <div className="bg-white p-8 border-4 border-zinc-900 shadow-[8px_8px_0px_0px_rgba(250,204,21,1)] space-y-6">
            <h2 className="font-black text-lg uppercase border-b-4 border-yellow-400 pb-2 mb-4">01. Identificação</h2>
            <InputField label="Código da Turma" name="codigoTurma" placeholder="Ex: ADV1-SEG" onChange={handleChange} value={formData.codigoTurma} />
            <SelectField label="Curso / Nível" name="id_curso" onChange={handleChange} value={formData.id_curso}>
              <option value="">Selecione o Curso...</option>
              {cursos.filter(c => c.ativo).map(c => <option key={c.id_curso} value={c.id_curso}>{c.nome} ({c.tipo})</option>)}
            </SelectField>
            <InputField label="Semestre/Ano" name="semestreAno" placeholder="Ex: 2026.1" onChange={handleChange} value={formData.semestreAno} />
          </div>

          <div className="bg-white p-8 border-4 border-zinc-900 shadow-[8px_8px_0px_0px_rgba(24,24,27,1)] space-y-6">
            <h2 className="font-black text-lg uppercase border-b-4 border-yellow-400 pb-2 mb-4">02. Escala & Vagas</h2>
            <InputField label="Dias da Semana" name="diasSemana" placeholder="Ex: Seg/Qua" onChange={handleChange} value={formData.diasSemana} />
            <div className="grid grid-cols-2 gap-4">
              <InputField label="Início" name="horarioInicio" type="time" onChange={handleChange} value={formData.horarioInicio} />
              <InputField label="Fim" name="horarioFim" type="time" onChange={handleChange} value={formData.horarioFim} />
            </div>
            <InputField label="Limite de Vagas" name="limiteVagas" type="number" placeholder="Ex: 15" onChange={handleChange} value={formData.limiteVagas} />
          </div>

          <div className="bg-zinc-200 p-8 border-4 border-zinc-900 shadow-[8px_8px_0px_0px_rgba(24,24,27,1)] flex flex-col justify-between">
            <div className="space-y-6">
              <h2 className="font-black text-lg uppercase border-b-4 border-zinc-900 pb-2 mb-4">03. Operação</h2>
              <SelectField label="Status da Turma" name="status" onChange={handleChange} value={formData.status}>
                <option value="Aberta">🟢 Aberta</option>
                <option value="Em Andamento">🟡 Em Andamento</option>
                <option value="Fechada">🔴 Fechada</option>
              </SelectField>
              <InputField label="ID Professor (Prov.)" name="idProfessor" type="number" placeholder="Ex: 1" onChange={handleChange} value={formData.idProfessor} />
            </div>
            <div className="flex flex-col gap-4 mt-10">
              <button type="submit" className="bg-yellow-400 text-zinc-900 p-4 font-black uppercase tracking-[0.2em] hover:bg-zinc-900 hover:text-white transition-all border-2 border-zinc-900">Abrir Turma</button>
              <button type="button" onClick={() => setFormData(estadoInicial)} className="bg-transparent text-zinc-900 p-4 font-bold uppercase text-xs border-2 border-dashed border-zinc-900 hover:bg-white transition-all">Limpar</button>
            </div>
          </div>
        </form>
      )}
      
      <section className="bg-white border-4 border-zinc-900 shadow-[12px_12px_0px_0px_rgba(24,24,27,1)] overflow-hidden">
        <div className="bg-zinc-900 p-6 flex justify-between items-center flex-wrap gap-4">
          <h2 className="font-black text-xl text-white uppercase tracking-tighter italic underline decoration-yellow-400 underline-offset-8">Database: Turmas</h2>
          <div className="relative w-full max-w-md">
            <input type="text" placeholder="PESQUISAR CÓDIGO OU SEMESTRE..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-4 py-2 bg-white border-2 border-yellow-400 rounded-none text-xs font-bold uppercase focus:outline-none" />
          </div>
        </div>

        <div className="overflow-x-auto p-4">
          <table className="w-full text-left min-w-[1000px]">
            <thead>
              <tr className="border-b-4 border-zinc-900 bg-gray-50">
                <th className="p-4 font-black uppercase text-xs tracking-widest text-zinc-700">Código</th>
                <th className="p-4 font-black uppercase text-xs tracking-widest text-zinc-900">Curso</th>
                <th className="p-4 font-black uppercase text-xs tracking-widest text-zinc-900">Dias / Horário</th>
                <th className="p-4 font-black uppercase text-xs tracking-widest text-zinc-900">Vagas</th>
                <th className="p-4 font-black uppercase text-xs tracking-widest text-zinc-900 text-center">Status</th>
                <th className="p-4 font-black uppercase text-xs tracking-widest text-zinc-900 text-center">Gestão</th>
              </tr>
            </thead>
            <tbody className="font-bold text-base">
              {!loading && !error && turmasFiltradas.map(turma => (
                <tr key={turma.id_turma} className="border-b-2 border-zinc-100 hover:bg-yellow-50 transition-colors group">
                  <td className="p-4 whitespace-nowrap"><span className="bg-zinc-900 text-white px-3 py-1.5 text-sm font-mono group-hover:bg-yellow-400 group-hover:text-zinc-900 transition-colors">{turma.codigoTurma}</span><div className="text-xs text-zinc-700 font-bold font-mono italic mt-2">SEM: {turma.semestreAno}</div></td>
                  <td className="p-4 text-zinc-900 uppercase">{turma.curso ? turma.curso.nome : 'Sem Curso'}</td>
                  <td className="p-4"><div className="uppercase text-zinc-900 mb-1">{turma.diasSemana}</div><div className="text-xs text-zinc-700 font-bold font-mono">{turma.horarioInicio} - {turma.horarioFim}</div></td>
                  <td className="p-4 font-mono text-zinc-900">{turma.limiteVagas} max</td>
                  <td className="p-4 text-center"><span className={`px-3 py-1.5 font-black text-xs uppercase border ${turma.status === 'Aberta' ? 'bg-emerald-100 text-emerald-700 border-emerald-300' : turma.status === 'Em Andamento' ? 'bg-blue-100 text-blue-700 border-blue-300' : 'bg-red-100 text-red-700 border-red-300'}`}>{turma.status}</span></td>
                  <td className="p-4">
                    <div className="flex justify-center gap-2">
                      {temPermissao('TURMAS_WRITE') && (
                        <button onClick={() => router.push(`/views/turmas/editar?id=${turma.id_turma}`)} className="bg-zinc-900 text-white w-10 h-10 flex items-center justify-center hover:bg-yellow-400 hover:text-zinc-900 transition-all border-2 border-zinc-900">✎</button>
                      )}
                      {temPermissao('TURMAS_DELETE') && (
                        <button onClick={() => handleExcluir(turma.id_turma)} className="bg-white text-zinc-900 w-10 h-10 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all border-2 border-zinc-900 shadow-[2px_2px_0px_0px_rgba(24,24,27,1)] active:shadow-none">🗑</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}