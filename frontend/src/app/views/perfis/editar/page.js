"use client";
import { useState, useEffect } from 'react';
import api from '../../../../utils/api'; // Ajuste o caminho conforme necessário
import { useRouter, useSearchParams } from 'next/navigation'; 

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

// Módulos disponíveis no sistema FlyHigh
const MODULOS = ["USUARIOS", "ALUNOS", "RESPONSAVEIS", "CURSOS", "TURMAS", "VINCULOS", "PERFIS", "RECADOS"];

export default function EditarPerfilPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get('id');

  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({ nomePerfil: '', descricao: '' });

  // Cria um objeto de permissões com todos os módulos falsos por padrão, mas preparando para receber o ID da permissão
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

        // Mapeia as permissões que vieram do banco para o nosso estado dos checkboxes
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
    
    // Transforma o objeto de permissões de volta na Lista que o Java espera
    const listaPermissoes = MODULOS.map(modulo => ({
      idPermissao: permissoes[modulo].idPermissao, // Importante enviar o ID para o Hibernate atualizar a linha e não duplicar
      modulo: modulo,
      podeLer: permissoes[modulo].podeLer,
      podeEscrever: permissoes[modulo].podeEscrever,
      podeExcluir: permissoes[modulo].podeExcluir
    })).filter(p => p.podeLer || p.podeEscrever || p.podeExcluir || p.idPermissao); // Envia os marcados ou os que já existiam no banco para atualizar/deletar

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

  if (loading) return <div className="flex items-center justify-center min-h-screen bg-gray-100"><span className="font-black uppercase tracking-widest animate-pulse">Carregando Matriz de Acesso...</span></div>;

  return (
    <div className="p-10 bg-gray-100 min-h-screen text-zinc-900 font-sans">
      <header className="mb-12 flex flex-col gap-4">
        <button onClick={() => router.push('/views/perfis')} className="flex items-center gap-2 text-zinc-500 hover:text-zinc-900 transition-colors font-black text-xs uppercase tracking-widest w-fit">
          <span className="text-lg">←</span> Voltar para a listagem
        </button>
        <div>
          <h1 className="text-4xl font-black uppercase tracking-tighter italic">Editar Perfil & Acesso</h1>
          <div className="h-2 w-24 bg-sky-300 mt-2"></div>
        </div>
      </header>
      
      <form onSubmit={handleSubmit} className="grid grid-cols-1 xl:grid-cols-3 gap-10 mb-12">
        
        {/* COLUNA 01: DADOS DO PERFIL */}
        <div className="bg-white p-8 border-4 border-zinc-900 shadow-[8px_8px_0px_0px_rgba(125,211,252,1)] space-y-6">
          <h2 className="font-black text-lg uppercase border-b-4 border-sky-300 pb-2 mb-4">01. Cargo / Perfil</h2>
          <InputField label="Nome do Perfil" name="nomePerfil" onChange={handleFormChange} value={formData.nomePerfil} />
          
          <div>
            <label className="block text-xs font-black text-zinc-800 uppercase tracking-widest mb-1">Descrição</label>
            <textarea
              name="descricao"
              value={formData.descricao}
              onChange={handleFormChange}
              className="w-full p-3 h-32 resize-none border-2 border-zinc-900 rounded-none text-sm focus:ring-0 focus:border-yellow-400 bg-white shadow-[4px_4px_0px_0px_rgba(24,24,27,1)] transition-all outline-none"
            />
          </div>
        </div>

        {/* COLUNA 02: MATRIZ DE PERMISSÕES */}
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

          <div className="flex flex-row justify-end gap-4 mt-6">
            <button type="button" onClick={() => router.push('/views/perfis')} className="bg-transparent text-zinc-900 px-8 py-4 font-bold uppercase text-xs border-2 border-dashed border-zinc-900 hover:bg-white transition-all">
              Cancelar
            </button>
            <button type="submit" className="bg-sky-300 text-zinc-900 px-8 py-4 font-black uppercase tracking-[0.2em] hover:bg-zinc-900 hover:text-white transition-all border-2 border-zinc-900 shadow-[4px_4px_0px_0px_rgba(24,24,27,1)] active:shadow-none active:translate-x-1 active:translate-y-1">
              Atualizar Perfil
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}