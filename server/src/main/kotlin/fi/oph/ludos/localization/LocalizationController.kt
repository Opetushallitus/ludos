package fi.oph.ludos.localization

import fi.oph.ludos.Constants
import fi.oph.ludos.auth.RequireAtLeastOpettajaRole
import fi.oph.ludos.auth.RequireYllapitajaRoleByDefault
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequireYllapitajaRoleByDefault
@RequestMapping("${Constants.API_PREFIX}/localization")
class LocalizationController(val localizationService: LocalizationService) {
    @GetMapping("")
    @RequireAtLeastOpettajaRole
    fun getLocalizationTexts(): Map<*, *> {
        return localizationService.getLocalizationTexts()
    }
}
