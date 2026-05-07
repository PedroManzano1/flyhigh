"use client";
import { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../../context/authContext';
import api from '../../utils/api';

export default function Login() {
    const { signIn } = useContext(AuthContext);
    const [login, setLogin] = useState('');
    const [senha, setSenha] = useState('');
    const [isPrimeiroAcesso, setIsPrimeiroAcesso] = useState(false);
    const [carregando, setCarregando] = useState(true);

    useEffect(() => {
        // Verifica com o Spring se o banco está vazio
        api.get('/api/auth/tem-usuarios')
            .then(res => {
                setIsPrimeiroAcesso(!res.data);
            })
            .catch(() => console.log("Erro ao verificar primeiro acesso"))
            .finally(() => setCarregando(false));
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (isPrimeiroAcesso) {
                await api.post('/api/auth/criar-diretor', { login, senha });
                alert("Diretor criado com sucesso! Agora faça o login para entrar.");
                setIsPrimeiroAcesso(false);
                setSenha('');
            } else {
                await signIn(login, senha);
            }
        } catch (error) {
            alert("Ocorreu um erro. Verifique suas credenciais.");
        }
    };

    if (carregando) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center font-black uppercase text-zinc-400 animate-pulse">
                Iniciando FlyHigh...
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center font-sans text-zinc-900 p-6">
            <div className="w-full max-w-md">
                {/* Logo / Header */}
                <div className="text-center mb-8">
                    <h2 className="text-3xl font-black text-zinc-900 tracking-tighter inline-block">
                        <span className="bg-yellow-400 text-zinc-900 px-3 py-1 rounded mr-1">FLYHIGH</span>IDIOMAS
                    </h2>
                    <p className="text-zinc-500 font-bold uppercase text-xs mt-3 tracking-widest">
                        Painel Administrativo v1.0
                    </p>
                </div>

                {/* Card do Formulário */}
                <div className="bg-white border-4 border-zinc-900 rounded-2xl shadow-[8px_8px_0px_0px_rgba(24,24,27,1)] p-8">
                    <header className="mb-8 border-l-8 border-yellow-400 pl-4">
                        <h1 className="text-2xl font-black text-zinc-900 uppercase leading-none">
                            {isPrimeiroAcesso ? "Primeiro Acesso" : "Welcome Back"}
                        </h1>
                        <p className="text-zinc-500 text-sm font-medium mt-1">
                            {isPrimeiroAcesso ? "Configure a conta do Diretor Master." : "Identifique-se para acessar o sistema."}
                        </p>
                    </header>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-xs font-black uppercase mb-1 ml-1 text-zinc-600">Login</label>
                            <input 
                                className="w-full p-3 bg-zinc-50 border-2 border-zinc-900 rounded-xl font-bold focus:ring-2 focus:ring-yellow-400 outline-none transition-all"
                                placeholder="Seu usuário" 
                                value={login} 
                                onChange={e => setLogin(e.target.value)} 
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-black uppercase mb-1 ml-1 text-zinc-600">Senha</label>
                            <input 
                                className="w-full p-3 bg-zinc-50 border-2 border-zinc-900 rounded-xl font-bold focus:ring-2 focus:ring-yellow-400 outline-none transition-all"
                                type="password" 
                                placeholder="••••••••" 
                                value={senha} 
                                onChange={e => setSenha(e.target.value)} 
                                required
                            />
                        </div>

                        <button 
                            type="submit"
                            className="w-full bg-zinc-900 text-white font-black uppercase tracking-widest p-4 rounded-xl hover:bg-yellow-400 hover:text-zinc-900 transition-colors flex items-center justify-center gap-2 group"
                        >
                            {isPrimeiroAcesso ? "Criar Conta Master" : "Entrar no Sistema"}
                            <span className="group-hover:translate-x-1 transition-transform">→</span>
                        </button>
                    </form>
                </div>

                {/* Footer do Login */}
                <p className="text-center mt-10 text-zinc-400 text-xs font-bold uppercase tracking-tighter">
                    &copy; 2026 FlyHigh Idiomas | Sistema de Gestão Interna
                </p>
            </div>
        </div>
    );
}