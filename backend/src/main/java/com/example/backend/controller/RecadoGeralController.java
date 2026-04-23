package com.example.backend.controller;

import com.example.backend.model.RecadoGeral;
import com.example.backend.service.RecadoGeralService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/recados")
@CrossOrigin(origins = "http://localhost:3000")
public class RecadoGeralController {

    @Autowired
    private RecadoGeralService service;

    @PreAuthorize("hasRole('DIRETOR') or hasAuthority('RECADOS_WRITE')")
    @PostMapping
    public RecadoGeral create(@RequestBody RecadoGeral recado) {
        return service.salvar(recado);
    }

    // Liberei leitura para todos os perfis principais (Ajuste conforme suas roles reais)
    @PreAuthorize("hasRole('DIRETOR') or hasRole('PROFESSOR') or hasRole('ALUNO') or hasAuthority('RECADOS_READ')")
    @GetMapping
    public List<RecadoGeral> getAll() {
        return service.listarTodos();
    }

    @PreAuthorize("hasRole('DIRETOR') or hasAuthority('RECADOS_READ')")
    @GetMapping("/{id}")
    public ResponseEntity<RecadoGeral> getById(@PathVariable Long id) {
        return service.buscarPorId(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PreAuthorize("hasRole('DIRETOR') or hasAuthority('RECADOS_WRITE')")
    @PutMapping("/editar/{id}")
    public ResponseEntity<RecadoGeral> update(@PathVariable Long id, @RequestBody RecadoGeral recado) {
        return service.buscarPorId(id).map(existente -> {
            recado.setId_recado(id);
            // Garante que a data de publicação original não seja sobrescrita acidentalmente na edição
            recado.setDataPublicacao(existente.getDataPublicacao());
            return ResponseEntity.ok(service.salvar(recado));
        }).orElse(ResponseEntity.notFound().build());
    }

    @PreAuthorize("hasRole('DIRETOR') or hasAuthority('RECADOS_DELETE')")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        if (service.buscarPorId(id).isPresent()) {
            service.excluir(id);
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }
}