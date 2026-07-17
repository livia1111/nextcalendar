package com.nextcalendar.exception;

import java.util.UUID;

public class EntityNotFoundException extends RuntimeException {
    public EntityNotFoundException(String entityName, UUID id) {
        super(entityName+" com ID " + id + " não encontrada.");
    }
}
