"use client";
import { useState, useEffect } from 'react';
import api from '../../../utils/api';
import { useRouter } from 'next/navigation'; 

// --- COMPONENTES UTILITÁRIOS (ESTILO FLYHIGH) ---
const InputField = ({ label, name, placeholder, type = "text", onChange, value, className = "" }) => (
  <div className={className}>
    <label className="block text-xs font-black text-zinc-800 uppercase tracking-widest mb-1">{label}</label>
    <input
      type={type} 
      name={name} 
      value={value || ''} 
      onChange={onChange} 
      placeholder={placeholder}
      className="w-full p-3 border-2 border-zinc-900 rounded-none text-sm focus:ring-0 focus:border-yellow-400 bg-white shadow-[4px_4px_0px_0px_rgba(24,24,27,1)] transition-all focus:translate-x-[2px] focus:translate-y-[2px] focus:shadow-none outline-none"
    />
  </div>
);

const SelectField = ({ label, name, children, onChange, value, className = "" }) => (
  <div className={className}>
    <label className="block text-xs font-black text-zinc-800 uppercase tracking-widest mb-1">{label}</label>
    <select
      name={name} 
      value={value || ''} 
      onChange={onChange}
      className="w-full p-3 border-2 border-zinc-900 rounded-none text-sm focus:ring-0 focus:border-yellow-400 bg-white shadow-[4px_4px_0px_0px_rgba(24,24,27,1)] transition-all outline-none appearance-none"
    >
      {children}
    </select>
  </div>
);

// --- PÁGINA PRINCIPAL DE RESPONSÁVEIS ---
export default function ResponsaveisPage() {
  const router = useRouter();
  const [responsaveis, setResponsaveis] = useState([]);
  const [alunos, setAlunos] = useState([]);
  const [vinculos, setVinculos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // --- ESTADOS DOS FORMULÁRIOS ---
  const estadoInicialResp = {
    nome: '', dataNascimento: '', rg: '', cpf: '',
    cep: '', logradouro: '', numero: '', bairro: '', cidade: '',
    telefonePrincipal: '', telefoneSecundario: ''
  };

  const estadoInicialVinculo = {
    id_aluno: '', id_responsavel: '', grauParentesco: '', isResponsavelFinanceiro: 'false'
  };

  const [formData, setFormData] = useState(estadoInicialResp);
  const [vinculoData, setVinculoData] = useState(estadoInicialVinculo);

  // --- CARREGAMENTO DE DADOS (RESPONSÁVEIS + ALUNOS + VÍNCULOS) ---
  const carregarDados = async () => {
    setLoading(true);
    try {
      const [resResp, resAlunos, resVinculos] = await Promise.all([
        api.get('/api/responsaveis'),
        api.get('/api/alunos'),
        api.get('/api/vinculos')
      ]);
      setResponsaveis(resResp.data);
      setAlunos(resAlunos.data);
      setVinculos(resVinculos.data);
      setError(null);
    } catch (err) {
      setError("Erro de conexão com o servidor.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { carregarDados(); }, []);

  // --- HANDLERS E SUBMITS ---
  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
  const handleVinculoChange = (e) => setVinculoData({ ...vinculoData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      nome: formData.nome, dataNascimento: formData.dataNascimento, rg: formData.rg, cpf: formData.cpf,
      telefonePrincipal: formData.telefonePrincipal, telefoneSecundario: formData.telefoneSecundario,
      endereco: { cep: formData.cep, logradouro: formData.logradouro, numero: formData.numero, bairro: formData.bairro, cidade: formData.cidade }
    };

    try {
      await api.post('/api/responsaveis', payload);
      alert("Responsável salvo com sucesso!");
      carregarDados();
      setFormData(estadoInicialResp);
    } catch (err) { 
      alert("Erro ao salvar responsável. Verifique se o CPF já existe."); 
      console.error(err);
    }
  };

  const handleVinculoSubmit = async (e) => {
    e.preventDefault();
    if (!vinculoData.id_aluno || !vinculoData.id_responsavel || !vinculoData.grauParentesco) {
      alert("Preencha Aluno, Responsável e Grau de Parentesco para criar o vínculo.");
      return;
    }

    const payload = {
      aluno: { id_aluno: parseInt(vinculoData.id_aluno) },
      responsavel: { id_responsavel: parseInt(vinculoData.id_responsavel) },
      grauParentesco: vinculoData.grauParentesco,
      isResponsavelFinanceiro: vinculoData.isResponsavelFinanceiro === 'true'
    };

    try {
      await api.post('/api/vinculos', payload);
      alert("Vínculo acadêmico criado com sucesso!");
      carregarDados();
      setVinculoData(estadoInicialVinculo);
    } catch (err) {
      alert("Erro ao criar o vínculo. Verifique os dados.");
      console.error(err);
    }
  };

  const handleExcluir = async (id) => {
    if (window.confirm("Atenção! Deseja excluir este responsável? Todos os vínculos associados a ele também serão excluídos.")) {
      try {
        await api.delete(`/api/responsaveis/${id}`);
        alert("Registro removido.");
        carregarDados(); 
      } catch (err) {
        console.error(err);
        alert("Erro ao excluir.");
      }
    }
  };

  const handleEditar = (id) => router.push(`/views/responsaveis/editar?id=${id}`);

  const responsaveisFiltrados = responsaveis.filter(resp =>
    resp.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    resp.cpf?.includes(searchTerm)
  );

  return (
    <div className="p-10 bg-gray-100 min-h-screen text-zinc-900 font-sans">
      <header className="mb-12 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black uppercase tracking-tighter italic">Gerenciar Responsáveis</h1>
          <div className="h-2 w-24 bg-yellow-400 mt-2"></div>
        </div>
        <button onClick={() => router.push('/')} className="flex items-center gap-2 px-6 py-3 bg-zinc-900 text-white font-bold uppercase text-xs tracking-widest hover:bg-yellow-400 hover:text-zinc-900 transition-all shadow-[4px_4px_0px_0px_rgba(250,204,21,1)] active:shadow-none active:translate-x-1 active:translate-y-1">
          <span>⌂</span> Voltar ao Início
        </button>
      </header>
      
      {/* 1. FORMULÁRIO DE CADASTRO DO RESPONSÁVEL */}
      <form onSubmit={handleSubmit} className="grid grid-cols-1 xl:grid-cols-3 gap-10 mb-10">
        <div className="bg-white p-8 border-4 border-zinc-900 shadow-[8px_8px_0px_0px_rgba(250,204,21,1)] space-y-6">
          <h2 className="font-black text-lg uppercase border-b-4 border-yellow-400 pb-2 mb-4">01. Dados Pessoais</h2>
          <InputField label="Nome do Responsável" name="nome" placeholder="Ex: Mary Smith" onChange={handleChange} value={formData.nome} />
          <div className="grid grid-cols-2 gap-4">
            <InputField label="Nascimento" name="dataNascimento" type="date" onChange={handleChange} value={formData.dataNascimento} />
            <InputField label="CPF" name="cpf" placeholder="000.000.000-00" onChange={handleChange} value={formData.cpf} />
          </div>
          <InputField label="RG" name="rg" placeholder="Identidade" onChange={handleChange} value={formData.rg} />
        </div>

        <div className="bg-white p-8 border-4 border-zinc-900 shadow-[8px_8px_0px_0px_rgba(24,24,27,1)] space-y-6">
          <h2 className="font-black text-lg uppercase border-b-4 border-yellow-400 pb-2 mb-4">02. Localização</h2>
          <div className="grid grid-cols-2 gap-4">
            <InputField label="Tel. Principal" name="telefonePrincipal" onChange={handleChange} value={formData.telefonePrincipal} />
            <InputField label="Tel. Reserva" name="telefoneSecundario" onChange={handleChange} value={formData.telefoneSecundario} />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <InputField label="CEP" name="cep" placeholder="00000-000" onChange={handleChange} value={formData.cep} />
            <InputField label="Nº" name="numero" onChange={handleChange} value={formData.numero} />
            <InputField label="Bairro" name="bairro" onChange={handleChange} value={formData.bairro} />
          </div>
          <InputField label="Logradouro" name="logradouro" onChange={handleChange} value={formData.logradouro} />
          <InputField label="Cidade" name="cidade" onChange={handleChange} value={formData.cidade} />
        </div>

        <div className="bg-yellow-400 p-8 border-4 border-zinc-900 shadow-[8px_8px_0px_0px_rgba(24,24,27,1)] flex flex-col justify-between">
          <div>
            <h2 className="font-black text-2xl uppercase mb-4 italic">Security Check</h2>
            <p className="font-bold text-zinc-900 text-sm leading-tight border-l-4 border-zinc-900 pl-4">
              Cada aluno deve estar vinculado a um responsável válido. Certifique-se de que os dados de contato estão atualizados para emergências.
            </p>
          </div>
          <div className="flex flex-col gap-4 mt-10">
            <button type="submit" className="bg-zinc-900 text-white p-4 font-black uppercase tracking-[0.2em] hover:bg-white hover:text-zinc-900 transition-all border-2 border-zinc-900">
              Salvar Responsável
            </button>
            <button type="button" onClick={() => setFormData(estadoInicialResp)} className="bg-transparent text-zinc-900 p-4 font-bold uppercase text-xs border-2 border-dashed border-zinc-900 hover:bg-white transition-all">
              Limpar Campos
            </button>
          </div>
        </div>
      </form>

      {/* 2. FORMULÁRIO DE VÍNCULOS (ALUNO <-> RESPONSÁVEL) */}
      <form onSubmit={handleVinculoSubmit} className="bg-sky-100 p-8 border-4 border-zinc-900 shadow-[8px_8px_0px_0px_rgba(24,24,27,1)] mb-16">
        <h2 className="font-black text-xl uppercase tracking-tighter italic border-b-4 border-zinc-900 pb-2 mb-6 flex items-center gap-3">
          <span className="text-2xl">🔗</span> Associar Aluno ao Responsável
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-6 items-end">
          <SelectField label="Responsável" name="id_responsavel" onChange={handleVinculoChange} value={vinculoData.id_responsavel} className="xl:col-span-1">
            <option value="">Selecione o adulto...</option>
            {responsaveis.map(r => <option key={r.id_responsavel} value={r.id_responsavel}>{r.nome} (CPF: {r.cpf})</option>)}
          </SelectField>

          <SelectField label="Aluno Matriculado" name="id_aluno" onChange={handleVinculoChange} value={vinculoData.id_aluno} className="xl:col-span-1">
            <option value="">Selecione o aluno...</option>
            {alunos.map(a => <option key={a.id_aluno} value={a.id_aluno}>{a.nome} (Matrícula: {a.numeroMatricula})</option>)}
          </SelectField>

          <SelectField label="Grau de Parentesco" name="grauParentesco" onChange={handleVinculoChange} value={vinculoData.grauParentesco} className="xl:col-span-1">
            <option value="">Selecione...</option>
            <option value="Pai">Pai</option>
            <option value="Mãe">Mãe</option>
            <option value="Avô / Avó">Avô / Avó</option>
            <option value="Tio / Tia">Tio / Tia</option>
            <option value="Tutor Legal">Tutor Legal</option>
            <option value="Irmão / Irmã">Irmão / Irmã</option>
            <option value="Outro">Outro</option>
          </SelectField>

          <SelectField label="Responsável Financeiro?" name="isResponsavelFinanceiro" onChange={handleVinculoChange} value={vinculoData.isResponsavelFinanceiro} className="xl:col-span-1">
            <option value="false">Não</option>
            <option value="true">Sim, paga as mensalidades</option>
          </SelectField>

          <button type="submit" className="bg-zinc-900 text-sky-300 p-3 w-full h-[48px] font-black uppercase tracking-widest hover:bg-sky-300 hover:text-zinc-900 transition-all border-2 border-zinc-900 xl:col-span-1">
            Vincular
          </button>
        </div>
      </form>
      
      {/* 3. TABELA DE RESPONSÁVEIS E VÍNCULOS */}
      <section className="bg-white border-4 border-zinc-900 shadow-[12px_12px_0px_0px_rgba(24,24,27,1)] overflow-hidden">
        <div className="bg-zinc-900 p-6 flex justify-between items-center flex-wrap gap-4">
          <h2 className="font-black text-xl text-white uppercase tracking-tighter italic underline decoration-yellow-400 underline-offset-8">
            Database: Responsáveis & Vínculos
          </h2>
          <div className="relative w-full max-w-md">
            <input
              type="text" placeholder="PESQUISAR NOME OU CPF..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-4 py-2 bg-white border-2 border-yellow-400 rounded-none text-xs font-bold uppercase focus:outline-none"
            />
          </div>
        </div>

        <div className="overflow-x-auto p-4">
          <table className="w-full text-left min-w-[1500px]">
            <thead>
              <tr className="border-b-4 border-zinc-900 bg-gray-50">
                <th className="p-4 font-black uppercase text-xs tracking-widest text-zinc-700">ID</th>
                <th className="p-4 font-black uppercase text-xs tracking-widest text-zinc-900">Nome do Responsável</th>
                <th className="p-4 font-black uppercase text-xs tracking-widest text-zinc-900">Alunos Vinculados</th>
                <th className="p-4 font-black uppercase text-xs tracking-widest text-zinc-900">Documentos</th>
                <th className="p-4 font-black uppercase text-xs tracking-widest text-zinc-900">Endereço Completo</th>
                <th className="p-4 font-black uppercase text-xs tracking-widest text-zinc-900">Contatos</th>
                <th className="p-4 font-black uppercase text-xs tracking-widest text-zinc-900 text-center">Gestão</th>
              </tr>
            </thead>
            <tbody className="font-bold text-base">
              {loading && <tr><td colSpan="7" className="p-10 text-center uppercase italic font-black text-zinc-600 animate-pulse">Loading Database...</td></tr>}
              
              {!loading && responsaveisFiltrados.map(resp => (
                <tr key={resp.id_responsavel} className="border-b-2 border-zinc-100 hover:bg-sky-50 transition-colors group">
                  <td className="p-4">
                    <span className="bg-zinc-900 text-white px-3 py-1.5 text-sm font-mono group-hover:bg-yellow-400 group-hover:text-zinc-900 transition-colors">
                      #{String(resp.id_responsavel).padStart(3, '0')}
                    </span>
                  </td>

                  <td className="p-4 whitespace-nowrap">
                    <span className="uppercase text-zinc-900">{resp.nome}</span>
                  </td>

                  <td className="p-4">
                    <div className="flex flex-col gap-2">
                      {vinculos.filter(v => v.responsavel?.id_responsavel === resp.id_responsavel).length === 0 ? (
                        <span className="text-xs text-zinc-400 italic">Nenhum aluno</span>
                      ) : (
                        vinculos.filter(v => v.responsavel?.id_responsavel === resp.id_responsavel).map((vinculo) => (
                          <div key={vinculo.aluno?.id_aluno} className="flex items-center gap-2 border border-zinc-300 bg-white px-2 py-1 shadow-sm w-max">
                            <span className="text-xs font-black uppercase text-zinc-900">{vinculo.aluno?.nome}</span>
                            <span className="text-[10px] text-zinc-500 bg-zinc-100 px-1 font-mono uppercase">{vinculo.grauParentesco}</span>
                            {vinculo.isResponsavelFinanceiro && (
                              <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1 font-mono font-black" title="Responsável Financeiro">FIN</span>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </td>

                  <td className="p-4 whitespace-nowrap">
                    <div className="flex flex-col gap-1 text-xs font-mono font-bold">
                      <span className="text-zinc-700">CPF: {resp.cpf || '---'}</span>
                      <span className="text-zinc-700">RG: {resp.rg || '---'}</span>
                    </div>
                  </td>

                  <td className="p-4 text-sm text-zinc-800 max-w-[300px] truncate" title={`${resp.endereco?.logradouro || '---'}, ${resp.endereco?.numero || 'S/N'} - ${resp.endereco?.bairro || '---'}, ${resp.endereco?.cidade || '---'} - CEP: ${resp.endereco?.cep || '---'}`}>
                    {resp.endereco ? (
                      <div className="flex flex-col">
                        <span className="uppercase text-zinc-900 font-bold truncate mb-1">
                          {resp.endereco.logradouro}, {resp.endereco.numero || 'S/N'}
                        </span>
                        <span className="text-xs text-zinc-700 font-bold truncate">
                          {resp.endereco.bairro} - {resp.endereco.cidade} | CEP: {resp.endereco.cep}
                        </span>
                      </div>
                    ) : (
                      'Endereço não cadastrado'
                    )}
                  </td>

                  <td className="p-4 text-sm whitespace-nowrap">
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2 font-mono font-bold text-zinc-800">
                        <span className="bg-emerald-100 text-emerald-700 px-1.5 py-0.5 font-black text-[10px]">PRI</span>
                        {resp.telefonePrincipal || '(---)'}
                      </div>
                      {resp.telefoneSecundario && (
                        <div className="flex items-center gap-2 font-mono font-bold text-zinc-800">
                          <span className="bg-zinc-200 text-zinc-700 px-1.5 py-0.5 font-black text-[10px]">SEC</span>
                          {resp.telefoneSecundario}
                        </div>
                      )}
                    </div>
                  </td>

                  <td className="p-4">
                    <div className="flex justify-center gap-2">
                      <button onClick={() => handleEditar(resp.id_responsavel)} className="bg-zinc-900 text-white w-10 h-10 flex items-center justify-center hover:bg-yellow-400 hover:text-zinc-900 transition-all border-2 border-zinc-900">✎</button>
                      <button onClick={() => handleExcluir(resp.id_responsavel)} className="bg-white text-zinc-900 w-10 h-10 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all border-2 border-zinc-900 shadow-[2px_2px_0px_0px_rgba(24,24,27,1)] active:shadow-none">🗑</button>
                    </div>
                  </td>
                </tr>
              ))}

              {!loading && responsaveisFiltrados.length === 0 && (
                 <tr><td colSpan="7" className="p-8 text-center text-zinc-500 uppercase font-black italic">Nenhum registro encontrado.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        
        <div className="bg-gray-50 p-4 border-t-2 border-zinc-900 flex justify-between items-center text-xs font-black uppercase tracking-widest text-zinc-500">
          <span>FlyHigh Idiomas v1.0</span>
          <span>Registros: {responsaveisFiltrados.length}</span>
        </div>
      </section>
    </div>
  );
}