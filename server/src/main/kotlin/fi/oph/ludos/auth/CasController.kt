package fi.oph.ludos.auth

import fi.oph.ludos.Constants
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.ResponseBody
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("${Constants.API_PREFIX}/auth")
@RequireAtLeastYllapitajaRole
class CasController(
    val oppijanumerorekisteriClient: OppijanumerorekisteriClient
) {
    @GetMapping("/user", produces = ["application/json"])
    @ResponseBody
    @RequireAtLeastOpettajaRole
    fun user(): ResponseEntity<User> {
        val kayttajatiedot = Kayttajatiedot.fromSecurityContext()

        val role = Role.fromKayttajatiedot(kayttajatiedot)

        val oidToName = oppijanumerorekisteriClient.getUserDetailsByOid(kayttajatiedot.oidHenkilo)

        val user = User(
            (oidToName?.kutsumanimi ?: kayttajatiedot.etunimet)?.ifBlank { kayttajatiedot.etunimet },
            kayttajatiedot.sukunimi,
            role,
            kayttajatiedot.asiointiKieli
        )

        return ResponseEntity.ok(user)
    }
}

data class User(
    val firstNames: String?, val lastName: String?, val role: Role, val businessLanguage: String?
)
