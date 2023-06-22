package fi.oph.ludos.koodisto

import fi.oph.ludos.Constants
import fi.oph.ludos.auth.RequireAtLeastOpettajaRole
import fi.oph.ludos.auth.RequireYllapitajaRoleByDefault
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequireYllapitajaRoleByDefault
@RequestMapping("${Constants.API_PREFIX}/koodisto")
class KoodistoController(val koodistoService: KoodistoService) {
    @GetMapping("/{language}")
    @RequireAtLeastOpettajaRole
    fun getKoodistot(@PathVariable language: Language): Map<KoodistoName, List<KoodiDtoOut>> = koodistoService.getKoodistos(language)
}
