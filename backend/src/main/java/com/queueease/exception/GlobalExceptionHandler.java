package com.queueease.exception;

import com.queueease.dto.ApiResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.support.DefaultMessageSourceResolvable;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import org.springframework.web.multipart.support.MissingServletRequestPartException;

@RestControllerAdvice
public class GlobalExceptionHandler {
    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(ApiException.class)
    public ResponseEntity<ApiResponse> api(ApiException e) {
        return ResponseEntity.status(e.getStatus()).body(ApiResponse.fail(e.getMessage()));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse> invalid(MethodArgumentNotValidException e) {
        String m = e.getBindingResult().getFieldErrors().stream().findFirst()
            .map(DefaultMessageSourceResolvable::getDefaultMessage).orElse("Invalid request.");
        return ResponseEntity.badRequest().body(ApiResponse.fail(m));
    }

    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<ApiResponse> tooBig(MaxUploadSizeExceededException e) {
        return ResponseEntity.badRequest().body(ApiResponse.fail("This file is too large for the server to accept."));
    }

    @ExceptionHandler({HttpMessageNotReadableException.class, MissingServletRequestPartException.class})
    public ResponseEntity<ApiResponse> bad(Exception e) {
        return ResponseEntity.badRequest().body(ApiResponse.fail("Invalid request."));
    }

    @ExceptionHandler(org.springframework.dao.DataIntegrityViolationException.class)
    public ResponseEntity<ApiResponse> duplicate(Exception e) {
        return ResponseEntity.status(409).body(ApiResponse.fail("This username or roll number is already registered."));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse> other(Exception e) {
        log.error("Unexpected error", e);
        return ResponseEntity.status(500).body(ApiResponse.fail("Something went wrong. Please try again."));
    }
}
