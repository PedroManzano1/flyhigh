import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:8080', // A URL do Spring Boot
});

api.interceptors.request.use(async config => {
    // Pega o token do armazenamento do navegador
    const token = localStorage.getItem('flyhigh_token');
    
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default api;