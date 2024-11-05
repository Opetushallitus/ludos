package fi.oph.ludos.config

import fi.oph.ludos.Constants
import fi.oph.ludos.auth.RequireAtLeastYllapitajaRole
import org.springframework.beans.factory.annotation.Value
import org.springframework.context.annotation.Configuration
import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.stereotype.Component
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.ResponseBody
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("${Constants.API_PREFIX}/config")
@RequireAtLeastYllapitajaRole
class ConfigController(val features: Features) {
    @GetMapping("/features", produces = ["application/json"])
    @ResponseBody
    @PreAuthorize("permitAll()")
    fun getFeatures(): ResponseEntity<FeaturesResponse> {
        return ResponseEntity.ok(FeaturesResponse())
    }
}

// Data class cannot be empty. Make dummy property as a placeholder until we get more featureflags
data class FeaturesResponse(
    val dummy: Unit = Unit
)

@Component
@Configuration
class Features(
)