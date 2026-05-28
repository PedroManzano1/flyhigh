package com.example.backend.controller;

import com.example.backend.model.Nota;
import com.example.backend.service.NotaService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/notas")
public class NotaController {

    private final NotaService notaService;

    public NotaController(NotaService notaService) {
        this.notaService = notaService;
    }

    @PostMapping
    public ResponseEntity<Nota> registrarNota(@RequestBody Nota nota) {
        Nota notaSalva = notaService.salvarNota(nota);
        return ResponseEntity.ok(notaSalva);
    }

    @GetMapping("/aluno/{idAluno}")
    public ResponseEntity<List<Nota>> listarNotasPorAluno(@PathVariable Integer idAluno) {
        List<Nota> notas = notaService.buscarNotasPorAluno(idAluno);
        return ResponseEntity.ok(notas);
    }

    @GetMapping("/avaliacao/{idAvaliacao}")
    public ResponseEntity<List<Nota>> listarNotasPorAvaliacao(@PathVariable Integer idAvaliacao) {
        List<Nota> notas = notaService.buscarNotasPorAvaliacao(idAvaliacao);
        return ResponseEntity.ok(notas);
    }
}