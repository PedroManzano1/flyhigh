package com.example.backend.service;

import com.example.backend.model.Perfil;
import com.example.backend.model.Permissao;
import com.example.backend.model.Usuario;
import com.example.backend.repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Regras que impedem alguém de ganhar mais acesso do que já tem.
 *
 * Quem não é diretor:
 * - não dá nem tira o perfil DIRETOR, nem mexe em conta de diretor;
 * - não altera o próprio perfil;
 * - só concede permissões que ele mesmo tem.
 *
 * Sem isso, quem tinha "Equipe: Escrever" se colocava no perfil DIRETOR, e quem
 * tinha "Perfis: Escrever" marcava todas as permissões no próprio perfil.
 */
@Service
public class ControleAcessoService {

    public static final String PERFIL_DIRETOR = "DIRETOR";
    private static final String ROLE_DIRETOR = "ROLE_DIRETOR";

    @Autowired
    private UsuarioRepository usuarioRepo;

    public static boolean ehPerfilDiretor(Perfil perfil) {
        return perfil != null && PERFIL_DIRETOR.equalsIgnoreCase(perfil.getNomePerfil());
    }

    public boolean logadoEhDiretor() {
        return autoridadesDoLogado().contains(ROLE_DIRETOR);
    }

    /** Conta de diretor só é alterada, inativada ou excluída por outro diretor. */
    public void exigirDiretorParaContaDeDiretor(Usuario alvo) {
        if (ehPerfilDiretor(alvo.getPerfil()) && !logadoEhDiretor()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Só um diretor pode alterar a conta de outro diretor.");
        }
    }

    /** Para quem atribui um perfil a uma conta (cadastro ou troca de perfil). */
    public void exigirPodeAtribuir(Perfil perfil) {
        if (perfil == null || logadoEhDiretor()) return;
        if (ehPerfilDiretor(perfil)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Só um diretor pode dar o perfil DIRETOR.");
        }
        List<String> faltando = semPermissao(autoridadesDe(perfil.getPermissoes()));
        if (!faltando.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "O perfil " + perfil.getNomePerfil() + " tem permissões que você não tem ("
                            + String.join(", ", faltando) + "). Peça a um diretor para fazer esta alteração.");
        }
    }

    /**
     * Para quem cria ou edita um perfil. Só as permissões acrescentadas contam:
     * quem edita a descrição de um perfil não precisa ter tudo o que ele já tinha.
     */
    public void exigirPodeEditarPerfil(Perfil existente, Collection<Permissao> novasPermissoes) {
        if (logadoEhDiretor()) return;
        if (existente != null) {
            if (ehPerfilDiretor(existente)) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Só um diretor pode alterar o perfil DIRETOR.");
            }
            Usuario logado = usuarioLogado();
            if (logado != null && logado.getPerfil() != null
                    && existente.getIdPerfil().equals(logado.getPerfil().getIdPerfil())) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                        "Você não pode alterar as permissões do seu próprio perfil. Peça a um diretor.");
            }
        }
        Set<String> novas = autoridadesDe(novasPermissoes);
        if (existente != null) {
            novas.removeAll(autoridadesDe(existente.getPermissoes()));
        }
        List<String> faltando = semPermissao(novas);
        if (!faltando.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Você só pode conceder permissões que você tem. Faltam: " + String.join(", ", faltando) + ".");
        }
    }

    public Usuario usuarioLogado() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getName() == null) return null;
        return usuarioRepo.findByLogin(auth.getName()).orElse(null);
    }

    // --- apoio ----------------------------------------------------------------

    private Set<String> autoridadesDoLogado() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null) return Set.of();
        return auth.getAuthorities().stream().map(GrantedAuthority::getAuthority).collect(Collectors.toSet());
    }

    /** "ALUNOS_READ", "ALUNOS_WRITE"... no mesmo formato de Usuario.getAuthorities(). */
    static Set<String> autoridadesDe(Collection<Permissao> permissoes) {
        Set<String> nomes = new java.util.LinkedHashSet<>();
        if (permissoes == null) return nomes;
        for (Permissao p : permissoes) {
            if (p == null || p.getModulo() == null) continue;
            String modulo = p.getModulo().trim().toUpperCase();
            if (p.isPodeLer()) nomes.add(modulo + "_READ");
            if (p.isPodeEscrever()) nomes.add(modulo + "_WRITE");
            if (p.isPodeExcluir()) nomes.add(modulo + "_DELETE");
        }
        return nomes;
    }

    private List<String> semPermissao(Set<String> exigidas) {
        Set<String> minhas = autoridadesDoLogado();
        List<String> faltando = new ArrayList<>();
        for (String a : exigidas) {
            if (!minhas.contains(a)) faltando.add(descrever(a));
        }
        return faltando;
    }

    // "FINANCEIRO_DELETE" -> "Financeiro: Excluir"
    private static String descrever(String autoridade) {
        int i = autoridade.lastIndexOf('_');
        String modulo = autoridade.substring(0, i).replace('_', ' ').toLowerCase();
        String acao = switch (autoridade.substring(i + 1)) {
            case "READ" -> "Ler";
            case "WRITE" -> "Escrever";
            default -> "Excluir";
        };
        return Character.toUpperCase(modulo.charAt(0)) + modulo.substring(1) + ": " + acao;
    }
}
