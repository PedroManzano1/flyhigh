"use client";
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import api from '../../../../utils/api';

// --- COMPONENTES UTILITÁRIOS PADRONIZADOS ---
const InputField = ({ label, name, placeholder, type = "text", onChange, value, className = "", required = false }) => (
  <div className={className}>
    <label className="block text-sm font-black text-zinc-700 uppercase tracking-wider mb-2">{label}</label>
    <input
      type={type} 
      name={name} 
      value={value || ''} 
      onChange={onChange} 
      placeholder={placeholder}
      required={required}
      className="w-full p-4 border border-zinc-300 rounded-xl text-lg font-bold text-zinc-900 focus:ring-4 focus:ring-yellow-400/30 focus:border-yellow-400 bg-white transition-all outline-none shadow-sm"
    />
  </div>
);

const SelectField = ({ label, name, children, onChange, value, required = false }) => (
  <div>
    <label className="block text-sm font-black text-zinc-700 uppercase tracking-wider mb-2">{label}</label>
    <select
      name={name} 
      value={value || ''} 
      onChange={onChange}
      required={required}
      className="w-full p-4 border border-zinc-300 rounded-xl text-lg font-bold text-zinc-900 focus:ring-4 focus:ring-yellow-400/30 bg-white transition-all outline-none appearance-none cursor-pointer shadow-sm"
    >
      {children}
    </select>
  </div>
);

export default function EditarUsuarioPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get('id');

  const [perfis, setPerfis] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [formData, setFormData] = useState({
    nome: '', login: '', senha: '', idPerfil: ''
  });

  useEffect(() => {
    if (!id) return;

    const carregarDados = async () => {
      try {
        const [resUser, resPerfis] = await Promise.all([
          api.get(`/api/usuarios/${id}`),
          api.get('/api/perfis')
        ]);
        
        const user = resUser.data;
        setFormData({
          nome: user.nome || '',
          login: user.login || '',
          senha: '', 
          idPerfil: user.perfil?.idPerfil || ''
        });
        setPerfis(Array.isArray(resPerfis.data) ? resPerfis.data : []);
      } catch (err) {
        alert("Erro ao buscar dados.");
        router.push('/views/usuarios');
      } finally {
        setLoading(false);
      }
    };
    carregarDados();
  }, [id, router]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    const payload = {
      nome: formData.nome,
      login: formData.login,
      perfil: { idPerfil: parseInt(formData.idPerfil) }
    };

    if (formData.senha && formData.senha.trim() !== "") {
      payload.senha = formData.senha;
    }

    try {
      await api.put(`/api/usuarios/editar/${id}`, payload);
      alert("Usuário atualizado!");
      router.push('/views/usuarios');
    } catch (err) { alert("Erro ao atualizar."); }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 text-xl font-black text-zinc-800">
      <span className="uppercase tracking-[0.2em] animate-pulse">Carregando Dados...</span>
    </div>
  );

  return (
    <div className="p-10 bg-gray-50 min-h-screen font-sans text-zinc-900 flex flex-col">
      <header className="mb-10 flex flex-col gap-4">
        <button onClick={() => router.push('/views/usuarios')} className="flex items-center gap-2 text-zinc-600 hover:text-zinc-900 transition-colors font-black text-sm uppercase tracking-widest w-fit">
          <span className="text-xl">←</span> Voltar para a equipe
        </button>
        <div>
          <h1 className="text-5xl font-black uppercase tracking-tighter italic text-zinc-900">Editar Colaborador</h1>
          <div className="h-2 w-24 bg-yellow-400 mt-2 rounded-full"></div>
        </div>
      </header>

      <div className="max-w-3xl w-full">
        <form onSubmit={handleUpdate} className="bg-white p-10 rounded-3xl border border-zinc-200 shadow-lg space-y-8">
          <div className="space-y-6">
            <h2 className="font-black text-lg uppercase text-yellow-600 tracking-widest border-b border-zinc-100 pb-4">01. Dados de Acesso</h2>
            
            <InputField label="Nome Completo" name="nome" value={formData.nome} onChange={e => setFormData({...formData, nome: e.target.value})} required />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <InputField label="Login de Acesso" name="login" value={formData.login} onChange={e => setFormData({...formData, login: e.target.value})} required className="font-mono" />
              <InputField label="Nova Senha (Opcional)" name="senha" type="password" placeholder="••••••••" value={formData.senha} onChange={e => setFormData({...formData, senha: e.target.value})} />
            </div>

            <SelectField label="Cargo / Perfil" name="idPerfil" value={formData.idPerfil} onChange={e => setFormData({...formData, idPerfil: e.target.value})} required>
              <option value="">Selecione o Perfil...</option>
              {perfis.map(p => <option key={p.idPerfil} value={p.idPerfil}>{p.nomePerfil}</option>)}
            </SelectField>
          </div>

          <div className="pt-6 border-t border-zinc-100 flex flex-col gap-4">
            <button type="submit" className="w-full bg-yellow-400 text-zinc-900 p-5 rounded-2xl font-black uppercase tracking-widest text-lg hover:bg-zinc-900 hover:text-white transition-all shadow-md">
              Confirmar Alterações
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}