package fi.oph.ludos.exception

import com.fasterxml.jackson.databind.exc.InvalidTypeIdException
import org.slf4j.Logger
import org.slf4j.LoggerFactory
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.http.converter.HttpMessageNotReadableException
import org.springframework.validation.BindException
import org.springframework.validation.FieldError
import org.springframework.web.bind.annotation.ControllerAdvice
import org.springframework.web.bind.annotation.ExceptionHandler

@ControllerAdvice
class ApiExceptionHandler {
    private final val logger: Logger = LoggerFactory.getLogger(javaClass)

    @ExceptionHandler(BindException::class)
    fun handleBindException(ex: BindException): ResponseEntity<Any> {
        val errors = ex.bindingResult.fieldErrors.map { fieldError: FieldError ->
            "${fieldError.field}: ${fieldError.defaultMessage}"
        }

        logger.error(ex.message)
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errors.sorted().joinToString("\n"))
    }

    @ExceptionHandler(ApiRequestException::class)
    fun handleApiRequestException(ex: ApiRequestException) =
        ResponseEntity.status(HttpStatus.BAD_REQUEST).body("ApiRequestException: ${ex.message}")

    @ExceptionHandler(HttpMessageNotReadableException::class)
    fun handleHttpMessageNotReadableException(ex: HttpMessageNotReadableException) =
        if (ex.cause is InvalidTypeIdException) {
            ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Invalid type: ${ex.message}")
        } else {
            ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Invalid JSON payload: ${ex.message}")
        }

        is BindException -> {
            val errors = ex.bindingResult.fieldErrors.map { fieldError: FieldError ->
                "${fieldError.field}: ${fieldError.defaultMessage}"
            }

            logger.error(ex.message)
            ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errors.sorted().joinToString("\n"))
        }

        else -> {
            logger.error("Unexpected error", ex)
            ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Unexpected error: ${ex.message}")
        }
    }
}


