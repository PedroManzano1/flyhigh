"use client";
import { useState, useEffect, useContext } from 'react';
import api from '../../../utils/api';
import { useRouter } from 'next/navigation'; 
import { AuthContext } from '../../../context/authContext'; 

const InputField = ({ label, name, placeholder, type = "text", onChange, value, className = "" }) => (
  <div className={className}>
    <label className="block text-xs font-black text-zinc-800 uppercase tracking-widest mb-1">{label}</label>
    <input type={type} name={name} value={value || ''} onChange={onChange} placeholder={placeholder} className="w-full p-3 border-2 border-zinc-900 rounded-none text-sm focus:ring-0 focus:border-yellow-400 bg-white shadow-[4px_4px_0px_0px_rgba(24,24,27,1)] transition-all focus:translate-x-[2px] focus:translate-y-[2px] focus:shadow-none outline-none" />
  </div>
);

const TextareaField = ({ label, name, placeholder, onChange, value, className = "" }) => (
  <div className={className}>
    <label className="block text-xs font-black text-zinc-800 uppercase tracking-widest mb-1">{label}</label>
    <textarea name={name} value={value || ''} onChange={onChange} placeholder={placeholder} className="w-full p-3 h-32 resize-none border-2 border-zinc-900 rounded-none text-sm focus:ring-0 focus:border-yellow-400 bg-white shadow-[4px_4px_0px_0px_rgba(24,24,27,1)] transition-all focus:translate-x-[2px] focus:translate-y-[2px] focus:shadow-none outline-none" />
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
          <div className="h-2 w-24 bg-yellow-400 mt-2"></div>
        </div>
        <button onClick={() => router.push('/')} className="flex items-center gap-2 px-6 py-3 bg-zinc-900 text-white font-bold uppercase text-xs tracking-widest hover:bg-yellow-400 hover:text-zinc-900 transition-all shadow-[4px_4px_0px_0px_rgba(250,204,21,1)]">
          <span>⌂</span> Voltar ao Início
        </button>
      </header>
      
      {temPermissao('RECADOS_WRITE') && (
        <form onSubmit={handleSubmit} className="grid grid-cols-1 xl:grid-cols-3 gap-10 mb-16">
          <div className="bg-white p-8 border-4 border-zinc-900 shadow-[8px_8px_0px_0px_rgba(250,204,21,1)] space-y-6 xl:col-span-2">
            <h2 className="font-black text-lg uppercase border-b-4 border-yellow-400 pb-2 mb-4">01. Redigir Comunicado</h2>
            <InputField label="Título do Recado" name="titulo" placeholder="Ex: Feriado Nacional - Suspensão de Aulas" onChange={handleChange} value={formData.titulo} />
            <TextareaField label="Mensagem" name="mensagem" placeholder="Escreva os detalhes do comunicado aqui..." onChange={handleChange} value={formData.mensagem} />
            <div className="grid grid-cols-2 gap-4">
              <InputField label="Data de Expiração (Opcional)" name="dataExpiracao" type="date" onChange={handleChange} value={formData.dataExpiracao} />
              <InputField label="URL do Anexo (Opcional)" name="arquivoAnexo" placeholder="Link para PDF/Imagem" onChange={handleChange} value={formData.arquivoAnexo} />
            </div>
          </div>

          <div className="bg-yellow-400 p-8 border-4 border-zinc-900 shadow-[8px_8px_0px_0px_rgba(24,24,27,1)] flex flex-col justify-between">
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
      
      {/* MURAL DE RECADOS - NOVO LAYOUT EM GRID */}
      <section className="bg-white border-4 border-zinc-900 shadow-[12px_12px_0px_0px_rgba(24,24,27,1)] overflow-hidden">
        <div className="bg-zinc-900 p-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          <h2 className="font-black text-xl text-white uppercase tracking-tighter italic">📌 Mural Interativo</h2>
          <input 
            type="text" 
            placeholder="BUSCAR RECADO..." 
            value={searchTerm} 
            onChange={e => setSearchTerm(e.target.value)} 
            className="w-full max-w-md pl-4 py-3 bg-white text-sm font-bold uppercase focus:outline-none border-2 border-transparent focus:border-yellow-400 transition-colors" 
          />
        </div>

        <div className="p-8 bg-zinc-50 min-h-[400px]">
          {loading ? (
            <div className="flex justify-center items-center h-full text-zinc-400 font-bold uppercase tracking-widest">
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
                <article 
                  key={recado.id_recado} 
                  className="bg-white border-4 border-zinc-900 shadow-[8px_8px_0px_0px_rgba(24,24,27,1)] flex flex-col relative group hover:-translate-y-1 hover:shadow-[12px_12px_0px_0px_rgba(250,204,21,1)] transition-all"
                >
                  {/* Título do Recado */}
                  <div className="bg-yellow-400 p-5 border-b-4 border-zinc-900 flex justify-between items-start">
                    <h3 className="font-black text-xl uppercase leading-tight text-zinc-900">
                      {recado.titulo}
                    </h3>
                  </div>

                  {/* Corpo da Mensagem */}
                  <div className="p-6 flex-grow flex flex-col gap-6">
                    <p className="text-zinc-800 font-bold text-base leading-relaxed whitespace-pre-wrap">
                      {recado.mensagem}
                    </p>
                    
                    {recado.arquivoAnexo && (
                      <div className="mt-auto">
                        <a 
                          href={recado.arquivoAnexo} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="inline-flex w-max items-center gap-2 bg-yellow-100 text-yellow-900 px-4 py-2 border-2 border-zinc-900 font-black text-xs uppercase shadow-[2px_2px_0px_0px_rgba(24,24,27,1)] hover:bg-zinc-900 hover:text-yellow-400 transition-colors"
                        >
                          📎 Acessar Anexo Completo
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Rodapé: Metadados e Gestão */}
                  <div className="bg-zinc-100 p-4 border-t-4 border-zinc-900 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div className="flex flex-col gap-1 text-[11px] font-mono font-bold w-full">
                      <span className="text-zinc-800 bg-white border border-zinc-300 px-2 py-0.5 w-max">
                        AUTOR: {recado.usuarioAutor?.login || 'SISTEMA'}
                      </span>
                      <span className="text-zinc-600">
                        <span className="text-zinc-400">PUB:</span> {new Date(recado.dataPublicacao).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
                      </span>
                      {recado.dataExpiracao && (
                        <span className="text-red-600">
                          <span className="text-red-400">EXP:</span> {new Date(recado.dataExpiracao).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
                        </span>
                      )}
                    </div>

                    <div className="flex gap-2 shrink-0">
                      {temPermissao('RECADOS_WRITE') && (
                        <button 
                          onClick={() => router.push(`/views/recados/editar?id=${recado.id_recado}`)} 
                          className="bg-white text-zinc-900 w-10 h-10 flex items-center justify-center text-lg hover:bg-yellow-400 border-2 border-zinc-900 shadow-[2px_2px_0px_0px_rgba(24,24,27,1)] transition-colors"
                          title="Editar Recado"
                        >
                          ✎
                        </button>
                      )}
                      {temPermissao('RECADOS_DELETE') && (
                        <button 
                          onClick={() => handleExcluir(recado.id_recado)} 
                          className="bg-white text-zinc-900 w-10 h-10 flex items-center justify-center text-lg hover:bg-red-500 hover:text-white border-2 border-zinc-900 shadow-[2px_2px_0px_0px_rgba(24,24,27,1)] transition-colors"
                          title="Excluir Recado"
                        >
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