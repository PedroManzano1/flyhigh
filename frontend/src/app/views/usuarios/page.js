"use client";
import { useState, useEffect, useContext, useMemo, useCallback } from 'react';
import { useFeedback } from '../../../components/feedback';
import { InputField, SelectField } from '../../../components/ui';
import api, { mensagemErro } from '../../../utils/api';
import { useRouter } from 'next/navigation';
import { AuthContext } from '../../../context/authContext';
import { PERFIL_ALUNO } from '../../../utils/permissoes';
import { formatarData } from '../../../utils/formato';

/**
 * Equipe e contas de acesso. Também é aqui que a secretaria aprova os cadastros
 * feitos pelos alunos na tela pública, ligando cada conta a um aluno do sistema.
 */

const ehPendente = (u) => (u.status || '').toUpperCase() === 'PENDENTE';
const ehContaAluno = (u) => (u.perfil?.nomePerfil || '').toUpperCase() === PERFIL_ALUNO;
const normalizar = (t) => (t || '').normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();

const ESTILO_STATUS = {
  ATIVO: { rotulo: 'Ativo', classe: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  INATIVO: { rotulo: 'Inativo', classe: 'bg-red-50 text-red-700 border-red-200' },
  PENDENTE: { rotulo: 'Aguardando', classe: 'bg-amber-50 text-amber-700 border-amber-200' }
};

// --- Componentes de apoio (fora da página para não perder o foco dos inputs) ---

function LinhaPendente({ usuario, alunosLivres, podeAprovar, podeRecusar, onAprovar, onRecusar }) {
  // Sugere o aluno cuja matrícula bate com a digitada no cadastro
  const sugerido = alunosLivres.find(a =>
    usuario.matriculaInformada && a.numeroMatricula === usuario.matriculaInformada.trim());
  const [filtro, setFiltro] = useState('');
  const [idAluno, setIdAluno] = useState(sugerido ? String(sugerido.id_aluno) : '');

  const opcoes = useMemo(() => {
    const termo = normalizar(filtro.trim());
    const lista = termo
      ? alunosLivres.filter(a => normalizar(a.nome).includes(termo) || (a.numeroMatricula || '').includes(termo))
      : alunosLivres;
    // Mantém a opção escolhida visível mesmo que o filtro a esconda
    const escolhido = alunosLivres.find(a => String(a.id_aluno) === idAluno);
    return escolhido && !lista.includes(escolhido) ? [escolhido, ...lista] : lista;
  }, [alunosLivres, filtro, idAluno]);

  return (
    <tr className="border-b border-amber-100 hover:bg-amber-50/50 transition-colors">
      <td className="p-6 align-top">
        <div className="font-black text-zinc-900 uppercase text-lg leading-tight">{usuario.nome}</div>
        <div className="font-mono text-sm font-bold text-zinc-600 mt-1">{usuario.login}</div>
        <div className="text-[11px] font-bold text-zinc-500 mt-2">
          Pedido em {usuario.dataCadastro ? formatarData(usuario.dataCadastro) : '---'}
          {usuario.matriculaInformada && <> · matrícula informada <span className="font-mono font-black text-zinc-700">#{usuario.matriculaInformada}</span></>}
        </div>
      </td>
      <td className="p-6 align-top min-w-[320px]">
        {podeAprovar ? (
          <div className="space-y-2">
            <input
              type="text" value={filtro} onChange={e => setFiltro(e.target.value)}
              placeholder="Buscar aluno por nome ou matrícula..."
              className="w-full px-4 py-2 rounded-xl border border-zinc-300 text-sm font-bold text-zinc-900 outline-none focus:ring-4 focus:ring-yellow-400/20"
            />
            <select
              value={idAluno} onChange={e => setIdAluno(e.target.value)}
              className="w-full p-3 border border-zinc-300 rounded-xl font-bold text-zinc-900 bg-white outline-none focus:ring-4 focus:ring-yellow-400/30"
            >
              <option value="">Escolha o aluno desta conta...</option>
              {opcoes.map(a => (
                <option key={a.id_aluno} value={a.id_aluno}>#{a.numeroMatricula} — {a.nome}</option>
              ))}
            </select>
            {sugerido && String(sugerido.id_aluno) === idAluno && (
              <div className="text-[11px] font-black uppercase tracking-widest text-emerald-700">✔ Sugerido pela matrícula informada</div>
            )}
          </div>
        ) : (
          <span className="text-sm font-bold text-zinc-500">Sem permissão para aprovar.</span>
        )}
      </td>
      <td className="p-6 align-top">
        <div className="flex flex-col gap-2">
          {podeAprovar && (
            <button
              onClick={() => onAprovar(usuario, idAluno)}
              disabled={!idAluno}
              className="px-5 py-3 bg-emerald-500 text-white rounded-xl font-black uppercase text-xs tracking-widest hover:bg-zinc-900 transition-all shadow-md disabled:bg-zinc-200 disabled:text-zinc-400 disabled:cursor-not-allowed"
            >
              Vincular e liberar
            </button>
          )}
          {podeRecusar && (
            <button
              onClick={() => onRecusar(usuario)}
              className="px-5 py-3 bg-white text-zinc-700 border-2 border-zinc-200 rounded-xl font-black uppercase text-xs tracking-widest hover:bg-red-600 hover:text-white hover:border-red-600 transition-all"
            >
              Recusar
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}

// --- Página --------------------------------------------------------------------

export default function UsuariosPage() {
  const router = useRouter();
  const { notificar, confirmar } = useFeedback();
  const { temPermissao } = useContext(AuthContext);

  const [usuarios, setUsuarios] = useState([]);
  const [perfis, setPerfis] = useState([]);
  const [alunos, setAlunos] = useState([]);
  const [semAcessoAlunos, setSemAcessoAlunos] = useState(false);
  const [loading, setLoading] = useState(true);
  const [aba, setAba] = useState('equipe');

  const [formData, setFormData] = useState({ nome: '', login: '', senha: '', idPerfil: '' });

  const podeEscrever = temPermissao('USUARIOS_WRITE');
  const podeExcluir = temPermissao('USUARIOS_DELETE');

  const carregarDados = useCallback(async () => {
    setLoading(true);
    const [resUsers, resPerfis, resAlunos] = await Promise.allSettled([
      api.get('/api/usuarios'),
      api.get('/api/perfis'),
      api.get('/api/alunos')
    ]);
    if (resUsers.status === 'fulfilled') {
      setUsuarios(Array.isArray(resUsers.value.data) ? resUsers.value.data : []);
    } else {
      notificar(mensagemErro(resUsers.reason, "Erro ao carregar os usuários."), 'erro');
    }
    if (resPerfis.status === 'fulfilled') setPerfis(Array.isArray(resPerfis.value.data) ? resPerfis.value.data : []);
    if (resAlunos.status === 'fulfilled') {
      setAlunos(Array.isArray(resAlunos.value.data) ? resAlunos.value.data : []);
      setSemAcessoAlunos(false);
    } else {
      setSemAcessoAlunos(true);
    }
    setLoading(false);
  }, [notificar]);

  useEffect(() => { carregarDados(); }, [carregarDados]);

  const pendentes = usuarios.filter(ehPendente);
  const contasDeAluno = usuarios.filter(u => !ehPendente(u) && ehContaAluno(u));
  const equipe = usuarios.filter(u => !ehPendente(u) && !ehContaAluno(u));
  const perfisDeEquipe = perfis.filter(p => (p.nomePerfil || '').toUpperCase() !== PERFIL_ALUNO);

  // Aluno que já tem conta não aparece de novo na lista de vínculo
  const alunosLivres = useMemo(() => {
    const comConta = new Set(usuarios.map(u => u.aluno?.id_aluno).filter(Boolean));
    return alunos
      .filter(a => !comConta.has(a.id_aluno))
      .sort((a, b) => (a.nome || '').localeCompare(b.nome || '', 'pt-BR'));
  }, [alunos, usuarios]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.idPerfil) return notificar("Selecione um perfil!", 'alerta');

    const payload = {
      nome: formData.nome, login: formData.login, senha: formData.senha,
      perfil: { idPerfil: parseInt(formData.idPerfil) }
    };

    try {
      await api.post('/api/usuarios', payload);
      notificar("Colaborador cadastrado!", 'sucesso');
      setFormData({ nome: '', login: '', senha: '', idPerfil: '' });
      carregarDados();
    } catch (err) { notificar(mensagemErro(err, "Erro ao salvar usuário."), 'erro'); }
  };

  const aprovar = async (u, idAluno) => {
    const aluno = alunos.find(a => String(a.id_aluno) === String(idAluno));
    const ok = await confirmar(
      `Ligar a conta "${u.login}" ao aluno ${aluno?.nome || ''} (#${aluno?.numeroMatricula || '?'}) e liberar o acesso?\n\n` +
      `Ele passa a ver o próprio boletim, as parcelas e os recados.`,
      { titulo: 'Aprovar cadastro', rotuloConfirmar: 'Vincular e liberar', perigoso: false }
    );
    if (!ok) return;
    try {
      await api.patch(`/api/usuarios/${u.idUsuario}/vincular-aluno`, { idAluno: Number(idAluno) });
      notificar(`Acesso de ${u.nome} liberado.`, 'sucesso');
      carregarDados();
    } catch (err) { notificar(mensagemErro(err, "Erro ao vincular a conta."), 'erro'); }
  };

  const recusar = async (u) => {
    if (!(await confirmar(`Recusar o cadastro de ${u.nome} (${u.login})? A conta será apagada.`, { titulo: 'Recusar cadastro', rotuloConfirmar: 'Recusar' }))) return;
    try {
      await api.delete(`/api/usuarios/${u.idUsuario}`);
      notificar("Cadastro recusado.", 'sucesso');
      carregarDados();
    } catch (err) { notificar(mensagemErro(err, "Erro ao recusar o cadastro."), 'erro'); }
  };

  const desvincular = async (u) => {
    const ok = await confirmar(
      `Desligar a conta "${u.login}" do aluno ${u.aluno?.nome || ''}?\n\nA conta volta para "aguardando aprovação" e deixa de entrar no sistema.`,
      { titulo: 'Desvincular conta', rotuloConfirmar: 'Desvincular' }
    );
    if (!ok) return;
    try {
      await api.patch(`/api/usuarios/${u.idUsuario}/desvincular-aluno`);
      carregarDados();
    } catch (err) { notificar(mensagemErro(err, "Erro ao desvincular a conta."), 'erro'); }
  };

  const alternarStatus = async (u) => {
    const novoStatus = (u.status || 'ATIVO').toUpperCase() === 'ATIVO' ? 'INATIVO' : 'ATIVO';
    const acao = novoStatus === 'INATIVO' ? 'inativar' : 'reativar';
    if (!(await confirmar(`Deseja ${acao} o acesso de ${u.nome}?`))) return;
    try {
      await api.patch(`/api/usuarios/${u.idUsuario}/status`, { status: novoStatus });
      carregarDados();
    } catch (err) { notificar(mensagemErro(err, "Erro ao alterar a situação do acesso."), 'erro'); }
  };

  const excluirUsuario = async (u) => {
    if (await confirmar(`Deseja remover o acesso de ${u.nome} permanentemente?`)) {
      try {
        await api.delete(`/api/usuarios/${u.idUsuario}`);
        carregarDados();
      } catch (err) { notificar(mensagemErro(err, "Erro ao excluir."), 'erro'); }
    }
  };

  const lista = aba === 'equipe' ? equipe : contasDeAluno;

  return (
    <div className="p-10 bg-gray-50 min-h-screen font-sans text-zinc-900">
      <header className="mb-12 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
          <h1 className="text-5xl font-black uppercase tracking-tighter italic text-zinc-900">Gestão de Equipe</h1>
          <div className="h-2 w-24 bg-yellow-400 mt-2 rounded-full"></div>
          <p className="text-zinc-500 font-bold mt-3">Contas da equipe, contas de alunos e aprovação dos cadastros feitos pelos alunos.</p>
        </div>
        <div className="flex flex-wrap gap-4">
          <button onClick={() => router.push('/')} className="px-8 py-4 bg-zinc-900 text-white rounded-2xl font-black text-sm uppercase tracking-[0.2em] hover:bg-yellow-400 hover:text-zinc-900 transition-all shadow-xl">
            Voltar ao Início
          </button>
          {temPermissao('PERFIS_READ') && (
            <button onClick={() => router.push('/views/perfis')} className="px-8 py-4 bg-sky-100 text-sky-800 border border-sky-200 rounded-2xl font-black text-sm uppercase tracking-[0.2em] hover:bg-sky-200 transition-all shadow-sm">
              🛡️ Configurar Perfis
            </button>
          )}
        </div>
      </header>

      {pendentes.length > 0 && (
        <section className="bg-white rounded-[2.5rem] shadow-md border-2 border-amber-300 overflow-hidden mb-12">
          <div className="p-8 border-b border-amber-200 bg-amber-50 flex justify-between items-center flex-wrap gap-4">
            <div>
              <h2 className="font-black text-lg uppercase text-zinc-900 tracking-tighter">⏳ Cadastros aguardando aprovação</h2>
              <p className="text-sm font-bold text-zinc-600 mt-1">Ligue cada conta ao aluno certo. Só depois disso ele consegue entrar.</p>
            </div>
            <span className="bg-amber-400 text-zinc-900 px-4 py-2 rounded-xl font-black text-sm">{pendentes.length}</span>
          </div>
          {semAcessoAlunos && (
            <div className="px-8 py-4 bg-red-50 border-b border-red-200 text-sm font-bold text-red-700">
              Seu perfil não pode ver a lista de alunos (módulo Alunos), por isso não dá para vincular as contas daqui.
            </div>
          )}
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-zinc-50 border-b border-zinc-200">
                <tr>
                  <th className="p-6 font-black uppercase text-xs tracking-widest text-zinc-600">Quem se cadastrou</th>
                  <th className="p-6 font-black uppercase text-xs tracking-widest text-zinc-800">Aluno do sistema</th>
                  <th className="p-6 font-black uppercase text-xs tracking-widest text-zinc-800">Decisão</th>
                </tr>
              </thead>
              <tbody>
                {pendentes.map(u => (
                  <LinhaPendente
                    key={u.idUsuario}
                    usuario={u}
                    alunosLivres={alunosLivres}
                    podeAprovar={podeEscrever && !semAcessoAlunos}
                    podeRecusar={podeExcluir}
                    onAprovar={aprovar}
                    onRecusar={recusar}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">

        {podeEscrever && (
          <form onSubmit={handleSubmit} className="bg-white p-8 rounded-3xl border border-zinc-200 shadow-sm space-y-6 h-fit xl:col-span-1">
            <h2 className="font-black text-lg uppercase text-zinc-800 tracking-[0.2em] mb-4 border-b border-zinc-100 pb-2">Novo Colaborador</h2>

            <InputField label="Nome Completo" name="nome" value={formData.nome} onChange={e => setFormData({...formData, nome: e.target.value})} required />
            <InputField label="Login" name="login" value={formData.login} onChange={e => setFormData({...formData, login: e.target.value})} required className="font-mono" />
            <InputField label="Senha Temporária" name="senha" type="password" value={formData.senha} onChange={e => setFormData({...formData, senha: e.target.value})} required />

            <SelectField label="Cargo / Perfil" name="idPerfil" value={formData.idPerfil} onChange={e => setFormData({...formData, idPerfil: e.target.value})} required>
              <option value="">Selecione um perfil...</option>
              {perfisDeEquipe.map(p => <option key={p.idPerfil} value={p.idPerfil}>{p.nomePerfil}</option>)}
            </SelectField>

            <button type="submit" className="w-full bg-zinc-900 text-white p-5 rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-yellow-400 hover:text-zinc-900 transition-all shadow-md mt-4">
              Cadastrar Acesso
            </button>

            <p className="text-xs font-bold text-zinc-500 leading-relaxed">
              Contas de aluno não são criadas aqui: o aluno se cadastra em "Criar conta" na tela de login e você aprova no quadro acima.
            </p>
          </form>
        )}

        <div className={podeEscrever ? "xl:col-span-2" : "xl:col-span-3"}>
          <div className="bg-white rounded-[2.5rem] shadow-md border border-zinc-200 overflow-hidden">
            <div className="p-6 border-b border-zinc-200 bg-zinc-100/30 flex gap-2 flex-wrap">
              {[
                { chave: 'equipe', rotulo: `👤 Equipe (${equipe.length})` },
                { chave: 'alunos', rotulo: `🎓 Contas de alunos (${contasDeAluno.length})` }
              ].map(t => (
                <button
                  key={t.chave}
                  onClick={() => setAba(t.chave)}
                  className={`px-5 py-3 rounded-xl font-black uppercase text-xs tracking-widest transition-all ${
                    aba === t.chave ? 'bg-zinc-900 text-white shadow-md' : 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900'
                  }`}
                >
                  {t.rotulo}
                </button>
              ))}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-zinc-50 border-b border-zinc-200">
                  <tr>
                    <th className="p-6 font-black uppercase text-xs tracking-widest text-zinc-600">{aba === 'equipe' ? 'Colaborador' : 'Conta'}</th>
                    <th className="p-6 font-black uppercase text-xs tracking-widest text-zinc-800">Login</th>
                    <th className="p-6 font-black uppercase text-xs tracking-widest text-zinc-800">{aba === 'equipe' ? 'Perfil / Cargo' : 'Aluno vinculado'}</th>
                    <th className="p-6 font-black uppercase text-xs tracking-widest text-zinc-800 text-center">Situação</th>
                    <th className="p-6 font-black uppercase text-xs tracking-widest text-zinc-800 text-center">Gestão</th>
                  </tr>
                </thead>
                <tbody>
                  {loading && <tr><td colSpan="5" className="p-10 text-center uppercase italic font-black text-zinc-500 animate-pulse">Carregando...</td></tr>}

                  {!loading && lista.map(u => {
                    const status = ESTILO_STATUS[(u.status || 'ATIVO').toUpperCase()] || ESTILO_STATUS.ATIVO;
                    const ativo = (u.status || 'ATIVO').toUpperCase() === 'ATIVO';
                    return (
                      <tr key={u.idUsuario} className="border-b border-zinc-100 hover:bg-yellow-50/50 transition-colors">
                        <td className="p-6 align-middle">
                          <span className="font-black text-zinc-900 uppercase text-lg">{u.nome}</span>
                        </td>
                        <td className="p-6 align-middle">
                          <span className="font-mono text-zinc-600 font-bold bg-zinc-100 px-3 py-1.5 rounded-lg border border-zinc-200">{u.login}</span>
                        </td>
                        <td className="p-6 align-middle">
                          {aba === 'equipe' ? (
                            <span className="bg-sky-50 text-sky-700 px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest border border-sky-200">
                              {u.perfil?.nomePerfil || 'SEM PERFIL'}
                            </span>
                          ) : u.aluno ? (
                            <div className="flex flex-col">
                              <span className="font-mono font-black text-zinc-500 text-xs">#{u.aluno.numeroMatricula}</span>
                              <span className="font-black uppercase text-zinc-900">{u.aluno.nome}</span>
                            </div>
                          ) : (
                            <span className="text-amber-700 font-black text-xs uppercase tracking-widest">Sem aluno vinculado</span>
                          )}
                        </td>
                        <td className="p-6 align-middle text-center">
                          <span className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border ${status.classe}`}>
                            {status.rotulo}
                          </span>
                        </td>
                        <td className="p-6 align-middle">
                          <div className="flex justify-center gap-3">
                            {podeEscrever && (
                              <button
                                onClick={() => alternarStatus(u)}
                                className="w-12 h-12 flex items-center justify-center bg-white text-zinc-900 border-2 border-zinc-200 hover:bg-zinc-900 hover:text-white rounded-xl transition-all shadow-md text-xl"
                                title={ativo ? 'Inativar acesso' : 'Reativar acesso'}
                              >
                                {ativo ? '🚫' : '✔'}
                              </button>
                            )}
                            {podeEscrever && aba === 'alunos' && (
                              <button onClick={() => desvincular(u)} className="w-12 h-12 flex items-center justify-center bg-white text-zinc-900 border-2 border-zinc-200 hover:bg-amber-500 hover:text-white rounded-xl transition-all shadow-md text-xl" title="Desvincular do aluno">⛓</button>
                            )}
                            {podeEscrever && (
                              <button onClick={() => router.push(`/views/usuarios/editar?id=${u.idUsuario}`)} className="w-12 h-12 flex items-center justify-center bg-zinc-900 text-white hover:bg-yellow-400 hover:text-zinc-900 rounded-xl transition-all shadow-md text-xl" title="Editar">✎</button>
                            )}
                            {podeExcluir && (
                              <button onClick={() => excluirUsuario(u)} className="w-12 h-12 flex items-center justify-center bg-white text-zinc-900 border-2 border-zinc-200 hover:bg-red-600 hover:text-white rounded-xl transition-all shadow-md text-xl" title="Revogar acesso">🗑</button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {!loading && lista.length === 0 && (
                    <tr><td colSpan="5" className="p-8 text-center text-zinc-500 uppercase font-black italic">
                      {aba === 'equipe' ? 'Nenhum colaborador encontrado.' : 'Nenhuma conta de aluno liberada ainda.'}
                    </td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
