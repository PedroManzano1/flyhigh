"use client";
import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useFeedback } from '../../../../components/feedback';
import api, { mensagemErro } from '../../../../utils/api';
import { formatarMoeda, formatarData } from '../../../../utils/formato';
import {
  TIPO_VIP, ESCOLA, TESTEMUNHAS, PREAMBULO, CLAUSULA_1,
  clausulasAntesDoFinanceiro, clausulasDepoisDoFinanceiro
} from '../../../../utils/contrato';

/**
 * Via impressa do contrato, no mesmo desenho dos modelos oficiais da escola.
 * A impressão é a do próprio navegador (Ctrl+P ou o botão Imprimir), por isso
 * a folha é montada em HTML e a barra de ações some no @media print.
 */

const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];

const porExtenso = (iso) => {
  if (!iso) return { dia: '______', mes: '____________', ano: '______' };
  const [ano, mes, dia] = String(iso).substring(0, 10).split('-');
  return { dia, mes: MESES[parseInt(mes, 10) - 1] || '____________', ano };
};

const enderecoDe = (pessoa) => {
  const e = pessoa?.endereco;
  if (!e) return { logradouro: '', numero: '', bairro: '', cep: '', cidade: '' };
  return {
    logradouro: e.logradouro || '',
    numero: e.numero || '',
    bairro: e.bairro || '',
    cep: e.cep || '',
    cidade: e.cidade || ''
  };
};

// Campo com linha, como nos espaços preenchidos à mão do contrato original
const Campo = ({ rotulo, valor, className = '' }) => (
  <div className={`flex items-end gap-2 ${className}`}>
    <span className="shrink-0 font-bold">{rotulo}</span>
    <span className="flex-1 border-b border-zinc-900 min-h-[1.15rem] px-1">{valor || ''}</span>
  </div>
);

function ImprimirContratoConteudo() {
  const router = useRouter();
  const { notificar } = useFeedback();
  const searchParams = useSearchParams();
  const id = searchParams.get('id');

  const [dados, setDados] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) {
      router.push('/views/contratos');
      return;
    }
    const carregar = async () => {
      try {
        const res = await api.get(`/api/contratos/${id}/completo`);
        setDados(res.data);
      } catch (err) {
        notificar(mensagemErro(err, "Erro ao carregar o contrato."), 'erro');
        router.push('/views/contratos');
      } finally {
        setLoading(false);
      }
    };
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (loading || !dados) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <span className="font-black uppercase tracking-widest animate-pulse text-zinc-800 text-xl">Montando o contrato...</span>
      </div>
    );
  }

  const c = dados.contrato || {};
  const parcelasCurso = dados.parcelasCurso || [];
  const parcelasMaterial = dados.parcelasMaterial || [];
  const ehVip = (c.tipoContrato || '').toUpperCase() === TIPO_VIP;

  const aluno = c.aluno || {};
  const contratante = c.responsavel || {};
  const end = enderecoDe(contratante.endereco ? contratante : aluno);
  const data = porExtenso(c.dataEmissao);

  const antes = clausulasAntesDoFinanceiro(ehVip ? TIPO_VIP : 'NORMAL', c.valorHoraAula);
  const depois = clausulasDepoisDoFinanceiro(ehVip ? TIPO_VIP : 'NORMAL');

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

      {/* Folha do contrato */}
      <article className="folha bg-white mx-auto shadow-2xl p-[14mm] text-[10.5pt] leading-snug text-zinc-900"
               style={{ width: '210mm', fontFamily: 'Georgia, "Times New Roman", serif' }}>

        <header className="text-center mb-6">
          <div className="text-[13pt] font-bold uppercase leading-tight">
            Contrato de Prestação de Serviços
          </div>
          <div className="text-[11pt] font-bold uppercase leading-tight">
            de Ensino de Língua Estrangeira{ehVip ? ' - VIP' : ''}
          </div>
          <div className="mt-2 text-[8pt] uppercase tracking-wide text-zinc-600">
            {ESCOLA.razaoSocial} · CNPJ {ESCOLA.cnpj}
          </div>
        </header>

        {/* Qualificação das partes */}
        <section className="space-y-2 mb-5">
          <div className="flex gap-4">
            <Campo rotulo="Aluno(a):" valor={aluno.nome} className="flex-1" />
            <Campo rotulo="Matrícula:" valor={aluno.numeroMatricula} className="w-52" />
          </div>
          <Campo rotulo="Contratante:" valor={contratante.nome} />
          <div className="flex gap-4">
            <Campo rotulo="CPF nº:" valor={contratante.cpf} className="flex-1" />
            <Campo rotulo="R.G. nº:" valor={contratante.rg} className="flex-1" />
          </div>
          <div className="flex gap-4">
            <Campo rotulo="Endereço:" valor={end.logradouro} className="flex-1" />
            <Campo rotulo="Nº:" valor={end.numero} className="w-40" />
          </div>
          <div className="flex gap-4">
            <Campo rotulo="Bairro:" valor={end.bairro} className="flex-1" />
            <Campo rotulo="CEP:" valor={end.cep} className="w-56" />
          </div>
          <Campo rotulo="Nome do cônjuge do(a) contratante:" valor={c.nomeConjuge} />
        </section>

        <p className="text-justify mb-4">{PREAMBULO}</p>

        <p className="text-justify mb-3">{CLAUSULA_1}</p>

        {/* Quadro da cláusula 1 */}
        <section className="border border-zinc-900 mb-5">
          <div className="grid grid-cols-2">
            <div className="border-r border-b border-zinc-900 p-2 flex gap-2">
              <span className="font-bold uppercase">Curso:</span><span>{c.cursoNome || ''}</span>
            </div>
            <div className="border-b border-zinc-900 p-2 flex gap-2">
              <span className="font-bold uppercase">Tipo:</span><span>{c.tipoCurso || ''}</span>
            </div>
            <div className="border-r border-b border-zinc-900 p-2 flex gap-2">
              <span className="font-bold uppercase">Dia(s):</span><span>{c.diasSemana || ''}</span>
            </div>
            <div className="border-b border-zinc-900 p-2 flex gap-2">
              <span className="font-bold uppercase">Horário:</span><span>{c.horario || ''}</span>
            </div>
            <div className="border-r border-b border-zinc-900 p-2 flex gap-2">
              <span className="font-bold uppercase">C/H Estágio:</span><span>{c.cargaHorariaEstagio || ''}</span>
            </div>
            <div className="border-b border-zinc-900 p-2 flex gap-2">
              <span className="font-bold uppercase">Desconto:</span>
              <span>{c.descontoPercentual ? `${c.descontoPercentual}%` : '—'}</span>
            </div>
            <div className={`p-2 flex gap-2 ${ehVip ? 'border-r border-zinc-900' : 'col-span-2'}`}>
              <span className="font-bold uppercase">Convênio:</span><span>{c.convenio || ''}</span>
            </div>
            {ehVip && (
              <div className="p-2 flex gap-2">
                <span className="font-bold uppercase">Valor H/A:</span>
                <span>{formatarMoeda(c.valorHoraAula)}</span>
              </div>
            )}
          </div>
        </section>

        {antes.map((texto, i) => (
          <p key={i} className="text-justify mb-2">{texto}</p>
        ))}

        {/* Quadro do material */}
        <section className="mt-4 mb-5 break-inside-avoid">
          <div className="border border-zinc-900">
            <div className="bg-zinc-100 border-b border-zinc-900 p-1.5 text-center font-bold uppercase tracking-widest text-[9pt]">
              Material
            </div>
            <div className="grid grid-cols-2 border-b border-zinc-900">
              <div className="border-r border-zinc-900 p-2 flex gap-2">
                <span className="font-bold">Valor total:</span><span>{formatarMoeda(c.valorTotalMaterial)}</span>
              </div>
              <div className="p-2 flex gap-2">
                <span className="font-bold">Vencimento:</span>
                <span>{c.diaVencimentoMaterial ? `dia ${c.diaVencimentoMaterial}` : '—'}</span>
              </div>
            </div>
            <table className="w-full text-[9.5pt]">
              <thead>
                <tr className="bg-zinc-50 border-b border-zinc-900">
                  <th className="p-1.5 border-r border-zinc-900 text-left font-bold w-28">Parcela nº</th>
                  <th className="p-1.5 border-r border-zinc-900 text-left font-bold">Valor</th>
                  <th className="p-1.5 text-left font-bold">Vencimento</th>
                </tr>
              </thead>
              <tbody>
                {parcelasMaterial.map((p, i) => (
                  <tr key={i} className="border-b border-zinc-300 last:border-b-0">
                    <td className="p-1.5 border-r border-zinc-900">{i + 1}/{parcelasMaterial.length}</td>
                    <td className="p-1.5 border-r border-zinc-900">{formatarMoeda(p.valor)}</td>
                    <td className="p-1.5">{formatarData(p.dataVencimento)}</td>
                  </tr>
                ))}
                {parcelasMaterial.length === 0 && (
                  <tr><td colSpan="3" className="p-3 text-center italic text-zinc-500">Sem material lançado.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Quadro do curso */}
        <section className="mb-5 break-inside-avoid">
          <div className="border border-zinc-900">
            <div className="bg-zinc-100 border-b border-zinc-900 p-1.5 text-center font-bold uppercase tracking-widest text-[9pt]">
              Curso
            </div>

            {ehVip ? (
              <div className="border-b border-zinc-900 p-2 flex gap-2">
                <span className="font-bold">Vencimento:</span>
                <span>{c.diaVencimentoCurso ? `dia ${c.diaVencimentoCurso}` : '—'}</span>
              </div>
            ) : (
              <div className="grid grid-cols-3 border-b border-zinc-900">
                <div className="border-r border-zinc-900 p-2 flex gap-2">
                  <span className="font-bold">Valor total:</span><span>{formatarMoeda(c.valorTotalCurso)}</span>
                </div>
                <div className="border-r border-zinc-900 p-2 flex gap-2">
                  <span className="font-bold">Com desconto:</span><span>{formatarMoeda(c.valorComDesconto)}</span>
                </div>
                <div className="p-2 flex gap-2">
                  <span className="font-bold">Vencimento:</span>
                  <span>{c.diaVencimentoCurso ? `dia ${c.diaVencimentoCurso}` : '—'}</span>
                </div>
              </div>
            )}

            <table className="w-full text-[9.5pt]">
              <thead>
                <tr className="bg-zinc-50 border-b border-zinc-900">
                  <th className="p-1.5 border-r border-zinc-900 text-left font-bold w-32">
                    {ehVip ? 'Número de H/A' : 'Parcela nº'}
                  </th>
                  <th className="p-1.5 border-r border-zinc-900 text-left font-bold">Valor</th>
                  <th className="p-1.5 text-left font-bold">Vencimento</th>
                </tr>
              </thead>
              <tbody>
                {parcelasCurso.map((p, i) => (
                  <tr key={i} className="border-b border-zinc-300 last:border-b-0">
                    <td className="p-1.5 border-r border-zinc-900">
                      {ehVip ? (p.numeroAulas ?? '—') : `${i + 1}/${parcelasCurso.length}`}
                    </td>
                    <td className="p-1.5 border-r border-zinc-900">{formatarMoeda(p.valor)}</td>
                    <td className="p-1.5">{formatarData(p.dataVencimento)}</td>
                  </tr>
                ))}
                {parcelasCurso.length === 0 && (
                  <tr><td colSpan="3" className="p-3 text-center italic text-zinc-500">Sem parcelas lançadas.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {depois.map((texto, i) => (
          <p key={i} className="text-justify mb-2">{texto}</p>
        ))}

        {/* Assinaturas */}
        <section className="mt-10 break-inside-avoid">
          <p className="mb-10">
            {ESCOLA.cidade}, {data.dia} de {data.mes} de {data.ano}.
          </p>

          <div className="grid grid-cols-2 gap-10 text-center mb-10">
            <div>
              <div className="border-t border-zinc-900 pt-1 font-bold uppercase text-[9pt]">O (A) Contratante</div>
              <div className="text-[9pt] mt-1">{contratante.nome || ''}</div>
            </div>
            <div>
              <div className="border-t border-zinc-900 pt-1 font-bold uppercase text-[9pt]">Mantenedor (A) Contratado (A)</div>
              <div className="text-[9pt] mt-1">{ESCOLA.razaoSocial}</div>
            </div>
          </div>

          <div className="font-bold uppercase text-[9pt] mb-3">Testemunhas:</div>
          <div className="grid grid-cols-2 gap-x-10 gap-y-6 text-[9pt]">
            {TESTEMUNHAS.map(t => (
              <div key={t.documento}>
                <div className="border-t border-zinc-900 pt-1">
                  <div><span className="font-bold">Nome:</span> {t.nome}</div>
                  <div><span className="font-bold">Documento:</span> {t.documento}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {c.observacoes && (
          <section className="mt-8 border-t border-zinc-300 pt-3 text-[8.5pt] text-zinc-600">
            <span className="font-bold uppercase">Observações: </span>{c.observacoes}
          </section>
        )}
      </article>
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
