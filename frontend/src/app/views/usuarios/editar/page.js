"use client";
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import api from '../../../../utils/api';

export default function EditarUsuarioPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get('id'); // Pega o ID da URL (?id=1)

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

  if (loading) return <div className="p-10 font-black uppercase animate-pulse">Carregando...</div>;

  return (
    <div className="p-10 bg-gray-100 min-h-screen font-sans text-zinc-900">
      <header className="mb-12 flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-black uppercase tracking-tighter italic">Editar Colaborador</h1>
          <div className="h-2 w-24 bg-yellow-400 mt-2"></div>
        </div>
        <button onClick={() => router.push('/views/usuarios')} className="bg-zinc-900 text-white px-6 py-3 border-4 border-zinc-900 font-black uppercase text-xs shadow-[4px_4px_0px_0px_rgba(24,24,27,1)] hover:shadow-none transition-all">⬅️ Voltar</button>
      </header>

      <div className="max-w-2xl mx-auto">
        <form onSubmit={handleUpdate} className="bg-white p-10 border-4 border-zinc-900 shadow-[12px_12px_0px_0px_rgba(24,24,27,1)] space-y-6">
          <div>
            <label className="block text-xs font-black uppercase mb-1">Nome Completo</label>
            <input required type="text" value={formData.nome} onChange={e => setFormData({...formData, nome: e.target.value})} className="w-full p-3 border-2 border-zinc-900 outline-none focus:border-sky-400 font-bold" />
          </div>
          <div>
            <label className="block text-xs font-black uppercase mb-1">Login</label>
            <input required type="text" value={formData.login} onChange={e => setFormData({...formData, login: e.target.value})} className="w-full p-3 border-2 border-zinc-900 outline-none focus:border-sky-400 font-mono" />
          </div>
          <div>
            <label className="block text-xs font-black uppercase mb-1">Nova Senha (opcional)</label>
            <input type="password" value={formData.senha} onChange={e => setFormData({...formData, senha: e.target.value})} className="w-full p-3 border-2 border-zinc-900 outline-none focus:border-yellow-400 placeholder:italic" placeholder="••••••••" />
          </div>
          <div>
            <label className="block text-xs font-black uppercase mb-1 text-sky-600">Cargo / Perfil</label>
            <select required value={formData.idPerfil} onChange={e => setFormData({...formData, idPerfil: e.target.value})} className="w-full p-3 border-2 border-zinc-900 bg-white font-black outline-none focus:border-yellow-400">
              {perfis.map(p => <option key={p.idPerfil} value={p.idPerfil}>{p.nomePerfil}</option>)}
            </select>
          </div>
          <button type="submit" className="w-full bg-yellow-400 text-zinc-900 p-4 border-2 border-zinc-900 font-black uppercase tracking-widest hover:bg-zinc-900 hover:text-white transition-all shadow-[4px_4px_0px_0px_rgba(24,24,27,1)]">Confirmar Alterações</button>
        </form>
      </div>
    </div>
  );
}