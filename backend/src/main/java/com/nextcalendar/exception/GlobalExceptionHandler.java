package com.nextcalendar.exception;

import com.nextcalendar.dto.ValidationErrorResponseDTO;
import jakarta.persistence.OptimisticLockException;
import jakarta.persistence.PessimisticLockException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;

import java.util.List;

@ControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(EntityNotFoundException.class)
    public ResponseEntity<String> handleEntityNotFound(EntityNotFoundException ex) {
        return ResponseEntity
                .status(HttpStatus.NOT_FOUND)
                .body(ex.getMessage());
    }

    // UC06 — Dados inválidos (falha de validação de campos) → 422 Unprocessable Entity
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<List<ValidationErrorResponseDTO>> handleValidationException(MethodArgumentNotValidException ex){
        List<ValidationErrorResponseDTO> errors = ex.getBindingResult()
                .getFieldErrors()
                .stream()
                .map(fieldError -> new
                        ValidationErrorResponseDTO(
                                fieldError.getField(),
                        fieldError.getDefaultMessage()
                ))
                .toList();
        return ResponseEntity
                .status(HttpStatus.valueOf(422))
                .body(errors);
    }

    @ExceptionHandler(BusinessException.class)
    public ResponseEntity<String> handleBusinessException(BusinessException ex) {
        return  ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(ex.getMessage());
    }

    // UC01 — Fluxo alternativo 2a: CNPJ já cadastrado → 409 Conflict
    @ExceptionHandler(DuplicateResourceException.class)
    public ResponseEntity<String> handleDuplicateResource(DuplicateResourceException ex) {
        return ResponseEntity
                .status(HttpStatus.CONFLICT)
                .body(ex.getMessage());
    }

    // UC01 — Fluxo alternativo 6a: CEP inválido → 422 Unprocessable Entity
    @ExceptionHandler(CepInvalidException.class)
    public ResponseEntity<String> handleCepInvalid(CepInvalidException ex) {
        return ResponseEntity
                .status(HttpStatus.valueOf(422))
                .body(ex.getMessage());
    }

    @ExceptionHandler({OptimisticLockException.class, PessimisticLockException.class})
    public ResponseEntity<String> handleLockConflict(Exception ex) {
        return ResponseEntity
                .status(HttpStatus.CONFLICT)
                .body("Este horário acabou de ser reservado por outro cliente. Por favor, escolha outro horário.");
    }

    @ExceptionHandler(org.springframework.security.access.AccessDeniedException.class)
    public ResponseEntity<String> handleAccessDenied(org.springframework.security.access.AccessDeniedException ex) {
        return ResponseEntity
                .status(HttpStatus.FORBIDDEN)
                .body(ex.getMessage() != null ? ex.getMessage() : "Acesso negado.");
    }
}
