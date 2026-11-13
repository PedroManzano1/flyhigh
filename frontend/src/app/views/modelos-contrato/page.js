"use client";
import { useState, useEffect, useContext, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useFeedback } from '../../../components/feedback';
import { TituloPagina } from '../../../components/ui';
import api, { mensagemErro } from '../../../utils/api';
import { AuthContext } from '../../../context/authContext';
import { formatarData } from '../../../utils/formato';
import { TIPOS_MODELO, ROTULO_STATUS } from '../../../utils/modeloContrato';

/**
 * Modelos de contrato: o texto dos contratos normal e VIP, com versões.
 * Versão publicada não muda; para alterar uma cláusula cria-se uma nova versão.
 */

const COR_STATUS = {
  RASCUNHO: 'bg-amber-50 text-amber-800 border-amber-200',
  VIGENTE: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  ARQUIVADO: 'bg-zinc-100 text-zinc-500 border-zinc-200'
};

function LinhaVersao({ modelo, onAbrir }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3 border-b border-zinc-100 last:border-0">
      <div className="min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-black text-zinc-900">Versão {modelo.versao}</span>
          <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-widest border ${COR_STATUS[modelo.status]}`}>
            {ROTULO_STATUS[modelo.status] || modelo.status}
          </span>
          <span className="text-xs font-bold text-zinc-500">
            {modelo.contratosVinculados ?? 0} contrato(s)
          </span>
        </div>
        <div className="text-xs font-bold text-zinc-500 mt-1 truncate">
          {modelo.publicadoEm
            ? <>Publicada em {formatarData(modelo.publicadoEm)} por {modelo.publicadoPor}</>
            : <>Criada em {formatarData(modelo.criadoEm)} por {modelo.criadoPor}</>}
          {modelo.descricaoAlteracao && <> · {modelo.descricaoAlteracao}</>}
        </div>
      </div>
      <button
        onClick={() => onAbrir(modelo)}
        className="shrink-0 px-4 py-2 rounded-xl bg-white border-2 border-zinc-200 font-black uppercase text-[10px] tracking-widest hover:bg-zinc-900 hover:text-white transition-all"
      >
        Ver
      </button>
    </div>
  );
}

function CartaoTipo({ tipo, versoes, podeEscrever, podeExcluir, ocupado, onNovaVersao, onAbrir, onDescartar }) {
  const vigente = versoes.find(v => v.status === 'VIGENTE');
  const rascunho = versoes.find(v => v.status === 'RASCUNHO');
  const arquivadas = versoes.filter(v => v.status === 'ARQUIVADO');

  return (
    <section className="bg-white rounded-3xl border border-zinc-200 shadow-sm overflow-hidden">
      <header className="p-6 md:p-8 border-b border-zinc-100 bg-zinc-50">
        <h2 className="font-black text-2xl uppercase tracking-tight">{tipo.rotulo}</h2>
        {vigente ? (
          <p className="text-sm font-bold text-zinc-600 mt-2">
            Contratos novos usam a <strong>versão {vigente.versao}</strong>, publicada em {formatarData(vigente.publicadoEm)}.
          </p>
        ) : (
          <p className="text-sm font-bold text-amber-700 mt-2">Nenhuma versão publicada ainda.</p>
        )}
      </header>

      <div className="p-6 md:p-8 space-y-6">
        {rascunho ? (
          <div className="rounded-2xl border-2 border-amber-300 bg-amber-50 p-5">
            <div className="font-black uppercase text-sm text-zinc-900">✎ Versão {rascunho.versao} em edição</div>
            <p className="text-xs font-bold text-zinc-600 mt-1">
              Começada em {formatarData(rascunho.criadoEm)} por {rascunho.criadoPor}. Só passa a valer quando for publicada.
            </p>
            <div className="flex gap-3 mt-4 flex-wrap">
              <button
                onClick={() => onAbrir(rascunho)}
                className="px-5 py-3 bg-zinc-900 text-white rounded-xl font-black uppercase text-xs tracking-widest hover:bg-yellow-400 hover:text-zinc-900 transition-all"
              >
                {podeEscrever ? 'Continuar editando' : 'Ver rascunho'}
              </button>
              {podeExcluir && (
                <button
                  onClick={() => onDescartar(rascunho)}
                  className="px-5 py-3 bg-white text-zinc-700 border-2 border-zinc-200 rounded-xl font-black uppercase text-xs tracking-widest hover:bg-red-600 hover:text-white hover:border-red-600 transition-all"
                >
                  Descartar
                </button>
              )}
            </div>
          </div>
        ) : podeEscrever && vigente && (
          <button
            onClick={() => onNovaVersao(vigente)}
            disabled={ocupado}
            className="w-full p-5 bg-yellow-400 text-zinc-900 rounded-2xl font-black uppercase text-sm tracking-widest hover:bg-zinc-900 hover:text-white transition-all shadow-md disabled:opacity-50"
          >
            + Criar nova versão para editar
          </button>
        )}

        <div>
          <div className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2">Versões</div>
          {[vigente, ...arquivadas].filter(Boolean).map(v => (
            <LinhaVersao key={v.idModeloContrato} modelo={v} onAbrir={onAbrir} />
          ))}
          {!vigente && arquivadas.length === 0 && (
            <p className="text-sm font-bold text-zinc-400">Nenhuma versão publicada.</p>
          )}
        </div>
      </div>
    </section>
  );
}

export default function ModelosContratoPage() {
  const router = useRouter();
  const { notificar, confirmar } = useFeedback();
  const { temPermissao } = useContext(AuthContext);

  const [modelos, setModelos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);
  const [ocupado, setOcupado] = useState(false);

  const podeEscrever = temPermissao('MODELOS_CONTRATO_WRITE');
  const podeExcluir = temPermissao('MODELOS_CONTRATO_DELETE');

  const carregar = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/modelos-contrato');
      setModelos(Array.isArray(res.data) ? res.data : []);
      setErro(null);
    } catch (err) {
      setErro(mensagemErro(err, "Erro ao carregar os modelos de contrato."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { carregar(); }, [carregar]);

  const abrir = (modelo) => router.push(`/views/modelos-contrato/editar?id=${modelo.idModeloContrato}`);

  const novaVersao = async (base) => {
    setOcupado(true);
    try {
      const res = await api.post(`/api/modelos-contrato/${base.idModeloContrato}/nova-versao`);
      router.push(`/views/modelos-contrato/editar?id=${res.data.idModeloContrato}`);
    } catch (err) {
      notificar(mensagemErro(err, "Não foi possível criar a nova versão."), 'erro');
      setOcupado(false);
    }
  };

  const descartar = async (rascunho) => {
    const ok = await confirmar(
      `Descartar a versão ${rascunho.versao} em edição? Tudo o que foi alterado nela será perdido. A versão em uso não muda.`,
      { titulo: 'Descartar rascunho', rotuloConfirmar: 'Descartar' }
    );
    if (!ok) return;
    try {
      await api.delete(`/api/modelos-contrato/${rascunho.idModeloContrato}`);
      notificar("Rascunho descartado.", 'sucesso');
      carregar();
    } catch (err) {
      notificar(mensagemErro(err, "Não foi possível descartar o rascunho."), 'erro');
    }
  };

  return (
    <div className="p-10 bg-gray-50 min-h-screen text-zinc-900 font-sans">
      <TituloPagina
        titulo="Modelos de Contrato"
        descricao="O texto que sai impresso nos contratos: cláusulas, dados da escola e testemunhas."
      >
        <button
          onClick={() => router.push('/views/contratos')}
          className="px-8 py-4 bg-zinc-900 text-white rounded-2xl font-black text-sm uppercase tracking-[0.2em] hover:bg-yellow-400 hover:text-zinc-900 transition-all shadow-xl"
        >
          ← Contratos
        </button>
      </TituloPagina>

      <section className="bg-white border border-zinc-200 rounded-3xl p-6 md:p-8 mb-10 grid grid-cols-1 md:grid-cols-3 gap-6 text-sm font-bold text-zinc-600">
        <div><span className="block font-black uppercase text-xs tracking-widest text-zinc-900 mb-1">1. Nova versão</span>O sistema copia o texto em uso para um rascunho.</div>
        <div><span className="block font-black uppercase text-xs tracking-widest text-zinc-900 mb-1">2. Editar e conferir</span>Altere o que precisar e confira na folha ao lado, igual à impressão.</div>
        <div><span className="block font-black uppercase text-xs tracking-widest text-zinc-900 mb-1">3. Publicar</span>Contratos novos passam a usar a versão nova. Os antigos continuam com o texto com que foram feitos.</div>
      </section>

      {loading && <div className="text-center uppercase italic font-black text-zinc-500 animate-pulse">Carregando...</div>}
      {!loading && erro && <div className="bg-red-50 border border-red-200 text-red-700 rounded-3xl p-6 font-bold">{erro}</div>}

      {!loading && !erro && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {TIPOS_MODELO.map(tipo => (
            <CartaoTipo
              key={tipo.valor}
              tipo={tipo}
              versoes={modelos.filter(m => m.tipoContrato === tipo.valor)}
              podeEscrever={podeEscrever}
              podeExcluir={podeExcluir}
              ocupado={ocupado}
              onNovaVersao={novaVersao}
              onAbrir={abrir}
              onDescartar={descartar}
            />
          ))}
        </div>
      )}
    </div>
  );
}
