package com.example.backend.service;

import com.example.backend.dto.MinhaAreaDTO;
import com.example.backend.dto.ParcelaFinanceiraDTO;
import com.example.backend.model.Aluno;
import com.example.backend.model.Contrato;
import com.example.backend.model.RecadoGeral;
import com.example.backend.model.Usuario;
import com.example.backend.repository.ContratoRepository;
import com.example.backend.repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.List;

/**
 * Área do aluno. O aluno é sempre o da conta logada: nada aqui recebe id de aluno
 * pela requisição, para uma conta não conseguir ver os dados de outra.
 */
@Service
public class MinhaAreaService {

    @Autowired
    private UsuarioRepository usuarioRepo;

    @Autowired
    private ContratoRepository contratoRepo;

    @Autowired
    private BoletimService boletimService;

    @Autowired
    private FinanceiroService financeiroService;

    @Autowired
    private RecadoGeralService recadoService;

    public MinhaAreaDTO montar() {
        Aluno aluno = alunoLogado();
        MinhaAreaDTO area = new MinhaAreaDTO();
        area.setAlunoNome(aluno.getNome());
        area.setAlunoMatricula(aluno.getNumeroMatricula());

        for (Contrato contrato : contratoRepo.findByAlunoId(aluno.getId_aluno())) {
            boolean ativo = "ATIVO".equalsIgnoreCase(contrato.getStatus());
            if (ativo && contrato.getTurma() != null) {
                area.getBoletins().add(
                        boletimService.gerarBoletimDoAluno(contrato.getTurma().getId_turma(), aluno.getId_aluno()));
            }
        }

        List<ParcelaFinanceiraDTO> parcelas =
                financeiroService.listar(null, null, null, null, aluno.getId_aluno(), null, null);
        // Anotações internas da secretaria não aparecem para o aluno
        parcelas.forEach(p -> {
            p.setUsuarioBaixa(null);
            p.setObservacaoPagamento(null);
        });
        area.setParcelas(parcelas);

        LocalDate hoje = LocalDate.now();
        for (RecadoGeral r : recadoService.listarTodos()) {
            if (r.getDataExpiracao() != null && r.getDataExpiracao().isBefore(hoje)) continue;
            MinhaAreaDTO.Recado recado = new MinhaAreaDTO.Recado();
            recado.setIdRecado(r.getId_recado());
            recado.setTitulo(r.getTitulo());
            recado.setMensagem(r.getMensagem());
            recado.setDataPublicacao(r.getDataPublicacao());
            recado.setDataExpiracao(r.getDataExpiracao());
            recado.setAutor(r.getUsuarioAutor() != null ? r.getUsuarioAutor().getNome() : null);
            area.getRecados().add(recado);
        }
        return area;
    }

    private Aluno alunoLogado() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Sessão inválida.");
        }
        Usuario usuario = usuarioRepo.findByLogin(auth.getName())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Sessão inválida."));
        if (usuario.getAluno() == null) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Sua conta ainda não está ligada a um aluno. Procure a secretaria.");
        }
        return usuario.getAluno();
    }
}
