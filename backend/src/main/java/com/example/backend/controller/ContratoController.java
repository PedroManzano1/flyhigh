package com.example.backend.controller;

import com.example.backend.dto.ContratoFormDTO;
import com.example.backend.model.Contrato;
import com.example.backend.model.LancamentoFinanceiro;
import com.example.backend.service.ContratoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/contratos")
@CrossOrigin(origins = "http://localhost:3000")
public class ContratoController {

    @Autowired
    private ContratoService service;

    @PreAuthorize("hasRole('DIRETOR') or hasAuthority('CONTRATOS_WRITE')")
    @PostMapping
    public Contrato matricular(@RequestBody ContratoFormDTO form) {
        return service.salvar(form);
    }

    @PreAuthorize("hasRole('DIRETOR') or hasAuthority('CONTRATOS_READ')")
    @GetMapping
    public List<Contrato> getAll() {
        return service.listarTodos();
    }

    @PreAuthorize("hasRole('DIRETOR') or hasAuthority('CONTRATOS_READ')")
    @GetMapping("/{id}")
    public ResponseEntity<Contrato> getById(@PathVariable Integer id) {
        return service.buscarPorId(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // Contrato + parcelas, usado na edição e na impressão
    @PreAuthorize("hasRole('DIRETOR') or hasAuthority('CONTRATOS_READ')")
    @GetMapping("/{id}/completo")
    public ContratoFormDTO getCompleto(@PathVariable Integer id) {
        return service.buscarCompleto(id);
    }

    @PreAuthorize("hasRole('DIRETOR') or hasAuthority('CONTRATOS_READ')")
    @GetMapping("/{id}/parcelas")
    public List<LancamentoFinanceiro> getParcelas(@PathVariable Integer id) {
        return service.buscarLancamentosDoContrato(id);
    }

    // Usado pela chamada (Faltas) e pelo lançamento de notas.
    // Liberado também para quem tem acesso ao pedagógico, senão o professor não
    @PreAuthorize("hasRole('DIRETOR') or hasAuthority('CONTRATOS_READ') "
            + "or hasAuthority('FREQUENCIAS_READ') or hasAuthority('AVALIACOES_READ')")
    @GetMapping("/turma/{idTurma}")
    public ResponseEntity<List<Contrato>> getByTurma(
            @PathVariable Long idTurma,
            @RequestParam(name = "somenteAtivos", defaultValue = "true") boolean somenteAtivos) {
        return ResponseEntity.ok(somenteAtivos
                ? service.buscarAtivosPorTurma(idTurma)
                : service.buscarPorTurma(idTurma));
    }

    // Quantas vagas da turma já estão ocupadas por contratos ativos
    @PreAuthorize("hasRole('DIRETOR') or hasAuthority('CONTRATOS_READ') or hasAuthority('TURMAS_READ')")
    @GetMapping("/turma/{idTurma}/ocupacao")
    public long getOcupacao(@PathVariable Long idTurma) {
        return service.contarVagasOcupadas(idTurma);
    }

    @PreAuthorize("hasRole('DIRETOR') or hasAuthority('CONTRATOS_READ')")
    @GetMapping("/aluno/{idAluno}")
    public ResponseEntity<List<Contrato>> getByAluno(@PathVariable Long idAluno) {
        return ResponseEntity.ok(service.buscarPorAluno(idAluno));
    }

    @PreAuthorize("hasRole('DIRETOR') or hasAuthority('CONTRATOS_READ')")
    @GetMapping("/aluno/{idAluno}/parcelas")
    public List<LancamentoFinanceiro> getParcelasDoAluno(@PathVariable Long idAluno) {
        return service.buscarLancamentosDoAluno(idAluno);
    }

    @PreAuthorize("hasRole('DIRETOR') or hasAuthority('CONTRATOS_WRITE')")
    @PutMapping("/editar/{id}")
    public ResponseEntity<Contrato> update(@PathVariable Integer id, @RequestBody ContratoFormDTO form) {
        return service.buscarPorId(id).map(existente -> {
            if (form.getContrato() != null) {
                form.getContrato().setIdContrato(id);
            }
            return ResponseEntity.ok(service.salvar(form));
        }).orElse(ResponseEntity.notFound().build());
    }

    @PreAuthorize("hasRole('DIRETOR') or hasAuthority('CONTRATOS_DELETE')")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Integer id) {
        if (service.buscarPorId(id).isPresent()) {
            service.excluir(id);
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }
}
