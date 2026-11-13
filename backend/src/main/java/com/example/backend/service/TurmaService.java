package com.example.backend.service;

import com.example.backend.model.Contrato;
import com.example.backend.model.Curso;
import com.example.backend.model.Turma;
import com.example.backend.model.Usuario;
import com.example.backend.repository.AulaRepository;
import com.example.backend.repository.AvaliacaoRepository;
import com.example.backend.repository.ContratoRepository;
import com.example.backend.repository.CursoRepository;
import com.example.backend.repository.TurmaRepository;
import com.example.backend.repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Service
public class TurmaService {

    @Autowired
    private TurmaRepository turmaRepo;

    @Autowired
    private CursoRepository cursoRepo;

    @Autowired
    private UsuarioRepository usuarioRepo;

    @Autowired
    private AulaRepository aulaRepo;

    @Autowired
    private AvaliacaoRepository avaliacaoRepo;

    @Autowired
    private ContratoRepository contratoRepo;

    @Autowired
    private ControleAcessoService acesso;

    public static final String ABERTA = "Aberta";
    public static final String FECHADA = "Fechada";
    public static final String CONCLUIDA = "Concluída";

    /** Turma encerrada pelo botão "Encerrar turma" (aceita "Concluida" sem acento). */
    public static boolean estaEncerrada(Turma turma) {
        return turma != null && "CONCLUIDA".equals(semAcento(turma.getStatus()));
    }

    /** Turma que não recebe matrícula nova: fechada ou encerrada. */
    public static boolean naoAceitaMatricula(Turma turma) {
        return turma != null && ("FECHADA".equals(semAcento(turma.getStatus())) || estaEncerrada(turma));
    }

    private static String semAcento(String texto) {
        if (texto == null) return "";
        return java.text.Normalizer.normalize(texto.trim(), java.text.Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "").toUpperCase();
    }

    public Turma salvar(Turma turma) {
        if (turma.getCodigoTurma() == null || turma.getCodigoTurma().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Informe o código da turma.");
        }
        turma.setCodigoTurma(turma.getCodigoTurma().trim());
        Turma existente = turma.getId_turma() == null ? null : turmaRepo.findById(turma.getId_turma()).orElse(null);

        validarCodigoUnico(turma);
        validarHorario(turma);
        validarStatus(turma, existente);

        // Só é possível abrir turma para um curso ativo. Turma antiga de um curso
        // que foi inativado depois continua podendo ser editada.
        if (turma.getCurso() != null && turma.getCurso().getId_curso() != null) {
            Curso cursoReal = cursoRepo.findById(turma.getCurso().getId_curso())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Curso não encontrado."));
            boolean mesmoCurso = existente != null && existente.getCurso() != null
                    && cursoReal.getId_curso().equals(existente.getCurso().getId_curso());
            if (Boolean.FALSE.equals(cursoReal.getAtivo()) && !mesmoCurso) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "O curso \"" + cursoReal.getNome() + "\" está inativo e não aceita novas turmas.");
            }
            turma.setCurso(cursoReal);
        } else {
            turma.setCurso(null);
        }

        validarPontuacao(turma);

        // O professor precisa ser uma conta da equipe, ativa
        if (turma.getProfessor() != null && turma.getProfessor().getIdUsuario() != null) {
            Usuario professorReal = usuarioRepo.findById(turma.getProfessor().getIdUsuario())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Professor não encontrado."));
            if (!"ATIVO".equalsIgnoreCase(professorReal.getStatus())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "O usuário selecionado como professor está inativo ou aguardando aprovação.");
            }
            boolean contaDeAluno = professorReal.getPerfil() == null || professorReal.getAluno() != null
                    || UsuarioService.PERFIL_ALUNO.equalsIgnoreCase(professorReal.getPerfil().getNomePerfil());
            if (contaDeAluno) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "O professor precisa ser uma conta da equipe, não uma conta de aluno.");
            }
            turma.setProfessor(professorReal);
        } else {
            turma.setProfessor(null);
        }

        if (existente != null) turma.setDataEncerramento(existente.getDataEncerramento());
        return turmaRepo.save(turma);
    }

    private void validarCodigoUnico(Turma turma) {
        turmaRepo.buscarPorCodigo(turma.getCodigoTurma()).stream()
                .filter(outra -> !outra.getId_turma().equals(turma.getId_turma()))
                .findFirst()
                .ifPresent(outra -> {
                    throw new ResponseStatusException(HttpStatus.CONFLICT,
                            "Já existe uma turma com o código " + outra.getCodigoTurma() + ".");
                });
    }

    private void validarHorario(Turma turma) {
        if (turma.getHorarioInicio() != null && turma.getHorarioFim() != null
                && !turma.getHorarioFim().isAfter(turma.getHorarioInicio())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "O horário de término precisa ser depois do horário de início.");
        }
    }

    /**
     * "Concluída" só pelo botão Encerrar turma, que conclui as matrículas junto.
     * Reabrir uma turma encerrada é só do diretor; as matrículas continuam concluídas.
     */
    private void validarStatus(Turma turma, Turma existente) {
        boolean estavaEncerrada = estaEncerrada(existente);
        if (estaEncerrada(turma) && !estavaEncerrada) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Para encerrar a turma use o botão \"Encerrar turma\", que também conclui as matrículas.");
        }
        if (estavaEncerrada && !estaEncerrada(turma) && !acesso.logadoEhDiretor()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Só o diretor pode reabrir uma turma encerrada.");
        }
        if (turma.getStatus() == null || turma.getStatus().isBlank()) {
            turma.setStatus(existente != null ? existente.getStatus() : ABERTA);
        }
    }

    /**
     * Fim do semestre: a turma vira Concluída e as matrículas ativas viram Concluído,
     * liberando as vagas. As parcelas não mudam. Depois disso notas, faltas e
     * atividades só são alteradas pelo diretor (AcessoPedagogicoService).
     */
    @Transactional
    public Turma encerrar(Long id) {
        Turma turma = turmaRepo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Turma não encontrada."));
        if (estaEncerrada(turma)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Esta turma já foi encerrada.");
        }
        for (Contrato contrato : contratoRepo.findAtivosByTurmaId(id)) {
            contrato.setStatus(Contrato.CONCLUIDO);
            contrato.setDataInterrupcao(null);
            contratoRepo.save(contrato);
        }
        turma.setStatus(CONCLUIDA);
        turma.setDataEncerramento(LocalDate.now());
        return turmaRepo.save(turma);
    }

    /**
     * Modelo de avaliação: 400 (soma ÷ 4) ou 500 (soma ÷ 5). Não pode ficar abaixo
     * dos pontos que as atividades da turma já somam.
     */
    private void validarPontuacao(Turma turma) {
        Integer pontuacao = turma.getPontuacaoTotal();
        if (pontuacao == null) return;
        if (pontuacao <= 0 || pontuacao % 100 != 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "O modelo de avaliação deve ser 400 ou 500 pontos.");
        }
        if (turma.getId_turma() != null) {
            double distribuidos = avaliacaoRepo.somarPontos(turma.getId_turma(), -1L);
            if (distribuidos > pontuacao + 0.01) {
                throw new ResponseStatusException(HttpStatus.CONFLICT,
                        "As atividades desta turma já somam " + Math.round(distribuidos)
                                + " pontos, mais que o Modelo " + pontuacao + ". Ajuste as atividades antes de trocar o modelo.");
            }
        }
    }

    public List<Turma> listarTodos() {
        return turmaRepo.findAll();
    }

    public Optional<Turma> buscarPorId(Long id) {
        return turmaRepo.findById(id);
    }

    /**
     * Exclusão protegida: turma com diário, avaliação ou matrícula preserva o histórico.
     */
    public void excluir(Long id) {
        Turma turma = turmaRepo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Turma não encontrada."));

        long aulas = aulaRepo.contarPorTurma(id);
        long avaliacoes = avaliacaoRepo.contarPorTurma(id);
        long matriculas = contratoRepo.contarPorTurma(id);

        if (aulas > 0 || avaliacoes > 0 || matriculas > 0) {
            StringBuilder itens = new StringBuilder();
            if (aulas > 0) itens.append(aulas).append(" aula(s)");
            if (avaliacoes > 0) {
                if (itens.length() > 0) itens.append(", ");
                itens.append(avaliacoes).append(" avaliação(ões)");
            }
            if (matriculas > 0) {
                if (itens.length() > 0) itens.append(" e ");
                itens.append(matriculas).append(" matrícula(s)");
            }
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Esta turma não pode ser excluída porque possui " + itens
                            + ". Altere o status da turma para \"Fechada\" em vez de excluir.");
        }

        turmaRepo.delete(turma);
    }
}
