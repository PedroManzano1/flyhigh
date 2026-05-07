package com.example.backend.controller;

import com.example.backend.model.VinculoAlunoResponsavel;
import com.example.backend.service.VinculoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/vinculos")
@CrossOrigin(origins = "http://localhost:3000")
public class VinculoController {

    @Autowired
    private VinculoService service;

    @PreAuthorize("hasRole('DIRETOR') or hasAuthority('VINCULOS_WRITE')")
    @PostMapping
    public ResponseEntity<VinculoAlunoResponsavel> criarVinculo(@RequestBody VinculoAlunoResponsavel vinculo) {
        return ResponseEntity.ok(service.vincular(vinculo));
    }

    @PreAuthorize("hasRole('DIRETOR') or hasAuthority('VINCULOS_READ')")
    @GetMapping
    public List<VinculoAlunoResponsavel> getAll() {
        return service.listarTodos();
    }

    //Endpoint para deletar o vínculo
    @PreAuthorize("hasRole('DIRETOR') or hasAuthority('VINCULOS_WRITE')")
    @DeleteMapping("/{id_aluno}/{id_responsavel}")
    public ResponseEntity<Void> deletarVinculo(@PathVariable Long id_aluno, @PathVariable Long id_responsavel) {
        service.desfazerVinculo(id_aluno, id_responsavel);
        return ResponseEntity.noContent().build();
    }
}