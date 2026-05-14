"use client";
import { useState, useEffect } from 'react';
import api from '../../../../utils/api';
import { useRouter, useSearchParams } from 'next/navigation'; 

const InputField = ({ label, name, placeholder, type = "text", onChange, value, className = "" }) => (
  <div className={className}>
    <label className="block text-sm font-black text-zinc-700 uppercase tracking-wider mb-2">{label}</label>
    <input
      type={type} 
      name={name} 
      value={value || ''} 
      onChange={onChange} 
      placeholder={placeholder}
      className="w-full p-4 border border-zinc-300 rounded-xl text-lg font-bold text-zinc-900 focus:ring-4 focus:ring-yellow-400/30 focus:border-yellow-400 bg-white transition-all outline-none shadow-sm"
    />
  </div>
);

const TextareaField = ({ label, name, placeholder, onChange, value, className = "" }) => (
  <div className={className}>
    <label className="block text-sm font-black text-zinc-700 uppercase tracking-wider mb-2">{label}</label>
    <textarea 
      name={name} 
      value={value || ''} 
      onChange={onChange} 
      placeholder={placeholder} 
      className="w-full p-4 h-48 resize-none border border-zinc-300 rounded-xl text-lg font-bold text-zinc-900 focus:ring-4 focus:ring-yellow-400/30 focus:border-yellow-400 bg-white transition-all outline-none shadow-sm" 
    />
  </div>
);

export default function EditarRecadoPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get('id');

  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    titulo: '', mensagem: '', dataExpiracao: '', arquivoAnexo: '', usuarioAutor: null
  });

  useEffect(() => {
    if (!id) { router.push('/views/recados'); return; }

    const carregarRecado = async () => {
      try {
        const res = await api.get(`/api/recados/${id}`);
        const recado = res.data;
        
        setFormData({
          titulo: recado.titulo || '',
          mensagem: recado.mensagem || '',
          dataExpiracao: recado.dataExpiracao || '',
          arquivoAnexo: recado.arquivoAnexo || '',
          usuarioAutor: recado.usuarioAutor 
        });
      } catch (err) {
        alert("Erro ao carregar dados do recado.");
        router.push('/views/recados'); 
      } finally { setLoading(false); }
    };
    carregarRecado();
  }, [id, router]);

  const handleChange = (e) => { setFormData({ ...formData, [e.target.name]: e.target.value }); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      titulo: formData.titulo, 
      mensagem: formData.mensagem,
      dataExpiracao: formData.dataExpiracao || null,
      arquivoAnexo: formData.arquivoAnexo,
      usuarioAutor: formData.usuarioAutor 
    };

    try {
      await api.put(`/api/recados/editar/${id}`, payload);
      alert("Recado atualizado com sucesso!");
      router.push('/views/recados'); 
    } catch (err) { alert("Erro ao atualizar o recado."); console.error(err); }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 text-xl font-black text-zinc-800">
        <span className="uppercase tracking-[0.2em] animate-pulse">Acessando Mural...</span>
      </div>
    );
  }

  return (
    <div className="p-10 bg-gray-50 min-h-screen text-zinc-900 font-sans">
      <header className="mb-10 flex flex-col gap-4">
        <button onClick={() => router.push('/views/recados')} className="flex items-center gap-2 text-zinc-600 hover:text-zinc-900 transition-colors font-black text-sm uppercase tracking-widest w-fit">
          <span className="text-xl">←</span> Voltar para o mural
        </button>
        <div>
          <h1 className="text-5xl font-black uppercase tracking-tighter italic text-zinc-900">Editar Recado</h1>
          <div className="h-2 w-24 bg-yellow-400 mt-2 rounded-full"></div>
        </div>
      </header>
      
      <form onSubmit={handleSubmit} className="grid grid-cols-1 xl:grid-cols-3 gap-8 mb-12">
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-zinc-200 space-y-8 xl:col-span-2">
          <h2 className="font-black text-lg uppercase text-yellow-600 tracking-widest border-b border-zinc-100 pb-4">Revisar Conteúdo</h2>
          <InputField label="Título do Recado" name="titulo" onChange={handleChange} value={formData.titulo} />
          <TextareaField label="Mensagem Completa" name="mensagem" onChange={handleChange} value={formData.mensagem} />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InputField label="Nova Data de Expiração" name="dataExpiracao" type="date" onChange={handleChange} value={formData.dataExpiracao} />
            <InputField label="Link do Anexo" name="arquivoAnexo" onChange={handleChange} value={formData.arquivoAnexo} />
          </div>
        </div>

        <div className="bg-zinc-900 p-8 rounded-3xl shadow-xl flex flex-col justify-between text-white border-4 border-white">
          <div>
            <h2 className="font-black text-3xl uppercase mb-6 italic text-yellow-400">Update?</h2>
            <p className="text-zinc-200 text-lg font-bold leading-relaxed border-l-4 border-yellow-400 pl-6">
              Ao salvar, a versão anterior deste comunicado será substituída permanentemente no quadro de avisos da escola.
            </p>
          </div>
          <div className="flex flex-col gap-4 mt-12">
            <button type="submit" className="bg-yellow-400 text-zinc-900 p-5 rounded-2xl font-black uppercase text-lg hover:bg-white transition-all shadow-lg">
              Confirmar Edição
            </button>
            <button type="button" onClick={() => router.push('/views/recados')} className="text-zinc-300 p-4 font-black uppercase text-sm hover:text-white transition-all tracking-widest underline decoration-yellow-400 decoration-2">
              Descartar Mudanças
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}