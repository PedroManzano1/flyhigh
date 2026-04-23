"use client";
import { useState, useEffect } from 'react';
import api from '../../../../utils/api';
import { useRouter, useSearchParams } from 'next/navigation'; 

const InputField = ({ label, name, placeholder, type = "text", onChange, value, className = "" }) => (
  <div className={className}>
    <label className="block text-xs font-black text-zinc-500 uppercase tracking-widest mb-1">{label}</label>
    <input
      type={type} 
      name={name} 
      value={value || ''} 
      onChange={onChange} 
      placeholder={placeholder}
      className="w-full p-3 border-2 border-zinc-900 rounded-none text-sm focus:ring-0 focus:border-emerald-400 bg-white shadow-[4px_4px_0px_0px_rgba(24,24,27,1)] transition-all focus:translate-x-[2px] focus:translate-y-[2px] focus:shadow-none outline-none"
    />
  </div>
);

const TextareaField = ({ label, name, placeholder, onChange, value, className = "" }) => (
  <div className={className}>
    <label className="block text-xs font-black text-zinc-500 uppercase tracking-widest mb-1">{label}</label>
    <textarea 
      name={name} 
      value={value || ''} 
      onChange={onChange} 
      placeholder={placeholder} 
      className="w-full p-3 h-48 resize-none border-2 border-zinc-900 rounded-none text-sm focus:ring-0 focus:border-emerald-400 bg-white shadow-[4px_4px_0px_0px_rgba(24,24,27,1)] transition-all focus:translate-x-[2px] focus:translate-y-[2px] focus:shadow-none outline-none" 
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
    if (!id) {
        router.push('/views/recados');
        return;
    }

    const carregarRecado = async () => {
      try {
        const res = await api.get(`/api/recados/${id}`);
        const recado = res.data;
        
        setFormData({
          titulo: recado.titulo || '',
          mensagem: recado.mensagem || '',
          dataExpiracao: recado.dataExpiracao || '',
          arquivoAnexo: recado.arquivoAnexo || '',
          usuarioAutor: recado.usuarioAutor // Mantemos o objeto do autor para não perdê-lo no PUT
        });
      } catch (err) {
        alert("Erro ao carregar dados do recado.");
        router.push('/views/recados'); 
      } finally {
        setLoading(false);
      }
    };

    carregarRecado();
  }, [id, router]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

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
    } catch (err) {
      alert("Erro ao atualizar o recado.");
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <span className="font-black uppercase tracking-widest animate-pulse text-emerald-600">Acessando Mural...</span>
      </div>
    );
  }

  return (
    <div className="p-10 bg-gray-100 min-h-screen text-zinc-900 font-sans">
      <header className="mb-12 flex flex-col gap-4">
        <button 
          onClick={() => router.push('/views/recados')} 
          className="flex items-center gap-2 text-zinc-500 hover:text-zinc-900 transition-colors font-black text-xs uppercase tracking-widest w-fit"
        >
          <span className="text-lg">←</span> Voltar para o mural
        </button>
        <div>
          <h1 className="text-4xl font-black uppercase tracking-tighter italic">Editar Recado</h1>
          <div className="h-2 w-24 bg-emerald-400 mt-2"></div>
        </div>
      </header>
      
      <form onSubmit={handleSubmit} className="grid grid-cols-1 xl:grid-cols-3 gap-10 mb-12">
        <div className="bg-white p-8 border-4 border-zinc-900 shadow-[8px_8px_0px_0px_rgba(52,211,153,1)] space-y-6 xl:col-span-2">
          <h2 className="font-black text-lg uppercase border-b-4 border-emerald-400 pb-2 mb-4">Revisar Conteúdo</h2>
          <InputField label="Título do Recado" name="titulo" onChange={handleChange} value={formData.titulo} />
          <TextareaField label="Mensagem Completa" name="mensagem" onChange={handleChange} value={formData.mensagem} />
          
          <div className="grid grid-cols-2 gap-4">
            <InputField label="Nova Data de Expiração" name="dataExpiracao" type="date" onChange={handleChange} value={formData.dataExpiracao} />
            <InputField label="Link do Anexo" name="arquivoAnexo" onChange={handleChange} value={formData.arquivoAnexo} />
          </div>
        </div>

        <div className="bg-emerald-400 p-8 border-4 border-zinc-900 shadow-[8px_8px_0px_0px_rgba(24,24,27,1)] flex flex-col justify-between">
          <div>
            <h2 className="font-black text-2xl uppercase mb-4 italic">Update?</h2>
            <p className="font-bold text-zinc-900 text-sm leading-tight border-l-4 border-zinc-900 pl-4">
              Ao salvar, a versão anterior deste comunicado será substituída permanentemente no quadro de avisos da escola.
            </p>
          </div>
          <div className="flex flex-col gap-4 mt-10">
            <button 
              type="submit" 
              className="bg-zinc-900 text-white p-4 font-black uppercase tracking-[0.2em] hover:bg-white hover:text-zinc-900 transition-all border-2 border-zinc-900"
            >
              Confirmar Edição
            </button>
            <button 
              type="button" 
              onClick={() => router.push('/views/recados')} 
              className="bg-transparent text-zinc-900 p-4 font-bold uppercase text-xs border-2 border-dashed border-zinc-900 hover:bg-white transition-all text-center"
            >
              Descartar Mudanças
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}