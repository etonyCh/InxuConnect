package com.inzuconnect.inzuconnect_api.web.error;

import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.OptimisticLockingFailureException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.validation.FieldError;
import org.springframework.web.HttpMediaTypeNotSupportedException;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.multipart.support.MissingServletRequestPartException;
import org.springframework.web.servlet.NoHandlerFoundException;

import java.net.URI;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);
    private static final String RFC_TYPE_BASE = "https://inzuconnect.bi/problem/";

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ProblemDetail handleValidation(MethodArgumentNotValidException ex, HttpServletRequest req) {
        ProblemDetail detail = ProblemDetail.forStatusAndDetail(
                HttpStatus.UNPROCESSABLE_CONTENT,
                "La validation de la requête a échoué."
        );
        detail.setType(URI.create(RFC_TYPE_BASE + "validation-failed"));
        detail.setTitle("Validation échouée");
        detail.setInstance(URI.create(req.getRequestURI()));

        List<FieldValidationError> violations = new ArrayList<>();
        for (FieldError fe : ex.getBindingResult().getFieldErrors()) {
            violations.add(new FieldValidationError(
                    fe.getField(),
                    fe.getRejectedValue() != null ? fe.getRejectedValue().toString() : null,
                    fe.getDefaultMessage()
            ));
        }
        detail.setProperty("timestamp", Instant.now());
        detail.setProperty("violations", violations);
        detail.setProperty("violationCount", violations.size());
        log.warn("Validation failed for {}: {}", req.getRequestURI(), violations);
        return detail;
    }

    @ExceptionHandler({
            MissingServletRequestParameterException.class,
            MissingServletRequestPartException.class,
            HttpMessageNotReadableException.class,
            MethodArgumentTypeMismatchException.class
    })
    public ProblemDetail handleBadRequest(Exception ex, HttpServletRequest req) {
        ProblemDetail detail = ProblemDetail.forStatusAndDetail(
                HttpStatus.BAD_REQUEST,
                ex.getMessage()
        );
        detail.setType(URI.create(RFC_TYPE_BASE + "bad-request"));
        detail.setTitle("Requête invalide");
        detail.setInstance(URI.create(req.getRequestURI()));
        detail.setProperty("timestamp", Instant.now());
        log.warn("Bad request on {}: {}", req.getRequestURI(), ex.getMessage());
        return detail;
    }

    @ExceptionHandler(ResourceNotFoundException.class)
    public ProblemDetail handleNotFound(ResourceNotFoundException ex, HttpServletRequest req) {
        ProblemDetail detail = ProblemDetail.forStatusAndDetail(
                HttpStatus.NOT_FOUND,
                ex.getMessage()
        );
        detail.setType(URI.create(RFC_TYPE_BASE + "not-found"));
        detail.setTitle("Ressource introuvable");
        detail.setInstance(URI.create(req.getRequestURI()));
        detail.setProperty("resource", ex.getResourceName());
        detail.setProperty("field", ex.getFieldName());
        detail.setProperty("value", ex.getFieldValue());
        detail.setProperty("timestamp", Instant.now());
        log.debug("Resource not found: {}", ex.getMessage());
        return detail;
    }

    @ExceptionHandler({UnauthorizedException.class, AuthenticationException.class, BadCredentialsException.class})
    public ProblemDetail handleUnauthorized(Exception ex, HttpServletRequest req) {
        ProblemDetail detail = ProblemDetail.forStatusAndDetail(
                HttpStatus.UNAUTHORIZED,
                ex.getMessage() != null ? ex.getMessage() : "Authentification requise"
        );
        detail.setType(URI.create(RFC_TYPE_BASE + "unauthorized"));
        detail.setTitle("Non authentifié");
        detail.setInstance(URI.create(req.getRequestURI()));
        detail.setProperty("timestamp", Instant.now());
        log.info("Unauthorized access attempt on {}: {}", req.getRequestURI(), ex.getMessage());
        return detail;
    }

    @ExceptionHandler({ForbiddenException.class, AccessDeniedException.class})
    public ProblemDetail handleForbidden(Exception ex, HttpServletRequest req) {
        ProblemDetail detail = ProblemDetail.forStatusAndDetail(
                HttpStatus.FORBIDDEN,
                ex.getMessage() != null ? ex.getMessage() : "Accès interdit"
        );
        detail.setType(URI.create(RFC_TYPE_BASE + "forbidden"));
        detail.setTitle("Accès interdit");
        detail.setInstance(URI.create(req.getRequestURI()));
        detail.setProperty("timestamp", Instant.now());
        log.warn("Forbidden access on {}: {}", req.getRequestURI(), ex.getMessage());
        return detail;
    }

    @ExceptionHandler(BusinessException.class)
    public ProblemDetail handleBusiness(BusinessException ex, HttpServletRequest req) {
        ProblemDetail detail = ProblemDetail.forStatusAndDetail(
                HttpStatus.CONFLICT,
                ex.getMessage()
        );
        detail.setType(URI.create(RFC_TYPE_BASE + ex.getErrorCode().toLowerCase()));
        detail.setTitle("Erreur métier");
        detail.setInstance(URI.create(req.getRequestURI()));
        detail.setProperty("errorCode", ex.getErrorCode());
        detail.setProperty("timestamp", Instant.now());
        log.info("Business error on {}: [{}] {}", req.getRequestURI(), ex.getErrorCode(), ex.getMessage());
        return detail;
    }

    @ExceptionHandler(OptimisticLockingFailureException.class)
    public ProblemDetail handleOptimisticLocking(OptimisticLockingFailureException ex, HttpServletRequest req) {
        ProblemDetail detail = ProblemDetail.forStatusAndDetail(
                HttpStatus.CONFLICT,
                "Conflit d'optimistic locking : la ressource a été modifiée par un autre utilisateur."
        );
        detail.setType(URI.create(RFC_TYPE_BASE + "conflict"));
        detail.setTitle("Conflit de mise à jour");
        detail.setInstance(URI.create(req.getRequestURI()));
        detail.setProperty("timestamp", Instant.now());
        log.warn("Optimistic locking conflict on {}: {}", req.getRequestURI(), ex.getMessage());
        return detail;
    }

    @ExceptionHandler(NoHandlerFoundException.class)
    public ProblemDetail handleNoHandler(NoHandlerFoundException ex, HttpServletRequest req) {
        ProblemDetail detail = ProblemDetail.forStatusAndDetail(
                HttpStatus.NOT_FOUND,
                "Aucun endpoint trouvé pour " + ex.getHttpMethod() + " " + ex.getRequestURL()
        );
        detail.setType(URI.create(RFC_TYPE_BASE + "not-found"));
        detail.setTitle("Endpoint introuvable");
        detail.setInstance(URI.create(req.getRequestURI()));
        detail.setProperty("timestamp", Instant.now());
        return detail;
    }

    @ExceptionHandler({HttpRequestMethodNotSupportedException.class, HttpMediaTypeNotSupportedException.class})
    public ProblemDetail handleMethodNotSupported(Exception ex, HttpServletRequest req) {
        ProblemDetail detail = ProblemDetail.forStatusAndDetail(
                HttpStatus.METHOD_NOT_ALLOWED,
                ex.getMessage()
        );
        detail.setType(URI.create(RFC_TYPE_BASE + "method-not-allowed"));
        detail.setTitle("Méthode non autorisée");
        detail.setInstance(URI.create(req.getRequestURI()));
        detail.setProperty("timestamp", Instant.now());
        return detail;
    }

    @ExceptionHandler(Exception.class)
    public ProblemDetail handleGeneric(Exception ex, HttpServletRequest req) {
        ProblemDetail detail = ProblemDetail.forStatusAndDetail(
                HttpStatus.INTERNAL_SERVER_ERROR,
                "Une erreur interne est survenue. Veuillez réessayer ultérieurement."
        );
        detail.setType(URI.create(RFC_TYPE_BASE + "internal-error"));
        detail.setTitle("Erreur interne du serveur");
        detail.setInstance(URI.create(req.getRequestURI()));
        detail.setProperty("timestamp", Instant.now());
        detail.setProperty("traceId", req.getHeader("X-Trace-ID"));
        log.error("Unhandled exception on {} {}: {}",
                req.getMethod(), req.getRequestURI(), ex.getMessage(), ex);
        return detail;
    }

    public record FieldValidationError(String field, String rejectedValue, String message) {}
}
