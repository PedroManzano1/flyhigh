package com.example.backend.controller;

import com.example.backend.model.Turma;
import com.example.backend.service.TurmaService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/turmas")
@CrossOrigin(origins = "http://localhost:3000")
public class TurmaController {

    @Autowired
    private TurmaService service;

    @PreAuthorize("hasRole('DIRETOR') or hasAuthority('TURMAS_WRITE')")
    @PostMapping
    public Turma create(@RequestBody Turma turma) {
        return service.salvar(turma);
    }

    @PreAuthorize("hasRole('DIRETOR') or hasAuthority('TURMAS_READ')")
    @GetMapping
    public List<Turma> getAll() {
        return service.listarTodos();
    }

    @PreAuthorize("hasRole('DIRETOR') or hasAuthority('TURMAS_READ')")
    @GetMapping("/{id}")
    public ResponseEntity<Turma> getById(@PathVariable Long id) {
        return service.buscarPorId(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PreAuthorize("hasRole('DIRETOR') or hasAuthority('TURMAS_WRITE')")
    @PutMapping("/editar/{id}")
    public ResponseEntity<Turma> update(@PathVariable Long id, @RequestBody Turma turma) {
        return service.buscarPorId(id).map(existente -> {
            turma.setId_turma(id);
            return ResponseEntity.ok(service.salvar(turma));
        }).orElse(ResponseEntity.notFound().build());
    }

    @PreAuthorize("hasRole('DIRETOR') or hasAuthority('TURMAS_DELETE')")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        if (service.buscarPorId(id).isPresent()) {
            service.excluir(id);
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }
}