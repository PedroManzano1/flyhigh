package com.example.backend.service;

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
import org.springframework.web.server.ResponseStatusException;

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

    public Turma salvar(Turma turma) {
        if (turma.getCodigoTurma() == null || turma.getCodigoTurma().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Informe o código da turma.");
        }

        // só é possível abrir turma para um curso ATIVO.
        if (turma.getCurso() != null && turma.getCurso().getId_curso() != null) {
            Curso cursoReal = cursoRepo.findById(turma.getCurso().getId_curso())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Curso não encontrado."));
            if (Boolean.FALSE.equals(cursoReal.getAtivo())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "O curso \"" + cursoReal.getNome() + "\" está inativo e não aceita novas turmas.");
            }
            turma.setCurso(cursoReal);
        } else {
            turma.setCurso(null);
        }

        validarPontuacao(turma);

        //o professor vinculado precisa ser um usuário ATIVO.
        if (turma.getProfessor() != null && turma.getProfessor().getIdUsuario() != null) {
            Usuario professorReal = usuarioRepo.findById(turma.getProfessor().getIdUsuario())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Professor não encontrado."));
            if (professorReal.getStatus() != null && !"ATIVO".equalsIgnoreCase(professorReal.getStatus())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "O usuário selecionado como professor está inativo.");
            }
            turma.setProfessor(professorReal);
        } else {
            turma.setProfessor(null);
        }

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
