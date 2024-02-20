package fi.oph.ludos.healthcheck

import fi.oph.ludos.Constants
import fi.oph.ludos.auth.RequireAtLeastYllapitajaRole
import org.springframework.http.ResponseEntity
import org.springframework.jdbc.core.JdbcTemplate
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController


@RestController
@RequestMapping("${Constants.API_PREFIX}/health-check")
@RequireAtLeastYllapitajaRole
class HealthCheckController(private val jdbcTemplate: JdbcTemplate) {
    @GetMapping("")
    @PreAuthorize("permitAll()")
    fun healthCheck(): ResponseEntity<Nothing> {
        try {
            jdbcTemplate.query("SELECT 1") { rs, _ -> rs.getInt(1) }.firstOrNull()
        } catch (e: Exception) {
            return ResponseEntity.internalServerError().build()
        }

        return ResponseEntity.ok().build()
    }
}