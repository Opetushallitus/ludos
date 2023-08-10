package fi.oph.ludos

import fi.oph.ludos.auth.Kayttajatiedot
import fi.oph.ludos.auth.Kayttooikeus
import fi.oph.ludos.auth.Organisaatio
import fi.oph.ludos.auth.Role
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken
import org.springframework.security.core.Authentication
import org.springframework.security.core.context.SecurityContext
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.security.test.context.support.WithSecurityContext
import org.springframework.security.test.context.support.WithSecurityContextFactory
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders
import java.time.ZonedDateTime

@Target(AnnotationTarget.FUNCTION)
@Retention(AnnotationRetention.RUNTIME)
@WithSecurityContext(factory = UnauthorizedSecurityContextFactory::class)
annotation class WithUnauhtorizedRole

@Target(AnnotationTarget.FUNCTION)
@Retention(AnnotationRetention.RUNTIME)
@WithSecurityContext(factory = OpettajaSecurityContextFactory::class)
annotation class WithOpettajaRole

@Target(AnnotationTarget.FUNCTION)
@Retention(AnnotationRetention.RUNTIME)
@WithSecurityContext(factory = LaatijaSecurityContextFactory::class)
annotation class WithLaatijaRole

@Target(AnnotationTarget.FUNCTION)
@Retention(AnnotationRetention.RUNTIME)
@WithSecurityContext(factory = YllapitajaSecurityContextFactory::class)
annotation class WithYllapitajaRole

@Target(AnnotationTarget.FUNCTION)
@Retention(AnnotationRetention.RUNTIME)
@WithSecurityContext(factory = OpettajaAndLaatijaSecurityContextFactory::class)
annotation class WithOpettajaAndLaatijaRoles

abstract class LudosSecurityContextFactory : WithSecurityContextFactory<Annotation> {
    override fun createSecurityContext(annotation: Annotation): SecurityContext {
        val authentication = createAuthentication()
        val securityContext = SecurityContextHolder.createEmptyContext()
        securityContext.authentication = authentication
        return securityContext
    }

    fun createAuthentication(): Authentication {
        val userDetails = kayttajatiedot()
        return UsernamePasswordAuthenticationToken(userDetails, null, userDetails.authorities)
    }

    abstract fun kayttajatiedot(): Kayttajatiedot
}

class UnauthorizedSecurityContextFactory : LudosSecurityContextFactory() {
    override fun kayttajatiedot() = Kayttajatiedot(
        "1.2.246.562.24.00000000001",
        "OskariOikeudeton",
        "VIRKAILIJA",
        listOf(Organisaatio("123", emptyList())),
        "Oskari",
        "Oikeudeton",
        null
    )
}

class OpettajaSecurityContextFactory : LudosSecurityContextFactory() {
    override fun kayttajatiedot() = Kayttajatiedot(
        "1.2.246.562.24.00000000002",
        "OonaOpettaja",
        "VIRKAILIJA",
        listOf(Organisaatio("123", listOf(Kayttooikeus.ludosOikeus(Role.OPETTAJA.oikeus)))),
        "Oona",
        "Opettaja",
        null
    )
}

class LaatijaSecurityContextFactory : LudosSecurityContextFactory() {
    override fun kayttajatiedot() = Kayttajatiedot(
        "1.2.246.562.24.00000000003",
        "LauraLaatija",
        "VIRKAILIJA",
        listOf(Organisaatio("123", listOf(Kayttooikeus.ludosOikeus(Role.LAATIJA.oikeus)))),
        "Laura",
        "Laatija",
        null
    )
}
class YllapitajaSecurityContextFactory : LudosSecurityContextFactory() {
    override fun kayttajatiedot() = Kayttajatiedot(
        "1.2.246.562.24.00000000004",
        "YrjoYllapitaja",
        "VIRKAILIJA",
        listOf(Organisaatio("123", listOf(Kayttooikeus.ludosOikeus(Role.YLLAPITAJA.oikeus)))),
        "Yrjö",
        "Ylläpitäjä",
        null
    )
}

class OpettajaAndLaatijaSecurityContextFactory : LudosSecurityContextFactory() {
    override fun kayttajatiedot() = Kayttajatiedot(
        "1.2.246.562.24.00000000005",
        "OpettajaLaatija",
        "VIRKAILIJA",
        listOf(Organisaatio("123", listOf(
            Kayttooikeus.ludosOikeus(Role.OPETTAJA.oikeus),
            Kayttooikeus.ludosOikeus(Role.LAATIJA.oikeus))
        )),
        "Opettaja",
        "Laatija",
        null
    )
}

fun nowFromDb(mockMvc: MockMvc): ZonedDateTime {
    val req = MockMvcRequestBuilders.get("${Constants.API_PREFIX}/test/now")
    val isoString = mockMvc.perform(req).andReturn().response.contentAsString.replace("\"", "")
    return ZonedDateTime.parse(isoString)
}

fun authenticateAsYllapitaja() {
    // Useful when @WithYllapitajaRole cannot be used, eg. in @BeforeAll
    SecurityContextHolder.getContext().authentication = YllapitajaSecurityContextFactory().createAuthentication()
}