package fi.oph.ludos.config

import fi.oph.ludos.Constants
import fi.oph.ludos.auth.RequireAtLeastOpettajaRole
import org.springframework.boot.context.properties.ConfigurationProperties
import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.stereotype.Component
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.ResponseBody
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("${Constants.API_PREFIX}/config")
@RequireAtLeastOpettajaRole
class ConfigController(val features: Features) {
    @GetMapping("/features", produces = ["application/json"])
    @ResponseBody
    @PreAuthorize("permitAll()")
    fun getFeatures(): ResponseEntity<FeaturesResponse> {
        return ResponseEntity.ok(FeaturesResponse(qrCodesForLinks = features.qrCodesForLinks))
    }
}

data class FeaturesResponse(
    val qrCodesForLinks: Boolean
)

@Component
@ConfigurationProperties(prefix = "features")
class Features(
    var qrCodesForLinks: Boolean = false
)