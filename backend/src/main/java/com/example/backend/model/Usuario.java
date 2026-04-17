package com.example.backend.model;
import jakarta.persistence.*;
import lombok.Data;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.ArrayList;
import java.util.Collection;
import java.util.List;

@Data
@Entity
@Table(name = "USUARIO")
public class Usuario implements UserDetails {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer idUsuario;

    @Column(unique = true)
    private String login;
    private String senha;
    private String nome;
    private String status; // Ex: "ATIVO", "INATIVO"

    //Garante que o perfil carregue junto com o usuário na hora do login
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "id_perfil")
    private Perfil perfil;

    // --- MÉTODOS DO SPRING SECURITY (UserDetails) ---
    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        List<SimpleGrantedAuthority> authorities = new ArrayList<>();

        // Adicionar role principal do usuário (Ex: ROLE_DIRETOR)
        if (this.perfil != null && this.perfil.getNomePerfil() != null) {
            authorities.add(new SimpleGrantedAuthority("ROLE_" + this.perfil.getNomePerfil().toUpperCase()));

            // Gerar as permissões
            if (this.perfil.getPermissoes() != null) {
                for (Permissao p : this.perfil.getPermissoes()) {
                    String modulo = p.getModulo().toUpperCase(); // Ex: ALUNOS, MATRICULAS

                    if (p.isPodeLer()) authorities.add(new SimpleGrantedAuthority(modulo + "_READ"));
                    if (p.isPodeEscrever()) authorities.add(new SimpleGrantedAuthority(modulo + "_WRITE"));
                    if (p.isPodeExcluir()) authorities.add(new SimpleGrantedAuthority(modulo + "_DELETE"));
                }
            }
        }
        return authorities;
    }

    @Override
    public String getPassword() { return this.senha; }

    @Override
    public String getUsername() { return this.login; }

    @Override
    public boolean isAccountNonExpired() { return true; }

    @Override
    public boolean isAccountNonLocked() { return "ATIVO".equalsIgnoreCase(this.status); }

    @Override
    public boolean isCredentialsNonExpired() { return true; }

    @Override
    public boolean isEnabled() { return "ATIVO".equalsIgnoreCase(this.status); }
}