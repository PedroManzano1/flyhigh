"use client";
import { useState, useEffect } from 'react';
import api from '../../../../utils/api'; 
import { useRouter, useSearchParams } from 'next/navigation'; 

// --- COMPONENTES UTILITÁRIOS ---
const InputField = ({ label, name, placeholder, type = "text", onChange, value, className = "" }) => (
  <div className={className}>
    <label className="block text-sm font-black text-zinc-700 uppercase tracking-wider mb-2">{label}</label>
    <input
      type={type} name={name} value={value || ''} onChange={onChange} placeholder={placeholder}
      className="w-full p-4 border border-zinc-300 rounded-xl text-lg font-bold text-zinc-900 focus:ring-4 focus:ring-yellow-400/30 focus:border-yellow-400 bg-white transition-all outline-none shadow-sm"
    />
  </div>
);

const MODULOS = ["USUARIOS", "ALUNOS", "RESPONSAVEIS", "CURSOS", "TURMAS", "VINCULOS", "PERFIS", "RECADOS"];

export default function EditarPerfilPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get('id');

  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({ nomePerfil: '', descricao: '' });

  const permissoesIniciais = MODULOS.reduce((acc, modulo) => {
    acc[modulo] = { idPermissao: null, podeLer: false, podeEscrever: false, podeExcluir: false };
    return acc;
  }, {});

  const [permissoes, setPermissoes] = useState(permissoesIniciais);

  useEffect(() => {
    if (!id) {
        router.push('/views/perfis');
        return;
    }

    const carregarPerfil = async () => {
      try {
        const res = await api.get(`/api/perfis/${id}`);
        const perfil = res.data;
        
        setFormData({
          nomePerfil: perfil.nomePerfil || '',
          descricao: perfil.descricao || ''
        });

        if (perfil.permissoes) {
          const permsAtualizadas = { ...permissoesIniciais };
          perfil.permissoes.forEach(p => {
            if (permsAtualizadas[p.modulo]) {
              permsAtualizadas[p.modulo] = {
                idPermissao: p.idPermissao,
                podeLer: p.podeLer,
                podeEscrever: p.podeEscrever,
                podeExcluir: p.podeExcluir
              };
            }
          });
          setPermissoes(permsAtualizadas);
        }
      } catch (err) {
        alert("Erro ao carregar dados do perfil.");
        router.push('/views/perfis'); 
      } finally {
        setLoading(false);
      }
    };

    carregarPerfil();
  }, [id, router]);

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
      idPermissao: permissoes[modulo].idPermissao,
      modulo: modulo,
      podeLer: permissoes[modulo].podeLer,
      podeEscrever: permissoes[modulo].podeEscrever,
      podeExcluir: permissoes[modulo].podeExcluir
    })).filter(p => p.podeLer || p.podeEscrever || p.podeExcluir || p.idPermissao);

    const payload = {
      nomePerfil: formData.nomePerfil.toUpperCase(),
      descricao: formData.descricao,
      permissoes: listaPermissoes
    };

    try {
      await api.put(`/api/perfis/editar/${id}`, payload);
      alert("Perfil e acessos atualizados com sucesso!");
      router.push('/views/perfis'); 
    } catch (err) {
      alert("Erro ao atualizar perfil.");
      console.error(err);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 text-xl font-black text-zinc-800">
      <span className="uppercase tracking-[0.2em] animate-pulse">Carregando Matriz de Acesso...</span>
    </div>
  );

  return (
    <div className="p-10 bg-gray-50 min-h-screen text-zinc-900 font-sans">
      <header className="mb-10 flex flex-col gap-4">
        <button onClick={() => router.push('/views/perfis')} className="flex items-center gap-2 text-zinc-600 hover:text-zinc-900 transition-colors font-black text-sm uppercase tracking-widest w-fit">
          <span className="text-xl">←</span> Voltar para a listagem
        </button>
        <div>
          <h1 className="text-5xl font-black uppercase tracking-tighter italic text-zinc-900">Editar Perfil & Acesso</h1>
          <div className="h-2 w-24 bg-yellow-400 mt-2 rounded-full"></div>
        </div>
      </header>
      
      <form onSubmit={handleSubmit} className="grid grid-cols-1 xl:grid-cols-3 gap-8 mb-12">
        
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-zinc-200 space-y-8">
          <h2 className="font-black text-lg uppercase text-yellow-600 tracking-widest border-b border-zinc-100 pb-4">01. Cargo / Perfil</h2>
          <InputField label="Nome do Perfil" name="nomePerfil" onChange={handleFormChange} value={formData.nomePerfil} />
          
          <div>
            <label className="block text-sm font-black text-zinc-700 uppercase tracking-wider mb-2">Descrição</label>
            <textarea
              name="descricao"
              value={formData.descricao}
              onChange={handleFormChange}
              className="w-full p-4 h-32 resize-none border border-zinc-300 rounded-xl text-lg font-bold text-zinc-900 focus:ring-4 focus:ring-yellow-400/30 focus:border-yellow-400 bg-white transition-all outline-none shadow-sm"
            />
          </div>
        </div>

        <div className="bg-white p-8 rounded-3xl shadow-sm border border-zinc-200 space-y-6 xl:col-span-2 flex flex-col">
          <h2 className="font-black text-lg uppercase text-zinc-700 tracking-widest border-b border-zinc-100 pb-4">02. Matriz de Acesso</h2>
          
          <div className="overflow-x-auto border border-zinc-200 rounded-2xl flex-grow">
            <table className="w-full text-left border-collapse">
              <thead className="bg-zinc-50 border-b border-zinc-200">
                <tr>
                  <th className="p-4 font-black uppercase text-xs tracking-widest text-zinc-600">Módulo do Sistema</th>
                  <th className="p-4 font-black uppercase text-xs tracking-widest text-center text-zinc-600">Ver / Ler</th>
                  <th className="p-4 font-black uppercase text-xs tracking-widest text-center text-zinc-600">Criar / Editar</th>
                  <th className="p-4 font-black uppercase text-xs tracking-widest text-center text-red-500">Excluir</th>
                </tr>
              </thead>
              <tbody>
                {MODULOS.map((modulo, index) => (
                  <tr key={modulo} className={`border-b border-zinc-100 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'} hover:bg-yellow-50/50 transition-colors`}>
                    <td className="p-4 font-black text-sm text-zinc-800 tracking-wider">
                      {modulo === 'VINCULOS' ? '🔗 VÍNCULOS (FAMÍLIA)' : `📁 ${modulo}`}
                    </td>
                    <td className="p-4 text-center">
                      <input type="checkbox" checked={permissoes[modulo].podeLer} onChange={() => handleCheckboxChange(modulo, 'podeLer')} className="w-6 h-6 accent-zinc-900 cursor-pointer" />
                    </td>
                    <td className="p-4 text-center">
                      <input type="checkbox" checked={permissoes[modulo].podeEscrever} onChange={() => handleCheckboxChange(modulo, 'podeEscrever')} className="w-6 h-6 accent-zinc-900 cursor-pointer" />
                    </td>
                    <td className="p-4 text-center bg-red-50/30">
                      <input type="checkbox" checked={permissoes[modulo].podeExcluir} onChange={() => handleCheckboxChange(modulo, 'podeExcluir')} className="w-6 h-6 accent-red-500 cursor-pointer" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-row justify-end gap-4 mt-6">
            <button type="button" onClick={() => router.push('/views/perfis')} className="text-zinc-500 p-4 font-black uppercase text-sm hover:text-zinc-900 transition-all tracking-widest underline decoration-zinc-300 decoration-2">
              Cancelar
            </button>
            <button type="submit" className="bg-yellow-400 text-zinc-900 px-8 py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-zinc-900 hover:text-white transition-all shadow-md">
              Atualizar Perfil
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}