import axios from 'axios';

const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080', // A URL do Spring Boot
});

api.interceptors.request.use(async config => {
    // Pega o token do armazenamento do navegador
    // (o typeof window evita quebrar caso o módulo seja carregado no servidor)
    const token = typeof window !== 'undefined' ? localStorage.getItem('flyhigh_token') : null;

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

api.interceptors.response.use(
    response => response,
    error => {
        const status = error?.response?.status;

        // Token expirado ou inválido: limpa a sessão e volta para o login,
        // em vez de deixar a tela em branco com erro 401 em todas as chamadas.
        if (status === 401 && typeof window !== 'undefined') {
            const estaNoLogin = window.location.pathname.startsWith('/login');
            localStorage.removeItem('flyhigh_token');
            if (!estaNoLogin) window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

// Extrai a mensagem de erro que o Spring devolve, para mostrar algo útil no alert()
export function mensagemErro(error, padrao = 'Não foi possível concluir a operação.') {
    const data = error?.response?.data;
    if (typeof data === 'string' && data.trim()) return data;
    if (data?.message) return data.message;
    if (data?.error) return data.error;
    if (error?.response?.status === 403) return 'Você não tem permissão para executar esta ação.';
    return padrao;
}

export default api;
