"use client";
import { useState } from 'react';
import Link from 'next/link';
import api, { mensagemErro } from '../../utils/api';

/**
 * Cadastro feito pelo próprio aluno. A conta nasce aguardando aprovação: a
 * secretaria liga a conta ao aluno certo na tela de Equipe e só então ela entra.
 */

const CLASSE_INPUT =
  "w-full p-3 bg-zinc-50 border-2 border-zinc-900 rounded-xl font-bold focus:ring-2 focus:ring-yellow-400 outline-none transition-all";

function Campo({ label, dica, ...props }) {
  return (
    <div>
      <label className="block text-xs font-black uppercase mb-1 ml-1 text-zinc-600">{label}</label>
      <input className={CLASSE_INPUT} {...props} />
      {dica && <p className="text-[11px] font-bold text-zinc-400 mt-1 ml-1">{dica}</p>}
    </div>
  );
}

export default function CadastroPage() {
  const [dados, setDados] = useState({ nome: '', matricula: '', login: '', senha: '', confirmacao: '' });
  const [erro, setErro] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);

  const alterar = (e) => setDados(atual => ({ ...atual, [e.target.name]: e.target.value }));

  const enviar = async (e) => {
    e.preventDefault();
    setErro('');
    if (dados.senha.length < 6) return setErro('A senha precisa ter pelo menos 6 caracteres.');
    if (dados.senha !== dados.confirmacao) return setErro('As duas senhas não são iguais.');
    if (/\s/.test(dados.login.trim())) return setErro('O login não pode ter espaços.');

    setEnviando(true);
    try {
      await api.post('/api/auth/cadastro', {
        nome: dados.nome.trim(),
        matricula: dados.matricula.trim(),
        login: dados.login.trim(),
        senha: dados.senha
      });
      setEnviado(true);
    } catch (err) {
      setErro(mensagemErro(err, 'Não foi possível enviar o cadastro.'));
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center font-sans text-zinc-900 p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-black text-zinc-900 tracking-tighter inline-block">
            <span className="bg-yellow-400 text-zinc-900 px-3 py-1 rounded mr-1">FLY HIGH</span>IDIOMAS
          </h2>
          <p className="text-zinc-500 font-bold uppercase text-xs mt-3 tracking-widest">Área do aluno</p>
        </div>

        <div className="bg-white border-4 border-zinc-900 rounded-2xl shadow-[8px_8px_0px_0px_rgba(24,24,27,1)] p-8">
          {enviado ? (
            <div className="text-center space-y-5">
              <div className="text-6xl">📨</div>
              <h1 className="text-2xl font-black uppercase leading-tight">Cadastro enviado!</h1>
              <p className="text-zinc-600 font-bold">
                A secretaria vai conferir os seus dados e liberar o acesso. Depois disso é só entrar
                com o login <span className="font-mono bg-zinc-100 px-2 py-0.5 rounded">{dados.login.trim()}</span>.
              </p>
              <Link href="/login" className="block w-full bg-zinc-900 text-white font-black uppercase tracking-widest p-4 rounded-xl hover:bg-yellow-400 hover:text-zinc-900 transition-colors">
                Voltar para o login
              </Link>
            </div>
          ) : (
            <>
              <header className="mb-8 border-l-8 border-yellow-400 pl-4">
                <h1 className="text-2xl font-black text-zinc-900 uppercase leading-none">Criar conta</h1>
                <p className="text-zinc-500 text-sm font-medium mt-1">
                  Para ver o seu boletim, as parcelas e os recados da escola.
                </p>
              </header>

              <form onSubmit={enviar} className="space-y-5">
                <Campo label="Nome completo do aluno" name="nome" value={dados.nome} onChange={alterar} required placeholder="Como está na matrícula" />
                <Campo
                  label="Nº de matrícula (se souber)" name="matricula" value={dados.matricula} onChange={alterar}
                  placeholder="Ex: 2026001" dica="Ajuda a secretaria a encontrar o seu cadastro mais rápido."
                />
                <Campo label="Escolha um login" name="login" value={dados.login} onChange={alterar} required placeholder="Sem espaços" autoComplete="username" />
                <Campo label="Senha" name="senha" type="password" value={dados.senha} onChange={alterar} required placeholder="Pelo menos 6 caracteres" autoComplete="new-password" />
                <Campo label="Repita a senha" name="confirmacao" type="password" value={dados.confirmacao} onChange={alterar} required autoComplete="new-password" />

                {erro && (
                  <div role="alert" className="bg-red-50 border-2 border-red-300 text-red-700 rounded-xl p-3 font-bold text-sm">{erro}</div>
                )}

                <button
                  type="submit" disabled={enviando}
                  className="w-full bg-zinc-900 text-white font-black uppercase tracking-widest p-4 rounded-xl hover:bg-yellow-400 hover:text-zinc-900 transition-colors disabled:opacity-60 disabled:cursor-wait"
                >
                  {enviando ? 'Enviando...' : 'Enviar cadastro →'}
                </button>
              </form>

              <p className="text-center mt-6 text-sm font-bold text-zinc-500">
                Já tem acesso? <Link href="/login" className="text-zinc-900 font-black underline decoration-yellow-400 decoration-2">Entrar</Link>
              </p>
            </>
          )}
        </div>

        <p className="text-center mt-10 text-zinc-400 text-xs font-bold uppercase tracking-tighter">
          &copy; 2026 Fly High Idiomas
        </p>
      </div>
    </div>
  );
}
