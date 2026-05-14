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

const TextareaField = ({ label, name, placeholder, onChange, value, className = "" }) => (
  <div className={className}>
    <label className="block text-sm font-black text-zinc-700 uppercase tracking-widest mb-2">{label}</label>
    <textarea name={name} value={value || ''} onChange={onChange} placeholder={placeholder} className="w-full p-4 h-32 resize-none border border-zinc-300 rounded-xl text-lg font-bold text-zinc-900 focus:ring-4 focus:ring-yellow-400/20 outline-none transition-all bg-white shadow-sm" />
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
    <div className="p-10 bg-gray-50 min-h-screen text-zinc-900 font-sans">
      <header className="mb-12 flex items-center justify-between">
        <div>
          <h1 className="text-5xl font-black uppercase tracking-tighter italic text-zinc-900">Mural de Recados</h1>
          <div className="h-2 w-24 bg-yellow-400 rounded-full mt-2"></div>
        </div>
        <button onClick={() => router.push('/')} className="px-8 py-4 bg-zinc-900 text-white rounded-2xl font-black text-sm uppercase tracking-[0.2em] hover:bg-yellow-400 hover:text-zinc-900 transition-all shadow-xl">
          Voltar ao Início
        </button>
      </header>
      
      {temPermissao('RECADOS_WRITE') && (
        <form onSubmit={handleSubmit} className="grid grid-cols-1 xl:grid-cols-3 gap-8 mb-16">
          <div className="bg-white p-8 rounded-3xl border border-zinc-200 shadow-sm space-y-6 xl:col-span-2">
            <h2 className="font-black text-sm uppercase text-zinc-800 tracking-[0.2em] mb-4 border-b border-zinc-100 pb-2">01. Redigir Comunicado</h2>
            <InputField label="Título do Recado" name="titulo" placeholder="Ex: Feriado Nacional - Suspensão de Aulas" onChange={handleChange} value={formData.titulo} />
            <TextareaField label="Mensagem" name="mensagem" placeholder="Escreva os detalhes do comunicado aqui..." onChange={handleChange} value={formData.mensagem} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <InputField label="Data de Expiração (Opcional)" name="dataExpiracao" type="date" onChange={handleChange} value={formData.dataExpiracao} />
              <InputField label="URL do Anexo (Opcional)" name="arquivoAnexo" placeholder="Link para PDF/Imagem" onChange={handleChange} value={formData.arquivoAnexo} />
            </div>
          </div>

          <div className="bg-yellow-400 p-10 rounded-3xl flex flex-col justify-between shadow-xl">
            <div>
              <h2 className="font-black text-2xl uppercase mb-4 italic text-zinc-900">Broadcast</h2>
              <p className="font-black text-zinc-900 text-lg leading-snug">
                Comunicados publicados aqui ficarão visíveis no mural geral do sistema. Defina uma data de expiração caso seja um aviso temporário.
              </p>
            </div>
            <div className="flex flex-col gap-3 mt-10">
              <button type="submit" className="bg-zinc-900 text-white p-5 rounded-2xl font-black uppercase text-sm tracking-widest hover:bg-white hover:text-zinc-900 transition-all shadow-lg">Publicar Recado</button>
              <button type="button" onClick={() => setFormData(estadoInicial)} className="text-zinc-900 p-2 font-black uppercase text-xs hover:underline">Limpar Editor</button>
            </div>
          </div>
        </form>
      )}
      
      <section className="bg-white rounded-[2.5rem] shadow-md border border-zinc-200 overflow-hidden">
        <div className="p-8 border-b border-zinc-200 flex justify-between items-center bg-zinc-100/30 flex-wrap gap-4">
          <h2 className="font-black text-lg uppercase text-zinc-800 tracking-tighter">📌 Mural Interativo</h2>
          <div className="relative w-full max-w-md">
             <input type="text" placeholder="Buscar recado..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full px-6 py-4 rounded-2xl border border-zinc-300 text-sm font-bold text-zinc-900 focus:outline-none focus:ring-4 focus:ring-yellow-400/20" />
          </div>
        </div>

        <div className="p-8 bg-zinc-50/50 min-h-[400px]">
          {loading ? (
            <div className="flex justify-center items-center h-full text-zinc-500 font-black uppercase tracking-widest text-xl">
              Carregando mural...
            </div>
          ) : recadosFiltrados.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <span className="text-6xl mb-4 opacity-50">📭</span>
              <h3 className="font-black text-xl text-zinc-400 uppercase tracking-widest">Nenhum recado encontrado</h3>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
              {recadosFiltrados.map(recado => (
                <article key={recado.id_recado} className="bg-white border border-zinc-200 rounded-3xl shadow-sm hover:-translate-y-2 hover:shadow-xl transition-all duration-300 flex flex-col overflow-hidden">
                  
                  {/* Título do Recado */}
                  <div className="bg-yellow-400/10 p-6 border-b border-yellow-400/20 flex justify-between items-start">
                    <h3 className="font-black text-xl uppercase leading-tight text-zinc-900">
                      {recado.titulo}
                    </h3>
                  </div>

                  {/* Corpo da Mensagem */}
                  <div className="p-8 flex-grow flex flex-col gap-6">
                    <p className="text-zinc-700 font-bold text-base leading-relaxed whitespace-pre-wrap">
                      {recado.mensagem}
                    </p>
                    
                    {recado.arquivoAnexo && (
                      <div className="mt-auto">
                        <a href={recado.arquivoAnexo} target="_blank" rel="noreferrer" className="inline-flex w-max items-center gap-2 bg-zinc-100 text-zinc-900 px-4 py-3 rounded-xl font-black text-xs uppercase hover:bg-yellow-400 transition-colors">
                          📎 Acessar Anexo
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Rodapé: Metadados e Gestão */}
                  <div className="bg-zinc-50 p-6 border-t border-zinc-100 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div className="flex flex-col gap-1.5 text-xs font-bold w-full">
                      <span className="text-zinc-600 bg-white border border-zinc-200 px-3 py-1 rounded-lg w-max uppercase">
                        AUTOR: {recado.usuarioAutor?.login || 'SISTEMA'}
                      </span>
                      <span className="text-zinc-500 mt-1">
                        <span className="text-zinc-400">PUB:</span> {new Date(recado.dataPublicacao).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
                      </span>
                      {recado.dataExpiracao && (
                        <span className="text-red-500">
                          <span className="text-red-400">EXP:</span> {new Date(recado.dataExpiracao).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
                        </span>
                      )}
                    </div>

                    <div className="flex gap-2 shrink-0">
                      {temPermissao('RECADOS_WRITE') && (
                        <button onClick={() => router.push(`/views/recados/editar?id=${recado.id_recado}`)} className="bg-zinc-100 text-zinc-900 w-12 h-12 flex items-center justify-center text-xl rounded-xl hover:bg-yellow-400 transition-all" title="Editar Recado">
                          ✎
                        </button>
                      )}
                      {temPermissao('RECADOS_DELETE') && (
                        <button onClick={() => handleExcluir(recado.id_recado)} className="bg-zinc-100 text-zinc-400 w-12 h-12 flex items-center justify-center text-xl rounded-xl hover:bg-red-500 hover:text-white transition-all" title="Excluir Recado">
                          🗑
                        </button>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}