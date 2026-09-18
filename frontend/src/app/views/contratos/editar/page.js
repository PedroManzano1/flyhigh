"use client";
import { Suspense, useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useFeedback } from '../../../../components/feedback';
import { InputField, SelectField, TextareaField } from '../../../../components/ui';
import api, { mensagemErro } from '../../../../utils/api';
import { formatarMoeda } from '../../../../utils/formato';
import {
  TIPO_NORMAL, TIPO_VIP, CURSOS_CONTRATO, TIPOS_CURSO, CARGAS_HORARIAS,
  DESCONTOS, CONVENIOS, DIAS_SEMANA, STATUS_MATRICULA, STATUS_ASSINATURA,
  VALOR_HORA_AULA_PADRAO, corDaParcela
} from '../../../../utils/contrato';

/**
 * Cadastro e edição do contrato (Estória 7).
 *
 * No modelo NORMAL as parcelas do curso são geradas a partir do valor com desconto.
 * No modelo VIP cada linha é digitada pela secretaria, porque a cobrança é por
 * hora/aula efetivamente dada (cláusula 7 do contrato VIP).
 */

const CLASSE_CARTAO = "bg-white p-8 rounded-3xl border border-zinc-200 shadow-sm space-y-6";
const CLASSE_SECAO = "font-black text-sm uppercase text-zinc-800 tracking-[0.2em] mb-4 border-b border-zinc-100 pb-2";

const contratoVazio = () => ({
  idContrato: null,
  numeroContrato: '',
  tipoContrato: TIPO_NORMAL,
  idAluno: '',
  idTurma: '',
  idResponsavel: '',
  nomeConjuge: '',
  dataEmissao: new Date().toISOString().substring(0, 10),
  status: 'Ativo',
  statusAssinatura: 'Aguardando Assinatura',
  cursoNome: '',
  tipoCurso: 'Semestral',
  diasSemana: '',
  horario: '',
  cargaHorariaEstagio: '',
  descontoPercentual: '0',
  convenio: 'Particular',
  valorTotalCurso: '',
  valorComDesconto: '',
  diaVencimentoCurso: '',
  valorHoraAula: '',
  valorTotalMaterial: '',
  diaVencimentoMaterial: '',
  observacoes: ''
});

const numero = (valor) => {
  if (valor === '' || valor === null || valor === undefined) return null;
  const n = Number(valor);
  return isNaN(n) ? null : n;
};

const arredondar = (valor) => Math.round(valor * 100) / 100;

// Soma meses a uma data ISO sem passar por new Date(), que desloca o dia pelo fuso
const somarMeses = (iso, meses) => {
  if (!iso) return '';
  const [ano, mes, dia] = iso.substring(0, 10).split('-').map(Number);
  const totalMeses = (ano * 12) + (mes - 1) + meses;
  const novoAno = Math.floor(totalMeses / 12);
  const novoMes = (totalMeses % 12) + 1;
  const ultimoDia = new Date(Date.UTC(novoAno, novoMes, 0)).getUTCDate();
  const novoDia = Math.min(dia, ultimoDia);
  return `${novoAno}-${String(novoMes).padStart(2, '0')}-${String(novoDia).padStart(2, '0')}`;
};

/**
 * Grade de parcelas. Fica fora do componente da página de propósito: declarada
 * dentro dele, o React recriaria a tabela a cada tecla e o campo perderia o foco.
 */
function TabelaParcelas({ destino, titulo, lista, soma, alvo, fecha, comAulas,
                          onAdicionar, onAlterar, onRemover, onAulas }) {
  return (
    <div className="bg-white rounded-3xl border border-zinc-200 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-zinc-200 bg-zinc-100/40 flex justify-between items-center flex-wrap gap-3">
        <h3 className="font-black text-sm uppercase text-zinc-800 tracking-[0.2em]">{titulo}</h3>
        <div className="flex items-center gap-3">
          <span className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border ${
            fecha ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'
          }`}>
            Soma: {formatarMoeda(soma)}{alvo !== null && alvo !== undefined ? ` / ${formatarMoeda(alvo)}` : ''}
          </span>
          <button
            type="button"
            onClick={() => onAdicionar(destino)}
            className="px-4 py-2 bg-zinc-900 text-white rounded-xl font-black text-[11px] uppercase tracking-widest hover:bg-yellow-400 hover:text-zinc-900 transition-all"
          >
            + Linha
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left min-w-[700px]">
          <thead>
            <tr className="bg-zinc-50 border-b border-zinc-200">
              <th className="p-4 font-black uppercase text-[11px] tracking-widest text-zinc-600 w-24">Parcela</th>
              {comAulas && <th className="p-4 font-black uppercase text-[11px] tracking-widest text-zinc-600 w-36">Nº de H/A</th>}
              <th className="p-4 font-black uppercase text-[11px] tracking-widest text-zinc-600">Valor</th>
              <th className="p-4 font-black uppercase text-[11px] tracking-widest text-zinc-600">Vencimento</th>
              <th className="p-4 font-black uppercase text-[11px] tracking-widest text-zinc-600 w-28 text-center">Situação</th>
              <th className="p-4 w-16"></th>
            </tr>
          </thead>
          <tbody>
            {lista.map((p, i) => (
              <tr key={i} className="border-b border-zinc-100">
                <td className="p-4 font-mono font-black text-zinc-500 text-sm">{i + 1}/{lista.length}</td>
                {comAulas && (
                  <td className="p-4">
                    <input
                      type="number" min="0" step="1" value={p.numeroAulas ?? ''}
                      onChange={e => onAulas(i, e.target.value)}
                      className="w-full p-3 border border-zinc-300 rounded-xl font-bold text-zinc-900 outline-none focus:border-yellow-400"
                    />
                  </td>
                )}
                <td className="p-4">
                  <input
                    type="number" min="0" step="0.01" value={p.valor ?? ''}
                    onChange={e => onAlterar(destino, i, 'valor', e.target.value)}
                    className="w-full p-3 border border-zinc-300 rounded-xl font-bold text-zinc-900 outline-none focus:border-yellow-400"
                  />
                </td>
                <td className="p-4">
                  <input
                    type="date" value={p.dataVencimento ?? ''}
                    onChange={e => onAlterar(destino, i, 'dataVencimento', e.target.value)}
                    className="w-full p-3 border border-zinc-300 rounded-xl font-bold text-zinc-900 outline-none focus:border-yellow-400"
                  />
                </td>
                <td className="p-4 text-center">
                  <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${corDaParcela(p.status)}`}>
                    {p.status || 'PENDENTE'}
                  </span>
                </td>
                <td className="p-4 text-center">
                  <button
                    type="button" onClick={() => onRemover(destino, i)} title="Remover parcela"
                    className="w-10 h-10 rounded-xl border-2 border-zinc-200 text-zinc-600 hover:bg-red-600 hover:text-white hover:border-red-600 transition-all"
                  >×</button>
                </td>
              </tr>
            ))}
            {lista.length === 0 && (
              <tr>
                <td colSpan={comAulas ? 6 : 5} className="p-8 text-center text-zinc-500 uppercase font-black italic text-sm">
                  Nenhuma parcela lançada.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ContratoFormConteudo() {
  const router = useRouter();
  const { notificar, confirmar } = useFeedback();
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  const editando = Boolean(id);

  const [form, setForm] = useState(contratoVazio);
  const [alunos, setAlunos] = useState([]);
  const [turmas, setTurmas] = useState([]);
  const [responsaveis, setResponsaveis] = useState([]);

  const [parcelasCurso, setParcelasCurso] = useState([]);
  const [parcelasMaterial, setParcelasMaterial] = useState([]);

  const [qtdCurso, setQtdCurso] = useState('12');
  const [primeiroCurso, setPrimeiroCurso] = useState('');
  const [qtdMaterial, setQtdMaterial] = useState('4');
  const [primeiroMaterial, setPrimeiroMaterial] = useState('');

  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [temParcelaPaga, setTemParcelaPaga] = useState(false);

  const ehVip = form.tipoContrato === TIPO_VIP;
  // Chave sempre válida: um tipo estranho vindo do banco não pode quebrar os selects
  const chaveTipo = ehVip ? TIPO_VIP : TIPO_NORMAL;

  // --- Carga inicial -------------------------------------------------------

  useEffect(() => {
    const carregar = async () => {
      setLoading(true);
      try {
        const chamadas = [
          api.get('/api/alunos'),
          api.get('/api/turmas'),
          api.get('/api/responsaveis')
        ];
        if (editando) chamadas.push(api.get(`/api/contratos/${id}/completo`));

        const [resAlunos, resTurmas, resResponsaveis, resContrato] = await Promise.all(chamadas);

        setAlunos(Array.isArray(resAlunos.data) ? resAlunos.data : []);
        setTurmas(Array.isArray(resTurmas.data) ? resTurmas.data : []);
        setResponsaveis(Array.isArray(resResponsaveis.data) ? resResponsaveis.data : []);

        if (resContrato) {
          const c = resContrato.data.contrato || {};
          setForm({
            idContrato: c.idContrato ?? null,
            numeroContrato: c.numeroContrato || '',
            tipoContrato: (c.tipoContrato || TIPO_NORMAL).toUpperCase(),
            idAluno: c.aluno ? String(c.aluno.id_aluno) : '',
            idTurma: c.turma ? String(c.turma.id_turma) : '',
            idResponsavel: c.responsavel ? String(c.responsavel.id_responsavel) : '',
            nomeConjuge: c.nomeConjuge || '',
            dataEmissao: c.dataEmissao ? String(c.dataEmissao).substring(0, 10) : '',
            status: c.status || 'Ativo',
            statusAssinatura: c.statusAssinatura || 'Aguardando Assinatura',
            cursoNome: c.cursoNome || '',
            tipoCurso: c.tipoCurso || 'Semestral',
            diasSemana: c.diasSemana || '',
            horario: c.horario || '',
            cargaHorariaEstagio: c.cargaHorariaEstagio || '',
            descontoPercentual: c.descontoPercentual != null ? String(c.descontoPercentual) : '0',
            convenio: c.convenio || 'Particular',
            valorTotalCurso: c.valorTotalCurso != null ? String(c.valorTotalCurso) : '',
            valorComDesconto: c.valorComDesconto != null ? String(c.valorComDesconto) : '',
            diaVencimentoCurso: c.diaVencimentoCurso != null ? String(c.diaVencimentoCurso) : '',
            valorHoraAula: c.valorHoraAula != null ? String(c.valorHoraAula) : '',
            valorTotalMaterial: c.valorTotalMaterial != null ? String(c.valorTotalMaterial) : '',
            diaVencimentoMaterial: c.diaVencimentoMaterial != null ? String(c.diaVencimentoMaterial) : '',
            observacoes: c.observacoes || ''
          });

          const mapear = (lista) => (Array.isArray(lista) ? lista : []).map(p => ({
            valor: p.valor != null ? String(p.valor) : '',
            dataVencimento: p.dataVencimento ? String(p.dataVencimento).substring(0, 10) : '',
            numeroAulas: p.numeroAulas != null ? String(p.numeroAulas) : '',
            status: p.status || 'PENDENTE'
          }));

          const curso = mapear(resContrato.data.parcelasCurso);
          const material = mapear(resContrato.data.parcelasMaterial);
          setParcelasCurso(curso);
          setParcelasMaterial(material);
          setTemParcelaPaga([...curso, ...material].some(p => (p.status || '').toUpperCase() === 'PAGA'));
        }
      } catch (err) {
        notificar(mensagemErro(err, "Erro ao carregar os dados do contrato."), 'erro');
        if (editando) router.push('/views/contratos');
      } finally {
        setLoading(false);
      }
    };
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // --- Campos --------------------------------------------------------------

  const alterar = (campo, valor) => setForm(anterior => ({ ...anterior, [campo]: valor }));
  const handleChange = (e) => alterar(e.target.name, e.target.value);

  const turmaSelecionada = useMemo(
    () => turmas.find(t => String(t.id_turma) === String(form.idTurma)) || null,
    [turmas, form.idTurma]
  );

  // Ao escolher a turma, sugere os dados da cláusula 1 que ainda estiverem em branco
  const aoEscolherTurma = (e) => {
    const idTurma = e.target.value;
    const turma = turmas.find(t => String(t.id_turma) === String(idTurma));
    setForm(anterior => {
      const proximo = { ...anterior, idTurma };
      if (!turma) return proximo;
      const hora = (h) => (h ? String(h).substring(0, 5) : '');
      if (!anterior.cursoNome && turma.curso?.nome) proximo.cursoNome = turma.curso.nome;
      if (!anterior.tipoCurso && turma.curso?.tipo) proximo.tipoCurso = turma.curso.tipo;
      if (!anterior.diasSemana && turma.diasSemana) proximo.diasSemana = turma.diasSemana;
      if (!anterior.horario && turma.horarioInicio) {
        proximo.horario = `${hora(turma.horarioInicio)} às ${hora(turma.horarioFim)}`;
      }
      if (!anterior.cargaHorariaEstagio && turma.curso?.cargaHorariaTotal) {
        proximo.cargaHorariaEstagio = `${turma.curso.cargaHorariaTotal} H/A`;
      }
      if (!anterior.valorTotalCurso && turma.curso?.valorBase) {
        proximo.valorTotalCurso = String(turma.curso.valorBase);
      }
      return proximo;
    });
  };

  // O cônjuge do contratante já vem do cadastro do responsável, quando preenchido
  const aoEscolherResponsavel = (e) => {
    const idResponsavel = e.target.value;
    const responsavel = responsaveis.find(r => String(r.id_responsavel) === String(idResponsavel));
    setForm(anterior => ({
      ...anterior,
      idResponsavel,
      nomeConjuge: anterior.nomeConjuge || responsavel?.nomeConjuge || ''
    }));
  };

  // Valor com desconto é calculado, mas continua editável pela secretaria
  const valorSugerido = useMemo(() => {
    const total = numero(form.valorTotalCurso);
    const desconto = numero(form.descontoPercentual) || 0;
    if (total === null) return null;
    return arredondar(total - (total * desconto / 100));
  }, [form.valorTotalCurso, form.descontoPercentual]);

  const aplicarDesconto = useCallback(() => {
    if (valorSugerido === null) return;
    alterar('valorComDesconto', String(valorSugerido));
  }, [valorSugerido]);

  // --- Parcelas ------------------------------------------------------------

  const gerarParcelas = (destino) => {
    const curso = destino === 'curso';
    const quantidade = parseInt(curso ? qtdCurso : qtdMaterial, 10);
    const primeiro = curso ? primeiroCurso : primeiroMaterial;
    const total = curso
      ? (numero(form.valorComDesconto) ?? valorSugerido)
      : numero(form.valorTotalMaterial);

    if (!quantidade || quantidade < 1) return notificar("Informe a quantidade de parcelas.", 'alerta');
    if (quantidade > 36) return notificar("O sistema aceita no máximo 36 parcelas por tipo.", 'alerta');
    if (!primeiro) return notificar("Informe a data do primeiro vencimento.", 'alerta');
    if (total === null || total <= 0) {
      return notificar(curso ? "Informe o valor do curso." : "Informe o valor do material.", 'alerta');
    }

    const valorParcela = arredondar(total / quantidade);
    let acumulado = 0;
    const novas = [];
    for (let i = 1; i <= quantidade; i++) {
      const valor = i === quantidade ? arredondar(total - acumulado) : valorParcela;
      acumulado = arredondar(acumulado + valor);
      novas.push({
        valor: String(valor),
        dataVencimento: somarMeses(primeiro, i - 1),
        numeroAulas: '',
        status: 'PENDENTE'
      });
    }

    const dia = String(parseInt(primeiro.substring(8, 10), 10));
    if (curso) {
      setParcelasCurso(novas);
      alterar('diaVencimentoCurso', dia);
    } else {
      setParcelasMaterial(novas);
      alterar('diaVencimentoMaterial', dia);
    }
  };

  const adicionarLinha = (destino) => {
    const lista = destino === 'curso' ? parcelasCurso : parcelasMaterial;
    const ultima = lista[lista.length - 1];
    const nova = {
      valor: '',
      dataVencimento: ultima ? somarMeses(ultima.dataVencimento, 1) : '',
      numeroAulas: '',
      status: 'PENDENTE'
    };
    if (destino === 'curso') setParcelasCurso([...lista, nova]);
    else setParcelasMaterial([...lista, nova]);
  };

  const alterarLinha = (destino, indice, campo, valor) => {
    const atualizar = (lista) => lista.map((p, i) => (i === indice ? { ...p, [campo]: valor } : p));
    if (destino === 'curso') setParcelasCurso(atualizar);
    else setParcelasMaterial(atualizar);
  };

  const removerLinha = (destino, indice) => {
    const filtrar = (lista) => lista.filter((_, i) => i !== indice);
    if (destino === 'curso') setParcelasCurso(filtrar);
    else setParcelasMaterial(filtrar);
  };

  // No VIP o valor da linha é calculado pelo número de horas/aula
  const recalcularPorAulas = (indice, aulas) => {
    const valorHora = numero(form.valorHoraAula) ?? VALOR_HORA_AULA_PADRAO;
    const qtd = numero(aulas);
    setParcelasCurso(lista => lista.map((p, i) => (
      i === indice
        ? { ...p, numeroAulas: aulas, valor: qtd ? String(arredondar(qtd * valorHora)) : p.valor }
        : p
    )));
  };

  const somar = (lista) => lista.reduce((total, p) => total + (numero(p.valor) || 0), 0);
  const somaCurso = somar(parcelasCurso);
  const somaMaterial = somar(parcelasMaterial);
  const alvoCurso = numero(form.valorComDesconto) ?? valorSugerido;
  const alvoMaterial = numero(form.valorTotalMaterial);
  const cursoFecha = alvoCurso === null || parcelasCurso.length === 0 || Math.abs(somaCurso - alvoCurso) < 0.01;
  const materialFecha = alvoMaterial === null || parcelasMaterial.length === 0 || Math.abs(somaMaterial - alvoMaterial) < 0.01;

  // --- Gravação ------------------------------------------------------------

  const montarParcelas = (lista) => lista.map(p => ({
    valor: numero(p.valor),
    dataVencimento: p.dataVencimento || null,
    numeroAulas: numero(p.numeroAulas)
  }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.idAluno) return notificar("Selecione o aluno.", 'alerta');
    if (!form.idTurma) return notificar("Selecione a turma.", 'alerta');

    const invalida = [...parcelasCurso, ...parcelasMaterial]
      .some(p => numero(p.valor) === null || !p.dataVencimento);
    if (invalida) return notificar("Todas as parcelas precisam de valor e vencimento.", 'alerta');

    if (!cursoFecha || !materialFecha) {
      const texto = "A soma das parcelas está diferente do valor contratado. Deseja gravar assim mesmo?";
      if (!(await confirmar(texto))) return;
    }

    const payload = {
      contrato: {
        idContrato: form.idContrato,
        numeroContrato: form.numeroContrato || null,
        tipoContrato: form.tipoContrato,
        aluno: { id_aluno: parseInt(form.idAluno, 10) },
        turma: { id_turma: parseInt(form.idTurma, 10) },
        responsavel: form.idResponsavel ? { id_responsavel: parseInt(form.idResponsavel, 10) } : null,
        nomeConjuge: form.nomeConjuge || null,
        dataEmissao: form.dataEmissao || null,
        status: form.status,
        statusAssinatura: form.statusAssinatura,
        cursoNome: form.cursoNome || null,
        tipoCurso: form.tipoCurso || null,
        diasSemana: form.diasSemana || null,
        horario: form.horario || null,
        cargaHorariaEstagio: form.cargaHorariaEstagio || null,
        descontoPercentual: numero(form.descontoPercentual) || 0,
        convenio: form.convenio || null,
        valorTotalCurso: numero(form.valorTotalCurso),
        valorComDesconto: numero(form.valorComDesconto) ?? valorSugerido,
        diaVencimentoCurso: numero(form.diaVencimentoCurso),
        valorHoraAula: ehVip ? (numero(form.valorHoraAula) ?? VALOR_HORA_AULA_PADRAO) : null,
        valorTotalMaterial: numero(form.valorTotalMaterial),
        diaVencimentoMaterial: numero(form.diaVencimentoMaterial),
        observacoes: form.observacoes || null
      },
      parcelasCurso: montarParcelas(parcelasCurso),
      parcelasMaterial: montarParcelas(parcelasMaterial)
    };

    setSalvando(true);
    try {
      let idGravado = form.idContrato;
      if (editando) {
        await api.put(`/api/contratos/editar/${id}`, payload);
      } else {
        const res = await api.post('/api/contratos', payload);
        idGravado = res.data?.idContrato;
      }
      notificar(editando ? "Contrato atualizado." : "Contrato cadastrado e aluno matriculado.", 'sucesso');
      router.push(idGravado ? `/views/contratos/imprimir?id=${idGravado}` : '/views/contratos');
    } catch (err) {
      notificar(mensagemErro(err, "Erro ao gravar o contrato."), 'erro');
    } finally {
      setSalvando(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <span className="font-black uppercase tracking-widest animate-pulse text-zinc-800 text-xl">Carregando contrato...</span>
      </div>
    );
  }

  return (
    <div className="p-10 bg-gray-50 min-h-screen text-zinc-900 font-sans">
      <header className="mb-12 flex items-end justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-5xl font-black uppercase tracking-tighter italic text-zinc-900">
            {editando ? 'Editar Contrato' : 'Novo Contrato'}
          </h1>
          <div className="h-2 w-24 bg-yellow-400 rounded-full mt-2"></div>
          <p className="text-zinc-500 font-bold mt-3">
            {editando ? 'Alterações no contrato regravam as parcelas ainda não pagas.' : 'Ao gravar, o aluno é matriculado na turma escolhida.'}
          </p>
        </div>
        <button
          type="button"
          onClick={() => router.push('/views/contratos')}
          className="px-8 py-4 bg-zinc-900 text-white rounded-2xl font-black text-sm uppercase tracking-[0.2em] hover:bg-yellow-400 hover:text-zinc-900 transition-all shadow-xl"
        >
          Voltar
        </button>
      </header>

      {temParcelaPaga && (
        <div className="mb-8 bg-amber-50 border border-amber-200 text-amber-800 rounded-3xl p-6 font-bold text-sm leading-relaxed">
          <span className="font-black uppercase tracking-widest text-xs block mb-1">Atenção</span>
          Este contrato já possui parcela paga. Os dados do contrato podem ser corrigidos, mas as parcelas
          serão mantidas como estão para não apagar um pagamento já registrado.
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">

        {/* Modelo do contrato */}
        <div className={CLASSE_CARTAO}>
          <h2 className={CLASSE_SECAO}>01. Modelo do contrato</h2>
          <div className="flex gap-4 flex-wrap">
            {[TIPO_NORMAL, TIPO_VIP].map(tipo => (
              <button
                key={tipo}
                type="button"
                onClick={() => alterar('tipoContrato', tipo)}
                className={`px-8 py-5 rounded-2xl font-black uppercase text-sm tracking-widest border-2 transition-all ${
                  form.tipoContrato === tipo
                    ? 'bg-zinc-900 text-yellow-400 border-zinc-900 shadow-lg'
                    : 'bg-white text-zinc-500 border-zinc-200 hover:border-zinc-400'
                }`}
              >
                Contrato {tipo === TIPO_VIP ? 'VIP' : 'Normal'}
              </button>
            ))}
          </div>
          <p className="text-xs font-bold text-zinc-500 leading-relaxed">
            {ehVip
              ? 'No VIP a cobrança do curso é por hora/aula dada: cada parcela recebe o número de H/A e o valor correspondente.'
              : 'No modelo normal o valor do curso é dividido em parcelas fixas, normalmente 12.'}
          </p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">

          {/* Partes */}
          <div className={CLASSE_CARTAO}>
            <h2 className={CLASSE_SECAO}>02. Partes</h2>
            <SelectField label="Aluno(a)" name="idAluno" value={form.idAluno} onChange={handleChange} required>
              <option value="">Selecione o aluno...</option>
              {alunos.map(a => (
                <option key={a.id_aluno} value={a.id_aluno}>#{a.numeroMatricula} — {a.nome}</option>
              ))}
            </SelectField>

            <SelectField label="Turma" name="idTurma" value={form.idTurma} onChange={aoEscolherTurma} required>
              <option value="">Selecione a turma...</option>
              {turmas.map(t => (
                <option key={t.id_turma} value={t.id_turma}>
                  {t.codigoTurma} — {t.curso ? t.curso.nome : 'Sem curso'} ({t.semestreAno || 's/ semestre'})
                </option>
              ))}
            </SelectField>

            {turmaSelecionada && (
              <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-5 text-sm font-bold text-zinc-600">
                Prof.: {turmaSelecionada.professor?.nome || 'A definir'} ·
                {' '}{turmaSelecionada.diasSemana || 'Dias a definir'} ·
                {' '}Limite de {turmaSelecionada.limiteVagas || '—'} vagas
              </div>
            )}

            <SelectField label="Contratante (responsável financeiro)" name="idResponsavel" value={form.idResponsavel} onChange={aoEscolherResponsavel}>
              <option value="">Selecione o contratante...</option>
              {responsaveis.map(r => (
                <option key={r.id_responsavel} value={r.id_responsavel}>{r.nome} — {r.cpf || 'sem CPF'}</option>
              ))}
            </SelectField>

            <InputField label="Nome do cônjuge do(a) contratante" name="nomeConjuge" value={form.nomeConjuge} onChange={handleChange} placeholder="Opcional" />

            <div className="grid grid-cols-2 gap-6">
              <InputField label="Nº do contrato" name="numeroContrato" value={form.numeroContrato} onChange={handleChange} placeholder="Gerado automaticamente" />
              <InputField label="Data de emissão" name="dataEmissao" type="date" value={form.dataEmissao} onChange={handleChange} />
            </div>

            <div className="grid grid-cols-2 gap-6">
              <SelectField label="Situação da matrícula" name="status" value={form.status} onChange={handleChange}>
                {STATUS_MATRICULA.map(s => <option key={s} value={s}>{s}</option>)}
              </SelectField>
              <SelectField label="Assinatura" name="statusAssinatura" value={form.statusAssinatura} onChange={handleChange}>
                {STATUS_ASSINATURA.map(s => <option key={s} value={s}>{s}</option>)}
              </SelectField>
            </div>
          </div>

          {/* Cláusula 1 */}
          <div className={CLASSE_CARTAO}>
            <h2 className={CLASSE_SECAO}>03. Cláusula 1 — Curso contratado</h2>
            <p className="text-xs font-bold text-zinc-500 leading-relaxed -mt-2">
              Estes dados são gravados no contrato como cópia. Editar a turma depois não muda o que foi assinado.
            </p>

            <SelectField label="Curso" name="cursoNome" value={form.cursoNome} onChange={handleChange}>
              <option value="">Selecione o curso...</option>
              {CURSOS_CONTRATO.map(c => <option key={c} value={c}>{c}</option>)}
              {form.cursoNome && !CURSOS_CONTRATO.includes(form.cursoNome) && (
                <option value={form.cursoNome}>{form.cursoNome}</option>
              )}
            </SelectField>

            <div className="grid grid-cols-2 gap-6">
              <SelectField label="Tipo" name="tipoCurso" value={form.tipoCurso} onChange={handleChange}>
                <option value="">Selecione...</option>
                {TIPOS_CURSO[chaveTipo].map(t => <option key={t} value={t}>{t}</option>)}
              </SelectField>
              <SelectField label="C/H do estágio" name="cargaHorariaEstagio" value={form.cargaHorariaEstagio} onChange={handleChange}>
                <option value="">Selecione...</option>
                {CARGAS_HORARIAS.map(c => <option key={c} value={c}>{c}</option>)}
                {form.cargaHorariaEstagio && !CARGAS_HORARIAS.includes(form.cargaHorariaEstagio) && (
                  <option value={form.cargaHorariaEstagio}>{form.cargaHorariaEstagio}</option>
                )}
              </SelectField>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <SelectField label="Dia(s)" name="diasSemana" value={form.diasSemana} onChange={handleChange}>
                <option value="">Selecione...</option>
                {DIAS_SEMANA.map(d => <option key={d} value={d}>{d}</option>)}
                {form.diasSemana && !DIAS_SEMANA.includes(form.diasSemana) && (
                  <option value={form.diasSemana}>{form.diasSemana}</option>
                )}
              </SelectField>
              <InputField label="Horário" name="horario" value={form.horario} onChange={handleChange} placeholder="Ex: 9:00 às 11:45" />
            </div>

            <div className="grid grid-cols-2 gap-6">
              <SelectField label="Desconto" name="descontoPercentual" value={form.descontoPercentual} onChange={handleChange}>
                {DESCONTOS[chaveTipo].map(d => <option key={d} value={d}>{d}%</option>)}
              </SelectField>
              <SelectField label="Convênio" name="convenio" value={form.convenio} onChange={handleChange}>
                <option value="">Selecione...</option>
                {CONVENIOS[chaveTipo].map(c => <option key={c} value={c}>{c}</option>)}
              </SelectField>
            </div>
          </div>
        </div>

        {/* Financeiro */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          <div className={CLASSE_CARTAO}>
            <h2 className={CLASSE_SECAO}>04. Curso</h2>
            <div className="grid grid-cols-2 gap-6">
              <InputField label="Valor total" name="valorTotalCurso" type="number" step="0.01" min="0" value={form.valorTotalCurso} onChange={handleChange} placeholder="0,00" />
              <InputField label="Com desconto" name="valorComDesconto" type="number" step="0.01" min="0" value={form.valorComDesconto} onChange={handleChange} placeholder="0,00" />
            </div>

            {valorSugerido !== null && (
              <button
                type="button"
                onClick={aplicarDesconto}
                className="text-xs font-black uppercase tracking-widest text-zinc-600 underline decoration-yellow-400 decoration-2 hover:text-zinc-900"
              >
                Aplicar desconto de {form.descontoPercentual}% → {formatarMoeda(valorSugerido)}
              </button>
            )}

            <div className="grid grid-cols-2 gap-6">
              <InputField label="Dia do vencimento" name="diaVencimentoCurso" type="number" min="1" max="31" value={form.diaVencimentoCurso} onChange={handleChange} placeholder="Ex: 25" />
              {ehVip && (
                <InputField label="Valor da H/A" name="valorHoraAula" type="number" step="0.01" min="0" value={form.valorHoraAula} onChange={handleChange} placeholder={String(VALOR_HORA_AULA_PADRAO)} />
              )}
            </div>

            {!ehVip && (
              <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-6 space-y-4">
                <div className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Gerar parcelas do curso</div>
                <div className="grid grid-cols-2 gap-4">
                  <InputField label="Quantidade" name="qtdCurso" type="number" min="1" max="36" value={qtdCurso} onChange={e => setQtdCurso(e.target.value)} />
                  <InputField label="1º vencimento" name="primeiroCurso" type="date" value={primeiroCurso} onChange={e => setPrimeiroCurso(e.target.value)} />
                </div>
                <button
                  type="button"
                  onClick={() => gerarParcelas('curso')}
                  className="w-full bg-zinc-900 text-white p-4 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-yellow-400 hover:text-zinc-900 transition-all"
                >
                  Gerar parcelas
                </button>
              </div>
            )}

            {ehVip && (
              <p className="text-xs font-bold text-zinc-500 leading-relaxed bg-zinc-50 border border-zinc-200 rounded-2xl p-5">
                No contrato VIP as linhas do curso são lançadas manualmente. Ao digitar o número de H/A,
                o valor é calculado por {formatarMoeda(numero(form.valorHoraAula) ?? VALOR_HORA_AULA_PADRAO)} a hora/aula.
              </p>
            )}
          </div>

          <div className={CLASSE_CARTAO}>
            <h2 className={CLASSE_SECAO}>05. Material didático</h2>
            <div className="grid grid-cols-2 gap-6">
              <InputField label="Valor total" name="valorTotalMaterial" type="number" step="0.01" min="0" value={form.valorTotalMaterial} onChange={handleChange} placeholder="0,00" />
              <InputField label="Dia do vencimento" name="diaVencimentoMaterial" type="number" min="1" max="31" value={form.diaVencimentoMaterial} onChange={handleChange} placeholder="Ex: 25" />
            </div>

            <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-6 space-y-4">
              <div className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Gerar parcelas do material</div>
              <div className="grid grid-cols-2 gap-4">
                <InputField label="Quantidade" name="qtdMaterial" type="number" min="1" max="36" value={qtdMaterial} onChange={e => setQtdMaterial(e.target.value)} />
                <InputField label="1º vencimento" name="primeiroMaterial" type="date" value={primeiroMaterial} onChange={e => setPrimeiroMaterial(e.target.value)} />
              </div>
              <button
                type="button"
                onClick={() => gerarParcelas('material')}
                className="w-full bg-zinc-900 text-white p-4 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-yellow-400 hover:text-zinc-900 transition-all"
              >
                Gerar parcelas
              </button>
            </div>

            <TextareaField label="Observações" name="observacoes" value={form.observacoes} onChange={handleChange} altura="h-24" placeholder="Anotações internas da secretaria." />
          </div>
        </div>

        <TabelaParcelas
          destino="curso"
          titulo="06. Parcelas do curso"
          lista={parcelasCurso}
          soma={somaCurso}
          alvo={alvoCurso}
          fecha={cursoFecha}
          comAulas={ehVip}
          onAdicionar={adicionarLinha}
          onAlterar={alterarLinha}
          onRemover={removerLinha}
          onAulas={recalcularPorAulas}
        />

        <TabelaParcelas
          destino="material"
          titulo="07. Parcelas do material"
          lista={parcelasMaterial}
          soma={somaMaterial}
          alvo={alvoMaterial}
          fecha={materialFecha}
          comAulas={false}
          onAdicionar={adicionarLinha}
          onAlterar={alterarLinha}
          onRemover={removerLinha}
          onAulas={() => {}}
        />

        <div className="bg-zinc-900 p-8 rounded-3xl shadow-xl flex flex-col sm:flex-row gap-4 items-center justify-between">
          <p className="text-zinc-400 font-bold text-sm">
            Depois de gravar, o contrato abre na tela de impressão pronto para ser assinado.
          </p>
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => router.push('/views/contratos')}
              className="text-zinc-300 px-6 py-4 font-black uppercase text-sm hover:text-white transition-all tracking-widest underline decoration-yellow-400 decoration-2"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={salvando}
              className="bg-yellow-400 text-zinc-900 px-10 py-5 rounded-2xl font-black uppercase text-sm tracking-widest hover:bg-white transition-all shadow-lg disabled:bg-zinc-600 disabled:text-zinc-400"
            >
              {salvando ? 'Gravando...' : editando ? 'Confirmar Edição' : 'Gravar e Matricular'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

// useSearchParams exige um limite de Suspense no App Router do Next.
export default function ContratoFormPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <span className="font-black uppercase tracking-widest animate-pulse text-zinc-800 text-xl">Carregando contrato...</span>
      </div>
    }>
      <ContratoFormConteudo />
    </Suspense>
  );
}
