package com.example.backend.model;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import lombok.Data;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import java.time.LocalDateTime;
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

    // A senha (hash) nunca deve trafegar do backend para o frontend.
    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    private String senha;
    private String nome;
    // ATIVO, INATIVO ou PENDENTE (cadastro feito pelo próprio aluno, aguardando a secretaria)
    private String status;

    //Garante que o perfil carregue junto com o usuário na hora do login
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "id_perfil")
    private Perfil perfil;

    // Conta de aluno: o aluno que ela representa. Fica nulo nas contas da equipe.
    @ManyToOne
    @JoinColumn(name = "id_aluno")
    private Aluno aluno;

    // Matrícula que o aluno digitou ao se cadastrar, para a secretaria achar quem é
    @Column(name = "matricula_informada")
    private String matriculaInformada;

    @Column(name = "data_cadastro")
    private LocalDateTime dataCadastro;

    // --- MÉTODOS DO SPRING SECURITY (UserDetails) ---
    @JsonIgnore
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

    @JsonIgnore
    @Override
    public String getPassword() { return this.senha; }

    @JsonIgnore
    @Override
    public String getUsername() { return this.login; }

    @JsonIgnore
    @Override
    public boolean isAccountNonExpired() { return true; }

    @JsonIgnore
    @Override
    public boolean isAccountNonLocked() { return "ATIVO".equalsIgnoreCase(this.status); }

    @JsonIgnore
    @Override
    public boolean isCredentialsNonExpired() { return true; }

    @JsonIgnore
    @Override
    public boolean isEnabled() { return "ATIVO".equalsIgnoreCase(this.status); }
}