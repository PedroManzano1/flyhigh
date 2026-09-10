"use client";
import { createContext, useCallback, useContext, useRef, useState } from 'react';

/**
 * Substitui alert() e window.confirm() por toast e modal.
 *
 * const { notificar, confirmar } = useFeedback();
 * notificar("Aluno cadastrado!", "sucesso");
 * if (!(await confirmar("Excluir este registro?"))) return;
 */

const FeedbackContext = createContext({
  notificar: () => {},
  confirmar: async () => false
});

export function useFeedback() {
  return useContext(FeedbackContext);
}

const ESTILO_AVISO = {
  sucesso: { classe: 'bg-emerald-500 border-emerald-600 text-white', icone: '✔' },
  erro: { classe: 'bg-red-600 border-red-700 text-white', icone: '✕' },
  alerta: { classe: 'bg-yellow-400 border-yellow-500 text-zinc-900', icone: '⚠' },
  info: { classe: 'bg-zinc-900 border-zinc-950 text-white', icone: 'ℓ' }
};

export function FeedbackProvider({ children }) {
  const [avisos, setAvisos] = useState([]);
  const [pergunta, setPergunta] = useState(null);
  const proximoId = useRef(1);

  const fechar = useCallback((id) => {
    setAvisos(atuais => atuais.filter(a => a.id !== id));
  }, []);

  const notificar = useCallback((mensagem, tipo = 'info') => {
    if (!mensagem) return;
    const id = proximoId.current++;
    setAvisos(atuais => [...atuais, { id, mensagem: String(mensagem), tipo }]);
    setTimeout(() => fechar(id), tipo === 'erro' ? 7000 : 4000);
  }, [fechar]);

  const confirmar = useCallback((mensagem, opcoes = {}) => {
    return new Promise(resolve => {
      setPergunta({
        mensagem: String(mensagem),
        titulo: opcoes.titulo || 'Confirmar ação',
        rotuloConfirmar: opcoes.rotuloConfirmar || 'Confirmar',
        rotuloCancelar: opcoes.rotuloCancelar || 'Cancelar',
        perigoso: opcoes.perigoso !== false,
        resolver: resolve
      });
    });
  }, []);

  const responder = (resposta) => {
    if (pergunta?.resolver) pergunta.resolver(resposta);
    setPergunta(null);
  };

  return (
    <FeedbackContext.Provider value={{ notificar, confirmar }}>
      {children}

      {/* Toasts */}
      <div className="fixed bottom-8 right-8 z-[100] flex flex-col gap-3 w-full max-w-sm pointer-events-none">
        {avisos.map(aviso => {
          const estilo = ESTILO_AVISO[aviso.tipo] || ESTILO_AVISO.info;
          return (
            <div
              key={aviso.id}
              role="status"
              onClick={() => fechar(aviso.id)}
              className={`pointer-events-auto cursor-pointer border-2 rounded-2xl px-6 py-5 shadow-xl flex items-start gap-4 ${estilo.classe}`}
            >
              <span className="text-xl font-black leading-none mt-0.5">{estilo.icone}</span>
              <p className="font-bold text-sm leading-snug flex-grow">{aviso.mensagem}</p>
              <span className="font-black text-xs opacity-60 uppercase tracking-widest">Fechar</span>
            </div>
          );
        })}
      </div>

      {/* Modal de confirmação */}
      {pergunta && (
        <div className="fixed inset-0 z-[110] bg-zinc-900/60 flex items-center justify-center p-6">
          <div className="bg-white border-4 border-zinc-900 rounded-3xl shadow-[8px_8px_0px_0px_rgba(24,24,27,1)] w-full max-w-lg p-8">
            <h2 className="text-2xl font-black uppercase tracking-tighter italic text-zinc-900">
              {pergunta.titulo}
            </h2>
            <div className="h-2 w-16 bg-yellow-400 rounded-full mt-2 mb-6"></div>

            <p className="font-bold text-zinc-700 leading-relaxed whitespace-pre-line">
              {pergunta.mensagem}
            </p>

            <div className="flex justify-end gap-4 mt-10">
              <button
                type="button"
                onClick={() => responder(false)}
                className="px-6 py-4 font-black uppercase text-sm tracking-widest text-zinc-500 hover:text-zinc-900 transition-all underline decoration-zinc-300 decoration-2"
              >
                {pergunta.rotuloCancelar}
              </button>
              <button
                type="button"
                autoFocus
                onClick={() => responder(true)}
                className={`px-8 py-4 rounded-2xl font-black uppercase text-sm tracking-widest transition-all shadow-md ${
                  pergunta.perigoso
                    ? 'bg-red-600 text-white hover:bg-zinc-900'
                    : 'bg-yellow-400 text-zinc-900 hover:bg-zinc-900 hover:text-white'
                }`}
              >
                {pergunta.rotuloConfirmar}
              </button>
            </div>
          </div>
        </div>
      )}
    </FeedbackContext.Provider>
  );
}
