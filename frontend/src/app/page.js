"use client";
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-zinc-900">
      {/* Navbar com as cores da escola */}
      <nav className="bg-zinc-900 px-10 py-5 flex justify-between items-center shadow-lg">
        <h2 className="text-xl font-black text-white flex items-center gap-2 tracking-tighter">
          <span className="bg-yellow-400 text-zinc-900 px-2 py-0.5 rounded">FLYHIGH</span>IDIOMAS
        </h2>
      </nav>

      <main className="p-10 max-w-7xl mx-auto">
        {/* Boas-vindas */}
        <header className="mb-12 border-l-8 border-yellow-400 pl-6">
          <h1 className="text-4xl font-black text-zinc-900 uppercase">Welcome back!</h1>
          <p className="text-zinc-500 mt-1 font-medium italic">O que você deseja gerenciar hoje?</p>
        </header>   

        {/* Menu Principal */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          
          {/* Card 01: Alunos */}
          <Link href="/views/alunos" className="group h-full">
            <div className="bg-zinc-900 p-10 rounded-sm hover:translate-x-2 hover:-translate-y-2 transition-all duration-300 relative h-full">
              <div className="absolute inset-0 bg-yellow-400 translate-x-0 translate-y-0 group-hover:translate-x-4 group-hover:translate-y-4 -z-10 transition-all"></div>
              
              <div className="flex justify-between items-start h-full">
                <div className="flex flex-col justify-between h-full">
                  <div>
                    <div className="text-4xl mb-6">🎓</div>
                    <h3 className="text-3xl font-black text-white mb-3 uppercase tracking-tighter">Gestão de Alunos</h3>
                  </div>
                  <p className="text-zinc-400 font-medium max-w-xs mt-4">
                    Gerencie dados de contato e endereços dos alunos.
                  </p>
                </div>
                <span className="text-yellow-400 text-4xl group-hover:translate-x-2 transition-transform">&rarr;</span>
              </div>
            </div>
          </Link>

          {/* Card 02: Responsáveis */}
          <Link href="/views/responsaveis" className="group h-full">
            <div className="bg-white border-4 border-zinc-900 p-10 rounded-sm hover:translate-x-2 hover:-translate-y-2 transition-all duration-300 relative h-full">
              <div className="absolute inset-0 bg-zinc-200 translate-x-0 translate-y-0 group-hover:translate-x-4 group-hover:translate-y-4 -z-10 transition-all"></div>
              
              <div className="flex justify-between items-start h-full">
                <div className="flex flex-col justify-between h-full">
                  <div>
                    <div className="text-4xl mb-6">👥</div>
                    <h3 className="text-3xl font-black text-zinc-900 mb-3 uppercase tracking-tighter">Responsáveis</h3>
                  </div>
                  <p className="text-zinc-500 font-medium max-w-xs mt-4">
                    Gerencie dados de contato e endereços dos pais ou tutores legais.
                  </p>
                </div>
                <span className="text-zinc-900 text-4xl group-hover:translate-x-2 transition-transform">&rarr;</span>
              </div>
            </div>
          </Link>

          {/* Card 03: Cursos */}
          <Link href="/views/cursos" className="group h-full">
            <div className="bg-yellow-400 border-4 border-zinc-900 p-10 rounded-sm hover:translate-x-2 hover:-translate-y-2 transition-all duration-300 relative h-full">
              {/* Sombra alterada para branco com borda preta para não atrapalhar a leitura */}
              <div className="absolute inset-0 bg-white border-4 border-zinc-900 translate-x-0 translate-y-0 group-hover:translate-x-4 group-hover:translate-y-4 -z-10 transition-all"></div>
              
              <div className="flex justify-between items-start h-full">
                <div className="flex flex-col justify-between h-full">
                  <div>
                    <div className="text-4xl mb-6">📚</div>
                    <h3 className="text-3xl font-black text-zinc-900 mb-3 uppercase tracking-tighter">Níveis & Cursos</h3>
                  </div>
                  <p className="text-zinc-800 font-medium max-w-xs mt-4">
                    Gerencie os níveis de ensino, cargas horárias e valores.
                  </p>
                </div>
                <span className="text-zinc-900 text-4xl group-hover:translate-x-2 transition-transform">&rarr;</span>
              </div>
            </div>
          </Link>

        </section>

        {/* Footer/Aviso */}
        <footer className="mt-20 text-center">
          <p className="text-zinc-400 text-sm font-bold tracking-widest uppercase">
            &copy; 2026 FlyHigh Idiomas | Admin Panel v1.0
          </p>
        </footer>
      </main>
    </div>
  );
}