package com.example.backend.controller;

import com.example.backend.model.Usuario;
import com.example.backend.service.UsuarioService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize; // Import necessário
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/usuarios")
@CrossOrigin(origins = "http://localhost:3000")
public class UsuarioController {

    @Autowired
    private UsuarioService service; // Injeta o Service em vez do Repository

    @GetMapping
    @PreAuthorize("hasRole('DIRETOR') or hasAuthority('USUARIOS_READ')")
    public List<Usuario> listarTodos() {
        return service.listarTodos();
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('DIRETOR') or hasAuthority('USUARIOS_READ')")
    public ResponseEntity<Usuario> buscarPorId(@PathVariable Integer id) {
        return service.buscarPorId(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    @PreAuthorize("hasRole('DIRETOR') or hasAuthority('USUARIOS_WRITE')")
    public Usuario salvar(@RequestBody Usuario usuario) {
        return service.salvar(usuario);
    }

    @PutMapping("/editar/{id}")
    @PreAuthorize("hasRole('DIRETOR') or hasAuthority('USUARIOS_WRITE')")
    public ResponseEntity<Usuario> atualizar(@PathVariable Integer id, @RequestBody Usuario dadosNovos) {
        try {
            return ResponseEntity.ok(service.atualizar(id, dadosNovos));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('DIRETOR') or hasAuthority('USUARIOS_DELETE')")
    public ResponseEntity<Void> deletar(@PathVariable Integer id) {
        service.deletar(id);
        return ResponseEntity.noContent().build();
    }
}