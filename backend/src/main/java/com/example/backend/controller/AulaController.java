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

    @PostMapping
    public Aula create(@RequestBody Aula aula) {
        return service.salvar(aula);
    }

    @GetMapping
    public List<Aula> getAll() {
        return service.listarTodos();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Aula> getById(@PathVariable Long id) {
        return service.buscarPorId(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/turma/{idTurma}")
    public ResponseEntity<List<Aula>> getByTurma(@PathVariable Long idTurma) {
        return ResponseEntity.ok(service.buscarPorTurma(idTurma));
    }

    @PutMapping("/editar/{id}")
    public ResponseEntity<Aula> update(@PathVariable Long id, @RequestBody Aula aula) {
        return service.buscarPorId(id).map(existente -> {
            aula.setId_aula(id); // O Lombok vai ler isso certinho pois padronizamos o nome
            return ResponseEntity.ok(service.salvar(aula));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        if (service.buscarPorId(id).isPresent()) {
            service.excluir(id);
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }
}