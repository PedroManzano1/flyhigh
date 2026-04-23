package com.example.backend.controller;

import com.example.backend.model.Perfil;
import com.example.backend.model.Permissao;
import com.example.backend.model.Usuario;
import com.example.backend.repository.PerfilRepository;
import com.example.backend.repository.UsuarioRepository;
import com.example.backend.security.JwtUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
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
        } catch (Exception e) {
            return ResponseEntity.status(401).body("Falha na autenticação: Login ou senha incorretos.");
        }
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

        Perfil perfilDiretor = perfilRepository.findByNomePerfil("DIRETOR").orElseGet(() -> {
            Perfil novoPerfil = new Perfil();
            novoPerfil.setNomePerfil("DIRETOR");
            novoPerfil.setDescricao("Acesso total e irrestrito ao sistema");

            String[] modulos = {"USUARIOS", "ALUNOS", "RESPONSAVEIS", "CURSOS", "TURMAS", "VINCULOS", "PERFIS", "RECADOS"};
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