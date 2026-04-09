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

export default function EditarCursoPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get('id');

  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    nome: '', tipo: '', cargaHorariaTotal: '', valorBase: '', faixaEtaria: '', ativo: 'true'
  });

  useEffect(() => {
    if (!id) {
        router.push('/views/cursos');
        return;
    }

    const carregarCurso = async () => {
      try {
        const res = await axios.get(`http://localhost:8080/api/cursos/${id}`);
        const curso = res.data;
        
        setFormData({
          nome: curso.nome || '',
          tipo: curso.tipo || '',
          cargaHorariaTotal: curso.cargaHorariaTotal || '',
          valorBase: curso.valorBase || '',
          faixaEtaria: curso.faixaEtaria || '',
          ativo: curso.ativo !== undefined ? String(curso.ativo) : 'true' // Convertendo boolean da API para string pro Select
        });
      } catch (err) {
        alert("Erro ao carregar dados do curso.");
        router.push('/views/cursos'); 
      } finally {
        setLoading(false);
      }
    };

    carregarCurso();
  }, [id, router]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      nome: formData.nome, 
      tipo: formData.tipo, 
      cargaHorariaTotal: parseInt(formData.cargaHorariaTotal),
      valorBase: parseFloat(formData.valorBase), 
      faixaEtaria: formData.faixaEtaria, 
      ativo: formData.ativo === 'true'
    };

    try {
      await axios.put(`http://localhost:8080/api/cursos/editar/${id}`, payload);
      alert("Nível atualizado com sucesso!");
      router.push('/views/cursos'); 
    } catch (err) {
      alert("Erro ao atualizar curso.");
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <span className="font-black uppercase tracking-widest animate-pulse">Carregando Dados do Curso...</span>
      </div>
    );
  }

  return (
    <div className="p-10 bg-gray-100 min-h-screen text-zinc-900 font-sans">
      {/* HEADER NAVEGAÇÃO */}
      <header className="mb-12 flex flex-col gap-4">
        <button 
          onClick={() => router.push('/views/cursos')} 
          className="flex items-center gap-2 text-zinc-500 hover:text-zinc-900 transition-colors font-black text-xs uppercase tracking-widest w-fit"
        >
          <span className="text-lg">←</span> Voltar para a listagem
        </button>
        <div>
          <h1 className="text-4xl font-black uppercase tracking-tighter italic">Editar Nível / Curso</h1>
          <div className="h-2 w-24 bg-yellow-400 mt-2"></div>
        </div>
      </header>
      
      {/* FORMULÁRIO DE EDIÇÃO */}
      <form onSubmit={handleSubmit} className="grid grid-cols-1 xl:grid-cols-3 gap-10 mb-12">
        
        {/* COLUNA 01: DADOS DO CURSO */}
        <div className="bg-white p-8 border-4 border-zinc-900 shadow-[8px_8px_0px_0px_rgba(250,204,21,1)] space-y-6">
          <h2 className="font-black text-lg uppercase border-b-4 border-yellow-400 pb-2 mb-4">01. Perfil Atualizado</h2>
          <InputField label="Nome do Nível" name="nome" onChange={handleChange} value={formData.nome} />
          
          <div className="grid grid-cols-2 gap-4">
            <SelectField label="Tipo" name="tipo" onChange={handleChange} value={formData.tipo}>
              <option value="">Selecione...</option>
              <option value="Regular">Regular</option>
              <option value="Intensivo">Intensivo</option>
              <option value="Preparatório">Preparatório VIP</option>
            </SelectField>
            
            <InputField 
              label="Faixa Etária" 
              name="faixaEtaria" 
              placeholder="Ex: 11 a 14 anos" 
              onChange={handleChange} 
              value={formData.faixaEtaria} 
            />
          </div>
        </div>

        {/* COLUNA 02: DADOS TÉCNICOS E COMERCIAIS */}
        <div className="bg-white p-8 border-4 border-zinc-900 shadow-[8px_8px_0px_0px_rgba(24,24,27,1)] space-y-6">
          <h2 className="font-black text-lg uppercase border-b-4 border-yellow-400 pb-2 mb-4">02. Técnico & Comercial</h2>
          <div className="grid grid-cols-2 gap-4">
            <InputField label="Carga Horária (Hrs)" name="cargaHorariaTotal" type="number" onChange={handleChange} value={formData.cargaHorariaTotal} />
            <InputField label="Valor Base (R$)" name="valorBase" type="number" step="0.01" onChange={handleChange} value={formData.valorBase} />
          </div>
          <SelectField label="Status do Curso" name="ativo" onChange={handleChange} value={formData.ativo}>
            <option value="true">🟢 Ativo (Aberto para Matrículas)</option>
            <option value="false">🔴 Inativo (Turmas Fechadas)</option>
          </SelectField>
        </div>

        {/* COLUNA 03: CONFIRMAÇÃO */}
        <div className="bg-yellow-400 p-8 border-4 border-zinc-900 shadow-[8px_8px_0px_0px_rgba(24,24,27,1)] flex flex-col justify-between">
          <div>
            <h2 className="font-black text-2xl uppercase mb-4 italic">Update Route?</h2>
            <p className="font-bold text-zinc-900 text-sm leading-tight border-l-4 border-zinc-900 pl-4">
              Você está alterando as configurações principais deste nível. Lembre-se que alterar o Valor Base não afeta alunos já matriculados, apenas novas matrículas.
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
              onClick={() => router.push('/views/cursos')} 
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