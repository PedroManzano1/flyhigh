"use client";
import { useState, useEffect, useContext } from 'react';
import api from '../../../utils/api';
import { useRouter } from 'next/navigation'; 
import { AuthContext } from '../../../context/authContext'; 

const InputField = ({ label, name, placeholder, type = "text", onChange, value, className = "" }) => (
  <div className={className}>
    <label className="block text-xs font-black text-zinc-800 uppercase tracking-widest mb-1">{label}</label>
    <input type={type} name={name} value={value || ''} onChange={onChange} placeholder={placeholder} className="w-full p-3 border-2 border-zinc-900 rounded-none text-sm focus:ring-0 focus:border-emerald-400 bg-white shadow-[4px_4px_0px_0px_rgba(24,24,27,1)] transition-all focus:translate-x-[2px] focus:translate-y-[2px] focus:shadow-none outline-none" />
  </div>
);

const TextareaField = ({ label, name, placeholder, onChange, value, className = "" }) => (
  <div className={className}>
    <label className="block text-xs font-black text-zinc-800 uppercase tracking-widest mb-1">{label}</label>
    <textarea name={name} value={value || ''} onChange={onChange} placeholder={placeholder} className="w-full p-3 h-32 resize-none border-2 border-zinc-900 rounded-none text-sm focus:ring-0 focus:border-emerald-400 bg-white shadow-[4px_4px_0px_0px_rgba(24,24,27,1)] transition-all focus:translate-x-[2px] focus:translate-y-[2px] focus:shadow-none outline-none" />
  </div>
);

export default function RecadosPage() {
  const router = useRouter();
  const { user } = useContext(AuthContext);

  const [recados, setRecados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const estadoInicial = { titulo: '', mensagem: '', dataExpiracao: '', arquivoAnexo: '' };
  const [formData, setFormData] = useState(estadoInicial);

  const temPermissao = (permissaoNecessaria) => {
    if (!user || !user.permissoes) return false;
    return user.permissoes.includes('ROLE_DIRETOR') || user.permissoes.includes(permissaoNecessaria);
  };

  const carregarRecados = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/recados'); 
      setRecados(res.data);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  useEffect(() => { carregarRecados(); }, []);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Vinculando o autor através do contexto de autenticação do usuário logado
    const payload = { 
      titulo: formData.titulo, 
      mensagem: formData.mensagem, 
      dataExpiracao: formData.dataExpiracao || null, 
      arquivoAnexo: formData.arquivoAnexo,
      usuarioAutor: { idUsuario: user?.idUsuario || user?.id_usuario } 
    };

    try {
      await api.post('/api/recados', payload);
      alert("Recado publicado no mural!"); 
      carregarRecados(); 
      setFormData(estadoInicial);
    } catch (err) { alert("Erro ao publicar o recado. Verifique os dados."); }
  };

  const handleExcluir = async (id) => {
    if (window.confirm("Deseja apagar este comunicado do mural?")) {
      try { await api.delete(`/api/recados/${id}`); carregarRecados(); } catch (err) { alert("Erro ao excluir."); }
    }
  };

  const recadosFiltrados = recados.filter(recado => recado.titulo?.toLowerCase().includes(searchTerm.toLowerCase()) || recado.mensagem?.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="p-10 bg-gray-100 min-h-screen text-zinc-900 font-sans">
      <header className="mb-12 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black uppercase tracking-tighter italic">Mural de Recados</h1>
          <div className="h-2 w-24 bg-emerald-400 mt-2"></div>
        </div>
        <button onClick={() => router.push('/')} className="flex items-center gap-2 px-6 py-3 bg-zinc-900 text-white font-bold uppercase text-xs tracking-widest hover:bg-emerald-400 hover:text-zinc-900 transition-all shadow-[4px_4px_0px_0px_rgba(52,211,153,1)]">
          <span>⌂</span> Voltar ao Início
        </button>
      </header>
      
      {temPermissao('RECADOS_WRITE') && (
        <form onSubmit={handleSubmit} className="grid grid-cols-1 xl:grid-cols-3 gap-10 mb-16">
          <div className="bg-white p-8 border-4 border-zinc-900 shadow-[8px_8px_0px_0px_rgba(52,211,153,1)] space-y-6 xl:col-span-2">
            <h2 className="font-black text-lg uppercase border-b-4 border-emerald-400 pb-2 mb-4">01. Redigir Comunicado</h2>
            <InputField label="Título do Recado" name="titulo" placeholder="Ex: Feriado Nacional - Suspensão de Aulas" onChange={handleChange} value={formData.titulo} />
            <TextareaField label="Mensagem" name="mensagem" placeholder="Escreva os detalhes do comunicado aqui..." onChange={handleChange} value={formData.mensagem} />
            <div className="grid grid-cols-2 gap-4">
              <InputField label="Data de Expiração (Opcional)" name="dataExpiracao" type="date" onChange={handleChange} value={formData.dataExpiracao} />
              <InputField label="URL do Anexo (Opcional)" name="arquivoAnexo" placeholder="Link para PDF/Imagem" onChange={handleChange} value={formData.arquivoAnexo} />
            </div>
          </div>

          <div className="bg-emerald-400 p-8 border-4 border-zinc-900 shadow-[8px_8px_0px_0px_rgba(24,24,27,1)] flex flex-col justify-between">
            <div>
              <h2 className="font-black text-2xl uppercase mb-4 italic">Broadcast</h2>
              <p className="font-bold text-zinc-900 text-sm leading-tight border-l-4 border-zinc-900 pl-4">
                Comunicados publicados aqui ficarão visíveis no mural geral do sistema. Defina uma data de expiração caso seja um aviso temporário.
              </p>
            </div>
            <div className="flex flex-col gap-4 mt-10">
              <button type="submit" className="bg-zinc-900 text-white p-4 font-black uppercase tracking-[0.2em] hover:bg-white hover:text-zinc-900 transition-all border-2 border-zinc-900">
                Publicar Recado
              </button>
              <button type="button" onClick={() => setFormData(estadoInicial)} className="bg-transparent text-zinc-900 p-4 font-bold uppercase text-xs border-2 border-dashed border-zinc-900 hover:bg-white transition-all">
                Limpar Editor
              </button>
            </div>
          </div>
        </form>
      )}
      
      <section className="bg-white border-4 border-zinc-900 shadow-[12px_12px_0px_0px_rgba(24,24,27,1)] overflow-hidden">
        <div className="bg-zinc-900 p-6 flex justify-between items-center">
          <h2 className="font-black text-xl text-white uppercase tracking-tighter italic">Quadro de Avisos</h2>
          <input type="text" placeholder="BUSCAR RECADO..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full max-w-md pl-4 py-2 bg-white text-xs font-bold uppercase focus:outline-none" />
        </div>

        <div className="overflow-x-auto p-4">
          <table className="w-full text-left min-w-[1000px]">
            <thead>
              <tr className="border-b-4 border-zinc-900 bg-gray-50">
                <th className="p-4 font-black uppercase text-xs text-zinc-700 w-1/4">Título</th>
                <th className="p-4 font-black uppercase text-xs text-zinc-900 w-1/3">Resumo da Mensagem</th>
                <th className="p-4 font-black uppercase text-xs text-zinc-900">Datas</th>
                <th className="p-4 font-black uppercase text-xs text-zinc-900">Autor</th>
                <th className="p-4 font-black uppercase text-xs text-center text-zinc-900">Ações</th>
              </tr>
            </thead>
            <tbody className="font-bold text-base">
              {!loading && recadosFiltrados.map(recado => (
                <tr key={recado.id_recado} className="border-b-2 border-zinc-100 hover:bg-emerald-50 transition-colors">
                  
                  {/* TÍTULO */}
                  <td className="p-4">
                    <span className="uppercase text-zinc-900 block truncate max-w-[250px]">{recado.titulo}</span>
                  </td>
                  
                  {/* MENSAGEM (TRUNCADA) */}
                  <td className="p-4">
                    <p className="text-sm text-zinc-600 font-medium truncate max-w-[350px]">{recado.mensagem}</p>
                    {recado.arquivoAnexo && (
                      <a href={recado.arquivoAnexo} target="_blank" rel="noreferrer" className="text-[10px] uppercase text-emerald-600 hover:underline inline-block mt-1">📎 Ver Anexo</a>
                    )}
                  </td>

                  {/* DATAS */}
                  <td className="p-4 whitespace-nowrap">
                    <div className="flex flex-col gap-1 text-xs font-mono font-bold">
                      <span className="text-zinc-800"><span className="text-zinc-400">PUB:</span> {new Date(recado.dataPublicacao).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</span>
                      {recado.dataExpiracao ? (
                        <span className="text-red-500"><span className="text-zinc-400">EXP:</span> {new Date(recado.dataExpiracao).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</span>
                      ) : (
                        <span className="text-emerald-500">Sem Expiração</span>
                      )}
                    </div>
                  </td>

                  {/* AUTOR */}
                  <td className="p-4">
                     <span className="bg-zinc-200 text-zinc-800 px-2 py-1 text-xs uppercase shadow-[2px_2px_0px_0px_rgba(24,24,27,1)] border border-zinc-900">
                        {recado.usuarioAutor?.login || 'Sistema'}
                     </span>
                  </td>

                  {/* AÇÕES */}
                  <td className="p-4">
                    <div className="flex justify-center gap-2">
                      {temPermissao('RECADOS_WRITE') && (
                        <button onClick={() => router.push(`/views/recados/editar?id=${recado.id_recado}`)} className="bg-zinc-900 text-white w-10 h-10 flex items-center justify-center hover:bg-emerald-400 hover:text-zinc-900 border-2 border-zinc-900">✎</button>
                      )}
                      {temPermissao('RECADOS_DELETE') && (
                        <button onClick={() => handleExcluir(recado.id_recado)} className="bg-white text-zinc-900 w-10 h-10 flex items-center justify-center hover:bg-red-500 hover:text-white border-2 border-zinc-900 shadow-[2px_2px_0px_0px_rgba(24,24,27,1)]">🗑</button>
                      )}
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