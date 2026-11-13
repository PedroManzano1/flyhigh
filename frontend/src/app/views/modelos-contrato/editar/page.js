"use client";
import { Suspense, useState, useEffect, useContext, useRef, useMemo, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useFeedback } from '../../../../components/feedback';
import { InputField, TextareaField } from '../../../../components/ui';
import FolhaContrato from '../../../../components/FolhaContrato';
import api, { mensagemErro } from '../../../../utils/api';
import { AuthContext } from '../../../../context/authContext';
import { formatarData } from '../../../../utils/formato';
import { hojeISO } from '../../../../utils/financeiro';
import {
  SECOES, VARIAVEIS, CLAUSULA, PARAGRAFO, ROTULO_STATUS, ordenarBlocos, variaveisDesconhecidas
} from '../../../../utils/modeloContrato';

/**
 * Editor de uma versão do modelo de contrato, com a folha ao lado mostrando o
 * resultado. Só rascunho pode ser alterado; versão publicada abre para leitura.
 */

const CAMPOS_TEXTO = [
  'titulo', 'subtitulo', 'escolaRazaoSocial', 'escolaCnpj', 'escolaEndereco', 'escolaCidade',
  'escolaComarca', 'preambulo', 'rotuloAssinaturaContratante', 'rotuloAssinaturaContratada', 'descricaoAlteracao'
];

let proximoId = 1;
const comId = (item) => ({ ...item, _id: proximoId++ });

// Contrato de exemplo só para a pré-visualização
function contratoExemplo(tipo) {
  return {
    tipoContrato: tipo,
    aluno: { nome: 'Nome do aluno', numeroMatricula: '0000' },
    responsavel: {
      nome: 'Nome do contratante', cpf: '000.000.000-00', rg: '00.000.000-0',
      endereco: { logradouro: 'Rua de exemplo', numero: '100', bairro: 'Centro', cep: '00000-000' }
    },
    dataEmissao: hojeISO(),
    cursoNome: 'Kids - 1', tipoCurso: 'Semestral', diasSemana: 'Seg./Qua.', horario: '14:30 às 16:00',
    cargaHorariaEstagio: '64 H/A', descontoPercentual: 10, convenio: 'Particular',
    valorTotalCurso: 3000, valorComDesconto: 2700, diaVencimentoCurso: 10, valorHoraAula: 70,
    valorTotalMaterial: 450, diaVencimentoMaterial: 10
  };
}
const PARCELAS_EXEMPLO = [
  { valor: 225, dataVencimento: '2027-02-10', numeroAulas: 8 },
  { valor: 225, dataVencimento: '2027-03-10', numeroAulas: 8 }
];

// --- Componentes de apoio (fora da página para não perder o foco dos campos) ---

function PainelVariaveis({ onInserir, desabilitado }) {
  return (
    <div className="bg-zinc-900 text-white rounded-3xl p-5 shadow-xl">
      <div className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-3">
        Variáveis — clique no texto e depois na variável para inserir
      </div>
      <div className="flex flex-wrap gap-2">
        {VARIAVEIS.map(v => (
          <button
            key={v.nome}
            type="button"
            title={v.descricao}
            disabled={desabilitado}
            // mouseDown + preventDefault: o campo de texto continua com o foco e o cursor
            onMouseDown={e => { e.preventDefault(); onInserir(v.nome); }}
            className="px-3 py-1.5 rounded-lg bg-zinc-800 border border-zinc-700 font-mono text-[11px] font-bold hover:bg-yellow-400 hover:text-zinc-900 transition-all disabled:opacity-40"
          >
            {`{${v.nome}}`}
          </button>
        ))}
      </div>
    </div>
  );
}

function EditorBloco({ bloco, numero, podeSubir, podeDescer, somenteLeitura, onFoco, onTexto, onTipo, onMover, onRemover }) {
  const desconhecidas = variaveisDesconhecidas(bloco.texto);
  const linhas = Math.min(14, Math.max(3, Math.ceil((bloco.texto || '').length / 85) + 1));
  return (
    <div className={`rounded-2xl border p-4 ${bloco.tipo === CLAUSULA ? 'bg-white border-zinc-200' : 'bg-zinc-50 border-dashed border-zinc-300 ml-6'}`}>
      <div className="flex items-center justify-between gap-3 mb-2 flex-wrap">
        <span className={`px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-widest ${bloco.tipo === CLAUSULA ? 'bg-zinc-900 text-white' : 'bg-zinc-200 text-zinc-700'}`}>
          {bloco.tipo === CLAUSULA ? `Cláusula ${numero}` : 'Parágrafo'}
        </span>
        {!somenteLeitura && (
          <div className="flex gap-1">
            <button type="button" onClick={onTipo} title="Trocar entre cláusula numerada e parágrafo"
              className="px-2 py-1 rounded-lg border border-zinc-200 text-[10px] font-black uppercase tracking-widest hover:bg-zinc-100">
              {bloco.tipo === CLAUSULA ? '→ parágrafo' : '→ cláusula'}
            </button>
            <button type="button" onClick={() => onMover(-1)} disabled={!podeSubir} title="Subir"
              className="w-8 h-8 rounded-lg border border-zinc-200 font-black hover:bg-zinc-100 disabled:opacity-30">↑</button>
            <button type="button" onClick={() => onMover(1)} disabled={!podeDescer} title="Descer"
              className="w-8 h-8 rounded-lg border border-zinc-200 font-black hover:bg-zinc-100 disabled:opacity-30">↓</button>
            <button type="button" onClick={onRemover} title="Remover"
              className="w-8 h-8 rounded-lg border border-zinc-200 font-black hover:bg-red-600 hover:text-white">✕</button>
          </div>
        )}
      </div>
      <TextareaField
        name={`bloco-${bloco._id}`}
        value={bloco.texto}
        onChange={e => onTexto(e.target.value)}
        onFocus={onFoco}
        disabled={somenteLeitura}
        altura="h-auto"
        rows={linhas}
        placeholder={bloco.tipo === CLAUSULA ? 'Texto da cláusula (o "Cláusula N." é colocado sozinho)' : 'Ex.: Parágrafo Único. ...'}
      />
      {desconhecidas.length > 0 && (
        <div className="text-xs font-bold text-red-600 mt-2">Variável desconhecida: {desconhecidas.join(', ')}</div>
      )}
    </div>
  );
}

function EditorTestemunhas({ testemunhas, somenteLeitura, onAlterar, onAdicionar, onRemover }) {
  return (
    <div className="space-y-3">
      {testemunhas.map((t, i) => (
        <div key={t._id} className="grid grid-cols-[1fr_12rem_auto] gap-3 items-end">
          <InputField label={i === 0 ? 'Nome' : undefined} name={`testemunha-nome-${t._id}`} value={t.nome}
            onChange={e => onAlterar(i, 'nome', e.target.value)} disabled={somenteLeitura} />
          <InputField label={i === 0 ? 'Documento' : undefined} name={`testemunha-doc-${t._id}`} value={t.documento}
            onChange={e => onAlterar(i, 'documento', e.target.value)} disabled={somenteLeitura} />
          {!somenteLeitura && (
            <button type="button" onClick={() => onRemover(i)} title="Remover testemunha"
              className="w-12 h-[3.75rem] rounded-xl border-2 border-zinc-200 font-black hover:bg-red-600 hover:text-white">✕</button>
          )}
        </div>
      ))}
      {!somenteLeitura && (
        <button type="button" onClick={onAdicionar}
          className="px-4 py-2 rounded-xl border-2 border-dashed border-zinc-300 font-black uppercase text-xs tracking-widest text-zinc-600 hover:border-zinc-900 hover:text-zinc-900">
          + Testemunha
        </button>
      )}
    </div>
  );
}

function Cartao({ numero, titulo, dica, children }) {
  return (
    <section className="bg-white p-6 md:p-8 rounded-3xl border border-zinc-200 shadow-sm space-y-5">
      <div className="border-b border-zinc-100 pb-3">
        <h2 className="font-black text-sm uppercase text-zinc-800 tracking-[0.2em]">
          <span className="text-yellow-500 mr-1">{numero}.</span> {titulo}
        </h2>
        {dica && <p className="text-xs font-bold text-zinc-500 mt-1">{dica}</p>}
      </div>
      {children}
    </section>
  );
}

// --- Página --------------------------------------------------------------------

function EditorModeloConteudo() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  const { notificar, confirmar } = useFeedback();
  const { temPermissao } = useContext(AuthContext);

  const [modelo, setModelo] = useState(null);
  const [form, setForm] = useState({});
  const [blocos, setBlocos] = useState([]);
  const [testemunhas, setTestemunhas] = useState([]);
  const [alterado, setAlterado] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [loading, setLoading] = useState(true);

  // Campo de texto em que a variável vai entrar
  const campoAtivo = useRef(null);

  const podeEscrever = temPermissao('MODELOS_CONTRATO_WRITE');
  const somenteLeitura = !podeEscrever || modelo?.status !== 'RASCUNHO';

  const preencher = useCallback((m) => {
    setModelo(m);
    const novoForm = {};
    CAMPOS_TEXTO.forEach(c => { novoForm[c] = m[c] || ''; });
    setForm(novoForm);
    setBlocos(ordenarBlocos(m.blocos).map(comId));
    setTestemunhas((m.testemunhas || []).map(comId));
    setAlterado(false);
  }, []);

  useEffect(() => {
    if (!id) {
      router.replace('/views/modelos-contrato');
      return;
    }
    api.get(`/api/modelos-contrato/${id}`)
      .then(res => preencher(res.data))
      .catch(err => {
        notificar(mensagemErro(err, "Erro ao carregar o modelo."), 'erro');
        router.replace('/views/modelos-contrato');
      })
      .finally(() => setLoading(false));
  }, [id, router, notificar, preencher]);

  // Avisa antes de fechar a aba com alterações não salvas
  useEffect(() => {
    if (!alterado) return;
    const aviso = (e) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', aviso);
    return () => window.removeEventListener('beforeunload', aviso);
  }, [alterado]);

  // --- Alterações ------------------------------------------------------------

  const definirCampo = (campo, valor) => {
    setForm(atual => ({ ...atual, [campo]: valor }));
    setAlterado(true);
  };

  // Blocos são localizados pelo _id: o índice muda quando alguém reordena
  const alterarBloco = (idBloco, mudancas) => {
    setBlocos(lista => lista.map(b => (b._id === idBloco ? { ...b, ...mudancas } : b)));
    setAlterado(true);
  };

  // A lista fica sempre na ordem do documento (seção por seção). Subir o primeiro
  // bloco de uma seção o leva para o fim da seção anterior, e vice-versa.
  const moverBloco = (idBloco, direcao) => {
    setBlocos(lista => {
      const indice = lista.findIndex(b => b._id === idBloco);
      if (indice < 0) return lista;
      const nova = [...lista];
      const bloco = nova[indice];
      const vizinho = nova[indice + direcao];
      const secaoAtual = SECOES.findIndex(s => s.chave === bloco.secao);
      if (vizinho && vizinho.secao === bloco.secao) {
        nova[indice] = vizinho;
        nova[indice + direcao] = bloco;
      } else if (SECOES[secaoAtual + direcao]) {
        nova[indice] = { ...bloco, secao: SECOES[secaoAtual + direcao].chave };
      }
      return nova;
    });
    setAlterado(true);
  };

  const adicionarBloco = (secao, tipo) => {
    setBlocos(lista => {
      const posicaoSecao = SECOES.findIndex(s => s.chave === secao);
      const indice = lista.filter(b => SECOES.findIndex(s => s.chave === b.secao) <= posicaoSecao).length;
      const nova = [...lista];
      nova.splice(indice, 0, comId({ secao, tipo, texto: '' }));
      return nova;
    });
    setAlterado(true);
  };

  const removerBloco = async (bloco) => {
    if (bloco.texto?.trim() && !(await confirmar('Remover este trecho do contrato?', { titulo: 'Remover', rotuloConfirmar: 'Remover' }))) return;
    setBlocos(lista => lista.filter(b => b._id !== bloco._id));
    setAlterado(true);
  };

  const alterarTestemunha = (indice, campo, valor) => {
    setTestemunhas(lista => lista.map((t, i) => (i === indice ? { ...t, [campo]: valor } : t)));
    setAlterado(true);
  };

  const focoEm = (definir) => (e) => { campoAtivo.current = { el: e.target, definir }; };

  const inserirVariavel = (nome) => {
    const alvo = campoAtivo.current;
    if (!alvo?.el || !document.body.contains(alvo.el)) {
      notificar("Clique primeiro no texto onde a variável deve entrar.", 'info');
      return;
    }
    const el = alvo.el;
    const marcador = `{${nome}}`;
    const inicio = el.selectionStart ?? el.value.length;
    const fim = el.selectionEnd ?? inicio;
    alvo.definir(el.value.slice(0, inicio) + marcador + el.value.slice(fim));
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(inicio + marcador.length, inicio + marcador.length);
    });
  };

  // --- Dados derivados -------------------------------------------------------

  const numeros = useMemo(() => {
    let n = 0;
    return blocos.map(b => (b.tipo === CLAUSULA ? ++n : null));
  }, [blocos]);

  const modeloAtual = useMemo(() => ({
    ...modelo,
    ...form,
    blocos: blocos.map(({ secao, tipo, texto }) => ({ secao, tipo, texto })),
    testemunhas: testemunhas.map(({ nome, documento }) => ({ nome, documento }))
  }), [modelo, form, blocos, testemunhas]);

  const problemas = useMemo(() => {
    const textos = [form.titulo, form.subtitulo, form.preambulo, form.rotuloAssinaturaContratante,
      form.rotuloAssinaturaContratada, ...blocos.map(b => b.texto)];
    return [...new Set(textos.flatMap(variaveisDesconhecidas))];
  }, [form, blocos]);

  // --- Gravação --------------------------------------------------------------

  const salvar = async ({ silencioso = false } = {}) => {
    setSalvando(true);
    try {
      const res = await api.put(`/api/modelos-contrato/${id}`, modeloAtual);
      preencher(res.data);
      if (!silencioso) notificar("Rascunho salvo.", 'sucesso');
      return true;
    } catch (err) {
      notificar(mensagemErro(err, "Não foi possível salvar o rascunho."), 'erro');
      return false;
    } finally {
      setSalvando(false);
    }
  };

  const publicar = async () => {
    const ok = await confirmar(
      `Publicar a versão ${modelo.versao} do contrato ${modelo.tipoContrato === 'VIP' ? 'VIP' : 'normal'}?\n\n` +
      'Contratos novos passam a sair com este texto. Os contratos já feitos continuam com o texto antigo, ' +
      'e depois de publicada esta versão não pode mais ser alterada.',
      { titulo: 'Publicar versão', rotuloConfirmar: 'Publicar', perigoso: false }
    );
    if (!ok) return;
    if (alterado && !(await salvar({ silencioso: true }))) return;
    setSalvando(true);
    try {
      await api.post(`/api/modelos-contrato/${id}/publicar`);
      setAlterado(false);
      notificar(`Versão ${modelo.versao} publicada.`, 'sucesso');
      router.push('/views/modelos-contrato');
    } catch (err) {
      notificar(mensagemErro(err, "Não foi possível publicar."), 'erro');
    } finally {
      setSalvando(false);
    }
  };

  const novaVersaoDestaVersao = async () => {
    try {
      const res = await api.post(`/api/modelos-contrato/${id}/nova-versao`);
      router.push(`/views/modelos-contrato/editar?id=${res.data.idModeloContrato}`);
    } catch (err) {
      notificar(mensagemErro(err, "Não foi possível criar a nova versão."), 'erro');
    }
  };

  const voltar = async () => {
    if (alterado && !(await confirmar('Sair sem salvar as alterações?', { titulo: 'Alterações não salvas', rotuloConfirmar: 'Sair sem salvar' }))) return;
    router.push('/views/modelos-contrato');
  };

  if (loading || !modelo) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <span className="font-black uppercase tracking-widest animate-pulse text-zinc-800 text-xl">Carregando modelo...</span>
      </div>
    );
  }

  const nomeTipo = modelo.tipoContrato === 'VIP' ? 'VIP' : 'normal';

  return (
    <div className="p-6 md:p-10 bg-gray-50 min-h-screen text-zinc-900 font-sans">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <button onClick={voltar} className="flex items-center gap-2 text-zinc-600 hover:text-zinc-900 font-black text-sm uppercase tracking-widest mb-4">
            <span className="text-xl">←</span> Modelos de contrato
          </button>
          <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter italic">Contrato {nomeTipo} · v{modelo.versao}</h1>
          <div className="h-2 w-24 bg-yellow-400 rounded-full mt-2"></div>
          <p className="text-zinc-500 font-bold mt-3 text-sm">
            {ROTULO_STATUS[modelo.status]}
            {modelo.publicadoEm ? ` · publicada em ${formatarData(modelo.publicadoEm)} por ${modelo.publicadoPor}` : ` · criada em ${formatarData(modelo.criadoEm)} por ${modelo.criadoPor}`}
            {alterado && <span className="text-amber-600"> · alterações não salvas</span>}
          </p>
        </div>
        {!somenteLeitura && (
          <div className="flex gap-3 flex-wrap">
            <button onClick={() => salvar()} disabled={salvando || !alterado}
              className="px-6 py-4 bg-white text-zinc-900 border-2 border-zinc-300 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-zinc-900 hover:text-white transition-all disabled:opacity-40">
              {salvando ? 'Salvando...' : 'Salvar rascunho'}
            </button>
            <button onClick={publicar} disabled={salvando || problemas.length > 0}
              className="px-8 py-4 bg-yellow-400 text-zinc-900 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-zinc-900 hover:text-white transition-all shadow-xl disabled:opacity-40">
              Publicar versão {modelo.versao}
            </button>
          </div>
        )}
      </header>

      {somenteLeitura && (
        <div className="mb-8 bg-white border-2 border-zinc-300 rounded-3xl p-5 flex flex-wrap items-center justify-between gap-4 text-sm font-bold text-zinc-700">
          <span>
            {modelo.status === 'RASCUNHO'
              ? 'Seu perfil pode ver este rascunho, mas não alterar.'
              : 'Esta versão já foi publicada e não pode ser alterada. Para mudar o texto, crie uma nova versão a partir dela.'}
          </span>
          {podeEscrever && modelo.status !== 'RASCUNHO' && (
            <button onClick={novaVersaoDestaVersao}
              className="px-5 py-3 bg-zinc-900 text-white rounded-xl font-black uppercase text-xs tracking-widest hover:bg-yellow-400 hover:text-zinc-900 transition-all">
              Criar nova versão a partir desta
            </button>
          )}
        </div>
      )}

      {problemas.length > 0 && (
        <div className="mb-8 bg-red-50 border border-red-200 text-red-700 rounded-3xl p-5 font-bold text-sm">
          O texto usa variável que o sistema não conhece: {problemas.join(', ')}. Corrija antes de publicar.
        </div>
      )}

      <div className="grid grid-cols-1 2xl:grid-cols-2 gap-8 items-start">
        <div className="space-y-6">
          {!somenteLeitura && (
            <div className="sticky top-4 z-20">
              <PainelVariaveis onInserir={inserirVariavel} desabilitado={somenteLeitura} />
            </div>
          )}

          <Cartao numero="01" titulo="Sobre esta versão" dica="Fica no histórico para saber o que mudou de uma versão para outra.">
            <InputField name="descricaoAlteracao" placeholder="Ex.: multa por atraso passou para 3%"
              value={form.descricaoAlteracao} onChange={e => definirCampo('descricaoAlteracao', e.target.value)} disabled={somenteLeitura} />
          </Cartao>

          <Cartao numero="02" titulo="Cabeçalho e dados da escola" dica="A cidade aparece na linha da data, antes das assinaturas.">
            <InputField label="Título" name="titulo" value={form.titulo} disabled={somenteLeitura}
              onChange={e => definirCampo('titulo', e.target.value)} onFocus={focoEm(v => definirCampo('titulo', v))} />
            <InputField label="Subtítulo" name="subtitulo" value={form.subtitulo} disabled={somenteLeitura}
              onChange={e => definirCampo('subtitulo', e.target.value)} onFocus={focoEm(v => definirCampo('subtitulo', v))} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <InputField label="Razão social" name="escolaRazaoSocial" value={form.escolaRazaoSocial} disabled={somenteLeitura}
                onChange={e => definirCampo('escolaRazaoSocial', e.target.value)} />
              <InputField label="CNPJ" name="escolaCnpj" value={form.escolaCnpj} disabled={somenteLeitura}
                onChange={e => definirCampo('escolaCnpj', e.target.value)} />
            </div>
            <InputField label="Endereço" name="escolaEndereco" value={form.escolaEndereco} disabled={somenteLeitura}
              onChange={e => definirCampo('escolaEndereco', e.target.value)} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <InputField label="Cidade" name="escolaCidade" value={form.escolaCidade} disabled={somenteLeitura}
                onChange={e => definirCampo('escolaCidade', e.target.value)} />
              <InputField label="Comarca (foro)" name="escolaComarca" value={form.escolaComarca} disabled={somenteLeitura}
                onChange={e => definirCampo('escolaComarca', e.target.value)} />
            </div>
          </Cartao>

          <Cartao numero="03" titulo="Preâmbulo" dica="Texto logo abaixo dos dados do aluno e do contratante.">
            <TextareaField name="preambulo" value={form.preambulo} disabled={somenteLeitura} altura="h-auto" rows={6}
              onChange={e => definirCampo('preambulo', e.target.value)} onFocus={focoEm(v => definirCampo('preambulo', v))} />
          </Cartao>

          {SECOES.map((secao, s) => (
            <Cartao key={secao.chave} numero={String(4 + s).padStart(2, '0')} titulo={secao.rotulo} dica={secao.dica}>
              <div className="space-y-3">
                {blocos.map((bloco, i) => bloco.secao !== secao.chave ? null : (
                  <EditorBloco
                    key={bloco._id}
                    bloco={bloco}
                    numero={numeros[i]}
                    podeSubir={i > 0 || s > 0}
                    podeDescer={i < blocos.length - 1 || s < SECOES.length - 1}
                    somenteLeitura={somenteLeitura}
                    onFoco={focoEm(v => alterarBloco(bloco._id, { texto: v }))}
                    onTexto={v => alterarBloco(bloco._id, { texto: v })}
                    onTipo={() => alterarBloco(bloco._id, { tipo: bloco.tipo === CLAUSULA ? PARAGRAFO : CLAUSULA })}
                    onMover={d => moverBloco(bloco._id, d)}
                    onRemover={() => removerBloco(bloco)}
                  />
                ))}
                {blocos.every(b => b.secao !== secao.chave) && (
                  <p className="text-sm font-bold text-zinc-400">Nada nesta parte do contrato.</p>
                )}
              </div>
              {!somenteLeitura && (
                <div className="flex gap-3 flex-wrap">
                  <button type="button" onClick={() => adicionarBloco(secao.chave, CLAUSULA)}
                    className="px-4 py-2 rounded-xl bg-zinc-900 text-white font-black uppercase text-xs tracking-widest hover:bg-yellow-400 hover:text-zinc-900">
                    + Cláusula
                  </button>
                  <button type="button" onClick={() => adicionarBloco(secao.chave, PARAGRAFO)}
                    className="px-4 py-2 rounded-xl border-2 border-zinc-300 font-black uppercase text-xs tracking-widest hover:border-zinc-900">
                    + Parágrafo
                  </button>
                </div>
              )}
            </Cartao>
          ))}

          <Cartao numero="07" titulo="Assinaturas e testemunhas">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <InputField label="Rótulo do contratante" name="rotuloAssinaturaContratante" value={form.rotuloAssinaturaContratante}
                disabled={somenteLeitura} onChange={e => definirCampo('rotuloAssinaturaContratante', e.target.value)} />
              <InputField label="Rótulo da escola" name="rotuloAssinaturaContratada" value={form.rotuloAssinaturaContratada}
                disabled={somenteLeitura} onChange={e => definirCampo('rotuloAssinaturaContratada', e.target.value)} />
            </div>
            <EditorTestemunhas
              testemunhas={testemunhas}
              somenteLeitura={somenteLeitura}
              onAlterar={alterarTestemunha}
              onAdicionar={() => { setTestemunhas(l => [...l, comId({ nome: '', documento: '' })]); setAlterado(true); }}
              onRemover={i => { setTestemunhas(l => l.filter((_, j) => j !== i)); setAlterado(true); }}
            />
          </Cartao>
        </div>

        <div className="2xl:sticky 2xl:top-4">
          <div className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2">
            Pré-visualização com dados de exemplo
          </div>
          <div className="bg-zinc-200 rounded-3xl p-4 overflow-auto 2xl:max-h-[calc(100vh-4rem)]">
            {/* zoom reduz a folha A4 sem mudar o desenho dela */}
            <div style={{ zoom: 0.62 }}>
              <FolhaContrato
                contrato={contratoExemplo(modelo.tipoContrato)}
                parcelasCurso={PARCELAS_EXEMPLO}
                parcelasMaterial={PARCELAS_EXEMPLO}
                modelo={modeloAtual}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// useSearchParams exige um limite de Suspense no App Router do Next.
export default function EditorModeloContratoPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <span className="font-black uppercase tracking-widest animate-pulse text-zinc-800 text-xl">Carregando modelo...</span>
      </div>
    }>
      <EditorModeloConteudo />
    </Suspense>
  );
}
