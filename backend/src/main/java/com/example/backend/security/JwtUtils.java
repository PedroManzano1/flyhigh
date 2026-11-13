package com.example.backend.security;

import com.example.backend.model.Usuario;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.util.Date;
import java.util.List;
import java.util.stream.Collectors;

@Component
public class JwtUtils {

    private static final long EXPIRATION_TIME = 86400000; // 24 horas em milissegundos

    // A chave vem de JWT_SECRET (variável de ambiente ou application-local.properties),
    // nunca do código: quem tem a chave consegue montar um token de diretor.
    private final Key chave;

    public JwtUtils(@Value("${flyhigh.jwt.secret}") String segredo) {
        if (segredo == null || segredo.getBytes(StandardCharsets.UTF_8).length < 32) {
            throw new IllegalStateException(
                    "JWT_SECRET precisa ter pelo menos 32 caracteres. Veja application-local.example.properties.");
        }
        this.chave = Keys.hmacShaKeyFor(segredo.getBytes(StandardCharsets.UTF_8));
    }

    private Key getSigningKey() {
        return chave;
    }

    // 1. Gera o token (Chamado na hora do Login)
    public String generateToken(Usuario usuario) {
        // Pega as permissões geradas pela sua classe Usuario
        List<String> authorities = usuario.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .collect(Collectors.toList());

        return Jwts.builder()
                .setSubject(usuario.getLogin()) // O "dono" do token
                .claim("authorities", authorities) // Guardando as permissões DENTRO do token
                .claim("idUsuario", usuario.getIdUsuario()) // Permite ao frontend saber QUEM está logado
                .claim("nome", usuario.getNome())
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + EXPIRATION_TIME))
                .signWith(getSigningKey(), SignatureAlgorithm.HS256)
                .compact();
    }

    // Método auxiliar para abrir o token
    private Claims getClaims(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(getSigningKey())
                .build()
                .parseClaimsJws(token)
                .getBody();
    }

    // 2. Extrai o login de dentro do token
    public String getLoginUsuario(String token) {
        return getClaims(token).getSubject();
    }

    // 3. Extrai as permissões (aquela lista "ROLE_DIRETOR", "ALUNOS_READ") do token
    public List<SimpleGrantedAuthority> getAuthorities(String token) {
        List<String> authorities = getClaims(token).get("authorities", List.class);
        return authorities.stream()
                .map(SimpleGrantedAuthority::new)
                .collect(Collectors.toList());
    }

    // 4. Verifica se o token é autêntico e se não passou das 24 horas
    public boolean isTokenValid(String token) {
        try {
            getClaims(token);
            return true;
        } catch (Exception e) {
            return false;
        }
    }
}