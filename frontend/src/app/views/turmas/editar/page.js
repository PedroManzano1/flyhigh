"use client";
import { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter, useSearchParams } from 'next/navigation'; 

const InputField = ({ label, name, placeholder, type = "text", onChange, value, className = "" }) => (
  <div className={className}>
    <label className="block text-xs font-black text-zinc-500 uppercase tracking-widest mb-1">{label}</label>
    <input type={type} name={name} value={value || ''} onChange={onChange} placeholder={placeholder} className="w-full p-3 border-2 border-zinc-900 rounded-none text-sm focus:ring-0 focus:border-yellow-400 bg-white shadow-[4px_4px_0px_0px_rgba(24,24,27,1)] transition-all focus:translate-x-[2px] focus:translate-y-[2px] focus:shadow-none outline-none" />
  </div>
);

const SelectField = ({ label, name, children, onChange, value }) => (
  <div>
    <label className="block text-xs font-black text-zinc-500 uppercase tracking-widest mb-1">{label}</label>
    <select name={name} value={value || ''} onChange={onChange} className="w-full p-3 border-2 border-zinc-900 rounded-none text-sm focus:ring-0 focus:border-yellow-400 bg-white shadow-[4px_4px_0px_0px_rgba(24,24,27,1)] transition-all outline-none appearance-none">
      {children}
    </select>
  </div>
);

export default function EditarTurmaPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get('id');

  const [loading, setLoading] = useState(true);
  const [cursos, setCursos] = useState([]);
  const [formData, setFormData] = useState({
    codigoTurma: '', id_curso: '', diasSemana: '', horarioInicio: '', horarioFim: '', limiteVagas: '', semestreAno: '', status: '', idProfessor: ''
  });

  useEffect(() => {
    if (!id) {
        router.push('/views/turmas');
        return;
    }

    const carregarDados = async () => {
      try {
        const [resTurma, resCursos] = await Promise.all([
          axios.get(`http://localhost:8080/api/turmas/${id}`),
          axios.get('http://localhost:8080/api/cursos')
        ]);
        
        const turma = resTurma.data;
        setCursos(resCursos.data);

        // O LocalTime do Java geralmente vem como "HH:mm:ss", o input type="time" precisa de "HH:mm"
        const formatarHora = (horaStr) => horaStr ? horaStr.substring(0, 5) : '';
        
        setFormData({
          codigoTurma: turma.codigoTurma || '',
          id_curso: turma.curso ? String(turma.curso.id_curso) : '',
          diasSemana: turma.diasSemana || '',
          horarioInicio: formatarHora(turma.horarioInicio),
          horarioFim: formatarHora(turma.horarioFim),
          limiteVagas: turma.limiteVagas || '',
          semestreAno: turma.semestreAno || '',
          status: turma.status || 'Aberta',
          idProfessor: turma.idProfessor || ''
        });
      } catch (err) {
        alert("Erro ao carregar dados.");
        router.push('/views/turmas'); 
      } finally {
        setLoading(false);
      }
    };

    carregarDados();
  }, [id, router]);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      codigoTurma: formData.codigoTurma,
      diasSemana: formData.diasSemana,
      horarioInicio: formData.horarioInicio,
      horarioFim: formData.horarioFim,
      limiteVagas: formData.limiteVagas ? parseInt(formData.limiteVagas) : 0,
      semestreAno: formData.semestreAno,
      status: formData.status,
      curso: formData.id_curso ? { id_curso: parseInt(formData.id_curso) } : null,
      idProfessor: formData.idProfessor ? parseInt(formData.idProfessor) : null
    };

    try {
      await axios.put(`http://localhost:8080/api/turmas/editar/${id}`, payload);
      alert("Turma atualizada com sucesso!");
      router.push('/views/turmas'); 
    } catch (err) {
      alert("Erro ao atualizar turma.");
      console.error(err);
    }
  };

  if (loading) return <div className="flex items-center justify-center min-h-screen bg-gray-100"><span className="font-black uppercase tracking-widest animate-pulse">Carregando Dados da Turma...</span></div>;

  return (
    <div className="p-10 bg-gray-100 min-h-screen text-zinc-900 font-sans">
      <header className="mb-12 flex flex-col gap-4">
        <button onClick={() => router.push('/views/turmas')} className="flex items-center gap-2 text-zinc-500 hover:text-zinc-900 transition-colors font-black text-xs uppercase tracking-widest w-fit">
          <span className="text-lg">←</span> Voltar para a listagem
        </button>
        <div>
          <h1 className="text-4xl font-black uppercase tracking-tighter italic">Editar Turma</h1>
          <div className="h-2 w-24 bg-yellow-400 mt-2"></div>
        </div>
      </header>
      
      <form onSubmit={handleSubmit} className="grid grid-cols-1 xl:grid-cols-3 gap-10 mb-12">
        
        {/* COLUNA 01: IDENTIFICAÇÃO */}
        <div className="bg-white p-8 border-4 border-zinc-900 shadow-[8px_8px_0px_0px_rgba(250,204,21,1)] space-y-6">
          <h2 className="font-black text-lg uppercase border-b-4 border-yellow-400 pb-2 mb-4">01. Identificação</h2>
          <InputField label="Código da Turma" name="codigoTurma" onChange={handleChange} value={formData.codigoTurma} />
          <SelectField label="Curso / Nível" name="id_curso" onChange={handleChange} value={formData.id_curso}>
            <option value="">Selecione o Curso...</option>
            {cursos.map(c => (
              <option key={c.id_curso} value={c.id_curso}>{c.nome} ({c.tipo})</option>
            ))}
          </SelectField>
          <InputField label="Semestre/Ano" name="semestreAno" onChange={handleChange} value={formData.semestreAno} />
        </div>

        {/* COLUNA 02: ESCALA */}
        <div className="bg-white p-8 border-4 border-zinc-900 shadow-[8px_8px_0px_0px_rgba(24,24,27,1)] space-y-6">
          <h2 className="font-black text-lg uppercase border-b-4 border-yellow-400 pb-2 mb-4">02. Escala & Vagas</h2>
          <InputField label="Dias da Semana" name="diasSemana" onChange={handleChange} value={formData.diasSemana} />
          <div className="grid grid-cols-2 gap-4">
            <InputField label="Início" name="horarioInicio" type="time" onChange={handleChange} value={formData.horarioInicio} />
            <InputField label="Fim" name="horarioFim" type="time" onChange={handleChange} value={formData.horarioFim} />
          </div>
          <InputField label="Limite de Vagas" name="limiteVagas" type="number" onChange={handleChange} value={formData.limiteVagas} />
        </div>

        {/* COLUNA 03: OPERAÇÃO E AÇÕES */}
        <div className="bg-zinc-200 p-8 border-4 border-zinc-900 shadow-[8px_8px_0px_0px_rgba(24,24,27,1)] flex flex-col justify-between">
          <div className="space-y-6">
            <h2 className="font-black text-lg uppercase border-b-4 border-zinc-900 pb-2 mb-4">03. Operação</h2>
            <SelectField label="Status da Turma" name="status" onChange={handleChange} value={formData.status}>
              <option value="Aberta">🟢 Aberta (Matrículas)</option>
              <option value="Em Andamento">🟡 Em Andamento</option>
              <option value="Fechada">🔴 Fechada</option>
            </SelectField>
            <InputField label="ID Professor (Prov.)" name="idProfessor" type="number" onChange={handleChange} value={formData.idProfessor} />
          </div>
          <div className="flex flex-col gap-4 mt-10">
            <button type="submit" className="bg-zinc-900 text-yellow-400 p-4 font-black uppercase tracking-[0.2em] hover:bg-yellow-400 hover:text-zinc-900 transition-all border-2 border-zinc-900">
              Confirmar Edição
            </button>
            <button type="button" onClick={() => router.push('/views/turmas')} className="bg-transparent text-zinc-900 p-4 font-bold uppercase text-xs border-2 border-dashed border-zinc-900 hover:bg-white transition-all text-center">
              Cancelar Alterações
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}