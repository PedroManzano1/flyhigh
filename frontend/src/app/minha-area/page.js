"use client";
import { useContext, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AuthContext } from '../../context/authContext';
import api, { mensagemErro } from '../../utils/api';
import { formatarMoeda, formatarData, formatarNumero } from '../../utils/formato';
import { corDaParcela } from '../../utils/contrato';
import { ROTULO_TIPO, rotuloParcela, rotuloAtraso } from '../../utils/financeiro';
import { agruparPorCategoria, corDaSituacao, rotuloModelo } from '../../utils/notas';

/**
 * Área do aluno: o próprio boletim, as próprias parcelas e os recados da escola.
 * Tudo vem de /api/minha-area, que só devolve os dados da conta logada.
 */

const ROTULO_SITUACAO = {
  APROVADO: 'Aprovado',
  REPROVADO: 'Reprovado',
  CURSANDO: 'Cursando',
  SEM_LANCAMENTOS: 'Sem notas ainda'
};

const pontos = (v) => formatarNumero(v, Number(v) % 1 === 0 ? 0 : 1);

function TelaDeEspera({ texto }) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center font-black uppercase text-zinc-400 animate-pulse text-xl tracking-widest">
      {texto}
    </div>
  );
}

function TituloSecao({ numero, titulo, children }) {
  return (
    <div className="flex items-end justify-between flex-wrap gap-3 mb-6">
      <h2 className="font-black text-2xl uppercase tracking-tighter italic text-zinc-900">
        <span className="text-yellow-500 not-italic mr-2">{numero}.</span>{titulo}
      </h2>
      {children}
    </div>
  );
}

function CartaoBoletim({ boletim }) {
  const linha = boletim.alunos?.[0];
  const notaMinima = boletim.notaMinima ?? 70;
  const notaPorAvaliacao = useMemo(() => {
    const mapa = {};
    (linha?.notas || []).forEach(n => { mapa[n.idAvaliacao] = n.valorObtido; });
    return mapa;
  }, [linha]);
  const grupos = useMemo(() => agruparPorCategoria(boletim.avaliacoes), [boletim.avaliacoes]);

  return (
    <article className="bg-white rounded-3xl border border-zinc-200 shadow-sm overflow-hidden">
      <header className="p-6 md:p-8 flex justify-between items-start flex-wrap gap-6 border-b border-zinc-100 bg-zinc-50">
        <div>
          <span className="bg-zinc-900 text-white px-3 py-1 rounded-lg text-xs font-black uppercase tracking-widest">{boletim.codigoTurma}</span>
          <h3 className="font-black text-2xl uppercase tracking-tight text-zinc-900 mt-3">{boletim.curso || 'Curso'}</h3>
          <p className="text-sm font-bold text-zinc-500 mt-1">
            Prof. {boletim.professor || 'a definir'} · {boletim.semestreAno || 's/ semestre'} · {rotuloModelo(boletim.modeloDefinido ? boletim.pontuacaoTotal : null)}
          </p>
        </div>

        {linha && (
          <div className="flex gap-4 flex-wrap">
            <div className={`rounded-2xl p-5 text-center min-w-[130px] ${
              linha.notaFinal === null || linha.notaFinal === undefined
                ? 'bg-zinc-100 text-zinc-400'
                : linha.notaFinal >= notaMinima ? 'bg-emerald-500 text-white' : 'bg-red-600 text-white'
            }`}>
              <div className="text-[10px] font-black uppercase tracking-widest opacity-80">Nota final</div>
              <div className="text-4xl font-black italic tracking-tighter">
                {linha.notaFinal === null || linha.notaFinal === undefined ? '--' : formatarNumero(linha.notaFinalArredondada ?? linha.notaFinal, 1)}
              </div>
              <div className="text-[10px] font-black uppercase tracking-widest opacity-80">de 100 · mínimo {formatarNumero(notaMinima, 0)}</div>
            </div>
            <div className="rounded-2xl p-5 text-center min-w-[130px] bg-white border border-zinc-200">
              <div className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Frequência</div>
              <div className="text-4xl font-black italic tracking-tighter text-zinc-900">
                {linha.percentualFrequencia === null || linha.percentualFrequencia === undefined ? '--' : `${formatarNumero(linha.percentualFrequencia, 0)}%`}
              </div>
              <div className="text-[10px] font-black uppercase tracking-widest text-zinc-500">{linha.faltas} falta(s)</div>
            </div>
          </div>
        )}
      </header>

      {!linha ? (
        <p className="p-8 text-zinc-500 font-bold">Ainda não há lançamentos para você nesta turma.</p>
      ) : (
        <>
          <div className="px-6 md:px-8 py-4 flex items-center gap-3 flex-wrap border-b border-zinc-100">
            <span className={`px-3 py-1.5 rounded-lg font-black text-[10px] uppercase border tracking-widest ${corDaSituacao(linha.situacao)}`}>
              {ROTULO_SITUACAO[linha.situacao] || linha.situacao}
            </span>
            <span className="text-sm font-bold text-zinc-600">{linha.observacao}</span>
            <span className="ml-auto text-sm font-black text-zinc-700">
              {pontos(linha.pontosObtidos ?? 0)} de {pontos(boletim.pontuacaoTotal ?? 0)} pontos
            </span>
          </div>

          {grupos.length > 0 && (
            <div className="overflow-x-auto p-6 md:p-8">
              <table className="border-collapse text-sm">
                <thead>
                  <tr>
                    {grupos.map(g => (
                      <th key={g.categoria} colSpan={g.itens.length} className="px-3 py-2 border border-zinc-200 bg-zinc-50 font-black text-zinc-900 whitespace-nowrap">
                        {g.categoria}
                      </th>
                    ))}
                  </tr>
                  <tr>
                    {grupos.flatMap(g => g.itens).map(a => (
                      <th key={a.idAvaliacao} className="px-3 py-2 border border-zinc-200 font-black text-zinc-700 whitespace-nowrap">
                        {a.etapa || a.titulo}
                        <div className="text-[10px] font-mono text-zinc-400">/{pontos(a.notaMaxima)}</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    {grupos.flatMap(g => g.itens).map(a => {
                      const valor = notaPorAvaliacao[a.idAvaliacao];
                      return (
                        <td key={a.idAvaliacao} className="px-3 py-3 border border-zinc-200 text-center font-mono font-black text-lg text-zinc-900">
                          {valor === null || valor === undefined ? <span className="text-zinc-300">—</span> : pontos(valor)}
                        </td>
                      );
                    })}
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </article>
  );
}

function TabelaParcelas({ parcelas }) {
  if (parcelas.length === 0) {
    return <p className="bg-white rounded-3xl border border-zinc-200 p-8 text-zinc-500 font-bold">Nenhuma parcela encontrada.</p>;
  }
  return (
    <div className="bg-white rounded-[2.5rem] border border-zinc-200 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left min-w-[640px]">
          <thead className="bg-zinc-50 border-b border-zinc-200">
            <tr>
              <th className="p-5 font-black uppercase text-xs tracking-widest text-zinc-600">Parcela</th>
              <th className="p-5 font-black uppercase text-xs tracking-widest text-zinc-600">Vencimento</th>
              <th className="p-5 font-black uppercase text-xs tracking-widest text-zinc-600 text-right">Valor</th>
              <th className="p-5 font-black uppercase text-xs tracking-widest text-zinc-600 text-center">Situação</th>
              <th className="p-5 font-black uppercase text-xs tracking-widest text-zinc-600">Pago em</th>
            </tr>
          </thead>
          <tbody>
            {parcelas.map(p => (
              <tr key={p.idLancamento} className={`border-b border-zinc-100 ${p.status === 'ATRASADA' ? 'bg-red-50/50' : ''}`}>
                <td className="p-5">
                  <div className="font-black text-zinc-900">{rotuloParcela(p)}</div>
                  <div className="text-[10px] font-black uppercase tracking-widest text-zinc-500">{ROTULO_TIPO[p.tipo] || p.tipo}</div>
                </td>
                <td className="p-5 whitespace-nowrap">
                  <span className="font-mono font-black text-zinc-900">{formatarData(p.dataVencimento)}</span>
                  {p.diasEmAtraso > 0 && <div className="text-[10px] font-black uppercase tracking-widest text-red-600">{rotuloAtraso(p.diasEmAtraso)}</div>}
                </td>
                <td className="p-5 text-right font-mono font-black text-zinc-900 whitespace-nowrap">{formatarMoeda(p.valor)}</td>
                <td className="p-5 text-center">
                  <span className={`px-3 py-1.5 rounded-lg font-black text-[10px] uppercase border tracking-widest ${corDaParcela(p.status)}`}>{p.status}</span>
                </td>
                <td className="p-5 text-sm font-bold text-zinc-600 whitespace-nowrap">
                  {p.dataPagamento ? <><span className="font-mono text-emerald-700 font-black">{formatarData(p.dataPagamento)}</span>{p.formaPagamento && <> · {p.formaPagamento}</>}</> : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function MinhaAreaPage() {
  const router = useRouter();
  const { user, carregandoUsuario, ehAluno, signOut } = useContext(AuthContext);

  const [area, setArea] = useState(null);
  const [erro, setErro] = useState(null);
  const [carregando, setCarregando] = useState(true);

  // Só conta de aluno fica aqui: sem sessão vai para o login, equipe vai para o painel
  useEffect(() => {
    if (carregandoUsuario) return;
    if (!user) router.replace('/login');
    else if (!ehAluno) router.replace('/');
  }, [carregandoUsuario, user, ehAluno, router]);

  useEffect(() => {
    if (!ehAluno) return;
    api.get('/api/minha-area')
      .then(res => { setArea(res.data); setErro(null); })
      .catch(err => setErro(mensagemErro(err, 'Não foi possível carregar a sua área.')))
      .finally(() => setCarregando(false));
  }, [ehAluno]);

  const financeiro = useMemo(() => {
    const parcelas = area?.parcelas || [];
    const soma = (status) => parcelas.filter(p => p.status === status).reduce((s, p) => s + (Number(p.valor) || 0), 0);
    return { atrasado: soma('ATRASADA'), aVencer: soma('PENDENTE'), pago: soma('PAGA'), atrasadas: parcelas.filter(p => p.status === 'ATRASADA').length };
  }, [area]);

  if (carregandoUsuario || !user || !ehAluno) return <TelaDeEspera texto="Carregando..." />;

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-zinc-900 flex flex-col">
      <nav className="bg-zinc-900 px-6 md:px-10 py-5 flex justify-between items-center shadow-md border-b-4 border-zinc-950 gap-4">
        <h2 className="text-xl md:text-2xl font-black text-white flex items-center gap-2 tracking-tighter">
          <span className="bg-yellow-400 text-zinc-900 px-3 py-1 rounded-xl shadow-sm">FLY HIGH</span>
          <span className="hidden sm:inline">IDIOMAS</span>
        </h2>
        <div className="flex items-center gap-4 md:gap-6">
          <span className="text-zinc-400 font-bold text-sm hidden md:block">
            Olá, <strong className="text-white uppercase">{user.nome || user.login}</strong>
          </span>
          <button
            onClick={signOut}
            className="bg-zinc-800 border border-zinc-700 text-zinc-300 hover:text-white hover:border-yellow-400 hover:bg-zinc-700 transition-all font-black uppercase tracking-widest py-2.5 px-5 rounded-xl text-xs flex items-center gap-2 shadow-sm"
          >
            Sair <span className="text-base leading-none">⏏️</span>
          </button>
        </div>
      </nav>

      <main className="p-6 md:p-10 max-w-6xl mx-auto w-full flex-grow space-y-14">
        <header>
          <h1 className="text-5xl font-black uppercase tracking-tighter italic text-zinc-900">Minha área</h1>
          <div className="h-2 w-24 bg-yellow-400 rounded-full mt-2"></div>
          {area && (
            <p className="text-zinc-500 font-bold mt-3">
              {area.alunoNome} · matrícula <span className="font-mono">#{area.alunoMatricula}</span>
            </p>
          )}
        </header>

        {carregando && <div className="text-center uppercase italic font-black text-zinc-500 animate-pulse">Carregando os seus dados...</div>}
        {!carregando && erro && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-3xl p-6 font-bold">{erro}</div>
        )}

        {!carregando && area && (
          <>
            <section>
              <TituloSecao numero="01" titulo="Boletim" />
              {area.boletins.length === 0 ? (
                <p className="bg-white rounded-3xl border border-zinc-200 p-8 text-zinc-500 font-bold">Você não tem matrícula ativa no momento.</p>
              ) : (
                <div className="space-y-8">
                  {area.boletins.map(b => <CartaoBoletim key={b.idTurma} boletim={b} />)}
                </div>
              )}
            </section>

            <section>
              <TituloSecao numero="02" titulo="Financeiro">
                <div className="flex gap-3 flex-wrap">
                  <span className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest ${financeiro.atrasado > 0 ? 'bg-red-600 text-white' : 'bg-white border border-zinc-200 text-zinc-500'}`}>
                    Em atraso {formatarMoeda(financeiro.atrasado)}
                  </span>
                  <span className="px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest bg-white border border-zinc-200 text-zinc-700">
                    A vencer {formatarMoeda(financeiro.aVencer)}
                  </span>
                  <span className="px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest bg-emerald-50 border border-emerald-200 text-emerald-700">
                    Pago {formatarMoeda(financeiro.pago)}
                  </span>
                </div>
              </TituloSecao>
              {financeiro.atrasadas > 0 && (
                <p className="mb-4 bg-red-50 border border-red-200 text-red-700 rounded-2xl p-4 font-bold text-sm">
                  Você tem {financeiro.atrasadas} parcela(s) em atraso. Procure a secretaria para regularizar.
                </p>
              )}
              <TabelaParcelas parcelas={area.parcelas} />
            </section>

            <section>
              <TituloSecao numero="03" titulo="Recados" />
              {area.recados.length === 0 ? (
                <p className="bg-white rounded-3xl border border-zinc-200 p-8 text-zinc-500 font-bold">Nenhum recado no mural.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {area.recados.map(r => (
                    <article key={r.idRecado} className="bg-white rounded-3xl border border-zinc-200 shadow-sm p-6 md:p-8">
                      <div className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                        {formatarData(r.dataPublicacao)}{r.autor && <> · {r.autor}</>}
                      </div>
                      <h3 className="font-black text-xl uppercase tracking-tight text-zinc-900 mt-2">{r.titulo}</h3>
                      <p className="text-zinc-700 font-medium mt-3 whitespace-pre-line leading-relaxed">{r.mensagem}</p>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </main>

      <footer className="px-10 py-6 text-center border-t border-zinc-200 bg-white">
        <p className="text-zinc-400 text-xs font-black tracking-widest uppercase">&copy; 2026 Fly High Idiomas</p>
      </footer>
    </div>
  );
}
