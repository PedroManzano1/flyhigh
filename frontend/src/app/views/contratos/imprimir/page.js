"use client";
import { Suspense, useState, useEffect, useContext, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useFeedback } from '../../../../components/feedback';
import api, { mensagemErro } from '../../../../utils/api';
import { formatarData } from '../../../../utils/formato';
import { AuthContext } from '../../../../context/authContext';
import FolhaContrato from '../../../../components/FolhaContrato';

/**
 * Via impressa do contrato, no mesmo desenho dos modelos oficiais da escola.
 * A impressão é a do próprio navegador (Ctrl+P ou o botão Imprimir), por isso
 * a folha é montada em HTML e a barra de ações some no @media print.
 *
 * O texto vem da versão do modelo de contrato gravada no contrato: contrato
 * assinado reimprime sempre com o texto com que foi assinado.
 */

function ImprimirContratoConteudo() {
  const router = useRouter();
  const { notificar } = useFeedback();
  const searchParams = useSearchParams();
  const id = searchParams.get('id');

  const { temPermissao } = useContext(AuthContext);

  const [dados, setDados] = useState(null);
  const [modelo, setModelo] = useState(null);
  const [vigente, setVigente] = useState(null);
  const [loading, setLoading] = useState(true);
  const [atualizando, setAtualizando] = useState(false);

  const carregar = useCallback(async () => {
    try {
      const res = await api.get(`/api/contratos/${id}/completo`);
      const contrato = res.data?.contrato || {};
      const tipo = (contrato.tipoContrato || 'NORMAL').toUpperCase();

      // Versão do próprio contrato; a vigente serve para avisar que há texto mais novo
      const [resModelo, resVigente] = await Promise.all([
        contrato.idModeloContrato
          ? api.get(`/api/modelos-contrato/${contrato.idModeloContrato}`)
          : api.get(`/api/modelos-contrato/vigente/${tipo}`),
        api.get(`/api/modelos-contrato/vigente/${tipo}`).catch(() => ({ data: null }))
      ]);
      setDados(res.data);
      setModelo(resModelo.data);
      setVigente(resVigente.data);
    } catch (err) {
      notificar(mensagemErro(err, "Erro ao carregar o contrato."), 'erro');
      router.push('/views/contratos');
    } finally {
      setLoading(false);
    }
  }, [id, notificar, router]);

  useEffect(() => {
    if (!id) {
      router.push('/views/contratos');
      return;
    }
    carregar();
  }, [id, carregar, router]);

  const atualizarTexto = async () => {
    setAtualizando(true);
    try {
      await api.patch(`/api/contratos/${id}/atualizar-modelo`);
      notificar(`Contrato passou a usar a versão ${vigente?.versao} do texto.`, 'sucesso');
      await carregar();
    } catch (err) {
      notificar(mensagemErro(err, "Não foi possível atualizar o texto do contrato."), 'erro');
    } finally {
      setAtualizando(false);
    }
  };

  if (loading || !dados || !modelo) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <span className="font-black uppercase tracking-widest animate-pulse text-zinc-800 text-xl">Montando o contrato...</span>
      </div>
    );
  }

  const c = dados.contrato || {};
  const assinado = (c.statusAssinatura || '').toUpperCase() === 'ASSINADO';
  const desatualizado = vigente && modelo && vigente.idModeloContrato !== modelo.idModeloContrato;

  return (
    <div className="bg-zinc-200 min-h-screen py-10 print:bg-white print:py-0">

      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          .sem-impressao { display: none !important; }
          .folha { box-shadow: none !important; margin: 0 !important; padding: 0 !important; width: 100% !important; }
          nav, footer { display: none !important; }
          body { background: #fff !important; }
        }
        @page { size: A4; margin: 14mm; }
      ` }} />

      {/* Barra de ações — não sai na impressão */}
      <div className="sem-impressao max-w-[210mm] mx-auto mb-8 flex flex-wrap justify-between items-center gap-4 px-4">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tighter italic text-zinc-900">
            Contrato {c.numeroContrato || `#${c.idContrato}`}
          </h1>
          <div className="h-2 w-16 bg-yellow-400 rounded-full mt-2"></div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => router.push('/views/contratos')}
            className="px-6 py-4 bg-white text-zinc-900 border-2 border-zinc-300 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-zinc-900 hover:text-white transition-all"
          >
            Voltar
          </button>
          <button
            onClick={() => router.push(`/views/contratos/editar?id=${c.idContrato}`)}
            className="px-6 py-4 bg-white text-zinc-900 border-2 border-zinc-300 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-zinc-900 hover:text-white transition-all"
          >
            Editar
          </button>
          <button
            onClick={() => window.print()}
            className="px-8 py-4 bg-zinc-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-yellow-400 hover:text-zinc-900 transition-all shadow-xl"
          >
            🖨 Imprimir / Salvar PDF
          </button>
        </div>
      </div>

      {/* Versão do texto — não sai na impressão */}
      <div className="sem-impressao max-w-[210mm] mx-auto mb-6 px-4">
        <div className={`rounded-2xl border px-5 py-4 text-sm font-bold flex flex-wrap items-center justify-between gap-3 ${
          desatualizado ? 'bg-amber-50 border-amber-200 text-amber-900' : 'bg-white border-zinc-300 text-zinc-600'
        }`}>
          <span>
            Texto: modelo {modelo.tipoContrato === 'VIP' ? 'VIP' : 'normal'}, versão {modelo.versao}
            {modelo.publicadoEm && <> (publicada em {formatarData(modelo.publicadoEm)})</>}
            {desatualizado && <> · já existe a versão {vigente.versao}{assinado ? ', mas contrato assinado mantém o texto original' : ''}.</>}
          </span>
          {desatualizado && !assinado && temPermissao('CONTRATOS_WRITE') && (
            <button
              onClick={atualizarTexto}
              disabled={atualizando}
              className="px-4 py-2 bg-amber-500 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-zinc-900 transition-all disabled:opacity-50"
            >
              {atualizando ? 'Atualizando...' : `Usar a versão ${vigente.versao}`}
            </button>
          )}
        </div>
      </div>

      <FolhaContrato
        contrato={c}
        parcelasCurso={dados.parcelasCurso || []}
        parcelasMaterial={dados.parcelasMaterial || []}
        modelo={modelo}
      />
    </div>
  );
}

// useSearchParams exige um limite de Suspense no App Router do Next.
export default function ImprimirContratoPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <span className="font-black uppercase tracking-widest animate-pulse text-zinc-800 text-xl">Montando o contrato...</span>
      </div>
    }>
      <ImprimirContratoConteudo />
    </Suspense>
  );
}
