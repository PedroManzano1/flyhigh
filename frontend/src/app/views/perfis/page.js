"use client";
import { useState, useEffect } from 'react';
import api from '../../../utils/api'; // Ajuste o caminho conforme o seu utils/services
import { useRouter } from 'next/navigation'; 

// --- COMPONENTES UTILITÁRIOS ---
const InputField = ({ label, name, placeholder, type = "text", onChange, value, className = "" }) => (
  <div className={className}>
    <label className="block text-xs font-black text-zinc-800 uppercase tracking-widest mb-1">{label}</label>
    <input
      type={type} name={name} value={value || ''} onChange={onChange} placeholder={placeholder}
      className="w-full p-3 border-2 border-zinc-900 rounded-none text-sm focus:ring-0 focus:border-yellow-400 bg-white shadow-[4px_4px_0px_0px_rgba(24,24,27,1)] transition-all focus:translate-x-[2px] focus:translate-y-[2px] focus:shadow-none outline-none"
    />
  </div>
);

const MODULOS = ["USUARIOS", "ALUNOS", "RESPONSAVEIS", "CURSOS", "TURMAS", "VINCULOS", "PERFIS"];

export default function PerfisPage() {
  const router = useRouter();
  const [perfis, setPerfis] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({ nomePerfil: '', descricao: '' });
  
  const permissoesIniciais = MODULOS.reduce((acc, modulo) => {
    acc[modulo] = { podeLer: false, podeEscrever: false, podeExcluir: false };
    return acc;
  }, {});
  
  const [permissoes, setPermissoes] = useState(permissoesIniciais);

  const carregarPerfis = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/perfis');
      setPerfis(res.data);
      setError(null);
    } catch (err) {
      setError("Erro ao carregar perfis.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { carregarPerfis(); }, []);

  const handleFormChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleCheckboxChange = (modulo, acao) => {
    setPermissoes(prev => ({
      ...prev,
      [modulo]: {
        ...prev[modulo],
        [acao]: !prev[modulo][acao]
      }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const listaPermissoes = MODULOS.map(modulo => ({
      modulo: modulo,
      podeLer: permissoes[modulo].podeLer,
      podeEscrever: permissoes[modulo].podeEscrever,
      podeExcluir: permissoes[modulo].podeExcluir
    })).filter(p => p.podeLer || p.podeEscrever || p.podeExcluir);

    const payload = {
      nomePerfil: formData.nomePerfil.toUpperCase(),
      descricao: formData.descricao,
      permissoes: listaPermissoes
    };

    try {
      await api.post('/api/perfis', payload);
      alert("Perfil criado com sucesso!");
      carregarPerfis();
      setFormData({ nomePerfil: '', descricao: '' });
      setPermissoes(permissoesIniciais);
    } catch (err) { alert("Erro ao salvar perfil."); }
  };

  const handleExcluir = async (id) => {
    if (window.confirm("Atenção! Deseja excluir este perfil? Usuários atrelados a ele perderão acessos.")) {
      try {
        await api.delete(`/api/perfis/${id}`);
        alert("Perfil removido.");
        carregarPerfis(); 
      } catch (err) { alert("Erro ao excluir."); }
    }
  };

  // ✅ NOVO: Função para redirecionar para a tela de edição
  const handleEditar = (id) => router.push(`/views/perfis/editar?id=${id}`);

  return (
    <div className="p-10 bg-gray-100 min-h-screen text-zinc-900 font-sans">
      <header className="mb-12 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black uppercase tracking-tighter italic">Controle de Perfis</h1>
          <div className="h-2 w-24 bg-sky-300 mt-2"></div>
        </div>
        <button onClick={() => router.push('/')} className="flex items-center gap-2 px-6 py-3 bg-zinc-900 text-white font-bold uppercase text-xs tracking-widest hover:bg-yellow-400 hover:text-zinc-900 transition-all shadow-[4px_4px_0px_0px_rgba(250,204,21,1)] active:shadow-none active:translate-x-1 active:translate-y-1">
          <span>⌂</span> Voltar ao Início
        </button>
      </header>
      
      <form onSubmit={handleSubmit} className="grid grid-cols-1 xl:grid-cols-3 gap-10 mb-16">
        <div className="bg-white p-8 border-4 border-zinc-900 shadow-[8px_8px_0px_0px_rgba(125,211,252,1)] space-y-6">
          <h2 className="font-black text-lg uppercase border-b-4 border-sky-300 pb-2 mb-4">01. Cargo / Perfil</h2>
          <InputField label="Nome do Perfil" name="nomePerfil" placeholder="Ex: SECRETARIA, PROFESSOR" onChange={handleFormChange} value={formData.nomePerfil} />
          <div>
            <label className="block text-xs font-black text-zinc-800 uppercase tracking-widest mb-1">Descrição</label>
            <textarea name="descricao" value={formData.descricao} onChange={handleFormChange} placeholder="Descreva as funções..." className="w-full p-3 h-32 resize-none border-2 border-zinc-900 rounded-none text-sm focus:ring-0 focus:border-yellow-400 bg-white shadow-[4px_4px_0px_0px_rgba(24,24,27,1)] transition-all outline-none" />
          </div>
        </div>

        <div className="bg-white p-8 border-4 border-zinc-900 shadow-[8px_8px_0px_0px_rgba(24,24,27,1)] space-y-4 xl:col-span-2 flex flex-col">
          <h2 className="font-black text-lg uppercase border-b-4 border-yellow-400 pb-2 mb-2">02. Matriz de Acesso</h2>
          <div className="overflow-x-auto border-2 border-zinc-900 flex-grow">
            <table className="w-full text-left">
              <thead className="bg-zinc-900 text-white">
                <tr>
                  <th className="p-3 font-black uppercase text-xs tracking-widest">Módulo do Sistema</th>
                  <th className="p-3 font-black uppercase text-xs tracking-widest text-center border-l border-zinc-700">Ver / Ler</th>
                  <th className="p-3 font-black uppercase text-xs tracking-widest text-center border-l border-zinc-700">Criar / Editar</th>
                  <th className="p-3 font-black uppercase text-xs tracking-widest text-center border-l border-zinc-700 text-red-400">Excluir</th>
                </tr>
              </thead>
              <tbody>
                {MODULOS.map((modulo, index) => (
                  <tr key={modulo} className={`border-b border-zinc-200 ${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'} hover:bg-yellow-50`}>
                    <td className="p-3 font-bold text-sm text-zinc-800 tracking-wider">
                      {modulo === 'VINCULOS' ? '🔗 VÍNCULOS (FAMÍLIA)' : `📁 ${modulo}`}
                    </td>
                    <td className="p-3 text-center border-l border-zinc-200">
                      <input type="checkbox" checked={permissoes[modulo].podeLer} onChange={() => handleCheckboxChange(modulo, 'podeLer')} className="w-5 h-5 accent-zinc-900 cursor-pointer" />
                    </td>
                    <td className="p-3 text-center border-l border-zinc-200">
                      <input type="checkbox" checked={permissoes[modulo].podeEscrever} onChange={() => handleCheckboxChange(modulo, 'podeEscrever')} className="w-5 h-5 accent-zinc-900 cursor-pointer" />
                    </td>
                    <td className="p-3 text-center border-l border-zinc-200 bg-red-50/30">
                      <input type="checkbox" checked={permissoes[modulo].podeExcluir} onChange={() => handleCheckboxChange(modulo, 'podeExcluir')} className="w-5 h-5 accent-red-600 cursor-pointer" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex gap-4 mt-4">
            <button type="submit" className="bg-sky-300 text-zinc-900 p-4 w-full font-black uppercase tracking-[0.2em] hover:bg-zinc-900 hover:text-white transition-all border-2 border-zinc-900 shadow-[4px_4px_0px_0px_rgba(24,24,27,1)] active:shadow-none active:translate-x-1 active:translate-y-1">
              Gravar Nível de Acesso
            </button>
          </div>
        </div>
      </form>
      
      <section className="bg-white border-4 border-zinc-900 shadow-[12px_12px_0px_0px_rgba(24,24,27,1)] overflow-hidden">
        <div className="bg-zinc-900 p-6">
          <h2 className="font-black text-xl text-white uppercase tracking-tighter italic underline decoration-yellow-400 underline-offset-8">
            Database: Cargos e Permissões Cadastradas
          </h2>
        </div>

        <div className="overflow-x-auto p-4">
          <table className="w-full text-left min-w-[800px]">
            <thead>
              <tr className="border-b-4 border-zinc-900 bg-gray-50">
                <th className="p-4 font-black uppercase text-xs tracking-widest text-zinc-700">Cargo / Perfil</th>
                <th className="p-4 font-black uppercase text-xs tracking-widest text-zinc-900 w-1/2">Descrição</th>
                <th className="p-4 font-black uppercase text-xs tracking-widest text-zinc-900 text-center">Módulos Liberados</th>
                <th className="p-4 font-black uppercase text-xs tracking-widest text-zinc-900 text-center">Gestão</th>
              </tr>
            </thead>
            <tbody className="font-bold text-base">
              {loading && <tr><td colSpan="4" className="p-10 text-center uppercase italic font-black text-zinc-600 animate-pulse">Consultando acessos...</td></tr>}
              
              {!loading && !error && perfis.map(perfil => (
                <tr key={perfil.idPerfil} className="border-b-2 border-zinc-100 hover:bg-sky-50 transition-colors group">
                  <td className="p-4 whitespace-nowrap">
                    <span className="bg-zinc-900 text-sky-300 px-3 py-1.5 text-sm font-black tracking-widest group-hover:bg-yellow-400 group-hover:text-zinc-900 transition-colors">
                      {perfil.nomePerfil}
                    </span>
                  </td>
                  <td className="p-4 text-sm text-zinc-600 font-medium">
                    {perfil.descricao || 'Sem descrição cadastrada.'}
                  </td>
                  <td className="p-4 text-center">
                    <span className="bg-zinc-100 border border-zinc-300 text-zinc-800 px-2 py-1 text-xs font-mono">
                      {perfil.permissoes?.length || 0} Regras
                    </span>
                  </td>
                  <td className="p-4">
                    {/* ✅ NOVO: Botão de Edição adicionado aqui ao lado do botão de exclusão */}
                    <div className="flex justify-center gap-2">
                      <button onClick={() => handleEditar(perfil.idPerfil)} className="bg-zinc-900 text-white w-10 h-10 flex items-center justify-center hover:bg-sky-300 hover:text-zinc-900 transition-all border-2 border-zinc-900">✎</button>
                      <button onClick={() => handleExcluir(perfil.idPerfil)} className="bg-white text-zinc-900 w-10 h-10 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all border-2 border-zinc-900 shadow-[2px_2px_0px_0px_rgba(24,24,27,1)] active:shadow-none" title="Excluir Perfil">🗑</button>
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