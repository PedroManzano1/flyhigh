// src/context/AuthContext.js
"use client";
import { createContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import { useRouter } from 'next/navigation'; // Roteador do Next.js
import api from '../utils/api';

export const AuthContext = createContext({});

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const router = useRouter();

    useEffect(() => {
        // Ao carregar a página, verifica se já tem alguém logado
        const token = localStorage.getItem('flyhigh_token');
        if (token) {
            const decoded = jwtDecode(token);
            setUser({ login: decoded.sub, permissoes: decoded.authorities });
        }
    }, []);

    async function signIn(login, senha) {
        try {
            const response = await api.post('/api/auth/login', { login, senha });
            const { token } = response.data;

            localStorage.setItem('flyhigh_token', token);
            const decoded = jwtDecode(token);
            setUser({ login: decoded.sub, permissoes: decoded.authorities });
            
            router.push('/'); // Manda para a página inicial após logar
        } catch (error) {
            throw new Error("Login ou senha incorretos.");
        }
    }

    function signOut() {
        localStorage.removeItem('flyhigh_token');
        setUser(null);
        router.push('/login');
    }

    return (
        <AuthContext.Provider value={{ user, signIn, signOut, isAuthenticated: !!user }}>
            {children}
        </AuthContext.Provider>
    );
}