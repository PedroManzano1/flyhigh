package com.example.backend.controller;

import com.example.backend.model.Aluno;
import com.example.backend.service.AlunoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize; // Importe isso!
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/alunos")
@CrossOrigin(origins = "http://localhost:3000")
public class AlunoController {

    @Autowired
    private AlunoService service;

    @PreAuthorize("hasRole('DIRETOR') or hasAuthority('ALUNOS_WRITE')")
    @PostMapping
    public Aluno create(@RequestBody Aluno aluno) {
        return service.salvar(aluno);
    }

    @PreAuthorize("hasRole('DIRETOR') or hasAuthority('ALUNOS_READ')")
    @GetMapping
    public List<Aluno> getAll() {
        return service.listarTodos();
    }

    @PreAuthorize("hasRole('DIRETOR') or hasAuthority('ALUNOS_READ')")
    @GetMapping("/{id}")
    public ResponseEntity<Aluno> getById(@PathVariable Long id) {
        return service.buscarPorId(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PreAuthorize("hasRole('DIRETOR') or hasAuthority('ALUNOS_WRITE')")
    @PutMapping("/editar/{id}")
    public ResponseEntity<Aluno> update(@PathVariable Long id, @RequestBody Aluno aluno) {
        return service.buscarPorId(id).map(existente -> {
            aluno.setId_aluno(id);
            return ResponseEntity.ok(service.salvar(aluno));
        }).orElse(ResponseEntity.notFound().build());
    }

    @PreAuthorize("hasRole('DIRETOR') or hasAuthority('ALUNOS_DELETE')")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        if (service.buscarPorId(id).isPresent()) {
            service.excluir(id);
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }
}