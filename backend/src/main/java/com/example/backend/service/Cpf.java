package com.example.backend.service;

import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

/**
 * CPF de alunos e responsáveis.
 *
 * Campo em branco vira nulo: a coluna é única, e o Postgres aceita vários nulos
 * mas não dois textos vazios (era isso que travava o segundo aluno sem CPF).
 * O CPF preenchido é gravado sempre no mesmo formato, 000.000.000-00, para
 * "52998224725" e "529.982.247-25" não virarem dois cadastros.
 */
public final class Cpf {

    private Cpf() {
    }

    public static String somenteNumeros(String texto) {
        return texto == null ? "" : texto.replaceAll("\\D", "");
    }

    /** Nulo quando não veio número nenhum; 400 quando não tem 11 dígitos. */
    public static String normalizar(String texto) {
        String numeros = somenteNumeros(texto);
        if (numeros.isEmpty()) return null;
        if (numeros.length() != 11) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "O CPF precisa ter 11 números (foram digitados " + numeros.length() + ").");
        }
        return numeros.substring(0, 3) + "." + numeros.substring(3, 6) + "."
                + numeros.substring(6, 9) + "-" + numeros.substring(9);
    }
}
