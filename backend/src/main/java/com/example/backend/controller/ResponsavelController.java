package com.example.backend.controller;

import com.example.backend.model.Responsavel;
import com.example.backend.service.ResponsavelService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/responsaveis")
@CrossOrigin(origins = "http://localhost:3000")
public class ResponsavelController {

    @Autowired
    private ResponsavelService service;

    @PreAuthorize("hasRole('DIRETOR') or hasAuthority('RESPONSAVEIS_WRITE')")
    @PostMapping
    public Responsavel create(@RequestBody Responsavel responsavel) {
        return service.salvar(responsavel);
    }

    @PreAuthorize("hasRole('DIRETOR') or hasAuthority('RESPONSAVEIS_READ')")
    @GetMapping
    public List<Responsavel> getAll() {
        return service.listarTodos();
    }

    @PreAuthorize("hasRole('DIRETOR') or hasAuthority('RESPONSAVEIS_READ')")
    @GetMapping("/{id}")
    public ResponseEntity<Responsavel> getById(@PathVariable Long id) {
        return service.buscarPorId(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PreAuthorize("hasRole('DIRETOR') or hasAuthority('RESPONSAVEIS_WRITE')")
    @PutMapping("/editar/{id}")
    public ResponseEntity<Responsavel> update(@PathVariable Long id, @RequestBody Responsavel responsavel) {
        return service.buscarPorId(id).map(existente -> {
            responsavel.setId_responsavel(id);
            return ResponseEntity.ok(service.salvar(responsavel));
        }).orElse(ResponseEntity.notFound().build());
    }

    @PreAuthorize("hasRole('DIRETOR') or hasAuthority('RESPONSAVEIS_DELETE')")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        if (service.buscarPorId(id).isPresent()) {
            service.excluir(id);
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }
}