package com.example.backend.controller;

import com.example.backend.model.Perfil;
import com.example.backend.model.Permissao;
import com.example.backend.model.Usuario;
import com.example.backend.repository.PerfilRepository;
import com.example.backend.repository.UsuarioRepository;
import com.example.backend.security.JwtUtils;
import com.example.backend.security.ProtecaoLogin;
import com.example.backend.service.UsuarioService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.LockedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "http://localhost:3000")
public class AuthController {

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private JwtUtils jwtUtils;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private PerfilRepository perfilRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private UsuarioService usuarioService;

    @Autowired
    private ProtecaoLogin protecaoLogin;

    @PostMapping("/login")
    public ResponseEntity<?> efetuarLogin(@RequestBody Map<String, String> dadosLogin) {
        String loginDigitado = dadosLogin.get("login");
        long minutos = protecaoLogin.minutosBloqueado(loginDigitado);
        if (minutos > 0) {
            return ResponseEntity.status(429).body(mensagemBloqueio(minutos));
        }
        try {
            String senhaDigitada = dadosLogin.get("senha");

            UsernamePasswordAuthenticationToken authToken =
                    new UsernamePasswordAuthenticationToken(loginDigitado, senhaDigitada);

            Authentication authentication = authenticationManager.authenticate(authToken);

            Usuario usuarioLogado = (Usuario) authentication.getPrincipal();
            String token = jwtUtils.generateToken(usuarioLogado);
            protecaoLogin.registrarSucesso(loginDigitado);

            Map<String, String> resposta = new HashMap<>();
            resposta.put("token", token);

            return ResponseEntity.ok(resposta);
        } catch (LockedException | DisabledException e) {
            // Conta pendente ou inativa: só explica o motivo para quem acertou a senha
            ResponseEntity<?> resposta = contaSemAcesso(loginDigitado, dadosLogin.get("senha"));
            return resposta != null ? resposta : senhaErrada(loginDigitado);
        } catch (Exception e) {
            return senhaErrada(loginDigitado);
        }
    }

    private ResponseEntity<?> senhaErrada(String login) {
        if (protecaoLogin.registrarFalha(login)) {
            return ResponseEntity.status(429).body(mensagemBloqueio(protecaoLogin.minutosBloqueado(login)));
        }
        return ResponseEntity.status(401).body("Falha na autenticação: Login ou senha incorretos.");
    }

    private static String mensagemBloqueio(long minutos) {
        return "Muitas tentativas com senha errada. Este login fica bloqueado por "
                + minutos + (minutos == 1 ? " minuto." : " minutos.");
    }

    /**
     * O Spring recusa conta bloqueada antes de conferir a senha. Só explicamos o motivo
     * (cadastro aguardando aprovação ou acesso inativo) para quem acertou a senha,
     * para não revelar a terceiros quais logins existem. Senha errada devolve nulo
     * e conta como tentativa errada.
     */
    private ResponseEntity<?> contaSemAcesso(String login, String senha) {
        return usuarioRepository.findByLogin(login)
                .filter(u -> senha != null && u.getSenha() != null && passwordEncoder.matches(senha, u.getSenha()))
                .<ResponseEntity<?>>map(u -> ResponseEntity.status(HttpStatus.FORBIDDEN).body(
                        UsuarioService.PENDENTE.equalsIgnoreCase(u.getStatus())
                                ? "Seu cadastro foi recebido e está aguardando a liberação da secretaria."
                                : "Seu acesso está inativo. Procure a secretaria da escola."))
                .orElse(null);
    }

    // Tela pública "Criar conta": o aluno se cadastra e aguarda a secretaria ligar a conta a ele
    @PostMapping("/cadastro")
    public ResponseEntity<?> cadastrarAluno(@RequestBody Map<String, String> dados) {
        usuarioService.cadastrarAluno(dados);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body("Cadastro enviado! Assim que a secretaria liberar, você já pode entrar com o seu login.");
    }

    /**
     * Dados e permissões atuais de quem está logado. O frontend chama ao abrir o
     * sistema para o menu refletir o perfil de agora, e não o que estava no token
     * quando a pessoa entrou. Conta inativada nem chega aqui (401 no JwtFilter).
     */
    @GetMapping("/eu")
    public ResponseEntity<?> quemSouEu(Authentication autenticacao) {
        return usuarioRepository.findByLogin(autenticacao.getName())
                .<ResponseEntity<?>>map(u -> {
                    Map<String, Object> dados = new HashMap<>();
                    dados.put("login", u.getLogin());
                    dados.put("nome", u.getNome());
                    dados.put("idUsuario", u.getIdUsuario());
                    dados.put("permissoes", u.getAuthorities().stream().map(a -> a.getAuthority()).toList());
                    return ResponseEntity.ok(dados);
                })
                .orElseGet(() -> ResponseEntity.status(HttpStatus.UNAUTHORIZED).build());
    }

    @GetMapping("/tem-usuarios")
    public ResponseEntity<Boolean> temUsuarios() {
        boolean possuiUsuarios = usuarioRepository.count() > 0;
        return ResponseEntity.ok(possuiUsuarios);
    }

    @PostMapping("/criar-diretor")
    public ResponseEntity<?> criarDiretorMaster(@RequestBody Map<String, String> dados) {

        if (usuarioRepository.count() > 0) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body("Acesso negado: O sistema já possui usuários cadastrados.");
        }
        if (dados.get("login") == null || dados.get("login").isBlank()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Informe o login do diretor.");
        }
        if (dados.get("senha") == null || dados.get("senha").length() < UsuarioService.SENHA_MINIMA) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("A senha precisa ter pelo menos " + UsuarioService.SENHA_MINIMA + " caracteres.");
        }

        Perfil perfilDiretor = perfilRepository.findByNomePerfilIgnoreCase("DIRETOR").stream()
                .findFirst().orElseGet(() -> {
            Perfil novoPerfil = new Perfil();
            novoPerfil.setNomePerfil("DIRETOR");
            novoPerfil.setDescricao("Acesso total e irrestrito ao sistema");

            String[] modulos = {"ALUNOS", "RESPONSAVEIS", "VINCULOS", "CURSOS", "TURMAS", "CONTRATOS",
                    "MODELOS_CONTRATO", "FINANCEIRO", "INADIMPLENCIA", "FREQUENCIAS", "AVALIACOES", "BOLETIM", "RECADOS",
                    "USUARIOS", "PERFIS"};
            List<Permissao> permissoes = new ArrayList<>();

            for (String modulo : modulos) {
                Permissao p = new Permissao();
                p.setModulo(modulo);
                p.setPodeLer(true);
                p.setPodeEscrever(true);
                p.setPodeExcluir(true);
                p.setPerfil(novoPerfil);
                permissoes.add(p);
            }

            novoPerfil.setPermissoes(permissoes);
            return perfilRepository.save(novoPerfil);
        });

        Usuario diretor = new Usuario();
        diretor.setNome("Administrador Principal");
        diretor.setLogin(dados.get("login"));
        diretor.setSenha(passwordEncoder.encode(dados.get("senha")));
        diretor.setStatus("ATIVO");
        diretor.setPerfil(perfilDiretor);

        usuarioRepository.save(diretor);

        return ResponseEntity.status(HttpStatus.CREATED).body("Diretor criado com sucesso!");
    }
}