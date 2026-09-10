"use client";

/**
 * Campos de formulário e linhas de estado usados por todas as telas.
 * Antes cada página redefinia os seus, com estilos ligeiramente diferentes.
 */

const CLASSE_CAMPO =
  "w-full p-4 border border-zinc-300 rounded-xl text-lg font-bold text-zinc-900 " +
  "focus:ring-4 focus:ring-yellow-400/30 focus:border-yellow-400 bg-white transition-all " +
  "outline-none shadow-sm disabled:bg-zinc-100 disabled:text-zinc-400 disabled:cursor-not-allowed";

const CLASSE_LABEL = "block text-sm font-black text-zinc-700 uppercase tracking-widest mb-2";

export const InputField = ({
  label, name, placeholder, type = "text", onChange, value,
  className = "", required = false, disabled = false, step, min, max, ...resto
}) => (
  <div className={className}>
    {label && <label className={CLASSE_LABEL}>{label}</label>}
    <input
      type={type}
      name={name}
      value={value ?? ''}
      onChange={onChange}
      placeholder={placeholder}
      required={required}
      disabled={disabled}
      step={step}
      min={min}
      max={max}
      className={CLASSE_CAMPO}
      {...resto}
    />
  </div>
);

export const SelectField = ({
  label, name, children, onChange, value,
  className = "", required = false, disabled = false, ...resto
}) => (
  <div className={className}>
    {label && <label className={CLASSE_LABEL}>{label}</label>}
    <select
      name={name}
      value={value ?? ''}
      onChange={onChange}
      required={required}
      disabled={disabled}
      className={`${CLASSE_CAMPO} appearance-none cursor-pointer`}
      {...resto}
    >
      {children}
    </select>
  </div>
);

export const TextareaField = ({
  label, name, placeholder, onChange, value,
  className = "", altura = "h-32", required = false, disabled = false, ...resto
}) => (
  <div className={className}>
    {label && <label className={CLASSE_LABEL}>{label}</label>}
    <textarea
      name={name}
      value={value ?? ''}
      onChange={onChange}
      placeholder={placeholder}
      required={required}
      disabled={disabled}
      className={`${CLASSE_CAMPO} ${altura} resize-none`}
      {...resto}
    />
  </div>
);

export const CampoBusca = ({ value, onChange, placeholder = "Pesquisar...", className = "w-full max-w-md" }) => (
  <div className={className}>
    <input
      type="text"
      value={value ?? ''}
      onChange={onChange}
      placeholder={placeholder}
      className="w-full px-6 py-4 rounded-2xl border border-zinc-300 text-sm font-bold text-zinc-900 focus:outline-none focus:ring-4 focus:ring-yellow-400/20"
    />
  </div>
);

// --- Linhas de estado das tabelas -------------------------------------------

export const LinhaCarregando = ({ colunas, texto = "Carregando..." }) => (
  <tr>
    <td colSpan={colunas} className="p-10 text-center uppercase italic font-black text-zinc-500 animate-pulse">
      {texto}
    </td>
  </tr>
);

export const LinhaVazia = ({ colunas, texto = "Nenhum registro encontrado.", children }) => (
  <tr>
    <td colSpan={colunas} className="p-10 text-center">
      <div className="flex flex-col items-center gap-4">
        <span className="text-zinc-500 uppercase font-black italic">{texto}</span>
        {children}
      </div>
    </td>
  </tr>
);

export const LinhaErro = ({ colunas, texto = "Erro ao carregar os dados." }) => (
  <tr>
    <td colSpan={colunas} className="p-10 text-center uppercase font-black italic text-red-600">
      {texto}
    </td>
  </tr>
);

// --- Cabeçalho padrão das telas ---------------------------------------------

export const TituloPagina = ({ titulo, descricao, children }) => (
  <header className="mb-12 flex items-end justify-between flex-wrap gap-4">
    <div>
      <h1 className="text-5xl font-black uppercase tracking-tighter italic text-zinc-900">{titulo}</h1>
      <div className="h-2 w-24 bg-yellow-400 rounded-full mt-2"></div>
      {descricao && <p className="text-zinc-500 font-bold mt-3">{descricao}</p>}
    </div>
    {children && <div className="flex flex-wrap gap-4">{children}</div>}
  </header>
);
