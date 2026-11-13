package com.example.backend.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import com.example.backend.model.Usuario;
import com.example.backend.repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * Lê o token de cada requisição e confere a conta no banco.
 *
 * O token sozinho valia por 24 h mesmo depois de a conta ser inativada, e as
 * permissões gravadas nele não mudavam quando o perfil era alterado. Agora a
 * conta precisa estar ATIVO e as permissões vêm do perfil atual: inativar ou
 * mudar o perfil vale já na próxima requisição.
 */
@Component
public class JwtFilter extends OncePerRequestFilter {

    @Autowired
    private JwtUtils jwtUtils;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        // Padrão da web: "Authorization: Bearer eyJhbGciOi..."
        String header = request.getHeader("Authorization");
        String token = header != null && header.startsWith("Bearer ") ? header.substring(7) : null;

        if (token != null && jwtUtils.isTokenValid(token)) {
            usuarioRepository.findByLogin(jwtUtils.getLoginUsuario(token))
                    .filter(Usuario::isEnabled)
                    .ifPresent(usuario -> SecurityContextHolder.getContext().setAuthentication(
                            new UsernamePasswordAuthenticationToken(usuario.getLogin(), null, usuario.getAuthorities())));
        }
        // Sem autenticação aqui, rota protegida recebe 401 (SecurityConfig)
        filterChain.doFilter(request, response);
    }
}
