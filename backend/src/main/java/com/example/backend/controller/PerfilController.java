package com.example.backend.controller;

import com.example.backend.model.Perfil;
import com.example.backend.service.PerfilService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize; // Import necessário
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/perfis")
@CrossOrigin(origins = "http://localhost:3000")
public class PerfilController {

    @Autowired
    private PerfilService perfilService;

    @GetMapping
    @PreAuthorize("hasRole('DIRETOR') or hasAuthority('PERFIS_READ')")
    public List<Perfil> listarTodos() {
        return perfilService.listarTodos();
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('DIRETOR') or hasAuthority('PERFIS_READ')")
    public ResponseEntity<Perfil> buscarPorId(@PathVariable Integer id) {
        return perfilService.buscarPorId(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    @PreAuthorize("hasRole('DIRETOR') or hasAuthority('PERFIS_WRITE')")
    public Perfil criar(@RequestBody Perfil perfil) {
        return perfilService.salvar(perfil);
    }

    @PutMapping("/editar/{id}")
    @PreAuthorize("hasRole('DIRETOR') or hasAuthority('PERFIS_WRITE')")
    public ResponseEntity<Perfil> atualizar(@PathVariable Integer id, @RequestBody Perfil perfil) {
        try {
            Perfil atualizado = perfilService.atualizar(id, perfil);
            return ResponseEntity.ok(atualizado);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('DIRETOR') or hasAuthority('PERFIS_DELETE')")
    public ResponseEntity<Void> deletar(@PathVariable Integer id) {
        perfilService.excluir(id);
        return ResponseEntity.noContent().build();
    }
}