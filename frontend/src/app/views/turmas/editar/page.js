"use client";
import { useState, useEffect } from 'react';
import api from '../../../../utils/api';
import { useRouter, useSearchParams } from 'next/navigation'; 

const InputField = ({ label, name, placeholder, type = "text", onChange, value, className = "" }) => (
  <div className={className}>
    <label className="block text-sm font-black text-zinc-700 uppercase tracking-wider mb-2">{label}</label>
    <input type={type} name={name} value={value || ''} onChange={onChange} placeholder={placeholder} className="w-full p-4 border border-zinc-300 rounded-xl text-lg font-bold text-zinc-900 focus:ring-4 focus:ring-yellow-400/30 focus:border-yellow-400 bg-white transition-all outline-none shadow-sm" />
  </div>
);

const SelectField = ({ label, name, children, onChange, value }) => (
  <div>
    <label className="block text-sm font-black text-zinc-700 uppercase tracking-wider mb-2">{label}</label>
    <select name={name} value={value || ''} onChange={onChange} className="w-full p-4 border border-zinc-300 rounded-xl text-lg font-bold text-zinc-900 focus:ring-4 focus:ring-yellow-400/30 bg-white transition-all outline-none appearance-none cursor-pointer shadow-sm">
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
  const [usuarios, setUsuarios] = useState([]); 
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
        const [resTurma, resCursos, resUsuarios] = await Promise.all([
          api.get(`/api/turmas/${id}`),
          api.get('/api/cursos'),
          api.get('/api/usuarios') 
        ]);
        
        const turma = resTurma.data;
        setCursos(resCursos.data);
        setUsuarios(resUsuarios.data);

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
          idProfessor: turma.professor ? String(turma.professor.idUsuario) : ''
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
      professor: formData.idProfessor ? { idUsuario: parseInt(formData.idProfessor) } : null
    };

    try {
      await api.put(`/api/turmas/editar/${id}`, payload);
      alert("Turma atualizada com sucesso!");
      router.push('/views/turmas'); 
    } catch (err) {
      alert("Erro ao atualizar turma.");
      console.error(err);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <span className="font-black uppercase tracking-widest animate-pulse text-zinc-800 text-xl">Carregando Dados da Turma...</span>
    </div>
  );

  return (
    <div className="p-10 bg-gray-50 min-h-screen text-zinc-900 font-sans">
      <header className="mb-10 flex flex-col gap-4">
        <button onClick={() => router.push('/views/turmas')} className="flex items-center gap-2 text-zinc-600 hover:text-zinc-900 transition-colors font-black text-sm uppercase tracking-widest w-fit">
          <span className="text-xl">←</span> Voltar para a listagem
        </button>
        <div>
          <h1 className="text-5xl font-black uppercase tracking-tighter italic text-zinc-900">Editar Turma</h1>
          <div className="h-2 w-24 bg-yellow-400 mt-2 rounded-full"></div>
        </div>
      </header>
      
      <form onSubmit={handleSubmit} className="grid grid-cols-1 xl:grid-cols-3 gap-8 mb-12">
        
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-zinc-200 space-y-8">
          <h2 className="font-black text-lg uppercase text-yellow-600 tracking-widest border-b border-zinc-100 pb-4">01. Identificação</h2>
          <InputField label="Código da Turma" name="codigoTurma" onChange={handleChange} value={formData.codigoTurma} />
          <SelectField label="Curso / Nível" name="id_curso" onChange={handleChange} value={formData.id_curso}>
            <option value="">Selecione o Curso...</option>
            {cursos.map(c => (
              <option key={c.id_curso} value={c.id_curso}>{c.nome} ({c.tipo})</option>
            ))}
          </SelectField>
          <InputField label="Semestre/Ano" name="semestreAno" onChange={handleChange} value={formData.semestreAno} />
        </div>

        <div className="bg-white p-8 rounded-3xl shadow-sm border border-zinc-200 space-y-8">
          <h2 className="font-black text-lg uppercase text-zinc-700 tracking-widest border-b border-zinc-100 pb-4">02. Escala & Vagas</h2>
          <InputField label="Dias da Semana" name="diasSemana" onChange={handleChange} value={formData.diasSemana} />
          <div className="grid grid-cols-2 gap-6">
            <InputField label="Início" name="horarioInicio" type="time" onChange={handleChange} value={formData.horarioInicio} />
            <InputField label="Fim" name="horarioFim" type="time" onChange={handleChange} value={formData.horarioFim} />
          </div>
          <InputField label="Limite de Vagas" name="limiteVagas" type="number" onChange={handleChange} value={formData.limiteVagas} />
        </div>

        <div className="flex flex-col gap-8">
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-zinc-200 space-y-8">
            <h2 className="font-black text-lg uppercase text-zinc-700 tracking-widest border-b border-zinc-100 pb-4">03. Operação</h2>
            <SelectField label="Status da Turma" name="status" onChange={handleChange} value={formData.status}>
              <option value="Aberta">🟢 Aberta (Matrículas)</option>
              <option value="Em Andamento">🟡 Em Andamento</option>
              <option value="Fechada">🔴 Fechada</option>
            </SelectField>
            
            <SelectField label="Professor Responsável" name="idProfessor" onChange={handleChange} value={formData.idProfessor}>
              <option value="">Selecione o Professor...</option>
              {usuarios.map(u => (
                <option key={u.idUsuario} value={u.idUsuario}>
                  {u.nome} (ID: {u.idUsuario})
                </option>
              ))}
            </SelectField>
          </div>

          <div className="bg-zinc-900 p-8 rounded-3xl shadow-xl flex flex-col gap-4 text-white border-4 border-white mt-auto">
            <button type="submit" className="bg-yellow-400 text-zinc-900 p-5 rounded-2xl font-black uppercase text-lg hover:bg-white transition-all shadow-lg">
              Confirmar Edição
            </button>
            <button type="button" onClick={() => router.push('/views/turmas')} className="text-zinc-300 p-4 font-black uppercase text-sm hover:text-white transition-all tracking-widest underline decoration-yellow-400 decoration-2 text-center">
              Cancelar Alterações
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}