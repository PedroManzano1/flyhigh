package com.example.backend.controller;

import com.example.backend.model.Responsavel;
import com.example.backend.service.ResponsavelService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/responsaveis")
@CrossOrigin(origins = "http://localhost:3000")
public class ResponsavelController {

    @Autowired
    private ResponsavelService service;

    // POST - http://localhost:8080/api/responsaveis
    @PostMapping
    public Responsavel create(@RequestBody Responsavel responsavel) {
        return service.salvar(responsavel);
    }

    // GET ALL - http://localhost:8080/api/responsaveis
    @GetMapping
    public List<Responsavel> getAll() {
        return service.listarTodos();
    }

    // GET BY ID - http://localhost:8080/api/responsaveis/1
    @GetMapping("/{id}")
    public ResponseEntity<Responsavel> getById(@PathVariable Long id) {
        return service.buscarPorId(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // PUT (Update) - http://localhost:8080/api/editar/responsaveis/1
    @PutMapping("/editar/{id}")
    public ResponseEntity<Responsavel> update(@PathVariable Long id, @RequestBody Responsavel responsavel) {
        return service.buscarPorId(id).map(existente -> {
            responsavel.setId_responsavel(id); // Garante que vai atualizar o registro correto
            return ResponseEntity.ok(service.salvar(responsavel));
        }).orElse(ResponseEntity.notFound().build());
    }

    // DELETE - http://localhost:8080/api/responsaveis/1
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        if (service.buscarPorId(id).isPresent())
        {
            service.excluir(id);
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }
}