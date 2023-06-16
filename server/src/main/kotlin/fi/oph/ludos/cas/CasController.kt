package fi.oph.ludos.cas

import fi.oph.ludos.Constants
import fi.oph.ludos.HasYllapitajaRole
import fi.oph.ludos.Role
import fi.oph.ludos.RoleChecker
import org.springframework.core.env.Environment
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.ResponseBody
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("${Constants.API_PREFIX}/auth")
class CasController(val environment: Environment) {
    @GetMapping("/user", produces = ["application/json"])
    @ResponseBody
    @HasYllapitajaRole
    fun user(): ResponseEntity<User> {
        if ("local" in environment.activeProfiles) {
            return ResponseEntity.ok(User(name = "Yrjö Ylläpitäjä", role = Role.YLLAPITAJA, businessLanguage = "fi"))
        }

        val userDetails = RoleChecker.getUserDetails()

        val user = User("${userDetails.etunimet} ${userDetails.sukunimi}", RoleChecker.getRole(environment), userDetails.asiointiKieli)

        return ResponseEntity.ok(user)
    }
}

data class User(
    val name: String, val role: Role, val businessLanguage: String?
)
