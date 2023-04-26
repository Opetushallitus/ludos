package fi.oph.ludos.cas

import fi.oph.ludos.Constants
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.ResponseBody
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("${Constants.API_PREFIX}/auth")
class CasController {
    @GetMapping("", produces = ["application/json"])
    @ResponseBody
    fun getUsername(): CasUsername {
        val auth = SecurityContextHolder.getContext().authentication
        return CasUsername(auth.name)
    }
}

data class CasUsername(val name: String)