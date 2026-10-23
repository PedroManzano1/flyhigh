"use client";
import { Suspense, useState, useEffect } from 'react';
import { useFeedback } from '../../../../components/feedback';
import { InputField, SelectField } from '../../../../components/ui';
import { useRouter, useSearchParams } from 'next/navigation';
import api, { mensagemErro } from '../../../../utils/api';
import { PERFIL_ALUNO } from '../../../../utils/permissoes';


function EditarUsuarioPageConteudo() {
  const router = useRouter();
  const { notificar } = useFeedback();
  const searchParams = useSearchParams();
  const id = searchParams.get('id');

  const [perfis, setPerfis] = useState([]);
  const [alunos, setAlunos] = useState([]);
  const [statusOriginal, setStatusOriginal] = useState('ATIVO');
  const [loading, setLoading] = useState(true);
  
  const [formData, setFormData] = useState({
    nome: '', login: '', senha: '', idPerfil: '', status: 'ATIVO', idAluno: ''
  });

  const perfilEscolhido = perfis.find(p => String(p.idPerfil) === String(formData.idPerfil));
  const contaDeAluno = (perfilEscolhido?.nomePerfil || '').toUpperCase() === PERFIL_ALUNO;

  useEffect(() => {
    if (!id) return;

    const carregarDados = async () => {
      try {
        const [resUser, resPerfis] = await Promise.all([
          api.get(`/api/usuarios/${id}`),
          api.get('/api/perfis')
        ]);
        // A lista de alunos depende do módulo Alunos; sem ele só não dá para trocar o vínculo
        const resAlunos = await api.get('/api/alunos').catch(() => ({ data: [] }));
        
        const user = resUser.data;
        setFormData({
          nome: user.nome || '',
          login: user.login || '',
          senha: '', 
          idPerfil: user.perfil?.idPerfil || '',
          status: user.status || 'ATIVO',
          idAluno: user.aluno?.id_aluno ? String(user.aluno.id_aluno) : ''
        });
        setStatusOriginal((user.status || 'ATIVO').toUpperCase());
        setPerfis(Array.isArray(resPerfis.data) ? resPerfis.data : []);
        setAlunos((Array.isArray(resAlunos.data) ? resAlunos.data : [])
          .sort((a, b) => (a.nome || '').localeCompare(b.nome || '', 'pt-BR')));
      } catch (err) {
        notificar(mensagemErro(err, "Erro ao buscar dados."), 'erro');
        router.push('/views/usuarios');
      } finally {
        setLoading(false);
      }
    };
    carregarDados();
  }, [id, router]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    const payload = {
      nome: formData.nome,
      login: formData.login,
      status: formData.status,
      perfil: formData.idPerfil ? { idPerfil: parseInt(formData.idPerfil) } : null,
      aluno: contaDeAluno && formData.idAluno ? { id_aluno: parseInt(formData.idAluno) } : null
    };
    if (contaDeAluno && !formData.idAluno) return notificar("Escolha o aluno desta conta.", 'alerta');

    if (formData.senha && formData.senha.trim() !== "") {
      payload.senha = formData.senha;
    }

    try {
      await api.put(`/api/usuarios/editar/${id}`, payload);
      notificar("Usuário atualizado!", 'sucesso');
      router.push('/views/usuarios');
    } catch (err) { notificar(mensagemErro(err, "Erro ao atualizar."), 'erro'); }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 text-xl font-black text-zinc-800">
      <span className="uppercase tracking-[0.2em] animate-pulse">Carregando Dados...</span>
    </div>
  );

  return (
    <div className="p-10 bg-gray-50 min-h-screen font-sans text-zinc-900 flex flex-col">
      <header className="mb-10 flex flex-col gap-4">
        <button onClick={() => router.push('/views/usuarios')} className="flex items-center gap-2 text-zinc-600 hover:text-zinc-900 transition-colors font-black text-sm uppercase tracking-widest w-fit">
          <span className="text-xl">←</span> Voltar para a equipe
        </button>
        <div>
          <h1 className="text-5xl font-black uppercase tracking-tighter italic text-zinc-900">Editar Acesso</h1>
          <div className="h-2 w-24 bg-yellow-400 mt-2 rounded-full"></div>
        </div>
      </header>

      <div className="max-w-3xl w-full">
        <form onSubmit={handleUpdate} className="bg-white p-10 rounded-3xl border border-zinc-200 shadow-lg space-y-8">
          <div className="space-y-6">
            <h2 className="font-black text-lg uppercase text-yellow-600 tracking-widest border-b border-zinc-100 pb-4">01. Dados de Acesso</h2>
            
            <InputField label="Nome Completo" name="nome" value={formData.nome} onChange={e => setFormData({...formData, nome: e.target.value})} required />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <InputField label="Login de Acesso" name="login" value={formData.login} onChange={e => setFormData({...formData, login: e.target.value})} required className="font-mono" />
              <InputField label="Nova Senha (Opcional)" name="senha" type="password" placeholder="••••••••" value={formData.senha} onChange={e => setFormData({...formData, senha: e.target.value})} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <SelectField label="Cargo / Perfil" name="idPerfil" value={formData.idPerfil} onChange={e => setFormData({...formData, idPerfil: e.target.value})} required={statusOriginal !== 'PENDENTE'}>
                <option value="">Selecione o Perfil...</option>
                {perfis.map(p => <option key={p.idPerfil} value={p.idPerfil}>{p.nomePerfil}</option>)}
              </SelectField>

              <SelectField label="Situação do Acesso" name="status" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} required>
                {statusOriginal === 'PENDENTE' && <option value="PENDENTE">⏳ Aguardando aprovação</option>}
                <option value="ATIVO">🟢 Ativo (pode entrar no sistema)</option>
                <option value="INATIVO">🔴 Inativo (login bloqueado)</option>
              </SelectField>
            </div>

            {contaDeAluno && (
              <SelectField label="Aluno desta conta" name="idAluno" value={formData.idAluno} onChange={e => setFormData({...formData, idAluno: e.target.value})} required>
                <option value="">Escolha o aluno...</option>
                {alunos.map(a => <option key={a.id_aluno} value={a.id_aluno}>#{a.numeroMatricula} — {a.nome}</option>)}
              </SelectField>
            )}

            <p className="text-xs font-bold text-zinc-500 leading-relaxed">
              Inative o acesso ao desligar um funcionário. Excluir o cadastro não é possível quando ele
              já é professor de alguma turma ou publicou recados, para não quebrar o histórico.
            </p>
          </div>

          <div className="pt-6 border-t border-zinc-100 flex flex-col gap-4">
            <button type="submit" className="w-full bg-yellow-400 text-zinc-900 p-5 rounded-2xl font-black uppercase tracking-widest text-lg hover:bg-zinc-900 hover:text-white transition-all shadow-md">
              Confirmar Alterações
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// useSearchParams exige um limite de Suspense no App Router do Next.
export default function EditarUsuarioPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <span className="font-black uppercase tracking-widest animate-pulse text-zinc-800 text-xl">Carregando Dados do Usuário...</span>
      </div>
    }>
      <EditarUsuarioPageConteudo />
    </Suspense>
  );
}
