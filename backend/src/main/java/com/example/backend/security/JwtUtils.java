package com.example.backend.security;

import com.example.backend.model.Usuario;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.stereotype.Component;

import java.security.Key;
import java.util.Date;
import java.util.List;
import java.util.stream.Collectors;

@Component
public class JwtUtils {

    // Chave secreta para assinar o token.
    // Em produção, isso deve ficar no arquivo application.properties.
    private static final String SECRET_KEY = "FlyHighIdiomasChaveSecretaMuitoSeguraParaGerarTokens123!";
    private static final long EXPIRATION_TIME = 86400000; // 24 horas em milissegundos

    private Key getSigningKey() {
        return Keys.hmacShaKeyFor(SECRET_KEY.getBytes());
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