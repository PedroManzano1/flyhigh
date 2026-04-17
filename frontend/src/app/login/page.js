"use client";
import { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../../context/authContext';
import api from '../../utils/api';

export default function Login() {
    const { signIn } = useContext(AuthContext);
    const [login, setLogin] = useState('');
    const [senha, setSenha] = useState('');
    const [isPrimeiroAcesso, setIsPrimeiroAcesso] = useState(false);

    useEffect(() => {
        // Verifica com o Spring se o banco está vazio
        api.get('/api/auth/tem-usuarios').then(res => {
            setIsPrimeiroAcesso(!res.data); // Se data for false, é o primeiro acesso
        }).catch(() => console.log("Erro ao verificar primeiro acesso"));
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isPrimeiroAcesso) {
            // Chama a rota de criar o diretor master
            await api.post('/api/auth/criar-diretor', { login, senha });
            alert("Diretor criado! Agora faça o login.");
            setIsPrimeiroAcesso(false);
            setSenha('');
        } else {
            await signIn(login, senha);
        }
    };

    return (
        <div className="flex h-screen items-center justify-center bg-gray-100">
            <form onSubmit={handleSubmit} className="p-8 bg-white rounded shadow-md w-96">
                <h1 className="text-2xl mb-6 font-bold text-center">
                    {isPrimeiroAcesso ? "Criar Primeiro Acesso (Diretor)" : "Login Fly High"}
                </h1>
                
                <input 
                    className="w-full mb-4 p-2 border rounded"
                    placeholder="Login" 
                    value={login} 
                    onChange={e => setLogin(e.target.value)} 
                />
                <input 
                    className="w-full mb-6 p-2 border rounded"
                    type="password" 
                    placeholder="Senha" 
                    value={senha} 
                    onChange={e => setSenha(e.target.value)} 
                />
                
                <button className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700">
                    {isPrimeiroAcesso ? "Criar e Finalizar" : "Entrar no Sistema"}
                </button>
            </form>
        </div>
    );
}