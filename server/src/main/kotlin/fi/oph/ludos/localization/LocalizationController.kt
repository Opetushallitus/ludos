package fi.oph.ludos.localization

import fi.oph.ludos.Constants
import fi.oph.ludos.auth.RequireAtLeastOpettajaRole
import fi.oph.ludos.auth.RequireAtLeastYllapitajaRole
import org.springframework.http.CacheControl
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import java.time.Duration

val LOCALIZATION_CACHE_CONTROL = CacheControl.maxAge(Duration.ofMinutes(5)).mustRevalidate()
    .cachePublic().staleWhileRevalidate(Duration.ofMinutes(1)).staleIfError(Duration.ofHours(1))

@RestController
@RequireAtLeastYllapitajaRole
@RequestMapping("${Constants.API_PREFIX}/localization")
class LocalizationController(val localizationService: LocalizationService) {
    @GetMapping("")
    @RequireAtLeastOpettajaRole
    fun getLocalizationTexts(): ResponseEntity<Map<*, *>> =
        ResponseEntity.ok()
            .cacheControl(LOCALIZATION_CACHE_CONTROL)
            .body(localizationService.getLocalizationTexts())
}
