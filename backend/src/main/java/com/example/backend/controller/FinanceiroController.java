package com.example.backend.controller;

import com.example.backend.dto.AjusteParcelaDTO;
import com.example.backend.dto.BaixaParcelaDTO;
import com.example.backend.dto.ParcelaFinanceiraDTO;
import com.example.backend.dto.ResumoFinanceiroDTO;
import com.example.backend.service.FinanceiroService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

/**
 * Diretor tem acesso total. O secretário recebe FINANCEIRO_READ e FINANCEIRO_WRITE
 * (consultar e dar baixa); estorno e exclusão ficam no FINANCEIRO_DELETE.
 */
@RestController
@RequestMapping("/api/financeiro")
@CrossOrigin(origins = "http://localhost:3000")
public class FinanceiroController {

    @Autowired
    private FinanceiroService service;

    @PreAuthorize("hasRole('DIRETOR') or hasAuthority('FINANCEIRO_READ')")
    @GetMapping("/parcelas")
    public List<ParcelaFinanceiraDTO> listar(
            @RequestParam(required = false) String busca,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String tipo,
            @RequestParam(required = false) Integer idContrato,
            @RequestParam(required = false) Long idAluno,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate vencimentoDe,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate vencimentoAte) {
        return service.listar(busca, status, tipo, idContrato, idAluno, vencimentoDe, vencimentoAte);
    }

    @PreAuthorize("hasRole('DIRETOR') or hasAuthority('FINANCEIRO_READ')")
    @GetMapping("/resumo")
    public ResumoFinanceiroDTO resumo() {
        return service.resumo();
    }

    // "Marcar como paga"
    @PreAuthorize("hasRole('DIRETOR') or hasAuthority('FINANCEIRO_WRITE')")
    @PatchMapping("/parcelas/{id}/baixa")
    public ParcelaFinanceiraDTO darBaixa(@PathVariable Long id, @RequestBody BaixaParcelaDTO baixa) {
        return service.darBaixa(id, baixa);
    }

    @PreAuthorize("hasRole('DIRETOR') or hasAuthority('FINANCEIRO_DELETE')")
    @PatchMapping("/parcelas/{id}/estorno")
    public ParcelaFinanceiraDTO estornar(@PathVariable Long id) {
        return service.estornar(id);
    }

    @PreAuthorize("hasRole('DIRETOR') or hasAuthority('FINANCEIRO_WRITE')")
    @PutMapping("/parcelas/{id}")
    public ParcelaFinanceiraDTO ajustar(@PathVariable Long id, @RequestBody AjusteParcelaDTO ajuste) {
        return service.ajustar(id, ajuste);
    }

    @PreAuthorize("hasRole('DIRETOR') or hasAuthority('FINANCEIRO_DELETE')")
    @DeleteMapping("/parcelas/{id}")
    public ResponseEntity<Void> excluir(@PathVariable Long id) {
        service.excluir(id);
        return ResponseEntity.noContent().build();
    }
}
