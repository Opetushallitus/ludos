package fi.oph.ludos.koodisto

import fi.oph.ludos.Constants
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("${Constants.API_PREFIX}/koodisto")
class KoodistoController(val koodistoService: KoodistoService) {
    @GetMapping("/{language}")
    fun getKoodistot(@PathVariable language: Language): Map<KoodistoName, List<KoodiDtoOut>> = koodistoService.getKoodistos(language)
}
