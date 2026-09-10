package com.example.backend.exception;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.ErrorResponse;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Centraliza os erros da API num JSON previsível: { status, error, message, timestamp }.
 * O frontend lê o campo "message" (utils/api.js -> mensagemErro).
 */
@RestControllerAdvice
public class ApiExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(ApiExceptionHandler.class);

    // Erros lançados de propósito pelos services
    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<Map<String, Object>> tratarResponseStatus(ResponseStatusException ex) {
        String mensagem = ex.getReason() != null ? ex.getReason() : ex.getMessage();
        return montar(ex.getStatusCode(), mensagem);
    }

    /**
     * Violação de constraint do banco (CPF, matrícula ou login duplicado, FK em uso).
     * Sem isso o cliente recebia um 500 com a mensagem crua do Postgres.
     */
    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<Map<String, Object>> tratarViolacaoDeIntegridade(DataIntegrityViolationException ex) {
        log.warn("Violação de integridade: {}", ex.getMostSpecificCause().getMessage());
        return montar(HttpStatus.CONFLICT, traduzirViolacao(ex));
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<Map<String, Object>> tratarAcessoNegado(AccessDeniedException ex) {
        return montar(HttpStatus.FORBIDDEN, "Você não tem permissão para executar esta ação.");
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<Map<String, Object>> tratarCorpoInvalido(HttpMessageNotReadableException ex) {
        return montar(HttpStatus.BAD_REQUEST, "Os dados enviados estão em formato inválido.");
    }

    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<Map<String, Object>> tratarParametroInvalido(MethodArgumentTypeMismatchException ex) {
        return montar(HttpStatus.BAD_REQUEST, "O parâmetro \"" + ex.getName() + "\" está inválido.");
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, Object>> tratarArgumentoInvalido(IllegalArgumentException ex) {
        return montar(HttpStatus.BAD_REQUEST, ex.getMessage());
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> tratarErroInesperado(Exception ex) {
        // Exceções do próprio Spring (404 de rota, parâmetro ausente) já sabem o status certo
        if (ex instanceof ErrorResponse erro) {
            return montar(erro.getStatusCode(), ex.getMessage());
        }

        // RuntimeException com mensagem própria dos services antigos ("Usuário não encontrado")
        if (ex instanceof RuntimeException && ex.getMessage() != null && ex.getClass() == RuntimeException.class) {
            return montar(HttpStatus.BAD_REQUEST, ex.getMessage());
        }

        log.error("Erro inesperado na API", ex);
        return montar(HttpStatus.INTERNAL_SERVER_ERROR,
                "Erro interno no servidor. Verifique o console do backend para os detalhes.");
    }

    private String traduzirViolacao(DataIntegrityViolationException ex) {
        String detalhe = ex.getMostSpecificCause().getMessage();
        String texto = detalhe == null ? "" : detalhe.toLowerCase();

        if (texto.contains("cpf")) {
            return "Já existe um cadastro com este CPF.";
        }
        if (texto.contains("numero_matricula") || texto.contains("numeromatricula")) {
            return "Já existe um aluno com este número de matrícula.";
        }
        if (texto.contains("login")) {
            return "Já existe um usuário com este login.";
        }
        if (texto.contains("codigo_turma")) {
            return "Já existe uma turma com este código.";
        }
        if (texto.contains("foreign key") || texto.contains("chave estrangeira")) {
            return "Este registro está sendo usado em outro cadastro e não pode ser removido ou alterado.";
        }
        if (texto.contains("not null") || texto.contains("não nulo")) {
            return "Existem campos obrigatórios não preenchidos.";
        }
        return "A operação viola uma regra de integridade dos dados.";
    }

    private ResponseEntity<Map<String, Object>> montar(HttpStatusCode status, String mensagem) {
        Map<String, Object> corpo = new LinkedHashMap<>();
        corpo.put("timestamp", LocalDateTime.now().toString());
        corpo.put("status", status.value());
        corpo.put("error", HttpStatus.valueOf(status.value()).getReasonPhrase());
        corpo.put("message", mensagem != null ? mensagem : "Não foi possível concluir a operação.");
        return ResponseEntity.status(status).body(corpo);
    }
}
