package com.nextcalendar.exception;

import java.util.UUID;

public class ClientNotFoundException extends RuntimeException {
    public ClientNotFoundException(UUID id) {
        super("ID " + id + " não encontrado.");
    }
}
