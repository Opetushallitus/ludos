package fi.oph.ludos.auth

import org.slf4j.Logger
import org.slf4j.LoggerFactory
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.security.core.context.SecurityContextHolder

enum class Role(val oikeus: String?) {
    // Order matters: later ones are accepted when earlier ones are required
    UNAUTHORIZED(null),
    OPETTAJA("LUKU"),
    LAATIJA("LUKU_MUOKKAUS"),
    YLLAPITAJA("LUKU_MUOKKAUS_POISTO");

    companion object {
        private val roleByOikeus = values().filter { it.oikeus != null }.associateBy { it.oikeus }
        fun fromOikeus(oikeus: String): Role? = roleByOikeus[oikeus]
    }
}

object RoleChecker {
    private val logger: Logger = LoggerFactory.getLogger(javaClass)
    fun hasAtLeastRole(minimumRequiredRole: Role): Boolean = getRole() >= minimumRequiredRole

    private fun mightiestRole(roles: Iterable<Role>) = roles.max() // Return the role that is defined latest in the Role enum

    fun getRole(): Role {
        val userDetails = getUserDetails()
        val userRights = userDetails.organisaatiot.flatMap { it.kayttooikeudet }.filter { it.palvelu == "LUDOS" }

        val userRoles = userRights.mapNotNull { Role.fromOikeus(it.oikeus) }

        return if (userRoles.isEmpty()) {
            Role.UNAUTHORIZED
        } else if (userRoles.size == 1) {
            userRoles.first()
        } else {
            logger.warn("User ${userDetails.username} has multiple roles: $userRoles")
            mightiestRole(userRoles)
        }
    }

    fun getUserDetails() =
        requireNotNull(SecurityContextHolder.getContext().authentication?.principal as? Kayttajatiedot) { "User details not available" }
}


@Target(AnnotationTarget.FUNCTION)
@Retention(AnnotationRetention.RUNTIME)
@PreAuthorize("@customPermissionEvaluator.hasPermission(null, null, 'YLLAPITAJA')")
annotation class RequireAtLeastYllapitajaRole

@Target(AnnotationTarget.FUNCTION)
@Retention(AnnotationRetention.RUNTIME)
@PreAuthorize("@customPermissionEvaluator.hasPermission(null, null, 'LAATIJA')")
annotation class RequireAtLeastLaatijaRole

@Target(AnnotationTarget.FUNCTION)
@Retention(AnnotationRetention.RUNTIME)
@PreAuthorize("@customPermissionEvaluator.hasPermission(null, null, 'OPETTAJA')")
annotation class RequireAtLeastOpettajaRole

@Target(AnnotationTarget.CLASS)
@Retention(AnnotationRetention.RUNTIME)
@MustBeDocumented
@PreAuthorize("@customPermissionEvaluator.hasPermission(null, null, 'YLLAPITAJA')")
annotation class RequireYllapitajaRoleByDefault
