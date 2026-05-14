"use client";
import { useState, useEffect } from 'react';
import api from '../../../../utils/api';
import { useRouter, useSearchParams } from 'next/navigation'; 

// --- COMPONENTES UTILITÁRIOS ---
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

const SelectField = ({ label, name, children, onChange, value }) => (
  <div>
    <label className="block text-sm font-black text-zinc-700 uppercase tracking-wider mb-2">{label}</label>
    <select
      name={name} 
      value={value || ''} 
      onChange={onChange}
      className="w-full p-4 border border-zinc-300 rounded-xl text-lg font-bold text-zinc-900 focus:ring-4 focus:ring-yellow-400/30 bg-white transition-all outline-none appearance-none cursor-pointer shadow-sm"
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
    if (!id) { router.push('/views/cursos'); return; }

    const carregarCurso = async () => {
      try {
        const res = await api.get(`/api/cursos/${id}`);
        const curso = res.data;
        setFormData({
          nome: curso.nome || '',
          tipo: curso.tipo || '',
          cargaHorariaTotal: curso.cargaHorariaTotal || '',
          valorBase: curso.valorBase || '',
          faixaEtaria: curso.faixaEtaria || '',
          ativo: curso.ativo !== undefined ? String(curso.ativo) : 'true' 
        });
      } catch (err) {
        alert("Erro ao carregar dados do curso.");
        router.push('/views/cursos'); 
      } finally { setLoading(false); }
    };
    carregarCurso();
  }, [id, router]);

  const handleChange = (e) => { setFormData({ ...formData, [e.target.name]: e.target.value }); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      nome: formData.nome, tipo: formData.tipo, 
      cargaHorariaTotal: parseInt(formData.cargaHorariaTotal),
      valorBase: parseFloat(formData.valorBase), 
      faixaEtaria: formData.faixaEtaria, 
      ativo: formData.ativo === 'true'
    };

    try {
      await api.put(`/api/cursos/editar/${id}`, payload);
      alert("Nível atualizado com sucesso!");
      router.push('/views/cursos'); 
    } catch (err) { alert("Erro ao atualizar curso."); console.error(err); }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 text-xl font-black text-zinc-800">
        <span className="uppercase tracking-[0.2em] animate-pulse">Carregando Dados do Curso...</span>
      </div>
    );
  }

  return (
    <div className="p-10 bg-gray-50 min-h-screen text-zinc-900 font-sans">
      <header className="mb-10 flex flex-col gap-4">
        <button onClick={() => router.push('/views/cursos')} className="flex items-center gap-2 text-zinc-600 hover:text-zinc-900 transition-colors font-black text-sm uppercase tracking-widest w-fit">
          <span className="text-xl">←</span> Voltar para a listagem
        </button>
        <div>
          <h1 className="text-5xl font-black uppercase tracking-tighter italic text-zinc-900">Editar Nível / Curso</h1>
          <div className="h-2 w-24 bg-yellow-400 mt-2 rounded-full"></div>
        </div>
      </header>
      
      <form onSubmit={handleSubmit} className="grid grid-cols-1 xl:grid-cols-3 gap-8 mb-12">
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-zinc-200 space-y-8">
          <h2 className="font-black text-lg uppercase text-yellow-600 tracking-widest border-b border-zinc-100 pb-4">01. Perfil Atualizado</h2>
          <InputField label="Nome do Nível" name="nome" onChange={handleChange} value={formData.nome} />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <SelectField label="Tipo" name="tipo" onChange={handleChange} value={formData.tipo}>
              <option value="">Selecione...</option>
              <option value="Regular">Regular</option>
              <option value="Intensivo">Intensivo</option>
              <option value="Preparatório">Preparatório VIP</option>
            </SelectField>
            <InputField label="Faixa Etária" name="faixaEtaria" placeholder="Ex: 11 a 14 anos" onChange={handleChange} value={formData.faixaEtaria} />
          </div>
        </div>

        <div className="bg-white p-8 rounded-3xl shadow-sm border border-zinc-200 space-y-8">
          <h2 className="font-black text-lg uppercase text-zinc-700 tracking-widest border-b border-zinc-100 pb-4">02. Técnico & Comercial</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InputField label="Carga Horária (Hrs)" name="cargaHorariaTotal" type="number" onChange={handleChange} value={formData.cargaHorariaTotal} />
            <InputField label="Valor Base (R$)" name="valorBase" type="number" step="0.01" onChange={handleChange} value={formData.valorBase} />
          </div>
          <SelectField label="Status do Curso" name="ativo" onChange={handleChange} value={formData.ativo}>
            <option value="true">🟢 Ativo (Aberto para Matrículas)</option>
            <option value="false">🔴 Inativo (Turmas Fechadas)</option>
          </SelectField>
        </div>

        <div className="bg-zinc-900 p-8 rounded-3xl shadow-xl flex flex-col justify-between text-white border-4 border-white">
          <div>
            <h2 className="font-black text-3xl uppercase mb-6 italic text-yellow-400">Update Route?</h2>
            <p className="text-zinc-200 text-lg font-bold leading-relaxed border-l-4 border-yellow-400 pl-6">
              Você está alterando as configurações principais deste nível. Lembre-se que alterar o Valor Base não afeta alunos já matriculados, apenas novas matrículas.
            </p>
          </div>
          <div className="flex flex-col gap-4 mt-12">
            <button type="submit" className="bg-yellow-400 text-zinc-900 p-5 rounded-2xl font-black uppercase text-lg hover:bg-white transition-all shadow-lg">
              Confirmar Edição
            </button>
            <button type="button" onClick={() => router.push('/views/cursos')} className="text-zinc-300 p-4 font-black uppercase text-sm hover:text-white transition-all tracking-widest underline decoration-yellow-400 decoration-2">
              Cancelar Alterações
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}