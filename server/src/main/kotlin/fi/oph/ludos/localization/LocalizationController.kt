package fi.oph.ludos.localization

import fi.oph.ludos.Constants
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("${Constants.API_PREFIX}/localization")
class LocalizationController(val localizationService: LocalizationService) {
    @GetMapping("/")
    fun getLocalizationTexts(): ResponseEntity<out Map<out Any?, Any?>> = localizationService.getLocalizationTexts()
}
