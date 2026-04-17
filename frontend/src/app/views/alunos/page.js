"use client";
import { useState, useEffect } from 'react';
import api from '../../../utils/api';
import { useRouter } from 'next/navigation'; 

const InputField = ({ label, name, placeholder, type = "text", onChange, value, className = "" }) => (
  <div className={className}>
    <label className="block text-xs font-black text-zinc-800 uppercase tracking-widest mb-1">{label}</label>
    <input
      type={type} name={name} value={value || ''} onChange={onChange} placeholder={placeholder}
      className="w-full p-3 border-2 border-zinc-900 rounded-none text-sm focus:ring-0 focus:border-yellow-400 bg-white shadow-[4px_4px_0px_0px_rgba(24,24,27,1)] transition-all focus:translate-x-[2px] focus:translate-y-[2px] focus:shadow-none outline-none"
    />
  </div>
);

const SelectField = ({ label, name, children, onChange, value }) => (
  <div>
    <label className="block text-xs font-black text-zinc-800 uppercase tracking-widest mb-1">{label}</label>
    <select
      name={name} value={value || ''} onChange={onChange}
      className="w-full p-3 border-2 border-zinc-900 rounded-none text-sm focus:ring-0 focus:border-yellow-400 bg-white shadow-[4px_4px_0px_0px_rgba(24,24,27,1)] transition-all outline-none appearance-none"
    >
      {children}
    </select>
  </div>
);

export default function AlunosPage() {
  const router = useRouter();
  const [alunos, setAlunos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const estadoInicial = {
    nome: '', numeroMatricula: '', dataNascimento: '', rg: '', cpf: '',
    cep: '', logradouro: '', numero: '', bairro: '', cidade: '',
    telefonePrincipal: '', telefoneSecundario: '', anoEscolar: ''
  };

  const [formData, setFormData] = useState(estadoInicial);

  const carregarAlunos = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/alunos');
      setAlunos(res.data);
      setError(null);
    } catch (err) {
      setError("Erro de conexão com o servidor FlyHigh.");
      console.error(err);
    } finally { setLoading(false); }
  };

  useEffect(() => { carregarAlunos(); }, []);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      nome: formData.nome, numeroMatricula: formData.numeroMatricula, dataNascimento: formData.dataNascimento,
      rg: formData.rg, cpf: formData.cpf, anoEscolar: formData.anoEscolar,
      telefonePrincipal: formData.telefonePrincipal, telefoneSecundario: formData.telefoneSecundario,
      endereco: { cep: formData.cep, logradouro: formData.logradouro, numero: formData.numero, bairro: formData.bairro, cidade: formData.cidade }
    };

    try {
      await api.post('/api/alunos', payload);
      alert("Aluno salvo com sucesso!");
      carregarAlunos(); setFormData(estadoInicial);
    } catch (err) { 
      alert("Erro ao salvar aluno. Verifique os dados."); console.error(err);
    }
  };

  const handleExcluir = async (id) => {
    if (window.confirm("Atenção! Deseja excluir este registro permanentemente?")) {
      try {
        await api.delete(`/api/alunos/${id}`);
        alert("Registro removido."); carregarAlunos(); 
      } catch (err) { alert("Erro ao excluir. Verifique a conexão."); }
    }
  };

  const handleEditar = (id) => router.push(`/views/alunos/editar?id=${id}`);

  const alunosFiltrados = alunos.filter(aluno =>
    aluno.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    aluno.numeroMatricula?.includes(searchTerm) || aluno.cpf?.includes(searchTerm)
  );

  return (
    <div className="p-10 bg-gray-100 min-h-screen text-zinc-900 font-sans">
      <header className="mb-12 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black uppercase tracking-tighter italic">Gerenciar Alunos</h1>
          <div className="h-2 w-24 bg-yellow-400 mt-2"></div>
        </div>
        <button onClick={() => router.push('/')} className="flex items-center gap-2 px-6 py-3 bg-zinc-900 text-white font-bold uppercase text-xs tracking-widest hover:bg-yellow-400 hover:text-zinc-900 transition-all shadow-[4px_4px_0px_0px_rgba(250,204,21,1)] active:shadow-none active:translate-x-1 active:translate-y-1">
          <span>⌂</span> Voltar ao Início
        </button>
      </header>
      
      <form onSubmit={handleSubmit} className="grid grid-cols-1 xl:grid-cols-3 gap-10 mb-16">
        <div className="bg-white p-8 border-4 border-zinc-900 shadow-[8px_8px_0px_0px_rgba(250,204,21,1)] space-y-6">
          <h2 className="font-black text-lg uppercase border-b-4 border-yellow-400 pb-2 mb-4">01. Perfil do Aluno</h2>
          <InputField label="Nome Completo" name="nome" placeholder="Ex: John Smith" onChange={handleChange} value={formData.nome} />
          <div className="grid grid-cols-2 gap-4">
            <InputField label="Nascimento" name="dataNascimento" type="date" onChange={handleChange} value={formData.dataNascimento} />
            <InputField label="CPF" name="cpf" placeholder="000.000.000-00" onChange={handleChange} value={formData.cpf} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <InputField label="RG" name="rg" placeholder="00.000.000-0" onChange={handleChange} value={formData.rg} />
            <InputField label="Matrícula" name="numeroMatricula" placeholder="ID Interno" onChange={handleChange} value={formData.numeroMatricula} />
          </div>
          <SelectField label="Ano Escolar Regular" name="anoEscolar" onChange={handleChange} value={formData.anoEscolar}>
            <option value="">Selecione o ano</option>
            <option value="1º Ano Fundamental">1º Ano Fundamental</option>
            <option value="2º Ano Fundamental">2º Ano Fundamental</option>
            <option value="3º Ano Fundamental">3º Ano Fundamental</option>
            <option value="4º Ano Fundamental">4º Ano Fundamental</option>
            <option value="5º Ano Fundamental">5º Ano Fundamental</option>
            <option value="6º Ano Fundamental">6º Ano Fundamental</option>
            <option value="7º Ano Fundamental">7º Ano Fundamental</option>
            <option value="8º Ano Fundamental">8º Ano Fundamental</option>
            <option value="9º Ano Fundamental">9º Ano Fundamental</option>
            <option value="1º Ano Médio">1º Ano Médio</option>
            <option value="2º Ano Médio">2º Ano Médio</option>
            <option value="3º Ano Médio">3º Ano Médio</option>
            <option value="Ensino Medio Completo">Ensino Medio Completo</option>
          </SelectField>
        </div>

        <div className="bg-white p-8 border-4 border-zinc-900 shadow-[8px_8px_0px_0px_rgba(24,24,27,1)] space-y-6">
          <h2 className="font-black text-lg uppercase border-b-4 border-yellow-400 pb-2 mb-4">02. Localização</h2>
          <div className="grid grid-cols-2 gap-4">
            <InputField label="Telefone Principal" name="telefonePrincipal" onChange={handleChange} value={formData.telefonePrincipal} />
            <InputField label="Telefone Reserva" name="telefoneSecundario" onChange={handleChange} value={formData.telefoneSecundario} />
          </div>
          <InputField label="CEP" name="cep" placeholder="00000-000" onChange={handleChange} value={formData.cep} />
          <InputField label="Logradouro" name="logradouro" onChange={handleChange} value={formData.logradouro} />
          <div className="grid grid-cols-3 gap-4">
            <InputField label="Nº" name="numero" onChange={handleChange} value={formData.numero} />
            <InputField label="Bairro" name="bairro" onChange={handleChange} value={formData.bairro} className="col-span-2" />
          </div>
          <InputField label="Cidade" name="cidade" onChange={handleChange} value={formData.cidade} />
        </div>

        <div className="bg-yellow-400 p-8 border-4 border-zinc-900 shadow-[8px_8px_0px_0px_rgba(24,24,27,1)] flex flex-col justify-between">
          <div>
            <h2 className="font-black text-2xl uppercase mb-4 italic">Ready to fly?</h2>
            <p className="font-bold text-zinc-900 text-sm leading-tight border-l-4 border-zinc-900 pl-4">
              Revise a matrícula e o CPF. Na FlyHigh, a precisão dos dados é o primeiro passo para o sucesso do aluno.
            </p>
          </div>
          <div className="flex flex-col gap-4 mt-10">
            <button type="submit" className="bg-zinc-900 text-white p-4 font-black uppercase tracking-[0.2em] hover:bg-white hover:text-zinc-900 transition-all border-2 border-zinc-900">
              Salvar Registro
            </button>
            <button type="button" onClick={() => setFormData(estadoInicial)} className="bg-transparent text-zinc-900 p-4 font-bold uppercase text-xs border-2 border-dashed border-zinc-900 hover:bg-white transition-all">
              Limpar Todos os Campos
            </button>
          </div>
        </div>
      </form>
      
      <section className="bg-white border-4 border-zinc-900 shadow-[12px_12px_0px_0px_rgba(24,24,27,1)] overflow-hidden">
        <div className="bg-zinc-900 p-6 flex justify-between items-center flex-wrap gap-4">
          <h2 className="font-black text-xl text-white uppercase tracking-tighter italic underline decoration-yellow-400 underline-offset-8">
            Database: Alunos Ativos
          </h2>
          <div className="relative w-full max-w-md">
            <input type="text" placeholder="PESQUISAR NOME, CPF OU MATRÍCULA..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-4 py-2 bg-white border-2 border-yellow-400 rounded-none text-xs font-bold uppercase focus:outline-none" />
          </div>
        </div>

        <div className="overflow-x-auto p-4">
          <table className="w-full text-left min-w-[1400px]">
            <thead>
              <tr className="border-b-4 border-zinc-900 bg-gray-50">
                <th className="p-4 font-black uppercase text-xs tracking-widest text-zinc-700">Matrícula</th>
                <th className="p-4 font-black uppercase text-xs tracking-widest text-zinc-900">Nome do Aluno</th>
                <th className="p-4 font-black uppercase text-xs tracking-widest text-zinc-900">Documentos</th>
                <th className="p-4 font-black uppercase text-xs tracking-widest text-zinc-900">Nascimento</th>
                <th className="p-4 font-black uppercase text-xs tracking-widest text-zinc-900">Ano Escolar</th>
                <th className="p-4 font-black uppercase text-xs tracking-widest text-zinc-900">Endereço Completo</th>
                <th className="p-4 font-black uppercase text-xs tracking-widest text-zinc-900">Contatos</th>
                <th className="p-4 font-black uppercase text-xs tracking-widest text-zinc-900 text-center">Gestão</th>
              </tr>
            </thead>
            <tbody className="font-bold text-base">
              {loading && <tr><td colSpan="8" className="p-10 text-center uppercase italic font-black text-zinc-600 animate-pulse">Connecting to FlyHigh Database...</td></tr>}
              
              {!loading && !error && alunosFiltrados.map(aluno => (
                <tr key={aluno.id_aluno} className="border-b-2 border-zinc-100 hover:bg-yellow-50 transition-colors group">
                  <td className="p-4">
                    <span className="bg-zinc-900 text-white px-3 py-1.5 text-sm font-mono group-hover:bg-yellow-400 group-hover:text-zinc-900 transition-colors">
                      #{aluno.numeroMatricula}
                    </span>
                  </td>
                  
                  <td className="p-4 whitespace-nowrap">
                    <span className="uppercase text-zinc-900">{aluno.nome}</span>
                  </td>

                  <td className="p-4 whitespace-nowrap">
                    <div className="flex flex-col gap-1 text-xs font-mono font-bold">
                      <span className="text-zinc-700">CPF: {aluno.cpf || '---'}</span>
                      <span className="text-zinc-700">RG: {aluno.rg || '---'}</span>
                    </div>
                  </td>

                  <td className="p-4 text-zinc-900 whitespace-nowrap">
                    {aluno.dataNascimento ? new Date(aluno.dataNascimento).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : '---'}
                  </td>
                  
                  <td className="p-4 whitespace-nowrap">
                    <span className="border-2 border-zinc-900 px-3 py-1.5 text-xs uppercase font-black bg-white shadow-[2px_2px_0px_0px_rgba(24,24,27,1)]">
                      {aluno.anoEscolar || '---'}
                    </span>
                  </td>

                  <td className="p-4 text-sm text-zinc-800 max-w-[300px] truncate" title={`${aluno.endereco?.logradouro || '---'}, ${aluno.endereco?.numero || 'S/N'} - ${aluno.endereco?.bairro || '---'}, ${aluno.endereco?.cidade || '---'} - CEP: ${aluno.endereco?.cep || '---'}`}>
                    {aluno.endereco ? (
                      <div className="flex flex-col">
                        <span className="uppercase text-zinc-900 font-bold truncate mb-1">
                          {aluno.endereco.logradouro}, {aluno.endereco.numero || 'S/N'}
                        </span>
                        <span className="text-xs text-zinc-700 font-bold truncate">
                          {aluno.endereco.bairro} - {aluno.endereco.cidade} | CEP: {aluno.endereco.cep}
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
                        {aluno.telefonePrincipal || '(---)'}
                      </div>
                      {aluno.telefoneSecundario && (
                        <div className="flex items-center gap-2 font-mono font-bold text-zinc-800">
                          <span className="bg-zinc-200 text-zinc-700 px-1.5 py-0.5 font-black text-[10px]">SEC</span>
                          {aluno.telefoneSecundario}
                        </div>
                      )}
                    </div>
                  </td>

                  <td className="p-4">
                    <div className="flex justify-center gap-2">
                      <button onClick={() => handleEditar(aluno.id_aluno)} className="bg-zinc-900 text-white w-10 h-10 flex items-center justify-center hover:bg-yellow-400 hover:text-zinc-900 transition-all border-2 border-zinc-900">✎</button>
                      <button onClick={() => handleExcluir(aluno.id_aluno)} className="bg-white text-zinc-900 w-10 h-10 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all border-2 border-zinc-900 shadow-[2px_2px_0px_0px_rgba(24,24,27,1)] active:shadow-none">🗑</button>
                    </div>
                  </td>
                </tr>
              ))}

              {!loading && !error && alunosFiltrados.length === 0 && (
                 <tr><td colSpan="8" className="p-8 text-center text-zinc-500 uppercase font-black italic">Nenhum registro encontrado.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        
        <div className="bg-gray-50 p-4 border-t-2 border-zinc-900 flex justify-between items-center text-xs font-black uppercase tracking-widest text-zinc-500">
          <span>FlyHigh Idiomas v1.0</span>
          <span>Total: {alunosFiltrados.length} Alunos</span>
        </div>
      </section>
    </div>
  );
}