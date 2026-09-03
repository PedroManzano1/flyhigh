package com.example.backend.controller;

import com.example.backend.model.Aula;
import com.example.backend.service.AulaService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/aulas")
@CrossOrigin(origins = "http://localhost:3000")
public class AulaController {

    @Autowired
    private AulaService service;

    @PreAuthorize("hasRole('DIRETOR') or hasAuthority('FREQUENCIAS_WRITE')")
    @PostMapping
    public Aula create(@RequestBody Aula aula) {
        return service.salvar(aula);
    }

    @PreAuthorize("hasRole('DIRETOR') or hasAuthority('FREQUENCIAS_READ')")
    @GetMapping
    public List<Aula> getAll() {
        return service.listarTodos();
    }

    @PreAuthorize("hasRole('DIRETOR') or hasAuthority('FREQUENCIAS_READ')")
    @GetMapping("/{id}")
    public ResponseEntity<Aula> getById(@PathVariable Long id) {
        return service.buscarPorId(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PreAuthorize("hasRole('DIRETOR') or hasAuthority('FREQUENCIAS_READ')")
    @GetMapping("/turma/{idTurma}")
    public ResponseEntity<List<Aula>> getByTurma(@PathVariable Long idTurma) {
        return ResponseEntity.ok(service.buscarPorTurma(idTurma));
    }

    @PreAuthorize("hasRole('DIRETOR') or hasAuthority('FREQUENCIAS_WRITE')")
    @PutMapping("/editar/{id}")
    public ResponseEntity<Aula> update(@PathVariable Long id, @RequestBody Aula aula) {
        return service.buscarPorId(id).map(existente -> {
            aula.setId_aula(id);
            return ResponseEntity.ok(service.salvar(aula));
        }).orElse(ResponseEntity.notFound().build());
    }

    @PreAuthorize("hasRole('DIRETOR') or hasAuthority('FREQUENCIAS_DELETE')")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        if (service.buscarPorId(id).isPresent()) {
            service.excluir(id);
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }
}
