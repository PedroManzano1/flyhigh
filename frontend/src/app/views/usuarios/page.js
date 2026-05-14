"use client";
import { useState, useEffect, useContext } from 'react';
import api from '../../../utils/api';
import { useRouter } from 'next/navigation';
import { AuthContext } from '../../../context/authContext'; 

// --- COMPONENTES UTILITÁRIOS PADRONIZADOS ---
const InputField = ({ label, name, placeholder, type = "text", onChange, value, className = "", required = false }) => (
  <div className={className}>
    <label className="block text-xs font-black text-zinc-700 uppercase tracking-widest mb-2">{label}</label>
    <input type={type} name={name} value={value || ''} onChange={onChange} placeholder={placeholder} required={required} className="w-full p-4 border border-zinc-300 rounded-xl text-lg font-bold text-zinc-900 focus:ring-4 focus:ring-yellow-400/20 outline-none transition-all bg-white shadow-sm" />
  </div>
);

const SelectField = ({ label, name, children, onChange, value, className = "", required = false }) => (
  <div className={className}>
    <label className="block text-xs font-black text-zinc-700 uppercase tracking-widest mb-2">{label}</label>
    <select name={name} value={value || ''} onChange={onChange} required={required} className="w-full p-4 border border-zinc-300 rounded-xl text-lg font-bold text-zinc-900 focus:ring-4 focus:ring-yellow-400/20 outline-none appearance-none bg-white cursor-pointer shadow-sm">{children}</select>
  </div>
);

export default function UsuariosPage() {
  const router = useRouter();
  const { user } = useContext(AuthContext);

  const [usuarios, setUsuarios] = useState([]);
  const [perfis, setPerfis] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [formData, setFormData] = useState({
    nome: '', login: '', senha: '', idPerfil: ''
  });

  const temPermissao = (permissaoNecessaria) => {
    if (!user || !user.permissoes) return false;
    return user.permissoes.includes('ROLE_DIRETOR') || user.permissoes.includes(permissaoNecessaria);
  };

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
      nome: formData.nome, login: formData.login, senha: formData.senha,
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
    if (confirm("Deseja remover o acesso deste colaborador permanentemente?")) {
      try {
        await api.delete(`/api/usuarios/${id}`);
        carregarDados();
      } catch (err) { alert("Erro ao excluir."); }
    }
  };

  return (
    <div className="p-10 bg-gray-50 min-h-screen font-sans text-zinc-900">
      <header className="mb-12 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
          <h1 className="text-5xl font-black uppercase tracking-tighter italic text-zinc-900">Gestão de Equipe</h1>
          <div className="h-2 w-24 bg-yellow-400 mt-2 rounded-full"></div>
        </div>
        <div className="flex flex-wrap gap-4">
          <button onClick={() => router.push('/')} className="px-8 py-4 bg-zinc-900 text-white rounded-2xl font-black text-sm uppercase tracking-[0.2em] hover:bg-yellow-400 hover:text-zinc-900 transition-all shadow-xl">
            Voltar ao Início
          </button>
          
          {temPermissao('PERFIS_READ') && (
            <button onClick={() => router.push('/views/perfis')} className="px-8 py-4 bg-sky-100 text-sky-800 border border-sky-200 rounded-2xl font-black text-sm uppercase tracking-[0.2em] hover:bg-sky-200 transition-all shadow-sm">
              🛡️ Configurar Perfis
            </button>
          )}
        </div>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {temPermissao('USUARIOS_WRITE') && (
          <form onSubmit={handleSubmit} className="bg-white p-8 rounded-3xl border border-zinc-200 shadow-sm space-y-6 h-fit xl:col-span-1">
            <h2 className="font-black text-lg uppercase text-zinc-800 tracking-[0.2em] mb-4 border-b border-zinc-100 pb-2">Novo Colaborador</h2>
            
            <InputField label="Nome Completo" name="nome" value={formData.nome} onChange={e => setFormData({...formData, nome: e.target.value})} required />
            <InputField label="Login" name="login" value={formData.login} onChange={e => setFormData({...formData, login: e.target.value})} required className="font-mono" />
            <InputField label="Senha Temporária" name="senha" type="password" value={formData.senha} onChange={e => setFormData({...formData, senha: e.target.value})} required />
            
            <SelectField label="Cargo / Perfil" name="idPerfil" value={formData.idPerfil} onChange={e => setFormData({...formData, idPerfil: e.target.value})} required>
              <option value="">Selecione um perfil...</option>
              {perfis.map(p => <option key={p.idPerfil} value={p.idPerfil}>{p.nomePerfil}</option>)}
            </SelectField>

            <button type="submit" className="w-full bg-zinc-900 text-white p-5 rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-yellow-400 hover:text-zinc-900 transition-all shadow-md mt-4">
              Cadastrar Acesso
            </button>
          </form>
        )}

        <div className={temPermissao('USUARIOS_WRITE') ? "xl:col-span-2" : "xl:col-span-3"}>
          <div className="bg-white rounded-[2.5rem] shadow-md border border-zinc-200 overflow-hidden">
            <div className="p-8 border-b border-zinc-200 bg-zinc-100/30">
              <h2 className="font-black text-lg uppercase text-zinc-800 tracking-tighter">Database: Colaboradores Ativos</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-zinc-50 border-b border-zinc-200">
                  <tr>
                    <th className="p-6 font-black uppercase text-xs tracking-widest text-zinc-600">Colaborador</th>
                    <th className="p-6 font-black uppercase text-xs tracking-widest text-zinc-800">Dados de Acesso</th>
                    <th className="p-6 font-black uppercase text-xs tracking-widest text-zinc-800">Perfil / Cargo</th>
                    <th className="p-6 font-black uppercase text-xs tracking-widest text-zinc-800 text-center">Gestão</th>
                  </tr>
                </thead>
                <tbody>
                  {loading && <tr><td colSpan="4" className="p-10 text-center uppercase italic font-black text-zinc-500 animate-pulse">Carregando Equipe...</td></tr>}
                  
                  {!loading && usuarios.map(u => (
                    <tr key={u.idUsuario} className="border-b border-zinc-100 hover:bg-yellow-50/50 transition-colors">
                      <td className="p-6 align-middle">
                        <span className="font-black text-zinc-900 uppercase text-lg">{u.nome}</span>
                      </td>
                      <td className="p-6 align-middle">
                        <span className="font-mono text-zinc-600 font-bold bg-zinc-100 px-3 py-1.5 rounded-lg border border-zinc-200">{u.login}</span>
                      </td>
                      <td className="p-6 align-middle">
                        <span className="bg-sky-50 text-sky-700 px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest border border-sky-200">
                          {u.perfil?.nomePerfil || 'SEM PERFIL'}
                        </span>
                      </td>
                      <td className="p-6 align-middle">
                        <div className="flex justify-center gap-3">
                          {temPermissao('USUARIOS_WRITE') && (
                            <button onClick={() => router.push(`/views/usuarios/editar?id=${u.idUsuario}`)} className="w-12 h-12 flex items-center justify-center bg-zinc-900 text-white hover:bg-yellow-400 hover:text-zinc-900 rounded-xl transition-all shadow-md text-xl" title="Editar Usuário">✎</button>
                          )}
                          {temPermissao('USUARIOS_DELETE') && (
                            <button onClick={() => excluirUsuario(u.idUsuario)} className="w-12 h-12 flex items-center justify-center bg-white text-zinc-900 border-2 border-zinc-200 hover:bg-red-600 hover:text-white rounded-xl transition-all shadow-md text-xl" title="Revogar Acesso">🗑</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}

                  {!loading && usuarios.length === 0 && (
                     <tr><td colSpan="4" className="p-8 text-center text-zinc-500 uppercase font-black italic">Nenhum colaborador encontrado.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}