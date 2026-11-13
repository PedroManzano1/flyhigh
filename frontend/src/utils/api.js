import axios from 'axios';

const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080', // A URL do Spring Boot
});

// Recado deixado para a tela de login quando a sessão cai
export const AVISO_LOGIN = 'flyhigh_aviso_login';

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

        // Sessão encerrada (token vencido, conta inativada ou excluída): limpa o token
        // e volta para o login com um aviso, em vez de mostrar erro em todas as telas.
        if (status === 401 && typeof window !== 'undefined') {
            const estaNoLogin = window.location.pathname.startsWith('/login');
            localStorage.removeItem('flyhigh_token');
            if (!estaNoLogin) {
                try {
                    sessionStorage.setItem(AVISO_LOGIN,
                        'Sua sessão terminou ou o seu acesso foi desativado. Entre novamente.');
                } catch { /* sem sessionStorage o login abre sem o aviso */ }
                window.location.href = '/login';
            }
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
