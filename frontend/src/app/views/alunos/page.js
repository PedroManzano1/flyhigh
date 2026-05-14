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

export default function AlunosPage() {
  const router = useRouter();
  const { user } = useContext(AuthContext);
  const [alunos, setAlunos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const estadoInicial = { nome: '', numeroMatricula: '', dataNascimento: '', rg: '', cpf: '', cep: '', logradouro: '', numero: '', bairro: '', cidade: '', telefonePrincipal: '', telefoneSecundario: '', anoEscolar: '' };
  const [formData, setFormData] = useState(estadoInicial);

  const temPermissao = (per) => user?.permissoes?.includes('ROLE_DIRETOR') || user?.permissoes?.includes(per);
  const carregarAlunos = async () => {
    setLoading(true);
    try { const res = await api.get('/api/alunos'); setAlunos(res.data); } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  useEffect(() => { carregarAlunos(); }, []);
  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = { ...formData, endereco: { cep: formData.cep, logradouro: formData.logradouro, numero: formData.numero, bairro: formData.bairro, cidade: formData.cidade } };
    try { await api.post('/api/alunos', payload); alert("Aluno cadastrado!"); carregarAlunos(); setFormData(estadoInicial); } catch (err) { alert("Erro ao salvar."); }
  };

  const handleExcluir = async (id) => {
    if (window.confirm("Deseja realmente excluir este registro?")) {
      try { await api.delete(`/api/alunos/${id}`); carregarAlunos(); } catch (err) { alert("Erro ao excluir."); }
    }
  };

  const alunosFiltrados = alunos.filter(a => a.nome?.toLowerCase().includes(searchTerm.toLowerCase()) || a.numeroMatricula?.includes(searchTerm) || a.cpf?.includes(searchTerm));

  return (
    <div className="p-10 bg-gray-50 min-h-screen text-zinc-900 font-sans">
      <header className="mb-12 flex items-center justify-between">
        <div>
          <h1 className="text-5xl font-black uppercase tracking-tighter italic text-zinc-900">Gestão de Alunos</h1>
          <div className="h-2 w-24 bg-yellow-400 rounded-full mt-2"></div>
        </div>
        <button onClick={() => router.push('/')} className="px-8 py-4 bg-zinc-900 text-white rounded-2xl font-black text-sm uppercase tracking-[0.2em] hover:bg-yellow-400 hover:text-zinc-900 transition-all shadow-xl">
          Voltar ao Início
        </button>
      </header>
      
      {temPermissao('ALUNOS_WRITE') && (
        <form onSubmit={handleSubmit} className="grid grid-cols-1 xl:grid-cols-3 gap-8 mb-20">
          <div className="bg-white p-8 rounded-3xl border border-zinc-200 shadow-sm space-y-6">
            <h2 className="font-black text-sm uppercase text-zinc-800 tracking-[0.2em] mb-4 border-b border-zinc-100 pb-2">01. Dados do Aluno</h2>
            <InputField label="Nome Completo" name="nome" onChange={handleChange} value={formData.nome} />
            <div className="grid grid-cols-2 gap-4">
              <InputField label="Nascimento" name="dataNascimento" type="date" onChange={handleChange} value={formData.dataNascimento} />
              <InputField label="CPF" name="cpf" onChange={handleChange} value={formData.cpf} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <InputField label="RG" name="rg" onChange={handleChange} value={formData.rg} />
              <InputField label="Matrícula" name="numeroMatricula" onChange={handleChange} value={formData.numeroMatricula} />
            </div>
            <SelectField label="Ano Letivo" name="anoEscolar" onChange={handleChange} value={formData.anoEscolar}>
               <option value="">Selecione...</option>
               <option value="1º Ano Fundamental">1º Ano Fundamental</option>
               {/* Outras opções... */}
            </SelectField>
          </div>

          <div className="bg-white p-8 rounded-3xl border border-zinc-200 shadow-sm space-y-6">
            <h2 className="font-black text-sm uppercase text-zinc-800 tracking-[0.2em] mb-4 border-b border-zinc-100 pb-2">02. Contato e Endereço</h2>
            <div className="grid grid-cols-2 gap-4">
              <InputField label="Celular Principal" name="telefonePrincipal" onChange={handleChange} value={formData.telefonePrincipal} />
              <InputField label="Contato Reserva" name="telefoneSecundario" onChange={handleChange} value={formData.telefoneSecundario} />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <InputField label="CEP" name="cep" onChange={handleChange} value={formData.cep} />
              <InputField label="Nº" name="numero" onChange={handleChange} value={formData.numero} />
              <InputField label="Bairro" name="bairro" onChange={handleChange} value={formData.bairro} />
            </div>
            <InputField label="Logradouro" name="logradouro" onChange={handleChange} value={formData.logradouro} />
            <InputField label="Cidade" name="cidade" onChange={handleChange} value={formData.cidade} />
          </div>

          <div className="bg-yellow-400 p-10 rounded-3xl flex flex-col justify-between shadow-xl">
            <div>
              <h3 className="font-black text-2xl uppercase italic mb-4 text-zinc-900">Novo Registro</h3>
              <p className="font-black text-zinc-900 text-lg leading-snug">Certifique-se de que todos os dados acima estão corretos.</p>
            </div>
            <div className="flex flex-col gap-3 mt-10">
              <button type="submit" className="bg-zinc-900 text-white p-5 rounded-2xl font-black uppercase text-sm tracking-widest hover:bg-white hover:text-zinc-900 transition-all shadow-lg">Cadastrar Aluno</button>
              <button type="button" onClick={() => setFormData(estadoInicial)} className="text-zinc-900 p-2 font-black uppercase text-xs hover:underline">Limpar Campos</button>
            </div>
          </div>
        </form>
      )}
      
      <section className="bg-white rounded-[2.5rem] shadow-md border border-zinc-200 overflow-hidden">
        <div className="p-8 border-b border-zinc-200 flex justify-between items-center bg-zinc-100/30">
          <h2 className="font-black text-lg uppercase text-zinc-800 tracking-tighter">Base de Dados</h2>
          <input type="text" placeholder="Pesquisar por nome, matrícula ou CPF..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-96 px-6 py-4 rounded-2xl border border-zinc-300 text-sm font-bold text-zinc-900 focus:outline-none focus:ring-4 focus:ring-yellow-400/20" />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-zinc-50 border-b border-zinc-200">
                <th className="p-6 font-black uppercase text-xs text-zinc-600 tracking-widest">Identificação</th>
                <th className="p-6 font-black uppercase text-xs text-zinc-800 tracking-widest">Documentos</th>
                <th className="p-6 font-black uppercase text-xs text-zinc-800 tracking-widest">Endereço</th>
                <th className="p-6 font-black uppercase text-xs text-zinc-800 tracking-widest">Contatos</th>
                <th className="p-6 font-black uppercase text-xs text-center text-zinc-800 tracking-widest">Ações</th>
              </tr>
            </thead>
            <tbody>
              {!loading && alunosFiltrados.map(aluno => (
                <tr key={aluno.id_aluno} className="border-b border-zinc-100 hover:bg-yellow-50/50 transition-colors">
                  <td className="p-6 align-top">
                    <div className="flex flex-col gap-1">
                      <span className="font-mono font-black text-zinc-500 text-base">#{aluno.numeroMatricula}</span>
                      <span className="font-black text-zinc-900 uppercase text-xl leading-tight">{aluno.nome}</span>
                      <span className="inline-block w-fit px-3 py-1 bg-zinc-900 text-white rounded-lg text-[10px] font-black uppercase tracking-tighter mt-2">{aluno.anoEscolar || 'NÃO DEFINIDO'}</span>
                    </div>
                  </td>

                  <td className="p-6 align-top font-bold text-sm text-zinc-900">
                    <div className="flex flex-col gap-1">
                       <span className="text-[10px] font-black uppercase text-zinc-500">Documentação</span>
                       <span>CPF: {aluno.cpf || '---'}</span>
                       <span>RG: {aluno.rg || '---'}</span>
                       <span className="mt-2 text-zinc-700">Nasc: {aluno.dataNascimento ? new Date(aluno.dataNascimento).toLocaleDateString('pt-BR', {timeZone: 'UTC'}) : '---'}</span>
                    </div>
                  </td>

                  <td className="p-6 align-top max-w-xs">
                    <div className="flex flex-col gap-1 font-bold text-sm text-zinc-900">
                      <span className="text-[10px] font-black uppercase text-zinc-500">Localização</span>
                      {aluno.endereco ? (
                        <>
                          <span className="uppercase font-black">{aluno.endereco.logradouro}, {aluno.endereco.numero}</span>
                          <span className="uppercase text-zinc-700">{aluno.endereco.bairro}</span>
                          <span className="uppercase text-zinc-700">{aluno.endereco.cidade} - {aluno.endereco.cep}</span>
                        </>
                      ) : ( <span className="italic text-zinc-400">Sem endereço</span> )}
                    </div>
                  </td>

                  <td className="p-6 align-top">
                    <div className="flex flex-col gap-3 font-black text-sm">
                        <span className="text-[10px] uppercase text-zinc-500">Contatos</span>
                        <span className="text-zinc-900 bg-emerald-100 px-2 py-1 rounded-md border border-emerald-200 w-fit">{aluno.telefonePrincipal || '(---)'}</span>
                        {aluno.telefoneSecundario && <span className="text-zinc-700 px-2 italic">{aluno.telefoneSecundario}</span>}
                    </div>
                  </td>

                  <td className="p-6 align-middle">
                    <div className="flex justify-center gap-3">
                      <button onClick={() => router.push(`/views/alunos/editar?id=${aluno.id_aluno}`)} className="w-14 h-14 flex items-center justify-center bg-zinc-900 text-white hover:bg-yellow-400 hover:text-zinc-900 rounded-2xl transition-all shadow-md text-2xl">✎</button>
                      <button onClick={() => handleExcluir(aluno.id_aluno)} className="w-14 h-14 flex items-center justify-center bg-white text-zinc-900 border-2 border-zinc-200 hover:bg-red-600 hover:text-white rounded-2xl transition-all shadow-md text-2xl">🗑</button>
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