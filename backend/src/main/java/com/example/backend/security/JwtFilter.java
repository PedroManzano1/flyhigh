package com.example.backend.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

@Component
public class JwtFilter extends OncePerRequestFilter {

    @Autowired
    private JwtUtils jwtUtils;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        // 1. Procura o cabeçalho "Authorization" na requisição que veio do React
        String header = request.getHeader("Authorization");
        String token = null;

        // O padrão da web é enviar o token assim: "Bearer eyJhbGciOi..."
        if (header != null && header.startsWith("Bearer ")) {
            token = header.substring(7); // Pula a palavra "Bearer " (7 letras) para pegar só o código
        }

        // 2. Se achou um token e ele não for falso/expirado, logamos o usuário internamente no Spring
        if (token != null && jwtUtils.isTokenValid(token)) {
            String login = jwtUtils.getLoginUsuario(token);

            // Olha a mágica: pegamos as permissões direto do token, sem fazer um "SELECT" no banco de dados!
            List<SimpleGrantedAuthority> authorities = jwtUtils.getAuthorities(token);

            // Cria o "crachá de acesso" temporário para esta requisição
            UsernamePasswordAuthenticationToken authentication =
                    new UsernamePasswordAuthenticationToken(login, null, authorities);

            // Coloca o crachá no pescoço do sistema
            SecurityContextHolder.getContext().setAuthentication(authentication);
        }

        // 3. Manda a requisição seguir o seu caminho
        filterChain.doFilter(request, response);
    }
}