package com.example.backend.controller;

import com.example.backend.model.Frequencia;
import com.example.backend.service.FrequenciaService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/frequencias")
@CrossOrigin(origins = "http://localhost:3000")
public class FrequenciaController {

    @Autowired
    private FrequenciaService service;

    @PostMapping("/chamada")
    public ResponseEntity<List<Frequencia>> realizarChamada(@RequestBody List<Frequencia> frequencias) {
        List<Frequencia> chamadasSalvas = service.registrarChamadaCompleta(frequencias);
        return ResponseEntity.ok(chamadasSalvas);
    }

    @GetMapping("/aluno/{idAluno}")
    public ResponseEntity<List<Frequencia>> listarFrequenciasDoAluno(@PathVariable Long idAluno) {
        return ResponseEntity.ok(service.buscarFrequenciasPorAluno(idAluno));
    }

    @GetMapping("/aula/{idAula}")
    public ResponseEntity<List<Frequencia>> listarFrequenciasDaAula(@PathVariable Long idAula) {
        return ResponseEntity.ok(service.buscarFrequenciaDaAula(idAula));
    }
}