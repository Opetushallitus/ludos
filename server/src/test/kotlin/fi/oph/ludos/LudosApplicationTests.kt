package fi.oph.ludos

import fi.oph.ludos.cas.Kayttajatiedot
import fi.oph.ludos.cas.Kayttooikeus
import fi.oph.ludos.cas.Organisaatio
import org.junit.jupiter.api.Test
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken
import org.springframework.security.core.Authentication
import org.springframework.security.core.context.SecurityContext
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.security.test.context.support.WithSecurityContext
import org.springframework.security.test.context.support.WithSecurityContextFactory
import org.springframework.test.context.ContextConfiguration

@SpringBootTest
@ContextConfiguration(classes = [TestPropertiesConfig::class])
class LudosApplicationTests {

    @Test
    fun contextLoads() {
    }

}

@Target(AnnotationTarget.FUNCTION)
@Retention(AnnotationRetention.RUNTIME)
@WithSecurityContext(factory = WithKayttajatiedotSecurityContextFactory::class)
annotation class WithYllapitajaRole(
    val role: String = "LUKU_MUOKKAUS_POISTO"
)

class WithKayttajatiedotSecurityContextFactory : WithSecurityContextFactory<WithYllapitajaRole> {
    override fun createSecurityContext(annotation: WithYllapitajaRole): SecurityContext {
        val authentication = createAuthentication(annotation)
        val securityContext = SecurityContextHolder.createEmptyContext()
        securityContext.authentication = authentication
        return securityContext
    }

    private fun createAuthentication(annotation: WithYllapitajaRole): Authentication {
        val userDetails = Kayttajatiedot(
            "",
            "TeppoTestaaja",
            "VIRKAILIJA",
            listOf(Organisaatio("123", listOf(Kayttooikeus("LUDOS", annotation.role)))),
            "Teppo",
            "Testaaja",
            null,
            null
        )
        return UsernamePasswordAuthenticationToken(userDetails, null, userDetails.authorities)
    }
}