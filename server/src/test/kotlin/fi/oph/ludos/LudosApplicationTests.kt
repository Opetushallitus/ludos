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

@Target(AnnotationTarget.FUNCTION)
@Retention(AnnotationRetention.RUNTIME)
@WithSecurityContext(factory = UnauthorizedSecurityContextFactory::class)
annotation class WithUnauhtorizedRole

@Target(AnnotationTarget.FUNCTION)
@Retention(AnnotationRetention.RUNTIME)
@WithSecurityContext(factory = YllapitajaSecurityContextFactory::class)
annotation class WithYllapitajaRole

@Target(AnnotationTarget.FUNCTION)
@Retention(AnnotationRetention.RUNTIME)
@WithSecurityContext(factory = OpettajaSecurityContextFactory::class)
annotation class WithOpettajaRole

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

class YllapitajaSecurityContextFactory : LudosSecurityContextFactory() {
    override fun kayttajatiedot() = Kayttajatiedot(
        "1.2.246.562.24.00000000002",
        "YrjoYllapitaja",
        "VIRKAILIJA",
        listOf(Organisaatio("123", listOf(Kayttooikeus("LUDOS", Role.YLLAPITAJA.oikeus)))),
        "Yrjö",
        "Ylläpitäjä",
        null
    )
}

class OpettajaSecurityContextFactory : LudosSecurityContextFactory() {
    override fun kayttajatiedot() = Kayttajatiedot(
        "1.2.246.562.24.00000000004",
        "OonaOpettaja",
        "VIRKAILIJA",
        listOf(Organisaatio("123", listOf(Kayttooikeus("LUDOS", Role.OPETTAJA.oikeus)))),
        "Oona",
        "Opettaja",
        null
    )
}

fun authenticateAsYllapitaja() {
    // Useful when @WithYllapitajaRole cannot be used, eg. in @BeforeAll
    SecurityContextHolder.getContext().authentication = YllapitajaSecurityContextFactory().createAuthentication()
}