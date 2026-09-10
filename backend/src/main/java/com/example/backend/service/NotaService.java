package com.example.backend.service;

import com.example.backend.model.Aluno;
import com.example.backend.model.Avaliacao;
import com.example.backend.model.Nota;
import com.example.backend.model.NotaKey;
import com.example.backend.repository.AlunoRepository;
import com.example.backend.repository.AvaliacaoRepository;
import com.example.backend.repository.NotaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.List;

@Service
public class NotaService {

    @Autowired
    private NotaRepository notaRepo;

    @Autowired
    private AvaliacaoRepository avaliacaoRepo;

    @Autowired
    private AlunoRepository alunoRepo;

    @Autowired
    private AcessoPedagogicoService acessoPedagogico;

    public List<Nota> buscarNotasPorAluno(Long idAluno) {
        return notaRepo.findByAlunoId(idAluno);
    }

    public List<Nota> buscarNotasPorAvaliacao(Long idAvaliacao) {
        // Bug corrigido: agora chama a query certa
        return notaRepo.findByAvaliacaoId(idAvaliacao);
    }

    public List<Nota> buscarNotasPorTurma(Long idTurma) {
        return notaRepo.findByTurmaId(idTurma);
    }

    @Transactional
    public Nota salvarNota(Nota nota) {
        return notaRepo.save(prepararParaSalvar(nota));
    }

    @Transactional
    public List<Nota> salvarNotasEmLote(List<Nota> notas) {
        if (notas == null || notas.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Nenhuma nota foi enviada.");
        }

        List<Nota> preparadas = new ArrayList<>();
        for (Nota n : notas) {
            Nota preparada = prepararParaSalvar(n);

            // Nota em branco significa "sem lançamento": se já existia, o registro é removido
            if (preparada.getValorObtido() == null) {
                notaRepo.findById(preparada.getId()).ifPresent(existente -> notaRepo.delete(existente));
                continue;
            }
            preparadas.add(preparada);
        }

        return preparadas.isEmpty() ? preparadas : notaRepo.saveAll(preparadas);
    }

    @Transactional
    public void excluirNota(Long idAvaliacao, Long idAluno) {
        Avaliacao avaliacao = avaliacaoRepo.findById(idAvaliacao)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Avaliação não encontrada."));

        acessoPedagogico.validarLancamentoNaTurma(avaliacao.getTurma());

        NotaKey chave = new NotaKey(idAvaliacao, idAluno);
        if (!notaRepo.existsById(chave)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Nota não encontrada.");
        }
        notaRepo.deleteById(chave);
    }

    private Nota prepararParaSalvar(Nota nota) {
        if (nota.getAvaliacao() == null || nota.getAvaliacao().getId_avaliacao() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Informe a avaliação.");
        }
        if (nota.getAluno() == null || nota.getAluno().getId_aluno() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Informe o aluno.");
        }

        Avaliacao avaliacaoReal = avaliacaoRepo.findById(nota.getAvaliacao().getId_avaliacao())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Avaliação não encontrada."));
        Aluno alunoReal = alunoRepo.findById(nota.getAluno().getId_aluno())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Aluno não encontrado."));

        // Professor só lança nota na própria turma
        acessoPedagogico.validarLancamentoNaTurma(avaliacaoReal.getTurma());

        if (nota.getValorObtido() != null) {
            if (nota.getValorObtido() < 0) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "A nota não pode ser negativa.");
            }
            if (avaliacaoReal.getNotaMaxima() != null && nota.getValorObtido() > avaliacaoReal.getNotaMaxima()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "A nota lançada não pode ser maior que a nota máxima da avaliação ("
                                + avaliacaoReal.getNotaMaxima() + ").");
            }
        }

        nota.setAvaliacao(avaliacaoReal);
        nota.setAluno(alunoReal);
        if (nota.getId() == null) {
            nota.setId(new NotaKey());
        }
        nota.getId().setAvaliacaoId(avaliacaoReal.getId_avaliacao());
        nota.getId().setAlunoId(alunoReal.getId_aluno());

        return nota;
    }
}
