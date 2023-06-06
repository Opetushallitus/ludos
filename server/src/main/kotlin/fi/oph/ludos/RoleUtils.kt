package fi.oph.ludos

import fi.oph.ludos.cas.Kayttajatiedot
import org.springframework.core.env.Environment
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.security.core.context.SecurityContextHolder

enum class Role {
    YLLAPITAJA, OPETTAJA, LAATIJA, UNAUTHORIZED
}

object RoleChecker {
    fun hasRole(permission: String, environment: Environment) = permission == getRole(environment).toString()

    fun getRole(environment: Environment): Role {
        if ("local" in environment.activeProfiles) {
            return Role.YLLAPITAJA
        }

        val userDetails = getUserDetails()
        val userRights = userDetails.organisaatiot.flatMap { it.kayttooikeudet }.filter { it.palvelu == "LUDOS" }

        val roleMapping = mapOf(
            "LUKU_MUOKKAUS_POISTO" to Role.YLLAPITAJA, "LUKU" to Role.OPETTAJA
        )

        return userRights.firstOrNull()?.oikeus?.let { roleMapping[it] } ?: Role.UNAUTHORIZED
    }

    fun getUserDetails() =
        requireNotNull(SecurityContextHolder.getContext().authentication?.principal as? Kayttajatiedot) { "User details not available" }
}


@Target(AnnotationTarget.FUNCTION)
@Retention(AnnotationRetention.RUNTIME)
@PreAuthorize("@customPermissionEvaluator.hasPermission(null, null, 'YLLAPITAJA')")
annotation class HasYllapitajaRole

@Target(AnnotationTarget.FUNCTION)
@Retention(AnnotationRetention.RUNTIME)
@PreAuthorize("@customPermissionEvaluator.hasPermission(null, null, 'LAATIJA')")
annotation class HasLaatijaRole

@Target(AnnotationTarget.FUNCTION)
@Retention(AnnotationRetention.RUNTIME)
@PreAuthorize("@customPermissionEvaluator.hasPermission(null, null, 'OPETTAJA')")
annotation class HasOpettajaRole

@Target(AnnotationTarget.FUNCTION)
@Retention(AnnotationRetention.RUNTIME)
@PreAuthorize("@customPermissionEvaluator.hasPermission(null, null, 'OPETTAJA, LAATIJA, YLLAPITAJA')")
annotation class HasAnyRole