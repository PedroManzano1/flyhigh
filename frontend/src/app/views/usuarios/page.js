"use client";
import { useState, useEffect } from 'react';
import api from '../../../utils/api';
import { useRouter } from 'next/navigation';

export default function UsuariosPage() {
  const router = useRouter();
  const [usuarios, setUsuarios] = useState([]);
  const [perfis, setPerfis] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [formData, setFormData] = useState({
    nome: '', login: '', senha: '', idPerfil: ''
  });

  const carregarDados = async () => {
    setLoading(true);
    try {
      const [resUsers, resPerfis] = await Promise.all([
        api.get('/api/usuarios'),
        api.get('/api/perfis')
      ]);
      setUsuarios(Array.isArray(resUsers.data) ? resUsers.data : []);
      setPerfis(Array.isArray(resPerfis.data) ? resPerfis.data : []);
    } catch (err) {
      console.error("Erro ao carregar dados", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { carregarDados(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.idPerfil) return alert("Selecione um perfil!");

    const payload = {
      nome: formData.nome,
      login: formData.login,
      senha: formData.senha,
      perfil: { idPerfil: parseInt(formData.idPerfil) }
    };

    try {
      await api.post('/api/usuarios', payload);
      alert("Colaborador cadastrado!");
      setFormData({ nome: '', login: '', senha: '', idPerfil: '' });
      carregarDados();
    } catch (err) { alert("Erro ao salvar usuário."); }
  };

  const excluirUsuario = async (id) => {
    if (confirm("Deseja remover este acesso?")) {
      try {
        await api.delete(`/api/usuarios/${id}`);
        carregarDados();
      } catch (err) { alert("Erro ao excluir."); }
    }
  };

  return (
    <div className="p-10 bg-gray-100 min-h-screen font-sans text-zinc-900">
      <header className="mb-12 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-black uppercase tracking-tighter italic">Gestão de Equipe</h1>
          <div className="h-2 w-24 bg-yellow-400 mt-2"></div>
        </div>
        <div className="flex gap-4">
          <button onClick={() => router.push('/')} className="bg-white px-6 py-3 border-4 border-zinc-900 font-black uppercase text-xs shadow-[4px_4px_0px_0px_rgba(24,24,27,1)] hover:shadow-none transition-all">🏠 Home</button>
          <button onClick={() => router.push('/views/perfis')} className="bg-sky-300 px-6 py-3 border-4 border-zinc-900 font-black uppercase text-xs shadow-[4px_4px_0px_0px_rgba(24,24,27,1)] hover:shadow-none transition-all">🛡️ Configurar Perfis</button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <form onSubmit={handleSubmit} className="bg-white p-8 border-4 border-zinc-900 shadow-[8px_8px_0px_0px_rgba(24,24,27,1)] space-y-6 h-fit">
          <h2 className="font-black text-xl uppercase border-b-4 border-yellow-400 pb-2 mb-6">Novo Colaborador</h2>
          <div>
            <label className="block text-xs font-black uppercase mb-1">Nome Completo</label>
            <input required type="text" value={formData.nome} onChange={e => setFormData({...formData, nome: e.target.value})} className="w-full p-3 border-2 border-zinc-900 outline-none focus:border-sky-400 font-bold" />
          </div>
          <div>
            <label className="block text-xs font-black uppercase mb-1">Login</label>
            <input required type="text" value={formData.login} onChange={e => setFormData({...formData, login: e.target.value})} className="w-full p-3 border-2 border-zinc-900 outline-none focus:border-sky-400 font-mono" />
          </div>
          <div>
            <label className="block text-xs font-black uppercase mb-1">Senha</label>
            <input required type="password" value={formData.senha} onChange={e => setFormData({...formData, senha: e.target.value})} className="w-full p-3 border-2 border-zinc-900 outline-none focus:border-sky-400" />
          </div>
          <div>
            <label className="block text-xs font-black uppercase mb-1 text-sky-600">Cargo / Perfil</label>
            <select required value={formData.idPerfil} onChange={e => setFormData({...formData, idPerfil: e.target.value})} className="w-full p-3 border-2 border-zinc-900 bg-white font-bold outline-none focus:border-yellow-400">
              <option value="">Selecione um perfil...</option>
              {perfis.map(p => <option key={p.idPerfil} value={p.idPerfil}>{p.nomePerfil}</option>)}
            </select>
          </div>
          <button type="submit" className="w-full bg-zinc-900 text-white p-4 font-black uppercase tracking-widest hover:bg-yellow-400 hover:text-zinc-900 transition-all border-2 border-zinc-900">Cadastrar</button>
        </form>

        <div className="lg:col-span-2">
          <div className="bg-white border-4 border-zinc-900 shadow-[8px_8px_0px_0px_rgba(125,211,252,1)] overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-zinc-900 text-white font-black uppercase text-xs">
                <tr>
                  <th className="p-4">Colaborador</th>
                  <th className="p-4">Login</th>
                  <th className="p-4">Perfil</th>
                  <th className="p-4 text-center">Ações</th>
                </tr>
              </thead>
              <tbody>
                {usuarios.map(u => (
                  <tr key={u.idUsuario} className="border-b-2 border-gray-100 hover:bg-yellow-50 transition-colors">
                    <td className="p-4 font-bold">{u.nome}</td>
                    <td className="p-4 font-mono text-sm">{u.login}</td>
                    <td className="p-4"><span className="bg-sky-100 text-sky-800 px-3 py-1 text-[10px] font-black uppercase border border-sky-300">{u.perfil?.nomePerfil || '---'}</span></td>
                    <td className="p-4 flex justify-center gap-2">
                      <button 
                        onClick={() => router.push(`/views/usuarios/editar?id=${u.idUsuario}`)} 
                        className="p-2 border-2 border-zinc-900 hover:bg-zinc-900 hover:text-white transition-all shadow-[2px_2px_0px_0px_rgba(24,24,27,1)] active:shadow-none"
                      >✎</button>
                      <button onClick={() => excluirUsuario(u.idUsuario)} className="p-2 border-2 border-zinc-900 hover:bg-red-500 hover:text-white transition-all shadow-[2px_2px_0px_0px_rgba(24,24,27,1)] active:shadow-none">🗑</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}