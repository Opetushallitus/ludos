package fi.oph.ludos.koodisto

import fi.oph.ludos.Constants
import fi.oph.ludos.Language
import fi.oph.ludos.auth.RequireAtLeastOpettajaRole
import fi.oph.ludos.auth.RequireAtLeastYllapitajaRole
import fi.oph.ludos.localization.LOCALIZATION_CACHE_CONTROL
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequireAtLeastYllapitajaRole
@RequestMapping("${Constants.API_PREFIX}/koodisto")
class KoodistoController(val koodistoService: KoodistoService) {
    @GetMapping("")
    @RequireAtLeastOpettajaRole
    fun getKoodistot(): ResponseEntity<Map<Language, Map<KoodistoName, Map<String, KoodiDtoOut>>>> =
        ResponseEntity.ok()
            .cacheControl(LOCALIZATION_CACHE_CONTROL)
            .body(koodistoService.getKoodistos())
}
