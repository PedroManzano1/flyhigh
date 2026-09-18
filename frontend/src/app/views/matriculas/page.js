"use client";
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * A tela provisória de matrículas foi substituída pelos Contratos (Estória 7).
 * O caminho antigo continua existindo só para não quebrar links salvos.
 */
export default function MatriculasPage() {
  const router = useRouter();

  useEffect(() => { router.replace('/views/contratos'); }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <span className="font-black uppercase tracking-widest animate-pulse text-zinc-800 text-xl">
        Redirecionando para Contratos...
      </span>
    </div>
  );
}
