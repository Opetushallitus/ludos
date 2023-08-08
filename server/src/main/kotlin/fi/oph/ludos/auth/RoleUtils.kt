package fi.oph.ludos.auth

import org.slf4j.Logger
import org.slf4j.LoggerFactory
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.security.core.GrantedAuthority

enum class Role(val oikeus: String) : GrantedAuthority {
    // Role order matters: later roles are accepted when earlier ones are required
    UNAUTHORIZED("UNAUTHORIZED"),
    OPETTAJA("LUKU"),
    LAATIJA("LUKU_MUOKKAUS"),
    YLLAPITAJA("LUKU_MUOKKAUS_POISTO");

    private fun isAtLeastAsMightyAs(minimumRequiredRole: Role): Boolean = this >= minimumRequiredRole

    override fun getAuthority(): String = this.name

    fun getAuthorities(): Collection<GrantedAuthority> = values().filter { this.isAtLeastAsMightyAs(it) }

    companion object {
        private val logger: Logger = LoggerFactory.getLogger(Role.Companion::class.java)
        private val roleByOikeus = values().associateBy { it.oikeus }
        private fun fromOikeus(oikeus: String): Role? = roleByOikeus[oikeus]

        private fun mightiestRole(roles: Iterable<Role>) = roles.max() // Return the role that is defined latest in the Role enum

        fun fromKayttajatiedot(kayttajatiedot: Kayttajatiedot): Role {
            val userRights = kayttajatiedot.organisaatiot.flatMap { it.kayttooikeudet }.filter { it.palvelu == Kayttooikeus.LUDOS_PALVELU }

            val userRoles = userRights.mapNotNull { Role.fromOikeus(it.oikeus) }

            return if (userRoles.isEmpty()) {
                UNAUTHORIZED
            } else if (userRoles.size == 1) {
                userRoles.first()
            } else {
                logger.warn("User ${kayttajatiedot.username} has multiple roles: $userRoles")
                mightiestRole(userRoles)
            }
        }
    }
}


@Target(AnnotationTarget.FUNCTION, AnnotationTarget.CLASS)
@Retention(AnnotationRetention.RUNTIME)
@PreAuthorize("hasAuthority('YLLAPITAJA')")
annotation class RequireAtLeastYllapitajaRole

@Target(AnnotationTarget.FUNCTION, AnnotationTarget.CLASS)
@Retention(AnnotationRetention.RUNTIME)
@PreAuthorize("hasAuthority('LAATIJA')")
annotation class RequireAtLeastLaatijaRole

@Target(AnnotationTarget.FUNCTION, AnnotationTarget.CLASS)
@Retention(AnnotationRetention.RUNTIME)
@PreAuthorize("hasAuthority('OPETTAJA')")
annotation class RequireAtLeastOpettajaRole