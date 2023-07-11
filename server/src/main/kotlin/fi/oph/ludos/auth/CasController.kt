package fi.oph.ludos.auth

import fi.oph.ludos.*
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.ResponseBody
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("${Constants.API_PREFIX}/auth")
@RequireAtLeastYllapitajaRole
class CasController {
    @GetMapping("/user", produces = ["application/json"])
    @ResponseBody
    @RequireAtLeastOpettajaRole
    fun user(): ResponseEntity<User> {
        val kayttajatiedot = Kayttajatiedot.fromSecurityContext()

        val role = Role.fromKayttajatiedot(kayttajatiedot)
        val user =
            User("${kayttajatiedot.etunimet} ${kayttajatiedot.sukunimi}", role, kayttajatiedot.asiointiKieli)

        return ResponseEntity.ok(user)
    }
}

data class User(
    val name: String, val role: Role, val businessLanguage: String?
)
