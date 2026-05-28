package com.example.backend.controller;

import com.example.backend.model.Aula;
import com.example.backend.service.AulaService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/aulas")
public class AulaController {

    private final AulaService aulaService;

    public AulaController(AulaService aulaService) {
        this.aulaService = aulaService;
    }

    // Rota para o professor criar uma nova aula
    @PostMapping
    public ResponseEntity<Aula> criarAula(@RequestBody Aula aula) {
        Aula novaAula = aulaService.salvarAula(aula);
        return ResponseEntity.ok(novaAula);
    }

    // Rota para listar o histórico de aulas de uma turma específica
    @GetMapping("/turma/{idTurma}")
    public ResponseEntity<List<Aula>> listarAulasPorTurma(@PathVariable Integer idTurma) {
        List<Aula> aulas = aulaService.buscarPorTurma(idTurma);
        return ResponseEntity.ok(aulas);
    }
}