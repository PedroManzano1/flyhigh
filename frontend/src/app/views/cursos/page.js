"use client";
import { useState, useEffect, useContext } from 'react';
import api from '../../../utils/api';
import { useRouter } from 'next/navigation'; 
import { AuthContext } from '../../../context/authContext'; 

const InputField = ({ label, name, placeholder, type = "text", onChange, value, className = "" }) => (
  <div className={className}>
    <label className="block text-xs font-black text-zinc-800 uppercase tracking-widest mb-1">{label}</label>
    <input
      type={type} name={name} value={value || ''} onChange={onChange} placeholder={placeholder}
      className="w-full p-3 border-2 border-zinc-900 rounded-none text-sm focus:ring-0 focus:border-yellow-400 bg-white shadow-[4px_4px_0px_0px_rgba(24,24,27,1)] transition-all focus:translate-x-[2px] focus:translate-y-[2px] focus:shadow-none outline-none"
    />
  </div>
);

const SelectField = ({ label, name, children, onChange, value }) => (
  <div>
    <label className="block text-xs font-black text-zinc-800 uppercase tracking-widest mb-1">{label}</label>
    <select
      name={name} value={value || ''} onChange={onChange}
      className="w-full p-3 border-2 border-zinc-900 rounded-none text-sm focus:ring-0 focus:border-yellow-400 bg-white shadow-[4px_4px_0px_0px_rgba(24,24,27,1)] transition-all outline-none appearance-none"
    >
      {children}
    </select>
  </div>
);

export default function CursosPage() {
  const router = useRouter();
  const { user } = useContext(AuthContext); // Importando o usuário logado

  const [cursos, setCursos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const estadoInicial = { nome: '', tipo: '', cargaHorariaTotal: '', valorBase: '', faixaEtaria: '', ativo: 'true' };
  const [formData, setFormData] = useState(estadoInicial);

  // Função Mágica de Validação de Permissões
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
    } catch (err) { 
      alert("Erro ao salvar curso. Verifique os dados."); console.error(err);
    }
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
    <div className="p-10 bg-gray-100 min-h-screen text-zinc-900 font-sans">
      <header className="mb-12 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black uppercase tracking-tighter italic">Gerenciar Cursos</h1>
          <div className="h-2 w-24 bg-yellow-400 mt-2"></div>
        </div>
        <button onClick={() => router.push('/')} className="flex items-center gap-2 px-6 py-3 bg-zinc-900 text-white font-bold uppercase text-xs tracking-widest hover:bg-yellow-400 hover:text-zinc-900 transition-all shadow-[4px_4px_0px_0px_rgba(250,204,21,1)] active:shadow-none active:translate-x-1 active:translate-y-1">
          <span>⌂</span> Voltar ao Início
        </button>
      </header>
      
      {/* Formulário protegido pela permissão CURSOS_WRITE */}
      {temPermissao('CURSOS_WRITE') && (
        <form onSubmit={handleSubmit} className="grid grid-cols-1 xl:grid-cols-3 gap-10 mb-16">
          <div className="bg-white p-8 border-4 border-zinc-900 shadow-[8px_8px_0px_0px_rgba(250,204,21,1)] space-y-6">
            <h2 className="font-black text-lg uppercase border-b-4 border-yellow-400 pb-2 mb-4">01. Perfil do Curso</h2>
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

          <div className="bg-white p-8 border-4 border-zinc-900 shadow-[8px_8px_0px_0px_rgba(24,24,27,1)] space-y-6">
            <h2 className="font-black text-lg uppercase border-b-4 border-yellow-400 pb-2 mb-4">02. Técnico & Comercial</h2>
            <div className="grid grid-cols-2 gap-4">
              <InputField label="Carga Horária (Hrs)" name="cargaHorariaTotal" type="number" placeholder="Ex: 120" onChange={handleChange} value={formData.cargaHorariaTotal} />
              <InputField label="Valor Base (R$)" name="valorBase" type="number" step="0.01" placeholder="Ex: 1500.00" onChange={handleChange} value={formData.valorBase} />
            </div>
            <SelectField label="Status do Curso" name="ativo" onChange={handleChange} value={formData.ativo}>
              <option value="true">🟢 Ativo (Aberto para Matrículas)</option>
              <option value="false">🔴 Inativo (Turmas Fechadas)</option>
            </SelectField>
          </div>

          <div className="bg-yellow-400 p-8 border-4 border-zinc-900 shadow-[8px_8px_0px_0px_rgba(24,24,27,1)] flex flex-col justify-between">
            <div>
              <h2 className="font-black text-2xl uppercase mb-4 italic">New Flight Route?</h2>
              <p className="font-bold text-zinc-900 text-sm leading-tight border-l-4 border-zinc-900 pl-4">
                Defina com clareza o nome e o tipo do nível. O valor base será utilizado como referência no momento da matrícula.
              </p>
            </div>
            <div className="flex flex-col gap-4 mt-10">
              <button type="submit" className="bg-zinc-900 text-white p-4 font-black uppercase tracking-[0.2em] hover:bg-white hover:text-zinc-900 transition-all border-2 border-zinc-900">
                Criar Nível
              </button>
              <button type="button" onClick={() => setFormData(estadoInicial)} className="bg-transparent text-zinc-900 p-4 font-bold uppercase text-xs border-2 border-dashed border-zinc-900 hover:bg-white transition-all">
                Limpar Campos
              </button>
            </div>
          </div>
        </form>
      )}
      
      <section className="bg-white border-4 border-zinc-900 shadow-[12px_12px_0px_0px_rgba(24,24,27,1)] overflow-hidden">
        <div className="bg-zinc-900 p-6 flex justify-between items-center flex-wrap gap-4">
          <h2 className="font-black text-xl text-white uppercase tracking-tighter italic underline decoration-yellow-400 underline-offset-8">
            Database: Níveis de Ensino
          </h2>
          <div className="relative w-full max-w-md">
            <input type="text" placeholder="PESQUISAR NOME OU TIPO..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-4 py-2 bg-white border-2 border-yellow-400 rounded-none text-xs font-bold uppercase focus:outline-none" />
          </div>
        </div>

        <div className="overflow-x-auto p-4">
          <table className="w-full text-left min-w-[1000px]">
            <thead>
              <tr className="border-b-4 border-zinc-900 bg-gray-50">
                <th className="p-4 font-black uppercase text-xs tracking-widest text-zinc-700">ID Nível</th>
                <th className="p-4 font-black uppercase text-xs tracking-widest text-zinc-900">Nome / Tipo</th>
                <th className="p-4 font-black uppercase text-xs tracking-widest text-zinc-900">Público</th>
                <th className="p-4 font-black uppercase text-xs tracking-widest text-zinc-900">Carga Horária</th>
                <th className="p-4 font-black uppercase text-xs tracking-widest text-zinc-900">Valor Base</th>
                <th className="p-4 font-black uppercase text-xs tracking-widest text-zinc-900 text-center">Status</th>
                <th className="p-4 font-black uppercase text-xs tracking-widest text-zinc-900 text-center">Gestão</th>
              </tr>
            </thead>
            <tbody className="font-bold text-base">
              {loading && <tr><td colSpan="7" className="p-10 text-center uppercase italic font-black text-zinc-600 animate-pulse">Connecting to FlyHigh Database...</td></tr>}
              
              {!loading && !error && cursosFiltrados.map(curso => (
                <tr key={curso.id_curso} className="border-b-2 border-zinc-100 hover:bg-yellow-50 transition-colors group">
                  <td className="p-4">
                    <span className="bg-zinc-900 text-white px-3 py-1.5 text-sm font-mono group-hover:bg-yellow-400 group-hover:text-zinc-900 transition-colors">
                      #{String(curso.id_curso).padStart(3, '0')}
                    </span>
                  </td>
                  <td className="p-4 whitespace-nowrap">
                    <div className="flex flex-col">
                      <span className="uppercase text-zinc-900 mb-1">{curso.nome}</span>
                      <span className="text-xs text-zinc-700 font-bold font-mono italic">TIPO: {curso.tipo}</span>
                    </div>
                  </td>
                  <td className="p-4 text-zinc-900">
                    {curso.faixaEtaria || '---'}
                  </td>
                  <td className="p-4">
                    <span className="border-2 border-zinc-900 px-3 py-1.5 text-xs uppercase font-black bg-white shadow-[2px_2px_0px_0px_rgba(24,24,27,1)]">
                      {curso.cargaHorariaTotal ? `${curso.cargaHorariaTotal}H` : '---'}
                    </span>
                  </td>
                  <td className="p-4 font-mono text-zinc-900">
                    {curso.valorBase ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(curso.valorBase) : '---'}
                  </td>
                  <td className="p-4 text-center">
                    {curso.ativo ? (
                      <span className="bg-emerald-100 text-emerald-700 px-3 py-1.5 font-black text-xs uppercase border border-emerald-300">Ativo</span>
                    ) : (
                      <span className="bg-red-100 text-red-700 px-3 py-1.5 font-black text-xs uppercase border border-red-300">Inativo</span>
                    )}
                  </td>
                  <td className="p-4">
                    <div className="flex justify-center gap-2">
                      {/* Botão de Edição protegido pela permissão CURSOS_WRITE */}
                      {temPermissao('CURSOS_WRITE') && (
                        <button onClick={() => handleEditar(curso.id_curso)} className="bg-zinc-900 text-white w-10 h-10 flex items-center justify-center hover:bg-yellow-400 hover:text-zinc-900 transition-all border-2 border-zinc-900">✎</button>
                      )}
                      
                      {/* Botão de Exclusão protegido pela permissão CURSOS_DELETE */}
                      {temPermissao('CURSOS_DELETE') && (
                        <button onClick={() => handleExcluir(curso.id_curso)} className="bg-white text-zinc-900 w-10 h-10 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all border-2 border-zinc-900 shadow-[2px_2px_0px_0px_rgba(24,24,27,1)] active:shadow-none">🗑</button>
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
        
        <div className="bg-gray-50 p-4 border-t-2 border-zinc-900 flex justify-between items-center text-xs font-black uppercase tracking-widest text-zinc-500">
          <span>FlyHigh Idiomas v1.0</span>
          <span>Total: {cursosFiltrados.length} Níveis</span>
        </div>
      </section>
    </div>
  );
}