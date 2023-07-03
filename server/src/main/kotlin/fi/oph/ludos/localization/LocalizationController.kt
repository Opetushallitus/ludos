package fi.oph.ludos.localization

import fi.oph.ludos.Constants
import fi.oph.ludos.HasAnyRole
import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import org.springframework.web.server.ResponseStatusException

@RestController
@RequestMapping("${Constants.API_PREFIX}/localization")
class LocalizationController(val localizationService: LocalizationService) {
    @GetMapping("")
    @HasAnyRole
    fun getLocalizationTexts(): Map<*, *> {
        return localizationService.getLocalizationTexts()
    }
}
