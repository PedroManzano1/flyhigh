package com.example.backend.controller;

import com.example.backend.model.ModeloContrato;
import com.example.backend.service.ModeloContratoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

/**
 * Textos dos contratos. Por padrão só o diretor mexe; o módulo MODELOS_CONTRATO
 * na matriz de perfis permite liberar para mais alguém. Quem lê contratos também
 * lê o texto da versão usada por eles, senão não conseguiria imprimir.
 */
@RestController
@RequestMapping("/api/modelos-contrato")
@CrossOrigin(origins = "http://localhost:3000")
public class ModeloContratoController {

    @Autowired
    private ModeloContratoService service;

    @PreAuthorize("hasRole('DIRETOR') or hasAuthority('MODELOS_CONTRATO_READ')")
    @GetMapping
    public List<ModeloContrato> listar() {
        return service.listar();
    }

    @PreAuthorize("hasRole('DIRETOR') or hasAuthority('MODELOS_CONTRATO_READ') or hasAuthority('CONTRATOS_READ')")
    @GetMapping("/{id}")
    public ModeloContrato buscar(@PathVariable Long id) {
        return service.buscar(id);
    }

    @PreAuthorize("hasRole('DIRETOR') or hasAuthority('MODELOS_CONTRATO_READ') or hasAuthority('CONTRATOS_READ')")
    @GetMapping("/vigente/{tipo}")
    public ModeloContrato vigente(@PathVariable String tipo) {
        return service.vigente(tipo).orElseThrow(() ->
                new ResponseStatusException(HttpStatus.NOT_FOUND, "Não há modelo publicado para o contrato " + tipo + "."));
    }

    // Cria um rascunho copiando a versão informada (normalmente a vigente)
    @PreAuthorize("hasRole('DIRETOR') or hasAuthority('MODELOS_CONTRATO_WRITE')")
    @PostMapping("/{id}/nova-versao")
    public ModeloContrato novaVersao(@PathVariable Long id) {
        return service.novaVersao(id);
    }

    @PreAuthorize("hasRole('DIRETOR') or hasAuthority('MODELOS_CONTRATO_WRITE')")
    @PutMapping("/{id}")
    public ModeloContrato salvar(@PathVariable Long id, @RequestBody ModeloContrato dados) {
        return service.salvarRascunho(id, dados);
    }

    @PreAuthorize("hasRole('DIRETOR') or hasAuthority('MODELOS_CONTRATO_WRITE')")
    @PostMapping("/{id}/publicar")
    public ModeloContrato publicar(@PathVariable Long id) {
        return service.publicar(id);
    }

    // Só rascunho pode ser apagado; versão publicada fica para sempre no histórico
    @PreAuthorize("hasRole('DIRETOR') or hasAuthority('MODELOS_CONTRATO_DELETE')")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> descartar(@PathVariable Long id) {
        service.descartar(id);
        return ResponseEntity.noContent().build();
    }
}
