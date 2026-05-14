"use client";
import { useState, useEffect, useContext } from 'react';
import api from '../../../utils/api';
import { useRouter } from 'next/navigation'; 
import { AuthContext } from '../../../context/authContext'; 

const InputField = ({ label, name, placeholder, type = "text", onChange, value, className = "" }) => (
  <div className={className}>
    <label className="block text-sm font-black text-zinc-700 uppercase tracking-widest mb-2">{label}</label>
    <input type={type} name={name} value={value || ''} onChange={onChange} placeholder={placeholder} className="w-full p-4 border border-zinc-300 rounded-xl text-lg font-bold text-zinc-900 focus:ring-4 focus:ring-yellow-400/20 outline-none transition-all bg-white shadow-sm" />
  </div>
);

const SelectField = ({ label, name, children, onChange, value, className = "" }) => (
  <div className={className}>
    <label className="block text-sm font-black text-zinc-700 uppercase tracking-widest mb-2">{label}</label>
    <select name={name} value={value || ''} onChange={onChange} className="w-full p-4 border border-zinc-300 rounded-xl text-lg font-bold text-zinc-900 focus:ring-4 focus:ring-yellow-400/20 outline-none appearance-none bg-white cursor-pointer shadow-sm">{children}</select>
  </div>
);

export default function TurmasPage() {
  const router = useRouter();
  const { user } = useContext(AuthContext);

  const [turmas, setTurmas] = useState([]);
  const [cursos, setCursos] = useState([]);
  const [usuarios, setUsuarios] = useState([]); 
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
      const [resTurmas, resCursos, resUsuarios] = await Promise.all([
        api.get('/api/turmas'), 
        api.get('/api/cursos'),
        api.get('/api/usuarios') 
      ]);
      setTurmas(resTurmas.data);
      setCursos(resCursos.data);
      setUsuarios(resUsuarios.data);
      setError(null);
    } catch (err) { setError("Erro de conexão."); } finally { setLoading(false); }
  };

  useEffect(() => { carregarDados(); }, []);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { id_curso, idProfessor, ...rest } = formData;
    const payload = { 
      ...rest, 
      limiteVagas: rest.limiteVagas ? parseInt(rest.limiteVagas) : 0, 
      curso: id_curso ? { id_curso: parseInt(id_curso) } : null, 
      professor: idProfessor ? { idUsuario: parseInt(idProfessor) } : null 
    };
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
    <div className="p-10 bg-gray-50 min-h-screen text-zinc-900 font-sans">
      <header className="mb-12 flex items-center justify-between">
        <div>
          <h1 className="text-5xl font-black uppercase tracking-tighter italic text-zinc-900">Gerenciar Turmas</h1>
          <div className="h-2 w-24 bg-yellow-400 rounded-full mt-2"></div>
        </div>
        <button onClick={() => router.push('/')} className="px-8 py-4 bg-zinc-900 text-white rounded-2xl font-black text-sm uppercase tracking-[0.2em] hover:bg-yellow-400 hover:text-zinc-900 transition-all shadow-xl">
          Voltar ao Início
        </button>
      </header>
      
      {temPermissao('TURMAS_WRITE') && (
        <form onSubmit={handleSubmit} className="grid grid-cols-1 xl:grid-cols-3 gap-8 mb-16">
          <div className="bg-white p-8 rounded-3xl border border-zinc-200 shadow-sm space-y-8">
            <h2 className="font-black text-sm uppercase text-zinc-800 tracking-[0.2em] mb-4 border-b border-zinc-100 pb-2">01. Identificação</h2>
            <InputField label="Código da Turma" name="codigoTurma" placeholder="Ex: ADV1-SEG" onChange={handleChange} value={formData.codigoTurma} />
            <SelectField label="Curso / Nível" name="id_curso" onChange={handleChange} value={formData.id_curso}>
              <option value="">Selecione o Curso...</option>
              {cursos.filter(c => c.ativo).map(c => <option key={c.id_curso} value={c.id_curso}>{c.nome} ({c.tipo})</option>)}
            </SelectField>
            <InputField label="Semestre/Ano" name="semestreAno" placeholder="Ex: 2026.1" onChange={handleChange} value={formData.semestreAno} />
          </div>

          <div className="bg-white p-8 rounded-3xl border border-zinc-200 shadow-sm space-y-8">
            <h2 className="font-black text-sm uppercase text-zinc-800 tracking-[0.2em] mb-4 border-b border-zinc-100 pb-2">02. Escala & Vagas</h2>
            <InputField label="Dias da Semana" name="diasSemana" placeholder="Ex: Seg/Qua" onChange={handleChange} value={formData.diasSemana} />
            <div className="grid grid-cols-2 gap-6">
              <InputField label="Início" name="horarioInicio" type="time" onChange={handleChange} value={formData.horarioInicio} />
              <InputField label="Fim" name="horarioFim" type="time" onChange={handleChange} value={formData.horarioFim} />
            </div>
            <InputField label="Limite de Vagas" name="limiteVagas" type="number" placeholder="Ex: 15" onChange={handleChange} value={formData.limiteVagas} />
          </div>

          <div className="flex flex-col gap-8">
            <div className="bg-white p-8 rounded-3xl border border-zinc-200 shadow-sm space-y-8">
              <h2 className="font-black text-sm uppercase text-zinc-800 tracking-[0.2em] mb-4 border-b border-zinc-100 pb-2">03. Operação</h2>
              <SelectField label="Status da Turma" name="status" onChange={handleChange} value={formData.status}>
                <option value="Aberta">🟢 Aberta</option>
                <option value="Em Andamento">🟡 Em Andamento</option>
                <option value="Fechada">🔴 Fechada</option>
              </SelectField>
              
              <SelectField label="Professor Responsável" name="idProfessor" onChange={handleChange} value={formData.idProfessor}>
                <option value="">Selecione o Professor...</option>
                {usuarios.map(u => (
                  <option key={u.idUsuario} value={u.idUsuario}>
                    {u.nome} (ID: {u.idUsuario})
                  </option>
                ))}
              </SelectField>
            </div>
            
            <div className="bg-yellow-400 p-8 rounded-3xl flex flex-col justify-between shadow-xl mt-auto">
              <div className="flex flex-col gap-3">
                <button type="submit" className="bg-zinc-900 text-white p-5 rounded-2xl font-black uppercase text-sm tracking-widest hover:bg-white hover:text-zinc-900 transition-all shadow-lg">Abrir Turma</button>
                <button type="button" onClick={() => setFormData(estadoInicial)} className="text-zinc-900 p-2 font-black uppercase text-xs hover:underline">Limpar Campos</button>
              </div>
            </div>
          </div>
        </form>
      )}
      
      <section className="bg-white rounded-[2.5rem] shadow-md border border-zinc-200 overflow-hidden">
        <div className="p-8 border-b border-zinc-200 flex justify-between items-center flex-wrap gap-4 bg-zinc-100/30">
          <h2 className="font-black text-lg uppercase text-zinc-800 tracking-tighter">Database: Turmas</h2>
          <div className="relative w-full max-w-md">
            <input type="text" placeholder="Pesquisar código ou semestre..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full px-6 py-4 rounded-2xl border border-zinc-300 text-sm font-bold text-zinc-900 focus:outline-none focus:ring-4 focus:ring-yellow-400/20" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[1000px]">
            <thead>
              <tr className="bg-zinc-50 border-b border-zinc-200">
                <th className="p-6 font-black uppercase text-xs tracking-widest text-zinc-600">Código / Semestre</th>
                <th className="p-6 font-black uppercase text-xs tracking-widest text-zinc-800">Curso</th>
                <th className="p-6 font-black uppercase text-xs tracking-widest text-zinc-800">Professor</th>
                <th className="p-6 font-black uppercase text-xs tracking-widest text-zinc-800">Dias / Horário</th>
                <th className="p-6 font-black uppercase text-xs tracking-widest text-zinc-800">Vagas</th>
                <th className="p-6 font-black uppercase text-xs tracking-widest text-zinc-800 text-center">Status</th>
                <th className="p-6 font-black uppercase text-xs tracking-widest text-zinc-800 text-center">Gestão</th>
              </tr>
            </thead>
            <tbody>
              {!loading && !error && turmasFiltradas.map(turma => (
                <tr key={turma.id_turma} className="border-b border-zinc-100 hover:bg-yellow-50/50 transition-colors">
                  <td className="p-6 align-middle whitespace-nowrap">
                    <span className="bg-zinc-100 text-zinc-800 px-3 py-1.5 rounded-lg text-base font-black border border-zinc-200 uppercase">{turma.codigoTurma}</span>
                    <div className="text-xs text-zinc-500 font-bold font-mono mt-2 uppercase tracking-widest">SEM: {turma.semestreAno}</div>
                  </td>
                  
                  <td className="p-6 align-middle">
                    <span className="font-black text-zinc-900 uppercase text-lg leading-tight">{turma.curso ? turma.curso.nome : 'Sem Curso'}</span>
                  </td>
                  
                  <td className="p-6 align-middle">
                    {turma.professor ? (
                      <span className="font-bold text-zinc-800 uppercase">{turma.professor.nome}</span>
                    ) : (
                      <span className="text-zinc-400 italic font-normal text-sm">A definir</span>
                    )}
                  </td>
                  
                  <td className="p-6 align-middle">
                    <div className="font-bold uppercase text-zinc-900 mb-1">{turma.diasSemana}</div>
                    <div className="text-sm text-zinc-600 font-bold font-mono">{turma.horarioInicio} - {turma.horarioFim}</div>
                  </td>
                  
                  <td className="p-6 align-middle font-mono font-bold text-lg text-zinc-900">
                    {turma.limiteVagas} max
                  </td>
                  
                  <td className="p-6 align-middle text-center">
                    <span className={`px-3 py-1.5 rounded-lg font-black text-[10px] uppercase border tracking-widest ${turma.status === 'Aberta' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : turma.status === 'Em Andamento' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                      {turma.status}
                    </span>
                  </td>
                  
                  <td className="p-6 align-middle">
                    <div className="flex justify-center gap-3">
                      {temPermissao('TURMAS_WRITE') && (
                        <button onClick={() => router.push(`/views/turmas/editar?id=${turma.id_turma}`)} className="w-12 h-12 flex items-center justify-center bg-zinc-900 text-white hover:bg-yellow-400 hover:text-zinc-900 rounded-xl transition-all shadow-md text-xl">✎</button>
                      )}
                      {temPermissao('TURMAS_DELETE') && (
                        <button onClick={() => handleExcluir(turma.id_turma)} className="w-12 h-12 flex items-center justify-center bg-white text-zinc-900 border-2 border-zinc-200 hover:bg-red-600 hover:text-white rounded-xl transition-all shadow-md text-xl">🗑</button>
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