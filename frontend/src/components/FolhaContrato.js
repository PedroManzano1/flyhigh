"use client";
import { formatarMoeda, formatarData } from '../utils/formato';
import { TIPO_VIP } from '../utils/contrato';
import { montarDocumento } from '../utils/modeloContrato';

/**
 * Folha A4 do contrato, no desenho dos modelos oficiais da escola. O texto vem da
 * versão do modelo de contrato; os campos e os quadros de valores vêm do contrato.
 * Usada na impressão e na pré-visualização do editor de modelos.
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

export default function FolhaContrato({ contrato, parcelasCurso = [], parcelasMaterial = [], modelo, className = '' }) {
  const c = contrato || {};
  const ehVip = (c.tipoContrato || '').toUpperCase() === TIPO_VIP;
  const aluno = c.aluno || {};
  const contratante = c.responsavel || {};
  const end = enderecoDe(contratante.endereco ? contratante : aluno);
  const data = porExtenso(c.dataEmissao);
  const doc = montarDocumento(modelo, c);

  return (
      <article className={`folha bg-white mx-auto shadow-2xl p-[14mm] text-[10.5pt] leading-snug text-zinc-900 ${className}`}
               style={{ width: '210mm', fontFamily: 'Georgia, "Times New Roman", serif' }}>

        <header className="text-center mb-6">
          <div className="text-[13pt] font-bold uppercase leading-tight">{doc.titulo}</div>
          {doc.subtitulo && <div className="text-[11pt] font-bold uppercase leading-tight">{doc.subtitulo}</div>}
          <div className="mt-2 text-[8pt] uppercase tracking-wide text-zinc-600">
            {doc.escola.razaoSocial}{doc.escola.cnpj && <> · CNPJ {doc.escola.cnpj}</>}
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

        <p className="text-justify mb-4 whitespace-pre-line">{doc.preambulo}</p>

        {doc.secoes.ABERTURA.map((texto, i) => (
          <p key={i} className="text-justify mb-3 whitespace-pre-line">{texto}</p>
        ))}

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

        {doc.secoes.ANTES_VALORES.map((texto, i) => (
          <p key={i} className="text-justify mb-2 whitespace-pre-line">{texto}</p>
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

        {doc.secoes.DEPOIS_VALORES.map((texto, i) => (
          <p key={i} className="text-justify mb-2 whitespace-pre-line">{texto}</p>
        ))}

        {/* Assinaturas */}
        <section className="mt-10 break-inside-avoid">
          <p className="mb-10">
            {doc.escola.cidade}, {data.dia} de {data.mes} de {data.ano}.
          </p>

          <div className="grid grid-cols-2 gap-10 text-center mb-10">
            <div>
              <div className="border-t border-zinc-900 pt-1 font-bold uppercase text-[9pt]">{doc.rotuloContratante}</div>
              <div className="text-[9pt] mt-1">{contratante.nome || ''}</div>
            </div>
            <div>
              <div className="border-t border-zinc-900 pt-1 font-bold uppercase text-[9pt]">{doc.rotuloContratada}</div>
              <div className="text-[9pt] mt-1">{doc.escola.razaoSocial}</div>
            </div>
          </div>

          {doc.testemunhas.length > 0 && (
            <div className="font-bold uppercase text-[9pt] mb-3">Testemunhas:</div>
          )}
          <div className="grid grid-cols-2 gap-x-10 gap-y-6 text-[9pt]">
            {doc.testemunhas.map((t, i) => (
              <div key={i}>
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
  );
}
