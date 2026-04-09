"use client";
import { useState, useEffect } from 'react';
import axios from 'axios';
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

const SelectField = ({ label, name, children, onChange, value }) => (
  <div>
    <label className="block text-xs font-black text-zinc-500 uppercase tracking-widest mb-1">{label}</label>
    <select
      name={name} 
      value={value || ''} 
      onChange={onChange}
      className="w-full p-3 border-2 border-zinc-900 rounded-none text-sm focus:ring-0 focus:border-yellow-400 bg-white shadow-[4px_4px_0px_0px_rgba(24,24,27,1)] transition-all outline-none appearance-none"
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
    if (!id) {
        router.push('/views/alunos');
        return;
    }

    const carregarAluno = async () => {
      try {
        const res = await axios.get(`http://localhost:8080/api/alunos/${id}`);
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
      } finally {
        setLoading(false);
      }
    };

    carregarAluno();
  }, [id, router]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      nome: formData.nome, 
      numeroMatricula: formData.numeroMatricula, 
      dataNascimento: formData.dataNascimento,
      rg: formData.rg, 
      cpf: formData.cpf, 
      anoEscolar: formData.anoEscolar,
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
      await axios.put(`http://localhost:8080/api/alunos/editar/${id}`, payload);
      alert("Dados atualizados com sucesso!");
      router.push('/views/alunos'); 
    } catch (err) {
      alert("Erro ao atualizar aluno.");
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <span className="font-black uppercase tracking-widest animate-pulse">Carregando Dados do Estudante...</span>
      </div>
    );
  }

  return (
    <div className="p-10 bg-gray-100 min-h-screen text-zinc-900 font-sans">
      {/* HEADER NAVEGAÇÃO */}
      <header className="mb-12 flex flex-col gap-4">
        <button 
          onClick={() => router.push('/views/alunos')} 
          className="flex items-center gap-2 text-zinc-500 hover:text-zinc-900 transition-colors font-black text-xs uppercase tracking-widest w-fit"
        >
          <span className="text-lg">←</span> Voltar para a listagem
        </button>
        <div>
          <h1 className="text-4xl font-black uppercase tracking-tighter italic">Editar Aluno</h1>
          <div className="h-2 w-24 bg-yellow-400 mt-2"></div>
        </div>
      </header>
      
      {/* FORMULÁRIO DE EDIÇÃO */}
      <form onSubmit={handleSubmit} className="grid grid-cols-1 xl:grid-cols-3 gap-10 mb-12">
        
        {/* COLUNA 01: DADOS PESSOAIS */}
        <div className="bg-white p-8 border-4 border-zinc-900 shadow-[8px_8px_0px_0px_rgba(250,204,21,1)] space-y-6">
          <h2 className="font-black text-lg uppercase border-b-4 border-yellow-400 pb-2 mb-4">01. Perfil Atualizado</h2>
          <InputField label="Nome Completo" name="nome" onChange={handleChange} value={formData.nome} />
          <div className="grid grid-cols-2 gap-4">
            <InputField label="Nascimento" name="dataNascimento" type="date" onChange={handleChange} value={formData.dataNascimento} />
            <InputField label="CPF" name="cpf" onChange={handleChange} value={formData.cpf} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <InputField label="RG" name="rg" onChange={handleChange} value={formData.rg} />
            <InputField label="Matrícula" name="numeroMatricula" onChange={handleChange} value={formData.numeroMatricula} />
          </div>
          <SelectField label="Ano Escolar Regular" name="anoEscolar" onChange={handleChange} value={formData.anoEscolar}>
            <option value="">Selecione o ano</option>
            <option value="1º Ano Fundamental">1º Ano Fundamental</option>
            <option value="2º Ano Fundamental">2º Ano Fundamental</option>
            <option value="3º Ano Fundamental">3º Ano Fundamental</option>
            <option value="4º Ano Fundamental">4º Ano Fundamental</option>
            <option value="5º Ano Fundamental">5º Ano Fundamental</option>
            <option value="6º Ano Fundamental">6º Ano Fundamental</option>
            <option value="7º Ano Fundamental">7º Ano Fundamental</option>
            <option value="8º Ano Fundamental">8º Ano Fundamental</option>
            <option value="9º Ano Fundamental">9º Ano Fundamental</option>
            <option value="1º Ano Médio">1º Ano Médio</option>
            <option value="2º Ano Médio">2º Ano Médio</option>
            <option value="3º Ano Médio">3º Ano Médio</option>
            <option value="Ensino Medio Completo">Ensino Medio Completo</option>
          </SelectField>
        </div>

        {/* COLUNA 02: ENDEREÇO E CONTATO */}
        <div className="bg-white p-8 border-4 border-zinc-900 shadow-[8px_8px_0px_0px_rgba(24,24,27,1)] space-y-6">
          <h2 className="font-black text-lg uppercase border-b-4 border-yellow-400 pb-2 mb-4">02. Localização</h2>
          <div className="grid grid-cols-2 gap-4">
            <InputField label="Telefone Principal" name="telefonePrincipal" onChange={handleChange} value={formData.telefonePrincipal} />
            <InputField label="Telefone Reserva" name="telefoneSecundario" onChange={handleChange} value={formData.telefoneSecundario} />
          </div>
          <InputField label="CEP" name="cep" onChange={handleChange} value={formData.cep} />
          <InputField label="Logradouro" name="logradouro" onChange={handleChange} value={formData.logradouro} />
          <div className="grid grid-cols-3 gap-4">
            <InputField label="Nº" name="numero" onChange={handleChange} value={formData.numero} />
            <InputField label="Bairro" name="bairro" onChange={handleChange} value={formData.bairro} className="col-span-2" />
          </div>
          <InputField label="Cidade" name="cidade" onChange={handleChange} value={formData.cidade} />
        </div>

        {/* COLUNA 03: CONFIRMAÇÃO */}
        <div className="bg-yellow-400 p-8 border-4 border-zinc-900 shadow-[8px_8px_0px_0px_rgba(24,24,27,1)] flex flex-col justify-between">
          <div>
            <h2 className="font-black text-2xl uppercase mb-4 italic italic">Update?</h2>
            <p className="font-bold text-zinc-900 text-sm leading-tight border-l-4 border-zinc-900 pl-4">
              Você está prestes a sobrescrever as informações deste aluno. Certifique-se de que os novos dados foram validados pela secretaria.
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
              onClick={() => router.push('/views/alunos')} 
              className="bg-transparent text-zinc-900 p-4 font-bold uppercase text-xs border-2 border-dashed border-zinc-900 hover:bg-white transition-all text-center"
            >
              Cancelar Alterações
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}