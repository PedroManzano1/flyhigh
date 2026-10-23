package com.example.backend.controller;

import com.example.backend.model.Perfil;
import com.example.backend.model.Permissao;
import com.example.backend.model.Usuario;
import com.example.backend.repository.PerfilRepository;
import com.example.backend.repository.UsuarioRepository;
import com.example.backend.security.JwtUtils;
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

    @PostMapping("/login")
    public ResponseEntity<?> efetuarLogin(@RequestBody Map<String, String> dadosLogin) {
        try {
            String loginDigitado = dadosLogin.get("login");
            String senhaDigitada = dadosLogin.get("senha");

            UsernamePasswordAuthenticationToken authToken =
                    new UsernamePasswordAuthenticationToken(loginDigitado, senhaDigitada);

            Authentication authentication = authenticationManager.authenticate(authToken);

            Usuario usuarioLogado = (Usuario) authentication.getPrincipal();
            String token = jwtUtils.generateToken(usuarioLogado);

            Map<String, String> resposta = new HashMap<>();
            resposta.put("token", token);

            return ResponseEntity.ok(resposta);
        } catch (LockedException | DisabledException e) {
            return contaSemAcesso(dadosLogin.get("login"), dadosLogin.get("senha"));
        } catch (Exception e) {
            return ResponseEntity.status(401).body("Falha na autenticação: Login ou senha incorretos.");
        }
    }

    /**
     * O Spring recusa conta bloqueada antes de conferir a senha. Só explicamos o motivo
     * (cadastro aguardando aprovação ou acesso inativo) para quem acertou a senha,
     * para não revelar a terceiros quais logins existem.
     */
    private ResponseEntity<?> contaSemAcesso(String login, String senha) {
        return usuarioRepository.findByLogin(login)
                .filter(u -> senha != null && u.getSenha() != null && passwordEncoder.matches(senha, u.getSenha()))
                .<ResponseEntity<?>>map(u -> ResponseEntity.status(HttpStatus.FORBIDDEN).body(
                        UsuarioService.PENDENTE.equalsIgnoreCase(u.getStatus())
                                ? "Seu cadastro foi recebido e está aguardando a liberação da secretaria."
                                : "Seu acesso está inativo. Procure a secretaria da escola."))
                .orElseGet(() -> ResponseEntity.status(401).body("Falha na autenticação: Login ou senha incorretos."));
    }

    // Tela pública "Criar conta": o aluno se cadastra e aguarda a secretaria ligar a conta a ele
    @PostMapping("/cadastro")
    public ResponseEntity<?> cadastrarAluno(@RequestBody Map<String, String> dados) {
        usuarioService.cadastrarAluno(dados);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body("Cadastro enviado! Assim que a secretaria liberar, você já pode entrar com o seu login.");
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

        Perfil perfilDiretor = perfilRepository.findByNomePerfilIgnoreCase("DIRETOR").stream()
                .findFirst().orElseGet(() -> {
            Perfil novoPerfil = new Perfil();
            novoPerfil.setNomePerfil("DIRETOR");
            novoPerfil.setDescricao("Acesso total e irrestrito ao sistema");

            String[] modulos = {"ALUNOS", "RESPONSAVEIS", "VINCULOS", "CURSOS", "TURMAS", "CONTRATOS",
                    "FINANCEIRO", "INADIMPLENCIA", "FREQUENCIAS", "AVALIACOES", "BOLETIM", "RECADOS",
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