"use client";
import { useState, useEffect } from 'react';
import api from '../../../../utils/api';
import { useRouter, useSearchParams } from 'next/navigation'; 

const InputField = ({ label, name, placeholder, type = "text", onChange, value, className = "" }) => (
  <div className={className}>
    {/* Label agora em cinza escuro para máxima clareza */}
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

const SelectField = ({ label, name, children, onChange, value }) => (
  <div>
    <label className="block text-sm font-black text-zinc-700 uppercase tracking-wider mb-2">{label}</label>
    <select
      name={name} 
      value={value || ''} 
      onChange={onChange}
      className="w-full p-4 border border-zinc-300 rounded-xl text-lg font-bold text-zinc-900 focus:ring-4 focus:ring-yellow-400/30 bg-white transition-all outline-none appearance-none cursor-pointer"
    >
      {children}
    </select>
  </div>
);

export default function EditarAlunoPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get('id');

  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    nome: '', numeroMatricula: '', dataNascimento: '', rg: '', cpf: '',
    cep: '', logradouro: '', numero: '', bairro: '', cidade: '',
    telefonePrincipal: '', telefoneSecundario: '', anoEscolar: ''
  });

  useEffect(() => {
    if (!id) { router.push('/views/alunos'); return; }
    const carregarAluno = async () => {
      try {
        const res = await api.get(`/api/alunos/${id}`);
        const aluno = res.data;
        setFormData({
          nome: aluno.nome || '',
          numeroMatricula: aluno.numeroMatricula || '',
          dataNascimento: aluno.dataNascimento || '',
          rg: aluno.rg || '',
          cpf: aluno.cpf || '',
          anoEscolar: aluno.anoEscolar || '',
          telefonePrincipal: aluno.telefonePrincipal || '',
          telefoneSecundario: aluno.telefoneSecundario || '',
          cep: aluno.endereco?.cep || '',
          logradouro: aluno.endereco?.logradouro || '',
          numero: aluno.endereco?.numero || '',
          bairro: aluno.endereco?.bairro || '',
          cidade: aluno.endereco?.cidade || ''
        });
      } catch (err) {
        alert("Erro ao carregar dados do aluno.");
        router.push('/views/alunos'); 
      } finally { setLoading(false); }
    };
    carregarAluno();
  }, [id, router]);

  const handleChange = (e) => { setFormData({ ...formData, [e.target.name]: e.target.value }); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      nome: formData.nome, numeroMatricula: formData.numeroMatricula, dataNascimento: formData.dataNascimento,
      rg: formData.rg, cpf: formData.cpf, anoEscolar: formData.anoEscolar,
      telefonePrincipal: formData.telefonePrincipal, telefoneSecundario: formData.telefoneSecundario,
      endereco: { cep: formData.cep, logradouro: formData.logradouro, numero: formData.numero, bairro: formData.bairro, cidade: formData.cidade }
    };

    try {
      await api.put(`/api/alunos/editar/${id}`, payload);
      alert("Dados atualizados com sucesso!");
      router.push('/views/alunos'); 
    } catch (err) { alert("Erro ao atualizar aluno."); }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 text-xl font-black text-zinc-800">
        <span className="uppercase tracking-[0.2em] animate-pulse">Carregando Dados...</span>
      </div>
    );
  }

  return (
    <div className="p-10 bg-gray-50 min-h-screen text-zinc-900 font-sans">
      <header className="mb-10 flex flex-col gap-4">
        <button onClick={() => router.push('/views/alunos')} className="flex items-center gap-2 text-zinc-600 hover:text-zinc-900 transition-colors font-black text-sm uppercase tracking-widest w-fit">
          <span className="text-xl">←</span> Voltar para a listagem
        </button>
        <div>
          <h1 className="text-5xl font-black uppercase tracking-tighter italic">Editar Registro</h1>
          <div className="h-2 w-24 bg-yellow-400 mt-2 rounded-full"></div>
        </div>
      </header>
      
      <form onSubmit={handleSubmit} className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-zinc-200 space-y-8">
          <h2 className="font-black text-lg uppercase text-yellow-600 tracking-widest border-b border-zinc-100 pb-4">01. Perfil do Aluno</h2>
          <InputField label="Nome Completo" name="nome" onChange={handleChange} value={formData.nome} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InputField label="Nascimento" name="dataNascimento" type="date" onChange={handleChange} value={formData.dataNascimento} />
            <InputField label="CPF" name="cpf" onChange={handleChange} value={formData.cpf} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InputField label="RG" name="rg" onChange={handleChange} value={formData.rg} />
            <InputField label="Matrícula" name="numeroMatricula" onChange={handleChange} value={formData.numeroMatricula} />
          </div>
          <SelectField label="Ano Escolar" name="anoEscolar" onChange={handleChange} value={formData.anoEscolar}>
            <option value="">Selecione o ano</option>
            <option value="1º Ano Fundamental">1º Ano Fundamental</option>
            {/* Opções... */}
          </SelectField>
        </div>

        <div className="bg-white p-8 rounded-3xl shadow-sm border border-zinc-200 space-y-8">
          <h2 className="font-black text-lg uppercase text-zinc-700 tracking-widest border-b border-zinc-100 pb-4">02. Endereço e Contato</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InputField label="Telefone Principal" name="telefonePrincipal" onChange={handleChange} value={formData.telefonePrincipal} />
            <InputField label="Telefone Reserva" name="telefoneSecundario" onChange={handleChange} value={formData.telefoneSecundario} />
          </div>
          <InputField label="CEP" name="cep" onChange={handleChange} value={formData.cep} />
          <InputField label="Logradouro (Rua/Av)" name="logradouro" onChange={handleChange} value={formData.logradouro} />
          <div className="grid grid-cols-3 gap-6">
            <InputField label="Nº" name="numero" onChange={handleChange} value={formData.numero} />
            <InputField label="Bairro" name="bairro" onChange={handleChange} value={formData.bairro} className="col-span-2" />
          </div>
          <InputField label="Cidade" name="cidade" onChange={handleChange} value={formData.cidade} />
        </div>

        <div className="bg-zinc-900 p-8 rounded-3xl shadow-xl flex flex-col justify-between text-white">
          <div>
            <h2 className="font-black text-3xl uppercase mb-6 italic text-yellow-400">Salvar?</h2>
            <p className="text-zinc-200 text-lg font-bold leading-relaxed border-l-4 border-yellow-400 pl-6">
              Confirme se todos os dados foram revisados. A clareza das informações é essencial.
            </p>
          </div>
          <div className="flex flex-col gap-4 mt-12">
            <button type="submit" className="bg-yellow-400 text-zinc-900 p-5 rounded-2xl font-black uppercase text-lg hover:bg-white transition-all shadow-lg">
              Confirmar Edição
            </button>
            <button type="button" onClick={() => router.push('/views/alunos')} className="text-zinc-300 p-4 font-black uppercase text-sm hover:text-white transition-all tracking-widest underline decoration-yellow-400 decoration-2">
              Cancelar e Sair
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}