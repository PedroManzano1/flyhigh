package com.example.backend.controller;

import com.example.backend.model.Frequencia;
import com.example.backend.service.AcessoPedagogicoService;
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

    @Autowired
    private AcessoPedagogicoService acesso;

    @PreAuthorize("hasRole('DIRETOR') or hasAuthority('FREQUENCIAS_WRITE')")
    @PostMapping("/chamada")
    public ResponseEntity<List<Frequencia>> realizarChamada(@RequestBody List<Frequencia> frequencias) {
        List<Frequencia> chamadasSalvas = service.registrarChamadaCompleta(frequencias);
        return ResponseEntity.ok(chamadasSalvas);
    }

    @PreAuthorize("hasRole('DIRETOR') or hasAuthority('FREQUENCIAS_READ')")
    @GetMapping("/aluno/{idAluno}")
    public ResponseEntity<List<Frequencia>> listarFrequenciasDoAluno(@PathVariable Long idAluno) {
        return ResponseEntity.ok(acesso.filtrarPorTurma(service.buscarFrequenciasPorAluno(idAluno),
                f -> f.getAula() != null ? f.getAula().getTurma() : null));
    }

    @PreAuthorize("hasRole('DIRETOR') or hasAuthority('FREQUENCIAS_READ')")
    @GetMapping("/aula/{idAula}")
    public ResponseEntity<List<Frequencia>> listarFrequenciasDaAula(@PathVariable Long idAula) {
        return ResponseEntity.ok(acesso.filtrarPorTurma(service.buscarFrequenciaDaAula(idAula),
                f -> f.getAula() != null ? f.getAula().getTurma() : null));
    }

    // Mapa de frequência da turma inteira: alimenta o resumo e o alerta de evasão da tela de Faltas.
    @PreAuthorize("hasRole('DIRETOR') or hasAuthority('FREQUENCIAS_READ')")
    @GetMapping("/turma/{idTurma}")
    public ResponseEntity<List<Frequencia>> listarFrequenciasDaTurma(@PathVariable Long idTurma) {
        acesso.validarLeituraDaTurma(idTurma);
        return ResponseEntity.ok(service.buscarFrequenciasPorTurma(idTurma));
    }
}
