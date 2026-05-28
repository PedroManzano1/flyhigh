package com.example.backend.controller;

import com.example.backend.model.Frequencia;
import com.example.backend.service.FrequenciaService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/frequencias")
public class FrequenciaController {

    private final FrequenciaService frequenciaService;

    public FrequenciaController(FrequenciaService frequenciaService) {
        this.frequenciaService = frequenciaService;
    }

    // Rota para o professor salvar a chamada inteira de uma vez
    @PostMapping("/chamada")
    public ResponseEntity<List<Frequencia>> realizarChamada(@RequestBody List<Frequencia> frequencias) {
        List<Frequencia> chamadasSalvas = frequenciaService.registrarChamadaCompleta(frequencias);
        return ResponseEntity.ok(chamadasSalvas);
    }

    // Rota para ver as faltas de um aluno específico
    @GetMapping("/aluno/{idAluno}")
    public ResponseEntity<List<Frequencia>> listarFrequenciasDoAluno(@PathVariable Integer idAluno) {
        return ResponseEntity.ok(frequenciaService.buscarFrequenciaDoAluno(idAluno));
    }

    // Rota para ver o espelho de chamada de uma aula específica
    @GetMapping("/aula/{idAula}")
    public ResponseEntity<List<Frequencia>> listarFrequenciasDaAula(@PathVariable Integer idAula) {
        return ResponseEntity.ok(frequenciaService.buscarFrequenciaDaAula(idAula));
    }
}