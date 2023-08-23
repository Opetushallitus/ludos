package fi.oph.ludos.exception

import com.fasterxml.jackson.databind.exc.InvalidTypeIdException
import org.slf4j.Logger
import org.slf4j.LoggerFactory
import org.springframework.security.access.AccessDeniedException
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.http.converter.HttpMessageNotReadableException
import org.springframework.validation.BindException
import org.springframework.validation.FieldError
import org.springframework.web.bind.annotation.ControllerAdvice
import org.springframework.web.bind.annotation.ExceptionHandler
import org.springframework.web.server.ResponseStatusException

@ControllerAdvice
class ApiExceptionHandler {
    private final val logger: Logger = LoggerFactory.getLogger(javaClass)

    @ExceptionHandler(BindException::class)
    fun handleBindException(ex: BindException): ResponseEntity<String> {
        val fieldErrors = ex.bindingResult.fieldErrors.map { fieldError: FieldError ->
            "${fieldError.field}: ${fieldError.defaultMessage}"
        }

        val globalErrors = ex.globalErrors.map {
            "Global error: ${it.defaultMessage}"
        }

        logger.error("BindException: ${ex.message}")
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body((fieldErrors.sorted() + globalErrors.sorted()).joinToString("\n"))
    }

    @ExceptionHandler(HttpMessageNotReadableException::class)
    fun handleHttpMessageNotReadableException(ex: HttpMessageNotReadableException): ResponseEntity<String> =
        if (ex.cause is InvalidTypeIdException) {
            ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Invalid type: ${ex.message}")
        } else {
            ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Invalid JSON payload: ${ex.message}")
        }

    @ExceptionHandler(ResponseStatusException::class)
    fun handleApiResponseStatusException(ex: ResponseStatusException) = ResponseEntity.status(ex.status).body(ex.reason)

    @ExceptionHandler(AccessDeniedException::class)
    fun handleAccessdenied(ex: AccessDeniedException): ResponseEntity<String> {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ex.message)
    }
}
