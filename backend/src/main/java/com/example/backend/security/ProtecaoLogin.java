package com.example.backend.security;

import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.Instant;
import java.util.Locale;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Bloqueio de login por tentativas erradas: 5 senhas erradas seguidas no mesmo
 * login bloqueiam esse login por 15 minutos. Sem isso dava para testar senhas
 * sem limite.
 *
 * Fica em memória: reiniciar o backend zera os contadores, o que é aceitável
 * para uma escola com um servidor só.
 */
@Component
public class ProtecaoLogin {

    static final int TENTATIVAS_MAXIMAS = 5;
    static final Duration BLOQUEIO = Duration.ofMinutes(15);
    private static final int LIMPAR_ACIMA_DE = 1000;

    private static class Registro {
        int falhas;
        Instant ultimaFalha;
        Instant bloqueadoAte;
    }

    private final Map<String, Registro> registros = new ConcurrentHashMap<>();

    /** Minutos que ainda faltam de bloqueio (0 = pode tentar). */
    public long minutosBloqueado(String login) {
        Registro r = registros.get(chave(login));
        if (r == null || r.bloqueadoAte == null) return 0;
        Duration falta = Duration.between(agora(), r.bloqueadoAte);
        if (falta.isNegative() || falta.isZero()) {
            registros.remove(chave(login));
            return 0;
        }
        return Math.max(1, (falta.getSeconds() + 59) / 60);
    }

    /** Conta uma senha errada; devolve true se este erro bloqueou o login. */
    public boolean registrarFalha(String login) {
        limparAntigos();
        Registro r = registros.computeIfAbsent(chave(login), k -> new Registro());
        synchronized (r) {
            r.falhas++;
            r.ultimaFalha = agora();
            if (r.falhas >= TENTATIVAS_MAXIMAS) {
                r.bloqueadoAte = agora().plus(BLOQUEIO);
                r.falhas = 0;
                return true;
            }
            return false;
        }
    }

    public void registrarSucesso(String login) {
        registros.remove(chave(login));
    }

    // Logins inventados por quem testa senhas não podem crescer o mapa para sempre
    private void limparAntigos() {
        if (registros.size() < LIMPAR_ACIMA_DE) return;
        Instant limite = agora().minus(BLOQUEIO);
        registros.entrySet().removeIf(e -> {
            Registro r = e.getValue();
            boolean bloqueado = r.bloqueadoAte != null && r.bloqueadoAte.isAfter(agora());
            return !bloqueado && (r.ultimaFalha == null || r.ultimaFalha.isBefore(limite));
        });
    }

    private static String chave(String login) {
        return login == null ? "" : login.trim().toLowerCase(Locale.ROOT);
    }

    Instant agora() {
        return Instant.now();
    }
}
