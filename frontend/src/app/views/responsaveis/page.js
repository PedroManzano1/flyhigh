"use client";
import { useState, useEffect, useContext } from 'react';
import api from '../../../utils/api';
import { useRouter } from 'next/navigation'; 
import { AuthContext } from '../../../context/authContext'; 

const InputField = ({ label, name, placeholder, type = "text", onChange, value, className = "" }) => (
  <div className={className}>
    <label className="block text-xs font-black text-zinc-700 uppercase tracking-widest mb-2">{label}</label>
    <input type={type} name={name} value={value || ''} onChange={onChange} placeholder={placeholder} className="w-full p-4 border border-zinc-300 rounded-xl text-lg font-bold text-zinc-900 focus:ring-4 focus:ring-yellow-400/20 outline-none transition-all bg-white shadow-sm" />
  </div>
);

const SelectField = ({ label, name, children, onChange, value, className = "" }) => (
  <div className={className}>
    <label className="block text-xs font-black text-zinc-700 uppercase tracking-widest mb-2">{label}</label>
    <select name={name} value={value || ''} onChange={onChange} className="w-full p-4 border border-zinc-300 rounded-xl text-lg font-bold text-zinc-900 focus:ring-4 focus:ring-yellow-400/20 outline-none appearance-none bg-white cursor-pointer shadow-sm">{children}</select>
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
  
  // Estado para a busca específica de responsável na área de vínculos
  const [buscaResponsavelVinculo, setBuscaResponsavelVinculo] = useState('');

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

  const handleDesfazerVinculo = async (idAluno, idResponsavel) => {
    if (!idAluno || !idResponsavel) return alert("IDs do vínculo não encontrados.");
    
    if (window.confirm("Deseja realmente desfazer este vínculo entre o aluno e o responsável?")) {
      try {
        await api.delete(`/api/vinculos/${idAluno}/${idResponsavel}`);
        alert("Vínculo desfeito com sucesso!");
        carregarDados();
      } catch (err) { 
        alert("Erro ao desfazer o vínculo."); 
        console.error(err);
      }
    }
  };

  const responsaveisFiltrados = responsaveis.filter(resp => resp.nome?.toLowerCase().includes(searchTerm.toLowerCase()) || resp.cpf?.includes(searchTerm));
  
  const responsaveisParaVinculo = responsaveis.filter(resp => 
    resp.nome?.toLowerCase().includes(buscaResponsavelVinculo.toLowerCase()) || 
    resp.cpf?.includes(buscaResponsavelVinculo)
  );

  const formatarData = (dataString) => {
    if (!dataString) return '---';
    const data = new Date(dataString);
    if (isNaN(data.getTime())) return dataString; 
    return data.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
  };

  return (
    <div className="p-10 bg-gray-50 min-h-screen text-zinc-900 font-sans">
      <header className="mb-12 flex items-center justify-between">
        <div>
          <h1 className="text-5xl font-black uppercase tracking-tighter italic text-zinc-900">Gerenciar Responsáveis</h1>
          <div className="h-2 w-24 bg-yellow-400 mt-2 rounded-full"></div>
        </div>
        <button onClick={() => router.push('/')} className="px-8 py-4 bg-zinc-900 text-white rounded-2xl font-black text-sm uppercase tracking-[0.2em] hover:bg-yellow-400 hover:text-zinc-900 transition-all shadow-xl">
          Voltar ao Início
        </button>
      </header>
      
      {temPermissao('RESPONSAVEIS_WRITE') && (
        <form onSubmit={handleSubmit} className="grid grid-cols-1 xl:grid-cols-3 gap-8 mb-10">
          <div className="bg-white p-8 rounded-3xl border border-zinc-200 shadow-sm space-y-6">
            <h2 className="font-black text-sm uppercase text-zinc-800 tracking-[0.2em] mb-4 border-b border-zinc-100 pb-2">01. Dados Pessoais</h2>
            <InputField label="Nome do Responsável" name="nome" placeholder="Ex: Mary Smith" onChange={handleChange} value={formData.nome} />
            <div className="grid grid-cols-2 gap-4">
              <InputField label="Nascimento" name="dataNascimento" type="date" onChange={handleChange} value={formData.dataNascimento} />
              <InputField label="CPF" name="cpf" placeholder="000.000.000-00" onChange={handleChange} value={formData.cpf} />
            </div>
            <InputField label="RG" name="rg" placeholder="Identidade" onChange={handleChange} value={formData.rg} />
          </div>

          <div className="bg-white p-8 rounded-3xl border border-zinc-200 shadow-sm space-y-6">
            <h2 className="font-black text-sm uppercase text-zinc-800 tracking-[0.2em] mb-4 border-b border-zinc-100 pb-2">02. Localização</h2>
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

          <div className="bg-yellow-400 p-10 rounded-3xl flex flex-col justify-between shadow-xl">
            <div>
              <h2 className="font-black text-3xl uppercase mb-4 italic text-zinc-900">Ground Control 🎧</h2>
              <p className="font-black text-zinc-900 text-lg leading-snug">
                Na FlyHigh, a família é a torre de controle dos nossos alunos. Revise o CPF e os contatos de emergência com atenção para garantir uma comunicação impecável em solo.
              </p>
            </div>
            <div className="flex flex-col gap-3 mt-10">
              <button type="submit" className="bg-zinc-900 text-white p-5 rounded-2xl font-black uppercase text-sm tracking-widest hover:bg-white hover:text-zinc-900 transition-all shadow-lg">Salvar Responsável</button>
              <button type="button" onClick={() => setFormData(estadoInicialResp)} className="text-zinc-900 p-2 font-black uppercase text-xs hover:underline">Limpar Campos</button>
            </div>
          </div>
        </form>
      )}

      {temPermissao('VINCULOS_WRITE') && (
        <form onSubmit={handleVinculoSubmit} className="bg-sky-50 p-8 rounded-3xl border border-sky-200 shadow-sm mb-16">
          <h2 className="font-black text-xl uppercase tracking-tighter italic text-sky-900 flex items-center gap-3 mb-6 border-b border-sky-200 pb-4">
            <span className="text-2xl">🔗</span> Associar Aluno ao Responsável
          </h2>
          
          <div className="mb-6">
            <InputField 
              label="Filtrar Responsável (Por Nome ou CPF)" 
              name="buscaResponsavelVinculo" 
              placeholder="Digite o nome ou CPF para facilitar a busca..." 
              onChange={(e) => setBuscaResponsavelVinculo(e.target.value)} 
              value={buscaResponsavelVinculo} 
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-6 items-end">
            <SelectField label="Responsável" name="id_responsavel" onChange={handleVinculoChange} value={vinculoData.id_responsavel}>
              <option value="">Selecione o adulto...</option>
              {responsaveisParaVinculo.map(r => <option key={r.id_responsavel} value={r.id_responsavel}>{r.nome} (CPF: {r.cpf})</option>)}
            </SelectField>
            
            <SelectField label="Aluno Matriculado" name="id_aluno" onChange={handleVinculoChange} value={vinculoData.id_aluno}>
              <option value="">Selecione o aluno...</option>
              {alunos.map(a => <option key={a.id_aluno} value={a.id_aluno}>{a.nome} (Matr.: {a.numeroMatricula})</option>)}
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
            
            <button type="submit" className="bg-zinc-900 text-sky-300 p-4 rounded-xl font-black uppercase text-sm tracking-widest hover:bg-sky-400 hover:text-zinc-900 transition-all shadow-md h-[62px]">Vincular</button>
          </div>
        </form>
      )}
      
      <section className="bg-white rounded-[2.5rem] shadow-md border border-zinc-200 overflow-hidden">
        <div className="p-8 border-b border-zinc-200 flex justify-between items-center bg-zinc-100/30">
          <h2 className="font-black text-lg uppercase text-zinc-800 tracking-tighter">Database: Responsáveis & Vínculos</h2>
          <input type="text" placeholder="PESQUISAR..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-96 px-6 py-4 rounded-2xl border border-zinc-300 text-sm font-bold text-zinc-900 focus:outline-none focus:ring-4 focus:ring-yellow-400/20" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
             <thead>
              <tr className="bg-zinc-50 border-b border-zinc-200">
                <th className="p-6 font-black uppercase text-xs text-zinc-600 tracking-widest">ID</th>
                <th className="p-6 font-black uppercase text-xs text-zinc-800 tracking-widest">Nome do Responsável</th>
                <th className="p-6 font-black uppercase text-xs text-zinc-800 tracking-widest">Nascimento</th>
                <th className="p-6 font-black uppercase text-xs text-zinc-800 tracking-widest">Alunos Vinculados</th>
                <th className="p-6 font-black uppercase text-xs text-zinc-800 tracking-widest">Documentos</th>
                <th className="p-6 font-black uppercase text-xs text-zinc-800 tracking-widest">Endereço Completo</th>
                <th className="p-6 font-black uppercase text-xs text-zinc-800 tracking-widest">Contatos</th>
                <th className="p-6 font-black uppercase text-xs text-center text-zinc-800 tracking-widest">Gestão</th>
              </tr>
            </thead>
            <tbody>
              {!loading && responsaveisFiltrados.map(resp => (
                <tr key={resp.id_responsavel} className="border-b border-zinc-100 hover:bg-yellow-50/50 transition-colors">
                  
                  {/* ID */}
                  <td className="p-6 align-top">
                    <span className="font-mono font-black text-zinc-400 text-base">
                      #{resp.id_responsavel}
                    </span>
                  </td>
                  
                  {/* NOME */}
                  <td className="p-6 align-top font-black text-zinc-900 uppercase text-lg">{resp.nome}</td>
                  
                  {/* NASCIMENTO */}
                  <td className="p-6 align-top font-bold text-zinc-700 text-base">
                    {formatarData(resp.dataNascimento)}
                  </td>
                  
                  {/* VÍNCULOS */}
                  <td className="p-6 align-top">
                    <div className="flex flex-col gap-2">
                      {vinculos.filter(v => v.responsavel?.id_responsavel === resp.id_responsavel).length === 0 ? (
                        <span className="text-sm font-bold text-zinc-400 italic">Nenhum aluno vinculado</span>
                      ) : (
                        vinculos.filter(v => v.responsavel?.id_responsavel === resp.id_responsavel).map((vinculo) => (
                          <div key={vinculo.id_vinculo || vinculo.aluno?.id_aluno} className="flex items-center gap-2 bg-white border border-zinc-200 px-3 py-2 rounded-xl shadow-sm w-max">
                            <span className="text-xs font-black uppercase text-zinc-900">{vinculo.aluno?.nome}</span>
                            <span className="text-[10px] text-zinc-900 bg-yellow-400 px-2 py-0.5 rounded-md font-black uppercase">{vinculo.grauParentesco}</span>
                            
                            {vinculo.isResponsavelFinanceiro && (
                              <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md font-black uppercase tracking-widest" title="Responsável Financeiro">
                                💰 FIN
                              </span>
                            )}

                            {/* Botão Desfazer Vínculo */}
                            {temPermissao('VINCULOS_WRITE') && (
                              <button 
                                onClick={() => handleDesfazerVinculo(vinculo.aluno.id_aluno, vinculo.responsavel.id_responsavel)} 
                                className="ml-2 text-red-400 hover:text-white hover:bg-red-500 bg-red-50 px-2 py-0.5 rounded-md font-black text-[10px] transition-colors"
                                title="Desfazer Vínculo"
                              >
                                X
                              </button>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </td>

                  {/* DOCUMENTOS */}
                  <td className="p-6 align-top">
                    <div className="flex flex-col gap-1 text-sm font-bold text-zinc-700">
                      <span>CPF: {resp.cpf || '---'}</span>
                      <span>RG: {resp.rg || '---'}</span>
                    </div>
                  </td>
                  
                  {/* ENDEREÇO */}
                  <td className="p-6 align-top text-sm font-bold text-zinc-800 max-w-[250px]">
                    {resp.endereco ? (
                      <div className="flex flex-col gap-1">
                        <span className="uppercase text-zinc-900">
                          {resp.endereco.logradouro}, {resp.endereco.numero || 'S/N'}
                        </span>
                        <span className="text-zinc-600">
                          {resp.endereco.bairro} - {resp.endereco.cidade}
                        </span>
                        <span className="text-zinc-500 text-xs">CEP: {resp.endereco.cep}</span>
                      </div>
                    ) : (
                      <span className="text-zinc-400 italic">Endereço não cadastrado</span>
                    )}
                  </td>
                  
                  {/* CONTATOS */}
                  <td className="p-6 align-top">
                    <div className="flex flex-col gap-3 font-black text-sm">
                      <div className="flex items-center gap-2 text-zinc-900">
                        <span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded-md text-[10px] tracking-widest">PRI</span>
                        {resp.telefonePrincipal || '(---)'}
                      </div>
                      {resp.telefoneSecundario && (
                        <div className="flex items-center gap-2 text-zinc-700">
                          <span className="bg-zinc-200 text-zinc-600 px-2 py-1 rounded-md text-[10px] tracking-widest">SEC</span>
                          {resp.telefoneSecundario}
                        </div>
                      )}
                    </div>
                  </td>
                  
                  {/* GESTÃO */}
                  <td className="p-6 align-middle">
                    <div className="flex justify-center gap-3">
                      {temPermissao('RESPONSAVEIS_WRITE') && (
                        <button onClick={() => router.push(`/views/responsaveis/editar?id=${resp.id_responsavel}`)} className="w-12 h-12 flex items-center justify-center bg-zinc-900 text-white hover:bg-yellow-400 hover:text-zinc-900 rounded-xl transition-all shadow-md text-xl">✎</button>
                      )}
                      {temPermissao('RESPONSAVEIS_DELETE') && (
                        <button onClick={() => handleExcluir(resp.id_responsavel)} className="w-12 h-12 flex items-center justify-center bg-white text-zinc-900 border-2 border-zinc-200 hover:bg-red-600 hover:text-white rounded-xl transition-all shadow-md text-xl">🗑</button>
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