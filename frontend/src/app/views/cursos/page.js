"use client";
import { useState, useEffect, useContext } from 'react';
import api from '../../../utils/api';
import { useRouter } from 'next/navigation'; 
import { AuthContext } from '../../../context/authContext'; 

const InputField = ({ label, name, placeholder, type = "text", onChange, value, className = "" }) => (
  <div className={className}>
    <label className="block text-xs font-black text-zinc-700 uppercase tracking-widest mb-2">{label}</label>
    <input type={type} name={name} value={value || ''} onChange={onChange} placeholder={placeholder} className="w-full p-4 border border-zinc-300 rounded-xl text-lg font-bold text-zinc-900 focus:ring-4 focus:ring-yellow-400/20 outline-none transition-all bg-white shadow-sm" />
  </div>
);

const SelectField = ({ label, name, children, onChange, value, className = "" }) => (
  <div className={className}>
    <label className="block text-xs font-black text-zinc-700 uppercase tracking-widest mb-2">{label}</label>
    <select name={name} value={value || ''} onChange={onChange} className="w-full p-4 border border-zinc-300 rounded-xl text-lg font-bold text-zinc-900 focus:ring-4 focus:ring-yellow-400/20 outline-none appearance-none bg-white cursor-pointer shadow-sm">{children}</select>
  </div>
);

export default function CursosPage() {
  const router = useRouter();
  const { user } = useContext(AuthContext); 

  const [cursos, setCursos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const estadoInicial = { nome: '', tipo: '', cargaHorariaTotal: '', valorBase: '', faixaEtaria: '', ativo: 'true' };
  const [formData, setFormData] = useState(estadoInicial);

  const temPermissao = (permissaoNecessaria) => {
    if (!user || !user.permissoes) return false;
    return user.permissoes.includes('ROLE_DIRETOR') || user.permissoes.includes(permissaoNecessaria);
  };

  const carregarCursos = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/cursos');
      setCursos(res.data);
      setError(null);
    } catch (err) {
      setError("Erro de conexão com o servidor FlyHigh.");
      console.error(err);
    } finally { setLoading(false); }
  };

  useEffect(() => { carregarCursos(); }, []);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      nome: formData.nome, tipo: formData.tipo, 
      cargaHorariaTotal: parseInt(formData.cargaHorariaTotal),
      valorBase: parseFloat(formData.valorBase), faixaEtaria: formData.faixaEtaria, 
      ativo: formData.ativo === 'true'
    };

    try {
      await api.post('/api/cursos', payload);
      alert("Curso salvo com sucesso!");
      carregarCursos(); setFormData(estadoInicial);
    } catch (err) { alert("Erro ao salvar curso. Verifique os dados."); console.error(err); }
  };

  const handleExcluir = async (id) => {
    if (window.confirm("Atenção! Deseja excluir este curso permanentemente?")) {
      try {
        await api.delete(`/api/cursos/${id}`);
        alert("Curso removido."); carregarCursos(); 
      } catch (err) { alert("Erro ao excluir. Verifique a conexão."); }
    }
  };

  const handleEditar = (id) => router.push(`/views/cursos/editar?id=${id}`);

  const cursosFiltrados = cursos.filter(curso =>
    curso.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    curso.tipo?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-10 bg-gray-50 min-h-screen text-zinc-900 font-sans">
      <header className="mb-12 flex items-center justify-between">
        <div>
          <h1 className="text-5xl font-black uppercase tracking-tighter italic text-zinc-900">Gerenciar Cursos</h1>
          <div className="h-2 w-24 bg-yellow-400 rounded-full mt-2"></div>
        </div>
        <button onClick={() => router.push('/')} className="px-8 py-4 bg-zinc-900 text-white rounded-2xl font-black text-sm uppercase tracking-[0.2em] hover:bg-yellow-400 hover:text-zinc-900 transition-all shadow-xl">
          Voltar ao Início
        </button>
      </header>
      
      {temPermissao('CURSOS_WRITE') && (
        <form onSubmit={handleSubmit} className="grid grid-cols-1 xl:grid-cols-3 gap-8 mb-16">
          <div className="bg-white p-8 rounded-3xl border border-zinc-200 shadow-sm space-y-6">
            <h2 className="font-black text-sm uppercase text-zinc-800 tracking-[0.2em] mb-4 border-b border-zinc-100 pb-2">01. Perfil do Curso</h2>
            <InputField label="Nome do Nível" name="nome" placeholder="Ex: Advanced 1, Kids Starter" onChange={handleChange} value={formData.nome} />
            <div className="grid grid-cols-2 gap-4">
              <SelectField label="Tipo" name="tipo" onChange={handleChange} value={formData.tipo}>
                <option value="">Selecione...</option>
                <option value="Regular">Regular</option>
                <option value="Intensivo">Intensivo</option>
                <option value="Preparatório">Preparatório VIP</option>
              </SelectField>
              <InputField label="Faixa Etária" name="faixaEtaria" placeholder="Ex: 11 a 14 anos" onChange={handleChange} value={formData.faixaEtaria} />
            </div>
          </div>

          <div className="bg-white p-8 rounded-3xl border border-zinc-200 shadow-sm space-y-6">
            <h2 className="font-black text-sm uppercase text-zinc-800 tracking-[0.2em] mb-4 border-b border-zinc-100 pb-2">02. Técnico & Comercial</h2>
            <div className="grid grid-cols-2 gap-4">
              <InputField label="Carga Horária (Hrs)" name="cargaHorariaTotal" type="number" placeholder="Ex: 120" onChange={handleChange} value={formData.cargaHorariaTotal} />
              <InputField label="Valor Base (R$)" name="valorBase" type="number" step="0.01" placeholder="Ex: 1500.00" onChange={handleChange} value={formData.valorBase} />
            </div>
            <SelectField label="Status do Curso" name="ativo" onChange={handleChange} value={formData.ativo}>
              <option value="true">🟢 Ativo (Aberto para Matrículas)</option>
              <option value="false">🔴 Inativo (Turmas Fechadas)</option>
            </SelectField>
          </div>

          <div className="bg-yellow-400 p-10 rounded-3xl flex flex-col justify-between shadow-xl">
            <div>
              <h2 className="font-black text-2xl uppercase mb-4 italic text-zinc-900">New Flight Route?</h2>
              <p className="font-black text-zinc-900 text-lg leading-snug">
                Defina com clareza o nome e o tipo do nível. O valor base será utilizado como referência no momento da matrícula.
              </p>
            </div>
            <div className="flex flex-col gap-3 mt-10">
              <button type="submit" className="bg-zinc-900 text-white p-5 rounded-2xl font-black uppercase text-sm tracking-widest hover:bg-white hover:text-zinc-900 transition-all shadow-lg">Criar Nível</button>
              <button type="button" onClick={() => setFormData(estadoInicial)} className="text-zinc-900 p-2 font-black uppercase text-xs hover:underline">Limpar Campos</button>
            </div>
          </div>
        </form>
      )}
      
      <section className="bg-white rounded-[2.5rem] shadow-md border border-zinc-200 overflow-hidden flex flex-col">
        <div className="p-8 border-b border-zinc-200 flex justify-between items-center flex-wrap gap-4 bg-zinc-100/30">
          <h2 className="font-black text-lg uppercase text-zinc-800 tracking-tighter">Database: Níveis de Ensino</h2>
          <div className="relative w-full max-w-md">
            <input type="text" placeholder="Pesquisar por nome ou tipo..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full px-6 py-4 rounded-2xl border border-zinc-300 text-sm font-bold text-zinc-900 focus:outline-none focus:ring-4 focus:ring-yellow-400/20" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-zinc-50 border-b border-zinc-200">
                <th className="p-6 font-black uppercase text-xs tracking-widest text-zinc-600">ID Nível</th>
                <th className="p-6 font-black uppercase text-xs tracking-widest text-zinc-800">Nome / Tipo</th>
                <th className="p-6 font-black uppercase text-xs tracking-widest text-zinc-800">Público</th>
                <th className="p-6 font-black uppercase text-xs tracking-widest text-zinc-800">Carga Horária</th>
                <th className="p-6 font-black uppercase text-xs tracking-widest text-zinc-800">Valor Base</th>
                <th className="p-6 font-black uppercase text-xs tracking-widest text-zinc-800 text-center">Status</th>
                <th className="p-6 font-black uppercase text-xs tracking-widest text-zinc-800 text-center">Gestão</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan="7" className="p-10 text-center uppercase italic font-black text-zinc-500 animate-pulse">Connecting to FlyHigh Database...</td></tr>}
              
              {!loading && !error && cursosFiltrados.map(curso => (
                <tr key={curso.id_curso} className="border-b border-zinc-100 hover:bg-yellow-50/50 transition-colors">
                  <td className="p-6 align-middle">
                    <span className="font-mono font-black text-zinc-500 text-base">
                      #{String(curso.id_curso).padStart(3, '0')}
                    </span>
                  </td>
                  <td className="p-6 align-middle">
                    <div className="flex flex-col">
                      <span className="font-black text-zinc-900 uppercase text-xl leading-tight">{curso.nome}</span>
                      <span className="text-sm font-bold text-zinc-600 mt-1 uppercase">TIPO: {curso.tipo}</span>
                    </div>
                  </td>
                  <td className="p-6 align-middle font-bold text-zinc-800">
                    {curso.faixaEtaria || '---'}
                  </td>
                  <td className="p-6 align-middle">
                    <span className="bg-zinc-100 text-zinc-700 px-3 py-1.5 rounded-lg text-sm font-black border border-zinc-200">
                      {curso.cargaHorariaTotal ? `${curso.cargaHorariaTotal}H` : '---'}
                    </span>
                  </td>
                  <td className="p-6 align-middle font-mono font-bold text-lg text-zinc-900">
                    {curso.valorBase ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(curso.valorBase) : '---'}
                  </td>
                  <td className="p-6 align-middle text-center">
                    {curso.ativo ? (
                      <span className="bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-lg font-black text-[10px] uppercase border border-emerald-200 tracking-widest">Ativo</span>
                    ) : (
                      <span className="bg-red-50 text-red-700 px-3 py-1.5 rounded-lg font-black text-[10px] uppercase border border-red-200 tracking-widest">Inativo</span>
                    )}
                  </td>
                  <td className="p-6 align-middle">
                    <div className="flex justify-center gap-3">
                      {temPermissao('CURSOS_WRITE') && (
                        <button onClick={() => handleEditar(curso.id_curso)} className="w-12 h-12 flex items-center justify-center bg-zinc-900 text-white hover:bg-yellow-400 hover:text-zinc-900 rounded-xl transition-all shadow-md text-xl">✎</button>
                      )}
                      {temPermissao('CURSOS_DELETE') && (
                        <button onClick={() => handleExcluir(curso.id_curso)} className="w-12 h-12 flex items-center justify-center bg-white text-zinc-900 border-2 border-zinc-200 hover:bg-red-600 hover:text-white rounded-xl transition-all shadow-md text-xl">🗑</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}

              {!loading && !error && cursosFiltrados.length === 0 && (
                 <tr><td colSpan="7" className="p-8 text-center text-zinc-500 uppercase font-black italic">Nenhum nível encontrado.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        
        <div className="bg-zinc-50 p-6 border-t border-zinc-200 flex justify-between items-center text-xs font-black uppercase tracking-widest text-zinc-500 rounded-b-[2.5rem]">
          <span>FlyHigh Idiomas v1.0</span>
          <span>Total: {cursosFiltrados.length} Níveis</span>
        </div>
      </section>
    </div>
  );
}