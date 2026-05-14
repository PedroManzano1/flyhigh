"use client";
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/authContext'; 

export default function Home() {
  const router = useRouter();
  const { user, signOut } = useContext(AuthContext); 
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('flyhigh_token');
    if (!token) {
      router.push('/login');
    } else {
      setCarregando(false);
    }
  }, [router]);

  const temPermissao = (permissaoNecessaria) => {
    if (!user || !user.permissoes) return false;
    return user.permissoes.includes('ROLE_DIRETOR') || user.permissoes.includes(permissaoNecessaria);
  };

  if (carregando) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center font-black uppercase text-zinc-400 animate-pulse text-xl tracking-widest">
        Carregando FlyHigh...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-zinc-900 flex flex-col">
      
      {/* NAVBAR RESTAURADA: Fundo escuro, IDIOMAS em branco e borda preta */}
      <nav className="bg-zinc-900 px-10 py-5 flex justify-between items-center shadow-md border-b-4 border-zinc-950">
        <h2 className="text-2xl font-black text-white flex items-center gap-2 tracking-tighter">
          <span className="bg-yellow-400 text-zinc-900 px-3 py-1 rounded-xl shadow-sm">FLYHIGH</span>IDIOMAS
        </h2>
        <div className="flex items-center gap-6">
          {user && (
            <span className="text-zinc-400 font-bold text-sm hidden sm:block">
              Olá, <strong className="text-white uppercase">{user.login}</strong>
            </span>
          )}
          <button 
            onClick={signOut}
            className="bg-zinc-800 border border-zinc-700 text-zinc-300 hover:text-white hover:border-yellow-400 hover:bg-zinc-700 transition-all font-black uppercase tracking-widest py-2.5 px-5 rounded-xl text-xs flex items-center gap-2 shadow-sm"
          >
            Sair <span className="text-base leading-none">⏏️</span>
          </button>
        </div>
      </nav>

      <main className="p-10 max-w-7xl mx-auto w-full flex-grow flex flex-col">
        
        <header className="mb-14">
          <h1 className="text-5xl font-black text-zinc-900 uppercase tracking-tighter italic">Welcome back!</h1>
          <div className="h-2 w-24 bg-yellow-400 mt-3 rounded-full mb-4"></div>
          <p className="text-zinc-500 font-bold text-lg">O que você deseja gerenciar hoje?</p>
        </header>   

        <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 mb-8">
          
          {temPermissao('ALUNOS_READ') && (
            <Link href="/views/alunos" className="group h-full">
              <div className="bg-zinc-900 p-8 rounded-3xl border border-zinc-800 shadow-md hover:shadow-xl hover:-translate-y-2 transition-all duration-300 h-full flex flex-col">
                <div className="flex justify-between items-start mb-8 w-full">
                  <div className="text-4xl bg-zinc-800 p-4 rounded-2xl">🎓</div>
                  <span className="text-yellow-400 text-3xl group-hover:translate-x-2 transition-transform flex-shrink-0">&rarr;</span>
                </div>
                <div className="flex flex-col flex-grow justify-between">
                  <h3 className="text-2xl font-black text-white mb-3 uppercase tracking-tight">Gestão de Alunos</h3>
                  <p className="text-zinc-400 font-bold mt-2 text-sm leading-relaxed">Gerencie matrículas, dados de contato e histórico dos alunos.</p>
                </div>
              </div>
            </Link>
          )}

          {temPermissao('RESPONSAVEIS_READ') && (
            <Link href="/views/responsaveis" className="group h-full">
              <div className="bg-white p-8 rounded-3xl border border-zinc-200 shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-300 h-full flex flex-col">
                <div className="flex justify-between items-start mb-8 w-full">
                  <div className="text-4xl bg-zinc-50 p-4 rounded-2xl">👥</div>
                  <span className="text-zinc-300 text-3xl group-hover:text-zinc-900 group-hover:translate-x-2 transition-all flex-shrink-0">&rarr;</span>
                </div>
                <div className="flex flex-col flex-grow justify-between">
                  <h3 className="text-2xl font-black text-zinc-900 mb-3 uppercase tracking-tight">Responsáveis</h3>
                  <p className="text-zinc-500 font-bold mt-2 text-sm leading-relaxed">Gerencie endereços e contatos dos pais ou tutores legais.</p>
                </div>
              </div>
            </Link>
          )}

          {temPermissao('CURSOS_READ') && (
            <Link href="/views/cursos" className="group h-full">
              <div className="bg-yellow-400 p-8 rounded-3xl border border-yellow-300 shadow-md hover:shadow-xl hover:-translate-y-2 transition-all duration-300 h-full flex flex-col">
                <div className="flex justify-between items-start mb-8 w-full">
                  <div className="text-4xl bg-yellow-300/50 p-4 rounded-2xl">📚</div>
                  <span className="text-zinc-900 text-3xl group-hover:translate-x-2 transition-transform flex-shrink-0">&rarr;</span>
                </div>
                <div className="flex flex-col flex-grow justify-between">
                  <h3 className="text-2xl font-black text-zinc-900 mb-3 uppercase tracking-tight">Níveis & Cursos</h3>
                  <p className="text-yellow-900 font-bold mt-2 text-sm leading-relaxed">Gerencie os níveis de ensino, cargas horárias e valores de base.</p>
                </div>
              </div>
            </Link>
          )}

          {temPermissao('TURMAS_READ') && (
            <Link href="/views/turmas" className="group h-full">
              <div className="bg-zinc-50 p-8 rounded-3xl border border-zinc-200 shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-300 h-full flex flex-col">
                <div className="flex justify-between items-start mb-8 w-full">
                  <div className="text-4xl bg-white shadow-sm p-4 rounded-2xl border border-zinc-100">🗓️</div>
                  <span className="text-zinc-300 text-3xl group-hover:text-yellow-500 group-hover:translate-x-2 transition-all flex-shrink-0">&rarr;</span>
                </div>
                <div className="flex flex-col flex-grow justify-between">
                  <h3 className="text-2xl font-black text-zinc-900 mb-3 uppercase tracking-tight">Gestão de Turmas</h3>
                  <p className="text-zinc-500 font-bold mt-2 text-sm leading-relaxed">Controle horários, limites de vagas e professores alocados.</p>
                </div>
              </div>
            </Link>
          )}

          {temPermissao('PERFIS_READ') && (
            <Link href="/views/perfis" className="group h-full">
              <div className="bg-zinc-900 p-8 rounded-3xl border border-zinc-800 shadow-md hover:shadow-xl hover:-translate-y-2 transition-all duration-300 h-full flex flex-col">
                <div className="flex justify-between items-start mb-8 w-full">
                  <div className="text-4xl bg-zinc-800 p-4 rounded-2xl">🛡️</div>
                  <span className="text-sky-400 text-3xl group-hover:translate-x-2 transition-transform flex-shrink-0">&rarr;</span>
                </div>
                <div className="flex flex-col flex-grow justify-between">
                  <h3 className="text-2xl font-black text-white mb-3 uppercase tracking-tight">Perfis & Acessos</h3>
                  <p className="text-zinc-400 font-bold mt-2 text-sm leading-relaxed">Gerencie a matriz de permissões e os cargos do sistema.</p>
                </div>
              </div>
            </Link>
          )}

          {temPermissao('USUARIOS_READ') && (
            <div onClick={() => router.push('/views/usuarios')} className="group cursor-pointer bg-white p-8 rounded-3xl border border-zinc-200 shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-300 h-full flex flex-col">
              <div className="flex justify-between items-start mb-8 w-full">
                <div className="text-4xl bg-zinc-50 p-4 rounded-2xl border border-zinc-100">👤</div>
                <span className="text-zinc-300 text-3xl group-hover:text-sky-500 group-hover:translate-x-2 transition-all flex-shrink-0">&rarr;</span>
              </div>
              <div className="flex flex-col flex-grow justify-between">
                <h3 className="text-2xl font-black text-zinc-900 mb-3 uppercase tracking-tight group-hover:text-sky-500 transition-colors">Equipe & Usuários</h3>
                <p className="text-zinc-500 font-bold mt-2 text-sm leading-relaxed">Gerencie os acessos, logins e senhas da equipe escolar.</p>
              </div>
            </div>
          )}

          {temPermissao('RECADOS_READ') && (
            <Link href="/views/recados" className="group h-full">
              <div className="bg-emerald-400 p-8 rounded-3xl border border-emerald-300 shadow-md hover:shadow-xl hover:-translate-y-2 transition-all duration-300 h-full flex flex-col">
                <div className="flex justify-between items-start mb-8 w-full">
                  <div className="text-4xl bg-emerald-300/50 p-4 rounded-2xl">📢</div>
                  <span className="text-emerald-900 text-3xl group-hover:translate-x-2 transition-transform flex-shrink-0">&rarr;</span>
                </div>
                <div className="flex flex-col flex-grow justify-between">
                  <h3 className="text-2xl font-black text-emerald-950 mb-3 uppercase tracking-tight">Mural de Recados</h3>
                  <p className="text-emerald-900 font-bold mt-2 text-sm leading-relaxed">Publique comunicados e avisos gerais para toda a comunidade.</p>
                </div>
              </div>
            </Link>
          )}

        </section>

        {user && user.permissoes && user.permissoes.length === 0 && (
           <div className="bg-white border border-zinc-200 rounded-3xl p-10 text-center mt-8 shadow-sm flex flex-col items-center justify-center">
             <span className="text-6xl mb-4">🔒</span>
             <h3 className="text-2xl font-black uppercase mb-2 text-zinc-900">Acesso Restrito</h3>
             <p className="text-zinc-500 font-bold text-lg">Seu perfil atual não possui módulos liberados. Contate a direção da escola.</p>
           </div>
        )}

        <footer className="mt-auto pt-20 pb-4 text-center">
          <p className="text-zinc-400 text-xs font-black tracking-widest uppercase">
            &copy; 2026 FlyHigh Idiomas | Admin Panel v1.0
          </p>
        </footer>
      </main>
    </div>
  );
}