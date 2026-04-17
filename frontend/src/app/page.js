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

  if (carregando) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center">Carregando...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-zinc-900">
      <nav className="bg-zinc-900 px-10 py-5 flex justify-between items-center shadow-lg">
        <h2 className="text-xl font-black text-white flex items-center gap-2 tracking-tighter">
          <span className="bg-yellow-400 text-zinc-900 px-2 py-0.5 rounded">FLYHIGH</span>IDIOMAS
        </h2>
        <div className="flex items-center gap-6">
          {user && (
            <span className="text-zinc-400 text-sm hidden sm:block">
              Olá, <strong className="text-white">{user.login}</strong>
            </span>
          )}
          <button 
            onClick={signOut}
            className="bg-transparent border border-zinc-600 text-zinc-300 hover:text-white hover:border-yellow-400 hover:bg-zinc-800 transition-all font-bold py-2 px-4 rounded text-sm flex items-center gap-2"
          >
            Sair <span className="text-lg leading-none">⏏️</span>
          </button>
        </div>
      </nav>

      <main className="p-10 max-w-7xl mx-auto">
        <header className="mb-12 border-l-8 border-yellow-400 pl-6">
          <h1 className="text-4xl font-black text-zinc-900 uppercase">Welcome back!</h1>
          <p className="text-zinc-500 mt-1 font-medium italic">O que você deseja gerenciar hoje?</p>
        </header>   

        <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 mb-8">
          
          {/* Card 01: Alunos */}
          <Link href="/views/alunos" className="group h-full">
            <div className="bg-zinc-900 p-8 rounded-sm hover:translate-x-2 hover:-translate-y-2 transition-all duration-300 relative h-full flex flex-col">
              <div className="absolute inset-0 bg-yellow-400 translate-x-0 translate-y-0 group-hover:translate-x-4 group-hover:translate-y-4 -z-10 transition-all"></div>
              <div className="flex justify-between items-start mb-6 w-full">
                <div className="text-4xl">🎓</div>
                <span className="text-yellow-400 text-4xl group-hover:translate-x-2 transition-transform flex-shrink-0">&rarr;</span>
              </div>
              <div className="flex flex-col flex-grow justify-between">
                <h3 className="text-2xl font-black text-white mb-3 uppercase tracking-tighter">Gestão de Alunos</h3>
                <p className="text-zinc-400 font-medium mt-2 text-sm leading-relaxed">Gerencie dados de contato e endereços dos alunos.</p>
              </div>
            </div>
          </Link>

          {/* Card 02: Responsáveis */}
          <Link href="/views/responsaveis" className="group h-full">
            <div className="bg-white border-4 border-zinc-900 p-8 rounded-sm hover:translate-x-2 hover:-translate-y-2 transition-all duration-300 relative h-full flex flex-col">
              <div className="absolute inset-0 bg-zinc-200 translate-x-0 translate-y-0 group-hover:translate-x-4 group-hover:translate-y-4 -z-10 transition-all"></div>
              <div className="flex justify-between items-start mb-6 w-full">
                <div className="text-4xl">👥</div>
                <span className="text-zinc-900 text-4xl group-hover:translate-x-2 transition-transform flex-shrink-0">&rarr;</span>
              </div>
              <div className="flex flex-col flex-grow justify-between">
                <h3 className="text-2xl font-black text-zinc-900 mb-3 uppercase tracking-tighter">Responsáveis</h3>
                <p className="text-zinc-500 font-medium mt-2 text-sm leading-relaxed">Gerencie dados de contato e endereços dos pais ou tutores.</p>
              </div>
            </div>
          </Link>

          {/* Card 03: Cursos */}
          <Link href="/views/cursos" className="group h-full">
            <div className="bg-yellow-400 border-4 border-zinc-900 p-8 rounded-sm hover:translate-x-2 hover:-translate-y-2 transition-all duration-300 relative h-full flex flex-col">
              <div className="absolute inset-0 bg-white border-4 border-zinc-900 translate-x-0 translate-y-0 group-hover:translate-x-4 group-hover:translate-y-4 -z-10 transition-all"></div>
              <div className="flex justify-between items-start mb-6 w-full">
                <div className="text-4xl">📚</div>
                <span className="text-zinc-900 text-4xl group-hover:translate-x-2 transition-transform flex-shrink-0">&rarr;</span>
              </div>
              <div className="flex flex-col flex-grow justify-between">
                <h3 className="text-2xl font-black text-zinc-900 mb-3 uppercase tracking-tighter">Níveis & Cursos</h3>
                <p className="text-zinc-800 font-medium mt-2 text-sm leading-relaxed">Gerencie os níveis de ensino, cargas horárias e valores.</p>
              </div>
            </div>
          </Link>

          {/* Card 04: Turmas */}
          <Link href="/views/turmas" className="group h-full">
            <div className="bg-zinc-100 border-4 border-zinc-900 p-8 rounded-sm hover:translate-x-2 hover:-translate-y-2 group-hover:bg-zinc-900 transition-colors duration-300 relative h-full flex flex-col">
              <div className="absolute inset-0 bg-yellow-400 translate-x-0 translate-y-0 group-hover:translate-x-4 group-hover:translate-y-4 -z-10 transition-all"></div>
              <div className="flex justify-between items-start mb-6 w-full">
                <div className="text-4xl">🗓️</div>
                <span className="text-zinc-900 group-hover:text-yellow-400 text-4xl group-hover:translate-x-2 transition-all flex-shrink-0">&rarr;</span>
              </div>
              <div className="flex flex-col flex-grow justify-between">
                <h3 className="text-2xl font-black text-zinc-900 group-hover:text-white mb-3 uppercase tracking-tighter transition-colors">Gestão de Turmas</h3>
                <p className="text-zinc-600 group-hover:text-zinc-300 font-medium mt-2 text-sm leading-relaxed transition-colors">Gerencie horários, capacidades e alocação de turmas.</p>
              </div>
            </div>
          </Link>

          {/* Card 05: Perfis de Acesso */}
          <Link href="/views/perfis" className="group h-full">
            <div className="bg-zinc-900 border-4 border-zinc-900 p-8 rounded-sm hover:translate-x-2 hover:-translate-y-2 transition-all duration-300 relative h-full flex flex-col">
              <div className="absolute inset-0 bg-sky-300 translate-x-0 translate-y-0 group-hover:translate-x-4 group-hover:translate-y-4 -z-10 transition-all"></div>
              <div className="flex justify-between items-start mb-6 w-full">
                <div className="text-4xl">🛡️</div>
                <span className="text-sky-300 text-4xl group-hover:translate-x-2 transition-transform flex-shrink-0">&rarr;</span>
              </div>
              <div className="flex flex-col flex-grow justify-between">
                <h3 className="text-2xl font-black text-white mb-3 uppercase tracking-tighter">Perfis & Acessos</h3>
                <p className="text-zinc-400 font-medium mt-2 text-sm leading-relaxed">Gerencie níveis de permissão e cargos do sistema.</p>
              </div>
            </div>
          </Link>

          {/* CARD USUÁRIOS */}
          <div onClick={() => router.push('/views/usuarios')} className="group cursor-pointer bg-white border-4 border-zinc-900 p-6 shadow-[8px_8px_0px_0px_rgba(24,24,27,1)] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all">
            <div className="flex justify-between items-start mb-4">
              <div className="bg-yellow-400 p-3 border-2 border-zinc-900">
                <span className="text-2xl">👤</span>
              </div>
              <span className="text-xs font-black uppercase tracking-widest text-zinc-400">Equipe</span>
            </div>
            <h3 className="font-black text-xl uppercase italic tracking-tighter group-hover:text-sky-500">Usuários</h3>
            <p className="text-sm font-medium text-zinc-600 mt-2">Gerencie acessos, logins e senhas da equipe.</p>
          </div>

        </section>

        <footer className="mt-20 text-center">
          <p className="text-zinc-400 text-sm font-bold tracking-widest uppercase">
            &copy; 2026 FlyHigh Idiomas | Admin Panel v1.0
          </p>
        </footer>
      </main>
    </div>
  );
}