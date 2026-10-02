"use client";
import Link from 'next/link';
import { useContext, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { AuthContext } from '../context/authContext';

/**
 * Casca das telas internas: identidade, usuário logado, logout, navegação
 * entre módulos filtrada por permissão e bloqueio de acesso sem sessão.
 */

const MODULOS = [
  { href: '/views/alunos', rotulo: 'Alunos', icone: '🎓', permissao: 'ALUNOS_READ' },
  { href: '/views/responsaveis', rotulo: 'Responsáveis', icone: '👥', permissao: 'RESPONSAVEIS_READ' },
  { href: '/views/cursos', rotulo: 'Cursos', icone: '📚', permissao: 'CURSOS_READ' },
  { href: '/views/turmas', rotulo: 'Turmas', icone: '🗓️', permissao: 'TURMAS_READ' },
  { href: '/views/contratos', rotulo: 'Contratos', icone: '📄', permissao: 'CONTRATOS_READ' },
  { href: '/views/financeiro', rotulo: 'Financeiro', icone: '💰', permissao: 'FINANCEIRO_READ' },
  { href: '/views/inadimplencia', rotulo: 'Inadimplência', icone: '🚨', permissao: 'FINANCEIRO_READ' },
  { href: '/views/faltas', rotulo: 'Faltas', icone: '📋', permissao: 'FREQUENCIAS_READ' },
  { href: '/views/notas', rotulo: 'Notas', icone: '✍️', permissao: 'AVALIACOES_READ' },
  { href: '/views/boletim', rotulo: 'Boletim', icone: '📊', permissao: 'AVALIACOES_READ' },
  { href: '/views/recados', rotulo: 'Recados', icone: '📢', permissao: 'RECADOS_READ' },
  { href: '/views/usuarios', rotulo: 'Equipe', icone: '👤', permissao: 'USUARIOS_READ' },
  { href: '/views/perfis', rotulo: 'Perfis', icone: '🛡️', permissao: 'PERFIS_READ' }
];

function TelaDeEspera({ texto }) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center font-black uppercase text-zinc-400 animate-pulse text-xl tracking-widest">
      {texto}
    </div>
  );
}

export default function AppShell({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, carregandoUsuario, signOut, temPermissao } = useContext(AuthContext);

  // Guarda de rota: sem sessão válida ninguém renderiza a tela interna
  useEffect(() => {
    if (!carregandoUsuario && !user) {
      router.replace('/login');
    }
  }, [carregandoUsuario, user, router]);

  if (carregandoUsuario) return <TelaDeEspera texto="Carregando Fly High..." />;
  if (!user) return <TelaDeEspera texto="Redirecionando para o login..." />;

  const modulosLiberados = MODULOS.filter(m => temPermissao(m.permissao));

  // print:hidden na navegação para relatórios impressos saírem só com o conteúdo
  return (
    <div className="min-h-screen bg-gray-50 font-sans text-zinc-900 flex flex-col">

      <nav className="print:hidden bg-zinc-900 px-6 md:px-10 py-5 flex justify-between items-center shadow-md border-b-4 border-zinc-950 gap-4">
        <Link href="/" className="shrink-0">
          <h2 className="text-xl md:text-2xl font-black text-white flex items-center gap-2 tracking-tighter">
            <span className="bg-yellow-400 text-zinc-900 px-3 py-1 rounded-xl shadow-sm">FLY HIGH</span>
            <span className="hidden sm:inline">IDIOMAS</span>
          </h2>
        </Link>

        <div className="flex items-center gap-4 md:gap-6">
          <span className="text-zinc-400 font-bold text-sm hidden md:block">
            Olá, <strong className="text-white uppercase">{user.nome || user.login}</strong>
          </span>
          <button
            onClick={signOut}
            className="bg-zinc-800 border border-zinc-700 text-zinc-300 hover:text-white hover:border-yellow-400 hover:bg-zinc-700 transition-all font-black uppercase tracking-widest py-2.5 px-5 rounded-xl text-xs flex items-center gap-2 shadow-sm shrink-0"
          >
            Sair <span className="text-base leading-none">⏏️</span>
          </button>
        </div>
      </nav>

      {modulosLiberados.length > 0 && (
        <div className="print:hidden bg-white border-b border-zinc-200 shadow-sm">
          <div className="px-6 md:px-10 py-3 flex gap-2 overflow-x-auto">
            <Link
              href="/"
              className="shrink-0 px-4 py-2.5 rounded-xl font-black uppercase text-[11px] tracking-widest text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 transition-all flex items-center gap-2"
            >
              <span className="text-base leading-none">🏠</span> Início
            </Link>

            <span className="w-px bg-zinc-200 mx-1 shrink-0"></span>

            {modulosLiberados.map(modulo => {
              const ativo = pathname === modulo.href || pathname.startsWith(`${modulo.href}/`);
              return (
                <Link
                  key={modulo.href}
                  href={modulo.href}
                  className={`shrink-0 px-4 py-2.5 rounded-xl font-black uppercase text-[11px] tracking-widest transition-all flex items-center gap-2 ${
                    ativo
                      ? 'bg-zinc-900 text-white shadow-md'
                      : 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900'
                  }`}
                >
                  <span className="text-base leading-none">{modulo.icone}</span> {modulo.rotulo}
                </Link>
              );
            })}
          </div>
        </div>
      )}

      <main className="flex-grow">
        {children}
      </main>

      <footer className="print:hidden px-10 py-6 text-center border-t border-zinc-200 bg-white">
        <p className="text-zinc-400 text-xs font-black tracking-widest uppercase">
          &copy; 2026 Fly High Idiomas | Admin Panel v1.0
        </p>
      </footer>
    </div>
  );
}
