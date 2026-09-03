package com.example.backend.controller;

import com.example.backend.model.Nota;
import com.example.backend.service.NotaService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/notas")
@CrossOrigin(origins = "http://localhost:3000")
public class NotaController {

    @Autowired
    private NotaService service;

    // Salvar uma única nota
    @PreAuthorize("hasRole('DIRETOR') or hasAuthority('AVALIACOES_WRITE')")
    @PostMapping
    public ResponseEntity<Nota> registrarNota(@RequestBody Nota nota) {
        return ResponseEntity.ok(service.salvarNota(nota));
    }

    // Rota otimizada para o professor lançar as notas da sala toda de uma vez
    @PreAuthorize("hasRole('DIRETOR') or hasAuthority('AVALIACOES_WRITE')")
    @PostMapping("/lote")
    public ResponseEntity<List<Nota>> registrarNotasEmLote(@RequestBody List<Nota> notas) {
        return ResponseEntity.ok(service.salvarNotasEmLote(notas));
    }

    // Listar boletim de um aluno
    @PreAuthorize("hasRole('DIRETOR') or hasAuthority('AVALIACOES_READ')")
    @GetMapping("/aluno/{idAluno}")
    public ResponseEntity<List<Nota>> listarNotasPorAluno(@PathVariable Long idAluno) {
        return ResponseEntity.ok(service.buscarNotasPorAluno(idAluno));
    }

    // Listar espelho de notas de uma prova específica
    @PreAuthorize("hasRole('DIRETOR') or hasAuthority('AVALIACOES_READ')")
    @GetMapping("/avaliacao/{idAvaliacao}")
    public ResponseEntity<List<Nota>> listarNotasPorAvaliacao(@PathVariable Long idAvaliacao) {
        return ResponseEntity.ok(service.buscarNotasPorAvaliacao(idAvaliacao));
    }
}