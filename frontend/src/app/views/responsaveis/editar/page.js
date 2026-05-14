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
      className="w-full p-4 border border-zinc-300 rounded-xl text-lg font-bold text-zinc-900 focus:ring-4 focus:ring-yellow-400/30 focus:border-yellow-400 bg-white transition-all outline-none"
    />
  </div>
);

export default function EditarResponsavelPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get('id'); 

  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    nome: '', dataNascimento: '', rg: '', cpf: '',
    cep: '', logradouro: '', numero: '', bairro: '', cidade: '',
    telefonePrincipal: '', telefoneSecundario: ''
  });

  useEffect(() => {
    if (!id) { router.push('/views/responsaveis'); return; }

    const carregarResponsavel = async () => {
      try {
        const res = await api.get(`/api/responsaveis/${id}`);
        const resp = res.data;
        setFormData({
          nome: resp.nome || '',
          dataNascimento: resp.dataNascimento || '',
          rg: resp.rg || '',
          cpf: resp.cpf || '',
          telefonePrincipal: resp.telefonePrincipal || '',
          telefoneSecundario: resp.telefoneSecundario || '',
          cep: resp.endereco?.cep || '',
          logradouro: resp.endereco?.logradouro || '',
          numero: resp.endereco?.numero || '',
          bairro: resp.endereco?.bairro || '',
          cidade: resp.endereco?.cidade || ''
        });
      } catch (err) {
        alert("Erro ao carregar dados do responsável.");
        router.push('/views/responsaveis'); 
      } finally { setLoading(false); }
    };
    carregarResponsavel();
  }, [id, router]);

  const handleChange = (e) => { setFormData({ ...formData, [e.target.name]: e.target.value }); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      nome: formData.nome, dataNascimento: formData.dataNascimento, rg: formData.rg, cpf: formData.cpf,
      telefonePrincipal: formData.telefonePrincipal, telefoneSecundario: formData.telefoneSecundario,
      endereco: { cep: formData.cep, logradouro: formData.logradouro, numero: formData.numero, bairro: formData.bairro, cidade: formData.cidade }
    };

    try {
      await api.put(`/api/responsaveis/editar/${id}`, payload);
      alert("Responsável atualizado com sucesso!");
      router.push('/views/responsaveis'); 
    } catch (err) { alert("Erro ao atualizar dados."); }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 text-xl font-black text-zinc-800">
        <span className="uppercase tracking-[0.2em] animate-pulse">Carregando Responsável...</span>
      </div>
    );
  }

  return (
    <div className="p-10 bg-gray-50 min-h-screen text-zinc-900 font-sans">
      <header className="mb-10 flex flex-col gap-4">
        <button onClick={() => router.push('/views/responsaveis')} className="flex items-center gap-2 text-zinc-600 hover:text-zinc-900 transition-colors font-black text-sm uppercase tracking-widest w-fit">
          <span className="text-xl">←</span> Voltar para a listagem
        </button>
        <div>
          <h1 className="text-5xl font-black uppercase tracking-tighter italic text-zinc-900">Editar Responsável</h1>
          <div className="h-2 w-24 bg-yellow-400 mt-2 rounded-full"></div>
        </div>
      </header>
      
      <form onSubmit={handleSubmit} className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-zinc-200 space-y-8">
          <h2 className="font-black text-lg uppercase text-yellow-600 tracking-widest border-b border-zinc-100 pb-4">01. Identificação</h2>
          <InputField label="Nome Completo" name="nome" onChange={handleChange} value={formData.nome} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InputField label="Nascimento" name="dataNascimento" type="date" onChange={handleChange} value={formData.dataNascimento} />
            <InputField label="CPF" name="cpf" onChange={handleChange} value={formData.cpf} />
          </div>
          <InputField label="RG" name="rg" onChange={handleChange} value={formData.rg} />
        </div>

        <div className="bg-white p-8 rounded-3xl shadow-sm border border-zinc-200 space-y-8">
          <h2 className="font-black text-lg uppercase text-zinc-700 tracking-widest border-b border-zinc-100 pb-4">02. Contato & Endereço</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InputField label="Tel. Principal" name="telefonePrincipal" onChange={handleChange} value={formData.telefonePrincipal} />
            <InputField label="Tel. Reserva" name="telefoneSecundario" onChange={handleChange} value={formData.telefoneSecundario} />
          </div>
          <div className="grid grid-cols-3 gap-6">
            <InputField label="CEP" name="cep" onChange={handleChange} value={formData.cep} />
            <InputField label="Nº" name="numero" onChange={handleChange} value={formData.numero} />
            <InputField label="Bairro" name="bairro" onChange={handleChange} value={formData.bairro} />
          </div>
          <InputField label="Logradouro" name="logradouro" onChange={handleChange} value={formData.logradouro} />
          <InputField label="Cidade" name="cidade" onChange={handleChange} value={formData.cidade} />
        </div>

        <div className="bg-zinc-900 p-8 rounded-3xl shadow-xl flex flex-col justify-between text-white border-4 border-white">
          <div>
            <h2 className="font-black text-3xl uppercase mb-6 italic text-yellow-400">Salvar?</h2>
            <p className="text-zinc-200 text-lg font-bold leading-relaxed border-l-4 border-yellow-400 pl-6">
              Alterações no cadastro do responsável impactam diretamente na comunicação e faturamento.
            </p>
          </div>
          <div className="flex flex-col gap-4 mt-12">
            <button type="submit" className="bg-yellow-400 text-zinc-900 p-5 rounded-2xl font-black uppercase text-lg hover:bg-white transition-all shadow-lg">
              Salvar Alterações
            </button>
            <button type="button" onClick={() => router.push('/views/responsaveis')} className="text-zinc-300 p-4 font-black uppercase text-sm hover:text-white transition-all tracking-widest underline decoration-yellow-400 decoration-2">
              Cancelar e Sair
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}