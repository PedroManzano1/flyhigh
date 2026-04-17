package com.example.backend.controller;

import com.example.backend.model.Curso;
import com.example.backend.service.CursoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/cursos")
@CrossOrigin(origins = "http://localhost:3000")
public class CursoController {

    @Autowired
    private CursoService service;

    @PreAuthorize("hasRole('DIRETOR') or hasAuthority('CURSOS_WRITE')")
    @PostMapping
    public Curso create(@RequestBody Curso curso) {
        return service.salvar(curso);
    }

    @PreAuthorize("hasRole('DIRETOR') or hasAuthority('CURSOS_READ')")
    @GetMapping
    public List<Curso> getAll() {
        return service.listarTodos();
    }

    @PreAuthorize("hasRole('DIRETOR') or hasAuthority('CURSOS_READ')")
    @GetMapping("/{id}")
    public ResponseEntity<Curso> getById(@PathVariable Long id) {
        return service.buscarPorId(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PreAuthorize("hasRole('DIRETOR') or hasAuthority('CURSOS_WRITE')")
    @PutMapping("/editar/{id}")
    public ResponseEntity<Curso> update(@PathVariable Long id, @RequestBody Curso curso) {
        return service.buscarPorId(id).map(existente -> {
            curso.setId_curso(id);
            return ResponseEntity.ok(service.salvar(curso));
        }).orElse(ResponseEntity.notFound().build());
    }

    @PreAuthorize("hasRole('DIRETOR') or hasAuthority('CURSOS_DELETE')")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        if (service.buscarPorId(id).isPresent()) {
            service.excluir(id);
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }
}