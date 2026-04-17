"use client";
import { useState, useEffect } from 'react';
import api from '../../../../utils/api';
import { useRouter, useSearchParams } from 'next/navigation'; 

// --- COMPONENTES UTILITÁRIOS (ESTILO FLYHIGH) ---
const InputField = ({ label, name, placeholder, type = "text", onChange, value, className = "" }) => (
  <div className={className}>
    <label className="block text-xs font-black text-zinc-500 uppercase tracking-widest mb-1">{label}</label>
    <input
      type={type} 
      name={name} 
      value={value || ''} 
      onChange={onChange} 
      placeholder={placeholder}
      className="w-full p-3 border-2 border-zinc-900 rounded-none text-sm focus:ring-0 focus:border-yellow-400 bg-white shadow-[4px_4px_0px_0px_rgba(24,24,27,1)] transition-all focus:translate-x-[2px] focus:translate-y-[2px] focus:shadow-none outline-none"
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
    if (!id) {
        router.push('/views/responsaveis');
        return;
    }

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
      } finally {
        setLoading(false);
      }
    };

    carregarResponsavel();
  }, [id, router]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      nome: formData.nome,
      dataNascimento: formData.dataNascimento,
      rg: formData.rg,
      cpf: formData.cpf,
      telefonePrincipal: formData.telefonePrincipal,
      telefoneSecundario: formData.telefoneSecundario,
      endereco: {
        cep: formData.cep,
        logradouro: formData.logradouro,
        numero: formData.numero,
        bairro: formData.bairro,
        cidade: formData.cidade
      }
    };

    try {
      await api.put(`/api/responsaveis/editar/${id}`, payload);
      alert("Responsável atualizado com sucesso!");
      router.push('/views/responsaveis'); 
    } catch (err) {
      alert("Erro ao atualizar dados. Verifique a conexão com o servidor.");
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <span className="font-black uppercase tracking-widest animate-pulse">Carregando Dados do Responsavel...</span>
      </div>
    );
  }

  return (
    <div className="p-10 bg-gray-100 min-h-screen text-zinc-900 font-sans">
      <header className="mb-12 flex flex-col gap-4">
        <button 
          onClick={() => router.push('/views/responsaveis')} 
          className="flex items-center gap-2 text-zinc-500 hover:text-zinc-900 transition-colors font-black text-xs uppercase tracking-widest w-fit"
        >
          <span className="text-lg">←</span> Voltar para a listagem
        </button>
        <div>
          <h1 className="text-4xl font-black uppercase tracking-tighter italic text-zinc-900">Editar Responsável</h1>
          <div className="h-2 w-24 bg-yellow-400 mt-2"></div>
        </div>
      </header>
      
      <form onSubmit={handleSubmit} className="grid grid-cols-1 xl:grid-cols-3 gap-10 mb-12">
        <div className="bg-white p-8 border-4 border-zinc-900 shadow-[8px_8px_0px_0px_rgba(250,204,21,1)] space-y-6">
          <h2 className="font-black text-lg uppercase border-b-4 border-yellow-400 pb-2 mb-4">01. Identificação</h2>
          <InputField label="Nome Completo" name="nome" onChange={handleChange} value={formData.nome} />
          <div className="grid grid-cols-2 gap-4">
            <InputField label="Nascimento" name="dataNascimento" type="date" onChange={handleChange} value={formData.dataNascimento} />
            <InputField label="CPF" name="cpf" onChange={handleChange} value={formData.cpf} />
          </div>
          <InputField label="RG" name="rg" onChange={handleChange} value={formData.rg} />
        </div>

        <div className="bg-white p-8 border-4 border-zinc-900 shadow-[8px_8px_0px_0px_rgba(24,24,27,1)] space-y-6">
          <h2 className="font-black text-lg uppercase border-b-4 border-yellow-400 pb-2 mb-4">02. Contato & Endereço</h2>
          <div className="grid grid-cols-2 gap-4">
            <InputField label="Tel. Principal" name="telefonePrincipal" onChange={handleChange} value={formData.telefonePrincipal} />
            <InputField label="Tel. Reserva" name="telefoneSecundario" onChange={handleChange} value={formData.telefoneSecundario} />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <InputField label="CEP" name="cep" onChange={handleChange} value={formData.cep} />
            <InputField label="Nº" name="numero" onChange={handleChange} value={formData.numero} />
            <InputField label="Bairro" name="bairro" onChange={handleChange} value={formData.bairro} />
          </div>
          <InputField label="Logradouro" name="logradouro" onChange={handleChange} value={formData.logradouro} />
          <InputField label="Cidade" name="cidade" onChange={handleChange} value={formData.cidade} />
        </div>

        <div className="bg-yellow-400 p-8 border-4 border-zinc-900 shadow-[8px_8px_0px_0px_rgba(24,24,27,1)] flex flex-col justify-between">
          <div>
            <h2 className="font-black text-2xl uppercase mb-4 italic">Confirm Changes</h2>
            <p className="font-bold text-zinc-900 text-sm leading-tight border-l-4 border-zinc-900 pl-4">
              Atenção: alterações no cadastro do responsável impactam diretamente na comunicação e faturamento dos alunos vinculados.
            </p>
          </div>
          <div className="flex flex-col gap-4 mt-10">
            <button 
              type="submit" 
              className="bg-zinc-900 text-white p-4 font-black uppercase tracking-[0.2em] hover:bg-white hover:text-zinc-900 transition-all border-2 border-zinc-900 shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)]"
            >
              Salvar Alterações
            </button>
            <button 
              type="button" 
              onClick={() => router.push('/views/responsaveis')} 
              className="bg-transparent text-zinc-900 p-4 font-bold uppercase text-xs border-2 border-dashed border-zinc-900 hover:bg-white transition-all text-center"
            >
              Cancelar Edição
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}