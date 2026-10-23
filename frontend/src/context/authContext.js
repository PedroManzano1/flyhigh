// src/context/AuthContext.js
"use client";
import { createContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import { useRouter } from 'next/navigation'; // Roteador do Next.js
import api, { mensagemErro } from '../utils/api';

export const AuthContext = createContext({});

// Monta o objeto do usuário a partir do token, sem quebrar a aplicação
// caso o token esteja corrompido/expirado no localStorage.
function lerToken(token) {
    try {
        const decoded = jwtDecode(token);
        if (decoded.exp && decoded.exp * 1000 < Date.now()) return null;
        return {
            login: decoded.sub,
            nome: decoded.nome || decoded.sub,
            idUsuario: decoded.idUsuario ?? null,
            permissoes: decoded.authorities || []
        };
    } catch {
        return null;
    }
}

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [carregandoUsuario, setCarregandoUsuario] = useState(true);
    const router = useRouter();

    useEffect(() => {
        // Ao carregar a página, verifica se já tem alguém logado
        const token = localStorage.getItem('flyhigh_token');
        if (token) {
            const dados = lerToken(token);
            if (dados) {
                setUser(dados);
            } else {
                localStorage.removeItem('flyhigh_token');
            }
        }
        setCarregandoUsuario(false);
    }, []);

    async function signIn(login, senha) {
        try {
            const response = await api.post('/api/auth/login', { login, senha });
            const { token } = response.data;

            localStorage.setItem('flyhigh_token', token);
            const dados = lerToken(token);
            setUser(dados);

            // Conta de aluno vai direto para a área dele
            router.push(dados?.permissoes?.includes('ROLE_ALUNO') ? '/minha-area' : '/');
        } catch (error) {
            // Mostra o motivo que o backend deu (cadastro aguardando aprovação, acesso inativo...)
            throw new Error(mensagemErro(error, "Login ou senha incorretos."));
        }
    }

    function signOut() {
        localStorage.removeItem('flyhigh_token');
        setUser(null);
        router.push('/login');
    }

    // Regra de acesso usada por todas as telas: o DIRETOR enxerga tudo,
    // os demais perfis dependem da permissão específica do módulo.
    function temPermissao(permissaoNecessaria) {
        if (!user || !user.permissoes) return false;
        return user.permissoes.includes('ROLE_DIRETOR') || user.permissoes.includes(permissaoNecessaria);
    }

    const ehAluno = !!user?.permissoes?.includes('ROLE_ALUNO');

    return (
        <AuthContext.Provider value={{ user, signIn, signOut, temPermissao, ehAluno, carregandoUsuario, isAuthenticated: !!user }}>
            {children}
        </AuthContext.Provider>
    );
}
