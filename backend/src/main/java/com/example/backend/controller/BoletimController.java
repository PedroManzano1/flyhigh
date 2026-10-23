package com.example.backend.controller;

import com.example.backend.dto.BoletimTurmaDTO;
import com.example.backend.service.BoletimService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/boletim")
@CrossOrigin(origins = "http://localhost:3000")
public class BoletimController {

    @Autowired
    private BoletimService service;

    // Tela de leitura: consolida notas e frequência da turma
    @PreAuthorize("hasRole('DIRETOR') or hasAuthority('BOLETIM_READ')")
    @GetMapping("/turma/{idTurma}")
    public ResponseEntity<BoletimTurmaDTO> boletimDaTurma(@PathVariable Long idTurma) {
        return ResponseEntity.ok(service.gerarBoletimDaTurma(idTurma));
    }
}
