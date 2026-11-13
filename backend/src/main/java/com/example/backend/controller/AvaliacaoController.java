package com.example.backend.controller;

import com.example.backend.model.Avaliacao;
import com.example.backend.service.AcessoPedagogicoService;
import com.example.backend.service.AvaliacaoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/avaliacoes")
@CrossOrigin(origins = "http://localhost:3000")
public class AvaliacaoController {

    @Autowired
    private AvaliacaoService service;

    @Autowired
    private AcessoPedagogicoService acesso;

    @PreAuthorize("hasRole('DIRETOR') or hasAuthority('AVALIACOES_WRITE')")
    @PostMapping
    public Avaliacao create(@RequestBody Avaliacao avaliacao) {
        return service.salvar(avaliacao);
    }

    // Cria as atividades da planilha da escola: /modelo/400 ou /modelo/500
    @PreAuthorize("hasRole('DIRETOR') or hasAuthority('AVALIACOES_WRITE')")
    @PostMapping("/turma/{idTurma}/modelo/{pontuacao}")
    public List<Avaliacao> aplicarModelo(@PathVariable Long idTurma, @PathVariable Integer pontuacao) {
        return service.aplicarModelo(idTurma, pontuacao);
    }

    @PreAuthorize("hasRole('DIRETOR') or hasAuthority('AVALIACOES_READ')")
    @GetMapping
    public List<Avaliacao> getAll() {
        return acesso.filtrarPorTurma(service.listarTodos(), Avaliacao::getTurma);
    }

    @PreAuthorize("hasRole('DIRETOR') or hasAuthority('AVALIACOES_READ')")
    @GetMapping("/{id}")
    public ResponseEntity<Avaliacao> getById(@PathVariable Long id) {
        return service.buscarPorId(id)
                .map(a -> {
                    acesso.validarLeituraDaTurma(a.getTurma() != null ? a.getTurma().getId_turma() : null);
                    return a;
                })
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PreAuthorize("hasRole('DIRETOR') or hasAuthority('AVALIACOES_READ')")
    @GetMapping("/turma/{idTurma}")
    public ResponseEntity<List<Avaliacao>> getByTurma(@PathVariable Long idTurma) {
        acesso.validarLeituraDaTurma(idTurma);
        return ResponseEntity.ok(service.buscarPorTurma(idTurma));
    }

    @PreAuthorize("hasRole('DIRETOR') or hasAuthority('AVALIACOES_WRITE')")
    @PutMapping("/editar/{id}")
    public ResponseEntity<Avaliacao> update(@PathVariable Long id, @RequestBody Avaliacao avaliacao) {
        return service.buscarPorId(id).map(existente -> {
            avaliacao.setId_avaliacao(id); // Setando o ID da URL na entidade
            return ResponseEntity.ok(service.salvar(avaliacao));
        }).orElse(ResponseEntity.notFound().build());
    }

    @PreAuthorize("hasRole('DIRETOR') or hasAuthority('AVALIACOES_DELETE')")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        if (service.buscarPorId(id).isPresent()) {
            service.excluir(id);
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }
}