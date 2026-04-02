"use client";
import { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation'; 

// --- COMPONENTES UTILITÁRIOS (ESTILO FLYHIGH) ---
const InputField = ({ label, name, placeholder, type = "text", onChange, value, className = "" }) => (
  <div className={className}>
    <label className="block text-xs font-black text-zinc-500 uppercase tracking-widest mb-1">{label}</label>
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

// --- PÁGINA PRINCIPAL ---
export default function ResponsaveisPage() {
  const router = useRouter();
  const [responsaveis, setResponsaveis] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const estadoInicial = {
    nome: '', dataNascimento: '', rg: '', cpf: '',
    cep: '', logradouro: '', numero: '', bairro: '', cidade: '',
    telefonePrincipal: '', telefoneSecundario: ''
  };

  const [formData, setFormData] = useState(estadoInicial);

  const carregarResponsaveis = async () => {
    setLoading(true);
    try {
      const res = await axios.get('http://localhost:8080/api/responsaveis');
      setResponsaveis(res.data);
      setError(null);
    } catch (err) {
      setError("Erro de conexão com o servidor de responsáveis.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { carregarResponsaveis(); }, []);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      nome: formData.nome,
      dataNascimento: formData.dataNascimento,
      rg: formData.rg,
      cpf: formData.cpf,
      telefonePrincipal: formData.telefonePrincipal,
      telefoneSecundario: formData.telefoneSecundario,
      endereco: {
        cep: formData.cep,
        logradouro: formData.logradouro,
        numero: formData.numero,
        bairro: formData.bairro,
        cidade: formData.cidade
      }
    };

    try {
      await axios.post('http://localhost:8080/api/responsaveis', payload);
      alert("Responsável salvo com sucesso!");
      carregarResponsaveis();
      setFormData(estadoInicial);
    } catch (err) { 
      alert("Erro ao salvar responsável. Verifique se o CPF já existe."); 
      console.error(err);
    }
  };

  const handleExcluir = async (id) => {
    if (window.confirm("Atenção! Deseja excluir este registro permanentemente?")) {
      try {
        await axios.delete(`http://localhost:8080/api/responsaveis/${id}`);
        alert("Registro removido.");
        carregarResponsaveis(); 
      } catch (err) {
        console.error(err);
        alert("Erro ao excluir.");
      }
    }
  };

  const handleEditar = (id) => {
    router.push(`/views/responsaveis/editar?id=${id}`);
  };

  const responsaveisFiltrados = responsaveis.filter(resp =>
    resp.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    resp.cpf?.includes(searchTerm)
  );

  return (
    <div className="p-10 bg-gray-100 min-h-screen text-zinc-900 font-sans">
      {/* HEADER NAVEGAÇÃO */}
      <header className="mb-12 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black uppercase tracking-tighter italic">Gerenciar Responsáveis</h1>
          <div className="h-2 w-24 bg-yellow-400 mt-2"></div>
        </div>
        
        <button 
          onClick={() => router.push('/')}
          className="flex items-center gap-2 px-6 py-3 bg-zinc-900 text-white font-bold uppercase text-xs tracking-widest hover:bg-yellow-400 hover:text-zinc-900 transition-all shadow-[4px_4px_0px_0px_rgba(250,204,21,1)] active:shadow-none active:translate-x-1 active:translate-y-1"
        >
          <span>⌂</span> Voltar ao Início
        </button>
      </header>
      
      {/* FORMULÁRIO DE CADASTRO */}
      <form onSubmit={handleSubmit} className="grid grid-cols-1 xl:grid-cols-3 gap-10 mb-16">
        
        {/* COLUNA 01: DADOS PESSOAIS */}
        <div className="bg-white p-8 border-4 border-zinc-900 shadow-[8px_8px_0px_0px_rgba(250,204,21,1)] space-y-6">
          <h2 className="font-black text-lg uppercase border-b-4 border-yellow-400 pb-2 mb-4">01. Dados Pessoais</h2>
          <InputField label="Nome do Responsável" name="nome" placeholder="Ex: Mary Smith" onChange={handleChange} value={formData.nome} />
          <div className="grid grid-cols-2 gap-4">
            <InputField label="Nascimento" name="dataNascimento" type="date" onChange={handleChange} value={formData.dataNascimento} />
            <InputField label="CPF" name="cpf" placeholder="000.000.000-00" onChange={handleChange} value={formData.cpf} />
          </div>
          <InputField label="RG" name="rg" placeholder="Identidade" onChange={handleChange} value={formData.rg} />
        </div>

        {/* COLUNA 02: CONTATO E ENDEREÇO */}
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

        {/* COLUNA 03: FINALIZAÇÃO */}
        <div className="bg-yellow-400 p-8 border-4 border-zinc-900 shadow-[8px_8px_0px_0px_rgba(24,24,27,1)] flex flex-col justify-between">
          <div>
            <h2 className="font-black text-2xl uppercase mb-4 italic">Security Check</h2>
            <p className="font-bold text-zinc-900 text-sm leading-tight border-l-4 border-zinc-900 pl-4">
              Cada aluno deve estar vinculado a um responsável válido. Certifique-se de que os dados de contato estão atualizados para emergências.
            </p>
          </div>
          <div className="flex flex-col gap-4 mt-10">
            <button 
              type="submit" 
              className="bg-zinc-900 text-white p-4 font-black uppercase tracking-[0.2em] hover:bg-white hover:text-zinc-900 transition-all border-2 border-zinc-900"
            >
              Salvar Responsável
            </button>
            <button 
              type="button" 
              onClick={() => setFormData(estadoInicial)} 
              className="bg-transparent text-zinc-900 p-4 font-bold uppercase text-xs border-2 border-dashed border-zinc-900 hover:bg-white transition-all"
            >
              Limpar Campos
            </button>
          </div>
        </div>
      </form>
      
      {/* TABELA DE RESPONSÁVEIS */}
      <section className="bg-white border-4 border-zinc-900 shadow-[12px_12px_0px_0px_rgba(24,24,27,1)] overflow-hidden">
        {/* HEADER TABELA */}
        <div className="bg-zinc-900 p-6 flex justify-between items-center flex-wrap gap-4">
          <h2 className="font-black text-xl text-white uppercase tracking-tighter italic underline decoration-yellow-400 underline-offset-8">
            Database: Responsáveis
          </h2>
          <div className="relative w-full max-w-md">
            <input
              type="text" 
              placeholder="PESQUISAR NOME OU CPF..."
              value={searchTerm} 
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-4 py-2 bg-white border-2 border-yellow-400 rounded-none text-xs font-bold uppercase focus:outline-none"
            />
          </div>
        </div>

        {/* CORPO TABELA */}
        <div className="overflow-x-auto p-4">
          <table className="w-full text-left min-w-[1400px]">
            <thead>
              <tr className="border-b-4 border-zinc-900 bg-gray-50">
                <th className="p-4 font-black uppercase text-[10px] tracking-widest text-zinc-500">ID</th>
                <th className="p-4 font-black uppercase text-[10px] tracking-widest text-zinc-900">Nome do Responsável</th>
                <th className="p-4 font-black uppercase text-[10px] tracking-widest text-zinc-900">Documentos</th>
                <th className="p-4 font-black uppercase text-[10px] tracking-widest text-zinc-900">Nascimento</th>
                <th className="p-4 font-black uppercase text-[10px] tracking-widest text-zinc-900">Endereço Completo</th>
                <th className="p-4 font-black uppercase text-[10px] tracking-widest text-zinc-900">Contatos</th>
                <th className="p-4 font-black uppercase text-[10px] tracking-widest text-zinc-900 text-center">Gestão</th>
              </tr>
            </thead>
            <tbody className="font-bold text-sm">
              {loading && (
                <tr>
                  <td colSpan="7" className="p-10 text-center uppercase italic font-black text-zinc-400 animate-pulse">
                    Loading Database...
                  </td>
                </tr>
              )}
              
              {!loading && responsaveisFiltrados.map(resp => (
                <tr key={resp.id_responsavel} className="border-b-2 border-zinc-100 hover:bg-yellow-50 transition-colors group">
                  <td className="p-4">
                    <span className="bg-zinc-900 text-white px-2 py-1 text-xs font-mono group-hover:bg-yellow-400 group-hover:text-zinc-900 transition-colors">
                      #{String(resp.id_responsavel).padStart(3, '0')}
                    </span>
                  </td>

                  <td className="p-4 whitespace-nowrap">
                    <span className="uppercase text-zinc-900">{resp.nome}</span>
                  </td>

                  <td className="p-4 whitespace-nowrap">
                    <div className="flex flex-col gap-1 text-[11px] font-mono">
                      <span className="text-zinc-600">CPF: {resp.cpf || '---'}</span>
                      <span className="text-zinc-400">RG: {resp.rg || '---'}</span>
                    </div>
                  </td>

                  <td className="p-4 text-zinc-600 whitespace-nowrap">
                    {resp.dataNascimento ? new Date(resp.dataNascimento).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : '---'}
                  </td>

                  <td className="p-4 text-[11px] text-zinc-600 max-w-[300px] truncate" title={`${resp.endereco?.logradouro || '---'}, ${resp.endereco?.numero || 'S/N'} - ${resp.endereco?.bairro || '---'}, ${resp.endereco?.cidade || '---'} - CEP: ${resp.endereco?.cep || '---'}`}>
                    {resp.endereco ? (
                      <div className="flex flex-col">
                        <span className="uppercase text-zinc-900 font-bold truncate">
                          {resp.endereco.logradouro}, {resp.endereco.numero || 'S/N'}
                        </span>
                        <span className="text-zinc-500 truncate">
                          {resp.endereco.bairro} - {resp.endereco.cidade} | CEP: {resp.endereco.cep}
                        </span>
                      </div>
                    ) : (
                      'Endereço não cadastrado'
                    )}
                  </td>

                  <td className="p-4 text-[11px] whitespace-nowrap">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2 font-mono">
                        <span className="bg-emerald-100 text-emerald-700 px-1 font-black text-[9px]">PRI</span>
                        {resp.telefonePrincipal || '(---)'}
                      </div>
                      {resp.telefoneSecundario && (
                        <div className="flex items-center gap-2 font-mono">
                          <span className="bg-zinc-100 text-zinc-500 px-1 font-black text-[9px]">SEC</span>
                          {resp.telefoneSecundario}
                        </div>
                      )}
                    </div>
                  </td>

                  <td className="p-4">
                    <div className="flex justify-center gap-2">
                      <button 
                        onClick={() => handleEditar(resp.id_responsavel)} 
                        className="bg-zinc-900 text-white w-9 h-9 flex items-center justify-center hover:bg-yellow-400 hover:text-zinc-900 transition-all border-2 border-zinc-900"
                      >
                        ✎
                      </button>
                      <button 
                        onClick={() => handleExcluir(resp.id_responsavel)} 
                        className="bg-white text-zinc-900 w-9 h-9 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all border-2 border-zinc-900 shadow-[2px_2px_0px_0px_rgba(24,24,27,1)] active:shadow-none"
                      >
                        🗑
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {!loading && responsaveisFiltrados.length === 0 && (
                 <tr><td colSpan="7" className="p-8 text-center text-zinc-400 uppercase font-black italic">Nenhum registro encontrado.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* FOOTER TABELA */}
        <div className="bg-gray-50 p-4 border-t-2 border-zinc-900 flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-zinc-400">
          <span>FlyHigh Management System</span>
          <span>Registros: {responsaveisFiltrados.length}</span>
        </div>
      </section>
    </div>
  );
}