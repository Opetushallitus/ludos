package fi.oph.ludos.exception

import com.fasterxml.jackson.databind.exc.InvalidTypeIdException
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.http.converter.HttpMessageNotReadableException
import org.springframework.web.bind.annotation.ControllerAdvice
import org.springframework.web.bind.annotation.ExceptionHandler
import org.springframework.web.server.ResponseStatusException

@ControllerAdvice
class ApiExceptionHandler {
    @ExceptionHandler(Exception::class)
    fun handleException(ex: Exception): ResponseEntity<Any> = when (ex) {
        is ApiRequestException -> {
            ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body("APiRequestException: ${ex.message}")
        }

        is HttpMessageNotReadableException -> {
            if (ex.cause is InvalidTypeIdException) {
                ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Invalid type: ${ex.message}")
            } else {
                ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Invalid JSON payload: ${ex.message}")
            }
        }

        is ResponseStatusException -> {
            ResponseEntity.status(HttpStatus.NOT_FOUND).body(ex.message)
        }

        else -> ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Unexpected error: ${ex.message}")
    }
}


