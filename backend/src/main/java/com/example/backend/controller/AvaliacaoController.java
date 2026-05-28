package com.example.backend.controller;

import com.example.backend.model.Avaliacao;
import com.example.backend.service.AvaliacaoService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/avaliacoes")
public class AvaliacaoController {

    private final AvaliacaoService avaliacaoService;

    public AvaliacaoController(AvaliacaoService avaliacaoService) {
        this.avaliacaoService = avaliacaoService;
    }

    @PostMapping
    public ResponseEntity<Avaliacao> criarAvaliacao(@RequestBody Avaliacao avaliacao) {
        Avaliacao novaAvaliacao = avaliacaoService.salvarAvaliacao(avaliacao);
        return ResponseEntity.ok(novaAvaliacao);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Avaliacao> buscarPorId(@PathVariable Integer id) {
        Avaliacao avaliacao = avaliacaoService.buscarPorId(id);
        return ResponseEntity.ok(avaliacao);
    }

    @GetMapping("/turma/{idTurma}")
    public ResponseEntity<List<Avaliacao>> listarPorTurma(@PathVariable Integer idTurma) {
        List<Avaliacao> avaliacoes = avaliacaoService.buscarAvaliacoesPorTurma(idTurma);
        return ResponseEntity.ok(avaliacoes);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletarAvaliacao(@PathVariable Integer id) {
        avaliacaoService.deletarAvaliacao(id);
        return ResponseEntity.noContent().build();
    }
}