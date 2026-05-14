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

const MODULOS = ["USUARIOS", "ALUNOS", "RESPONSAVEIS", "CURSOS", "TURMAS", "VINCULOS", "PERFIS", "RECADOS"];

export default function PerfisPage() {
  const router = useRouter();
  const { user } = useContext(AuthContext);

  const [perfis, setPerfis] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({ nomePerfil: '', descricao: '' });
  
  const permissoesIniciais = MODULOS.reduce((acc, modulo) => {
    acc[modulo] = { podeLer: false, podeEscrever: false, podeExcluir: false }; return acc;
  }, {});
  
  const [permissoes, setPermissoes] = useState(permissoesIniciais);

  const temPermissao = (permissaoNecessaria) => {
    if (!user || !user.permissoes) return false;
    return user.permissoes.includes('ROLE_DIRETOR') || user.permissoes.includes(permissaoNecessaria);
  };

  const carregarPerfis = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/perfis');
      setPerfis(res.data); setError(null);
    } catch (err) { setError("Erro ao carregar."); } finally { setLoading(false); }
  };

  useEffect(() => { carregarPerfis(); }, []);

  const handleFormChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleCheckboxChange = (modulo, acao) => {
    setPermissoes(prev => ({ ...prev, [modulo]: { ...prev[modulo], [acao]: !prev[modulo][acao] } }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const listaPermissoes = MODULOS.map(modulo => ({ modulo: modulo, podeLer: permissoes[modulo].podeLer, podeEscrever: permissoes[modulo].podeEscrever, podeExcluir: permissoes[modulo].podeExcluir })).filter(p => p.podeLer || p.podeEscrever || p.podeExcluir);
    const payload = { nomePerfil: formData.nomePerfil.toUpperCase(), descricao: formData.descricao, permissoes: listaPermissoes };

    try {
      await api.post('/api/perfis', payload);
      alert("Perfil criado!"); carregarPerfis(); setFormData({ nomePerfil: '', descricao: '' }); setPermissoes(permissoesIniciais);
    } catch (err) { alert("Erro ao salvar."); }
  };

  const handleExcluir = async (id) => {
    if (window.confirm("Atenção! Deseja excluir este perfil?")) {
      try {
        await api.delete(`/api/perfis/${id}`); carregarPerfis(); 
      } catch (err) { alert("Erro ao excluir."); }
    }
  };

  return (
    <div className="p-10 bg-gray-50 min-h-screen text-zinc-900 font-sans">
      <header className="mb-12 flex items-center justify-between">
        <div>
          <h1 className="text-5xl font-black uppercase tracking-tighter italic text-zinc-900">Controle de Perfis</h1>
          <div className="h-2 w-24 bg-yellow-400 rounded-full mt-2"></div>
        </div>
        <button onClick={() => router.push('/')} className="px-8 py-4 bg-zinc-900 text-white rounded-2xl font-black text-sm uppercase tracking-[0.2em] hover:bg-yellow-400 hover:text-zinc-900 transition-all shadow-xl">
          Voltar ao Início
        </button>
      </header>
      
      {temPermissao('PERFIS_WRITE') && (
        <form onSubmit={handleSubmit} className="grid grid-cols-1 xl:grid-cols-3 gap-8 mb-16">
          <div className="bg-white p-8 rounded-3xl border border-zinc-200 shadow-sm space-y-6">
            <h2 className="font-black text-sm uppercase text-zinc-800 tracking-[0.2em] mb-4 border-b border-zinc-100 pb-2">01. Cargo / Perfil</h2>
            <InputField label="Nome do Perfil" name="nomePerfil" placeholder="Ex: SECRETARIA" onChange={handleFormChange} value={formData.nomePerfil} />
            <div>
              <label className="block text-sm font-black text-zinc-700 uppercase tracking-widest mb-2">Descrição</label>
              <textarea name="descricao" value={formData.descricao} onChange={handleFormChange} placeholder="Descreva as funções principais..." className="w-full p-4 h-32 resize-none border border-zinc-300 rounded-xl text-lg font-bold text-zinc-900 focus:ring-4 focus:ring-yellow-400/20 bg-white transition-all outline-none shadow-sm" />
            </div>
          </div>

          <div className="bg-white p-8 rounded-3xl border border-zinc-200 shadow-sm space-y-6 xl:col-span-2 flex flex-col">
            <h2 className="font-black text-sm uppercase text-zinc-800 tracking-[0.2em] mb-2 border-b border-zinc-100 pb-2">02. Matriz de Acesso</h2>
            <div className="overflow-x-auto border border-zinc-200 rounded-2xl flex-grow">
              <table className="w-full text-left border-collapse">
                <thead className="bg-zinc-50 border-b border-zinc-200">
                  <tr>
                    <th className="p-4 font-black uppercase text-xs tracking-widest text-zinc-600">Módulo</th>
                    <th className="p-4 font-black uppercase text-xs text-center text-zinc-600">Ler</th>
                    <th className="p-4 font-black uppercase text-xs text-center text-zinc-600">Escrever</th>
                    <th className="p-4 font-black uppercase text-xs text-center text-red-500">Excluir</th>
                  </tr>
                </thead>
                <tbody>
                  {MODULOS.map((modulo, index) => (
                    <tr key={modulo} className={`border-b border-zinc-100 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'} hover:bg-yellow-50/50 transition-colors`}>
                      <td className="p-4 font-black text-sm text-zinc-800 tracking-wider">{modulo}</td>
                      <td className="p-4 text-center"><input type="checkbox" checked={permissoes[modulo].podeLer} onChange={() => handleCheckboxChange(modulo, 'podeLer')} className="w-6 h-6 accent-zinc-900 cursor-pointer" /></td>
                      <td className="p-4 text-center"><input type="checkbox" checked={permissoes[modulo].podeEscrever} onChange={() => handleCheckboxChange(modulo, 'podeEscrever')} className="w-6 h-6 accent-zinc-900 cursor-pointer" /></td>
                      <td className="p-4 text-center bg-red-50/30"><input type="checkbox" checked={permissoes[modulo].podeExcluir} onChange={() => handleCheckboxChange(modulo, 'podeExcluir')} className="w-6 h-6 accent-red-500 cursor-pointer" /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button type="submit" className="bg-zinc-900 text-white p-5 rounded-2xl w-full font-black uppercase tracking-[0.2em] hover:bg-yellow-400 hover:text-zinc-900 transition-all shadow-lg mt-4">
              Gravar Novo Perfil
            </button>
          </div>
        </form>
      )}
      
      <section className="bg-white rounded-[2.5rem] shadow-md border border-zinc-200 overflow-hidden">
        <div className="p-8 border-b border-zinc-200 bg-zinc-100/30">
          <h2 className="font-black text-lg uppercase text-zinc-800 tracking-tighter">Database: Cargos Cadastrados</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[800px]">
            <thead>
              <tr className="bg-zinc-50 border-b border-zinc-200">
                <th className="p-6 font-black uppercase text-xs tracking-widest text-zinc-600">Cargo / Perfil</th>
                <th className="p-6 font-black uppercase text-xs tracking-widest text-zinc-800 w-1/2">Descrição</th>
                <th className="p-6 font-black uppercase text-xs tracking-widest text-zinc-800 text-center">Regras Aplicadas</th>
                <th className="p-6 font-black uppercase text-xs tracking-widest text-zinc-800 text-center">Gestão</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan="4" className="p-10 text-center uppercase italic font-black text-zinc-500 animate-pulse">Carregando Perfis...</td></tr>}
              
              {!loading && !error && perfis.map(perfil => (
                <tr key={perfil.idPerfil} className="border-b border-zinc-100 hover:bg-yellow-50/50 transition-colors">
                  <td className="p-6 align-middle whitespace-nowrap">
                    <span className="bg-zinc-900 text-yellow-400 px-4 py-2 rounded-xl text-base font-black uppercase tracking-widest shadow-sm">
                      {perfil.nomePerfil}
                    </span>
                  </td>
                  <td className="p-6 align-middle text-sm text-zinc-700 font-bold leading-relaxed">
                    {perfil.descricao || 'Sem descrição'}
                  </td>
                  <td className="p-6 align-middle text-center">
                    <span className="bg-zinc-100 text-zinc-700 border border-zinc-200 px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest">
                      {perfil.permissoes?.length || 0} Permissões
                    </span>
                  </td>
                  <td className="p-6 align-middle">
                    <div className="flex justify-center gap-3">
                      {temPermissao('PERFIS_WRITE') && (
                        <button onClick={() => router.push(`/views/perfis/editar?id=${perfil.idPerfil}`)} className="w-12 h-12 flex items-center justify-center bg-zinc-900 text-white hover:bg-yellow-400 hover:text-zinc-900 rounded-xl transition-all shadow-md text-xl">✎</button>
                      )}
                      {temPermissao('PERFIS_DELETE') && (
                        <button onClick={() => handleExcluir(perfil.idPerfil)} className="w-12 h-12 flex items-center justify-center bg-white text-zinc-900 border-2 border-zinc-200 hover:bg-red-600 hover:text-white rounded-xl transition-all shadow-md text-xl">🗑</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              
              {!loading && !error && perfis.length === 0 && (
                 <tr><td colSpan="4" className="p-8 text-center text-zinc-500 uppercase font-black italic">Nenhum perfil encontrado.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}