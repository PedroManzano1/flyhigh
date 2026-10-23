package com.example.backend.service;

import com.example.backend.model.Aluno;
import com.example.backend.model.Perfil;
import com.example.backend.model.Usuario;
import com.example.backend.repository.AlunoRepository;
import com.example.backend.repository.PerfilRepository;
import com.example.backend.repository.RecadoGeralRepository;
import com.example.backend.repository.TurmaRepository;
import com.example.backend.repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Contas de acesso: equipe (criada pela direção) e alunos.
 *
 * O aluno se cadastra sozinho pela tela pública e a conta nasce PENDENTE, sem perfil
 * e sem poder entrar. A secretaria liga a conta a um aluno do cadastro e ela vira
 * ATIVO com o perfil ALUNO, que só enxerga a área do aluno.
 */
@Service
public class UsuarioService {

    public static final String ATIVO = "ATIVO";
    public static final String INATIVO = "INATIVO";
    public static final String PENDENTE = "PENDENTE";

    public static final String PERFIL_ALUNO = "ALUNO";

    private static final int SENHA_MINIMA = 6;

    @Autowired
    private UsuarioRepository repository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private TurmaRepository turmaRepo;

    @Autowired
    private RecadoGeralRepository recadoRepo;

    @Autowired
    private PerfilRepository perfilRepo;

    @Autowired
    private AlunoRepository alunoRepo;

    public List<Usuario> listarTodos() {
        return repository.findAll();
    }

    public Optional<Usuario> buscarPorId(Integer id) {
        return repository.findById(id);
    }

    // --- Cadastro feito pela direção -----------------------------------------

    public Usuario salvar(Usuario usuario) {
        if (usuario.getLogin() == null || usuario.getLogin().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Informe o login do usuário.");
        }
        if (usuario.getSenha() == null || usuario.getSenha().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Informe a senha do usuário.");
        }
        usuario.setLogin(usuario.getLogin().trim());
        validarLoginLivre(usuario.getLogin(), null);

        Perfil perfil = resolverPerfil(usuario.getPerfil());
        usuario.setPerfil(perfil);
        usuario.setAluno(resolverAlunoDaConta(perfil, usuario.getAluno(), null));

        usuario.setSenha(passwordEncoder.encode(usuario.getSenha()));
        usuario.setStatus(normalizarStatus(usuario.getStatus()));
        if (usuario.getDataCadastro() == null) usuario.setDataCadastro(LocalDateTime.now());
        return repository.save(usuario);
    }

    public Usuario atualizar(Integer id, Usuario dadosNovos) {
        return repository.findById(id).map(usuario -> {
            String login = dadosNovos.getLogin() != null ? dadosNovos.getLogin().trim() : usuario.getLogin();
            validarLoginLivre(login, usuario.getIdUsuario());

            usuario.setNome(dadosNovos.getNome());
            usuario.setLogin(login);

            Perfil perfil = resolverPerfil(dadosNovos.getPerfil());
            usuario.setPerfil(perfil);
            usuario.setAluno(resolverAlunoDaConta(perfil, dadosNovos.getAluno(), usuario.getIdUsuario()));

            // Status só muda quando vem preenchido e diferente, para não inativar sem querer
            if (dadosNovos.getStatus() != null && !dadosNovos.getStatus().isBlank()
                    && !dadosNovos.getStatus().trim().equalsIgnoreCase(usuario.getStatus())) {
                String novoStatus = normalizarStatus(dadosNovos.getStatus());
                if (INATIVO.equals(novoStatus)) {
                    validarInativacao(usuario);
                }
                usuario.setStatus(novoStatus);
            }

            // Conta liberada precisa de perfil; aluno sem vínculo continua pendente
            if (ATIVO.equalsIgnoreCase(usuario.getStatus()) && usuario.getPerfil() == null) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Escolha o perfil desta conta antes de liberar o acesso.");
            }

            // Regra: só muda a senha se vier algo no campo
            if (dadosNovos.getSenha() != null && !dadosNovos.getSenha().isEmpty()) {
                usuario.setSenha(passwordEncoder.encode(dadosNovos.getSenha()));
            }

            return repository.save(usuario);
        }).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuário não encontrado."));
    }

    /** Usado pelo botão de ativar/inativar da listagem. */
    public Usuario alterarStatus(Integer id, String status) {
        Usuario usuario = repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuário não encontrado."));

        String novoStatus = normalizarStatus(status);
        if (INATIVO.equals(novoStatus)) {
            validarInativacao(usuario);
        }
        if (ATIVO.equals(novoStatus) && usuario.getPerfil() == null) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Este cadastro ainda não foi ligado a um aluno. Use \"Vincular e liberar\" para aprovar.");
        }

        usuario.setStatus(novoStatus);
        return repository.save(usuario);
    }

    // --- Cadastro feito pelo próprio aluno -----------------------------------

    /** Tela pública "Criar conta". A conta só entra no sistema depois de vinculada. */
    public Usuario cadastrarAluno(Map<String, String> dados) {
        if (repository.count() == 0) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "O sistema ainda não foi configurado pela escola.");
        }

        String nome = limpar(dados.get("nome"));
        String login = limpar(dados.get("login"));
        String senha = dados.get("senha");
        String matricula = limpar(dados.get("matricula"));

        if (nome == null || nome.length() < 3) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Informe o seu nome completo.");
        }
        if (login == null || login.length() < 3 || login.contains(" ")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Escolha um login com pelo menos 3 caracteres e sem espaços.");
        }
        if (senha == null || senha.length() < SENHA_MINIMA) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "A senha precisa ter pelo menos " + SENHA_MINIMA + " caracteres.");
        }
        validarLoginLivre(login, null);

        Usuario usuario = new Usuario();
        usuario.setNome(nome);
        usuario.setLogin(login);
        usuario.setSenha(passwordEncoder.encode(senha));
        usuario.setStatus(PENDENTE);
        usuario.setMatriculaInformada(matricula);
        usuario.setDataCadastro(LocalDateTime.now());
        return repository.save(usuario);
    }

    /** Aprova um cadastro (ou troca o aluno de uma conta de aluno): liga ao aluno e libera. */
    @Transactional
    public Usuario vincularAluno(Integer idUsuario, Long idAluno) {
        Usuario usuario = repository.findById(idUsuario)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuário não encontrado."));

        boolean contaDeEquipe = usuario.getPerfil() != null
                && !PERFIL_ALUNO.equalsIgnoreCase(usuario.getPerfil().getNomePerfil());
        if (contaDeEquipe) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Esta é uma conta da equipe (" + usuario.getPerfil().getNomePerfil()
                            + ") e não pode ser ligada a um aluno.");
        }

        Perfil perfilAluno = obterPerfilAluno();
        Aluno informado = new Aluno();
        informado.setId_aluno(idAluno);

        usuario.setPerfil(perfilAluno);
        usuario.setAluno(resolverAlunoDaConta(perfilAluno, informado, usuario.getIdUsuario()));
        usuario.setStatus(ATIVO);
        return repository.save(usuario);
    }

    /** Desfaz o vínculo: a conta volta a aguardar e deixa de entrar no sistema. */
    public Usuario desvincularAluno(Integer idUsuario) {
        Usuario usuario = repository.findById(idUsuario)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuário não encontrado."));
        if (usuario.getAluno() == null) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Esta conta não está ligada a nenhum aluno.");
        }
        usuario.setAluno(null);
        usuario.setPerfil(null);
        usuario.setStatus(PENDENTE);
        return repository.save(usuario);
    }

    // --- Exclusão ------------------------------------------------------------

    /**
     * Exclusão protegida: usuário vinculado a turma ou autor de recado permanece no banco,
     * senão o histórico perde a referência. Nesse caso o caminho é inativar.
     * Recusar um cadastro pendente também passa por aqui.
     */
    public void deletar(Integer id) {
        Usuario usuario = repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuário não encontrado."));

        if (ehUsuarioLogado(usuario)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Você não pode excluir o seu próprio usuário.");
        }
        validarUltimoDiretor(usuario);

        long turmas = turmaRepo.contarPorProfessor(id);
        long recados = recadoRepo.contarPorAutor(id);

        if (turmas > 0 || recados > 0) {
            StringBuilder itens = new StringBuilder();
            if (turmas > 0) itens.append(turmas).append(" turma(s) como professor");
            if (recados > 0) {
                if (itens.length() > 0) itens.append(" e ");
                itens.append(recados).append(" recado(s) publicado(s)");
            }
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Este usuário não pode ser excluído porque possui " + itens
                            + ". Inative o acesso em vez de excluir.");
        }

        repository.delete(usuario);
    }

    // --- Regras --------------------------------------------------------------

    /**
     * Conta com perfil ALUNO precisa apontar para um aluno, e cada aluno tem uma conta só.
     * Para qualquer outro perfil o vínculo é descartado.
     */
    private Aluno resolverAlunoDaConta(Perfil perfil, Aluno informado, Integer idUsuarioIgnorado) {
        boolean contaDeAluno = perfil != null && PERFIL_ALUNO.equalsIgnoreCase(perfil.getNomePerfil());
        if (!contaDeAluno) return null;

        if (informado == null || informado.getId_aluno() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Escolha o aluno desta conta.");
        }
        Aluno aluno = alunoRepo.findById(informado.getId_aluno())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Aluno não encontrado."));

        repository.findByAlunoId(aluno.getId_aluno()).stream()
                .filter(outra -> !outra.getIdUsuario().equals(idUsuarioIgnorado))
                .findFirst()
                .ifPresent(outra -> {
                    throw new ResponseStatusException(HttpStatus.CONFLICT,
                            "O aluno " + aluno.getNome() + " já tem a conta \"" + outra.getLogin() + "\".");
                });
        return aluno;
    }

    private Perfil resolverPerfil(Perfil informado) {
        if (informado == null || informado.getIdPerfil() == null) return null;
        return perfilRepo.findById(informado.getIdPerfil())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Perfil não encontrado."));
    }

    /** Perfil das contas de aluno. Não tem permissões na matriz: só a área do aluno. */
    private Perfil obterPerfilAluno() {
        return perfilRepo.findByNomePerfilIgnoreCase(PERFIL_ALUNO).stream().findFirst().orElseGet(() -> {
            Perfil perfil = new Perfil();
            perfil.setNomePerfil(PERFIL_ALUNO);
            perfil.setDescricao("Conta do aluno: vê só o próprio boletim, as próprias parcelas e os recados");
            perfil.setPermissoes(new ArrayList<>());
            return perfilRepo.save(perfil);
        });
    }

    private void validarLoginLivre(String login, Integer idIgnorado) {
        repository.findByLogin(login)
                .filter(existente -> !existente.getIdUsuario().equals(idIgnorado))
                .ifPresent(existente -> {
                    throw new ResponseStatusException(HttpStatus.CONFLICT, "Este login já está em uso. Escolha outro.");
                });
    }

    private void validarInativacao(Usuario usuario) {
        if (ehUsuarioLogado(usuario)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Você não pode inativar o seu próprio usuário.");
        }
        validarUltimoDiretor(usuario);
    }

    private void validarUltimoDiretor(Usuario usuario) {
        boolean ehDiretor = usuario.getPerfil() != null
                && "DIRETOR".equalsIgnoreCase(usuario.getPerfil().getNomePerfil());
        boolean estaAtivo = ATIVO.equalsIgnoreCase(usuario.getStatus());

        if (ehDiretor && estaAtivo && repository.contarOutrosDiretoresAtivos(usuario.getIdUsuario()) == 0) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Este é o último diretor ativo do sistema. Cadastre outro diretor antes de remover este acesso.");
        }
    }

    private boolean ehUsuarioLogado(Usuario usuario) {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        return auth != null && usuario.getLogin() != null && usuario.getLogin().equals(auth.getName());
    }

    private String normalizarStatus(String status) {
        if (status == null || status.isBlank()) return ATIVO;

        String limpo = status.trim().toUpperCase();
        if (!ATIVO.equals(limpo) && !INATIVO.equals(limpo)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Status deve ser ATIVO ou INATIVO.");
        }
        return limpo;
    }

    private String limpar(String texto) {
        return texto == null || texto.isBlank() ? null : texto.trim();
    }
}
