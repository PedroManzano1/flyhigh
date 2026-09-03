package com.example.backend.controller;

import com.example.backend.model.Contrato;
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
    public Contrato matricular(@RequestBody Contrato contrato) {
        return service.matricular(contrato);
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

    @PreAuthorize("hasRole('DIRETOR') or hasAuthority('CONTRATOS_READ')")
    @GetMapping("/aluno/{idAluno}")
    public ResponseEntity<List<Contrato>> getByAluno(@PathVariable Long idAluno) {
        return ResponseEntity.ok(service.buscarPorAluno(idAluno));
    }

    @PreAuthorize("hasRole('DIRETOR') or hasAuthority('CONTRATOS_WRITE')")
    @PutMapping("/editar/{id}")
    public ResponseEntity<Contrato> update(@PathVariable Integer id, @RequestBody Contrato contrato) {
        return service.buscarPorId(id).map(existente -> {
            contrato.setIdContrato(id);
            return ResponseEntity.ok(service.matricular(contrato));
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
