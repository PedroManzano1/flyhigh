package com.example.backend.controller;

import com.example.backend.dto.MinhaAreaDTO;
import com.example.backend.service.MinhaAreaService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

/** Área do aluno: boletim, parcelas e recados da própria conta. */
@RestController
@RequestMapping("/api/minha-area")
@CrossOrigin(origins = "http://localhost:3000")
public class MinhaAreaController {

    @Autowired
    private MinhaAreaService service;

    @PreAuthorize("hasRole('ALUNO')")
    @GetMapping
    public MinhaAreaDTO minhaArea() {
        return service.montar();
    }
}
