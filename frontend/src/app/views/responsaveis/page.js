"use client";
import { useState, useEffect, useContext } from 'react';
import api from '../../../utils/api';
import { useRouter } from 'next/navigation'; 
import { AuthContext } from '../../../context/authContext'; 

const InputField = ({ label, name, placeholder, type = "text", onChange, value, className = "" }) => (
  <div className={className}>
    <label className="block text-xs font-black text-zinc-800 uppercase tracking-widest mb-1">{label}</label>
    <input type={type} name={name} value={value || ''} onChange={onChange} placeholder={placeholder} className="w-full p-3 border-2 border-zinc-900 rounded-none text-sm focus:ring-0 focus:border-yellow-400 bg-white shadow-[4px_4px_0px_0px_rgba(24,24,27,1)] transition-all focus:translate-x-[2px] focus:translate-y-[2px] focus:shadow-none outline-none" />
  </div>
);

const SelectField = ({ label, name, children, onChange, value, className = "" }) => (
  <div className={className}>
    <label className="block text-xs font-black text-zinc-800 uppercase tracking-widest mb-1">{label}</label>
    <select name={name} value={value || ''} onChange={onChange} className="w-full p-3 border-2 border-zinc-900 rounded-none text-sm focus:ring-0 focus:border-yellow-400 bg-white shadow-[4px_4px_0px_0px_rgba(24,24,27,1)] transition-all outline-none appearance-none">{children}</select>
  </div>
);

export default function ResponsaveisPage() {
  const router = useRouter();
  const { user } = useContext(AuthContext);

  const [responsaveis, setResponsaveis] = useState([]);
  const [alunos, setAlunos] = useState([]);
  const [vinculos, setVinculos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const [error, setError] = useState(null);

  const estadoInicialResp = { nome: '', dataNascimento: '', rg: '', cpf: '', cep: '', logradouro: '', numero: '', bairro: '', cidade: '', telefonePrincipal: '', telefoneSecundario: '' };
  const estadoInicialVinculo = { id_aluno: '', id_responsavel: '', grauParentesco: '', isResponsavelFinanceiro: 'false' };

  const [formData, setFormData] = useState(estadoInicialResp);
  const [vinculoData, setVinculoData] = useState(estadoInicialVinculo);

  const temPermissao = (permissaoNecessaria) => {
    if (!user || !user.permissoes) return false;
    return user.permissoes.includes('ROLE_DIRETOR') || user.permissoes.includes(permissaoNecessaria);
  };

  const carregarDados = async () => {
    setLoading(true);
    try {
      const resResp = await api.get('/api/responsaveis');
      setResponsaveis(resResp.data);

      try {
        const resAlunos = await api.get('/api/alunos');
        setAlunos(resAlunos.data);
      } catch (e) {
        setAlunos([]); 
      }

      try {
        const resVinculos = await api.get('/api/vinculos');
        setVinculos(resVinculos.data);
      } catch (e) {
        setVinculos([]); 
      }

      setError(null);
    } catch (err) {
      setError("Erro de conexão com o servidor.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { carregarDados(); }, []);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
  const handleVinculoChange = (e) => setVinculoData({ ...vinculoData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = { nome: formData.nome, dataNascimento: formData.dataNascimento, rg: formData.rg, cpf: formData.cpf, telefonePrincipal: formData.telefonePrincipal, telefoneSecundario: formData.telefoneSecundario, endereco: { cep: formData.cep, logradouro: formData.logradouro, numero: formData.numero, bairro: formData.bairro, cidade: formData.cidade } };
    try {
      await api.post('/api/responsaveis', payload);
      alert("Responsável salvo com sucesso!");
      carregarDados(); setFormData(estadoInicialResp);
    } catch (err) { alert("Erro ao salvar responsável."); }
  };

  const handleVinculoSubmit = async (e) => {
    e.preventDefault();
    if (!vinculoData.id_aluno || !vinculoData.id_responsavel || !vinculoData.grauParentesco) return alert("Preencha Aluno, Responsável e Grau.");
    const payload = { aluno: { id_aluno: parseInt(vinculoData.id_aluno) }, responsavel: { id_responsavel: parseInt(vinculoData.id_responsavel) }, grauParentesco: vinculoData.grauParentesco, isResponsavelFinanceiro: vinculoData.isResponsavelFinanceiro === 'true' };
    try {
      await api.post('/api/vinculos', payload);
      alert("Vínculo criado!"); carregarDados(); setVinculoData(estadoInicialVinculo);
    } catch (err) { alert("Erro ao criar o vínculo."); }
  };

  const handleExcluir = async (id) => {
    if (window.confirm("Deseja excluir este responsável?")) {
      try {
        await api.delete(`/api/responsaveis/${id}`);
        carregarDados(); 
      } catch (err) { alert("Erro ao excluir."); }
    }
  };

  const responsaveisFiltrados = responsaveis.filter(resp => resp.nome?.toLowerCase().includes(searchTerm.toLowerCase()) || resp.cpf?.includes(searchTerm));

  const formatarData = (dataString) => {
    if (!dataString) return '---';
    const data = new Date(dataString);
    if (isNaN(data.getTime())) return dataString; 
    return data.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
  };

  return (
    <div className="p-10 bg-gray-100 min-h-screen text-zinc-900 font-sans">
      <header className="mb-12 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black uppercase tracking-tighter italic">Gerenciar Responsáveis</h1>
          <div className="h-2 w-24 bg-yellow-400 mt-2"></div>
        </div>
        <button onClick={() => router.push('/')} className="flex items-center gap-2 px-6 py-3 bg-zinc-900 text-white font-bold uppercase text-xs tracking-widest hover:bg-yellow-400 hover:text-zinc-900 transition-all shadow-[4px_4px_0px_0px_rgba(250,204,21,1)]">
          <span>⌂</span> Voltar ao Início
        </button>
      </header>
      
      {temPermissao('RESPONSAVEIS_WRITE') && (
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
              <h2 className="font-black text-2xl uppercase mb-4 italic">Ground Control 🎧</h2>
              <p className="font-bold text-zinc-900 text-sm leading-tight border-l-4 border-zinc-900 pl-4">
                Na FlyHigh, a família é a torre de controle dos nossos alunos. Revise o CPF e os contatos de emergência com atenção para garantir uma comunicação impecável em solo.
              </p>
            </div>
            <div className="flex flex-col gap-4 mt-10">
              <button type="submit" className="bg-zinc-900 text-white p-4 font-black uppercase tracking-[0.2em] hover:bg-white hover:text-zinc-900 transition-all border-2 border-zinc-900">Salvar Responsável</button>
              <button type="button" onClick={() => setFormData(estadoInicialResp)} className="bg-transparent text-zinc-900 p-4 font-bold uppercase text-xs border-2 border-dashed border-zinc-900 hover:bg-white transition-all">Limpar Campos</button>
            </div>
          </div>
        </form>
      )}

      {temPermissao('VINCULOS_WRITE') && (
        <form onSubmit={handleVinculoSubmit} className="bg-sky-100 p-8 border-4 border-zinc-900 shadow-[8px_8px_0px_0px_rgba(24,24,27,1)] mb-16">
          <h2 className="font-black text-xl uppercase tracking-tighter italic border-b-4 border-zinc-900 pb-2 mb-6 flex items-center gap-3">
            <span className="text-2xl">🔗</span> Associar Aluno ao Responsável
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-6 items-end">
            <SelectField label="Responsável" name="id_responsavel" onChange={handleVinculoChange} value={vinculoData.id_responsavel}>
              <option value="">Selecione o adulto...</option>
              {responsaveis.map(r => <option key={r.id_responsavel} value={r.id_responsavel}>{r.nome} (CPF: {r.cpf})</option>)}
            </SelectField>
            <SelectField label="Aluno Matriculado" name="id_aluno" onChange={handleVinculoChange} value={vinculoData.id_aluno}>
              <option value="">Selecione o aluno...</option>
              {alunos.map(a => <option key={a.id_aluno} value={a.id_aluno}>{a.nome} (Matrícula: {a.numeroMatricula})</option>)}
            </SelectField>
            <SelectField label="Grau de Parentesco" name="grauParentesco" onChange={handleVinculoChange} value={vinculoData.grauParentesco}>
              <option value="">Selecione...</option>
              <option value="Pai">Pai</option>
              <option value="Mãe">Mãe</option>
              <option value="Outro">Outro</option>
            </SelectField>
            <SelectField label="Responsável Financeiro?" name="isResponsavelFinanceiro" onChange={handleVinculoChange} value={vinculoData.isResponsavelFinanceiro}>
              <option value="false">Não</option>
              <option value="true">Sim, paga as mensalidades</option>
            </SelectField>
            <button type="submit" className="bg-zinc-900 text-sky-300 p-3 w-full h-[48px] font-black uppercase hover:bg-sky-300 hover:text-zinc-900 transition-all border-2 border-zinc-900">Vincular</button>
          </div>
        </form>
      )}
      
      <section className="bg-white border-4 border-zinc-900 shadow-[12px_12px_0px_0px_rgba(24,24,27,1)] overflow-hidden">
        <div className="bg-zinc-900 p-6 flex justify-between items-center">
          <h2 className="font-black text-xl text-white uppercase tracking-tighter italic">Database: Responsáveis & Vínculos</h2>
          <input type="text" placeholder="PESQUISAR..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full max-w-md pl-4 py-2 bg-white text-xs font-bold uppercase focus:outline-none" />
        </div>
        <div className="overflow-x-auto p-4">
          <table className="w-full text-left min-w-[1600px]">
             <thead>
              <tr className="border-b-4 border-zinc-900 bg-gray-50">
                <th className="p-4 font-black uppercase text-xs text-zinc-700">ID</th>
                <th className="p-4 font-black uppercase text-xs text-zinc-900">Nome do Responsável</th>
                <th className="p-4 font-black uppercase text-xs text-zinc-900">Nascimento</th>
                <th className="p-4 font-black uppercase text-xs text-zinc-900">Alunos Vinculados</th>
                <th className="p-4 font-black uppercase text-xs text-zinc-900">Documentos</th>
                <th className="p-4 font-black uppercase text-xs text-zinc-900">Endereço Completo</th>
                <th className="p-4 font-black uppercase text-xs text-zinc-900">Contatos</th>
                <th className="p-4 font-black uppercase text-xs text-center text-zinc-900">Gestão</th>
              </tr>
            </thead>
            <tbody className="font-bold text-base">
              {!loading && responsaveisFiltrados.map(resp => (
                <tr key={resp.id_responsavel} className="border-b-2 border-zinc-100 hover:bg-yellow-50 transition-colors">
                  
                  {/* ID */}
                  <td className="p-4">
                    <span className="bg-zinc-900 text-white px-3 py-1.5 text-sm font-mono">
                      #{resp.id_responsavel}
                    </span>
                  </td>
                  
                  {/* NOME */}
                  <td className="p-4 uppercase whitespace-nowrap">{resp.nome}</td>
                  
                  {/* NASCIMENTO */}
                  <td className="p-4 whitespace-nowrap text-zinc-900">
                    {formatarData(resp.dataNascimento)}
                  </td>
                  
                  {/* VÍNCULOS */}
                  <td className="p-4">
                    <div className="flex flex-col gap-2">
                      {vinculos.filter(v => v.responsavel?.id_responsavel === resp.id_responsavel).length === 0 ? (
                        <span className="text-xs text-zinc-400 italic font-normal">Nenhum aluno vinculado</span>
                      ) : (
                        vinculos.filter(v => v.responsavel?.id_responsavel === resp.id_responsavel).map((vinculo) => (
                          <div key={vinculo.aluno?.id_aluno} className="flex items-center gap-2 border-2 border-zinc-900 bg-white px-2 py-1 shadow-[2px_2px_0px_0px_rgba(24,24,27,1)] w-max">
                            <span className="text-[10px] font-black uppercase text-zinc-900">{vinculo.aluno?.nome}</span>
                            <span className="text-[10px] text-zinc-900 bg-yellow-400 border border-zinc-900 px-1 font-black uppercase">{vinculo.grauParentesco}</span>
                            
                            {vinculo.isResponsavelFinanceiro && (
                              <span className="text-[10px] bg-emerald-100 text-emerald-800 border-2 border-emerald-800 px-1.5 py-0 font-black uppercase tracking-widest" title="Responsável Financeiro">
                                💰 FIN
                              </span>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </td>

                  {/* DOCUMENTOS */}
                  <td className="p-4 whitespace-nowrap">
                    <div className="flex flex-col gap-1 text-xs font-mono font-bold">
                      <span className="text-zinc-700">CPF: {resp.cpf || '---'}</span>
                      <span className="text-zinc-700">RG: {resp.rg || '---'}</span>
                    </div>
                  </td>
                  
                  {/* ENDEREÇO */}
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
                      <span className="text-zinc-400 italic font-normal">Endereço não cadastrado</span>
                    )}
                  </td>
                  
                  {/* CONTATOS */}
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
                  
                  {/* GESTÃO */}
                  <td className="p-4">
                    <div className="flex justify-center gap-2">
                      {temPermissao('RESPONSAVEIS_WRITE') && (
                        <button onClick={() => router.push(`/views/responsaveis/editar?id=${resp.id_responsavel}`)} className="bg-zinc-900 text-white w-10 h-10 flex items-center justify-center hover:bg-yellow-400 hover:text-zinc-900 border-2 border-zinc-900">✎</button>
                      )}
                      {temPermissao('RESPONSAVEIS_DELETE') && (
                        <button onClick={() => handleExcluir(resp.id_responsavel)} className="bg-white text-zinc-900 w-10 h-10 flex items-center justify-center hover:bg-red-500 hover:text-white border-2 border-zinc-900 shadow-[2px_2px_0px_0px_rgba(24,24,27,1)]">🗑</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}