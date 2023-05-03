package fi.oph.ludos.healthcheck

import fi.oph.ludos.Constants
import fi.oph.ludos.assignment.*
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController


data class HealthCheckResult(
    val isHealthy: Boolean
)

@RestController
@RequestMapping("${Constants.API_PREFIX}/health-check")
class HealthCheckController {
    @GetMapping("")
    fun getAssignment(): HealthCheckResult {
        return HealthCheckResult(isHealthy = true)
    }
}