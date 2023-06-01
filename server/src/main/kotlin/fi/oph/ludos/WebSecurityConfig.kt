package fi.oph.ludos

import fi.oph.ludos.cas.CasConfig
import fi.oph.ludos.cas.Kayttajatiedot
import fi.oph.ludos.cas.Role
import org.jasig.cas.client.session.SingleSignOutFilter
import org.slf4j.Logger
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Value
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.security.access.PermissionEvaluator
import org.springframework.security.cas.web.CasAuthenticationFilter
import org.springframework.security.config.annotation.method.configuration.EnableGlobalMethodSecurity
import org.springframework.security.config.annotation.web.builders.HttpSecurity
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity
import org.springframework.security.core.Authentication
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.security.web.AuthenticationEntryPoint
import org.springframework.security.web.SecurityFilterChain
import java.io.Serializable

@Configuration
@EnableWebSecurity
@EnableGlobalMethodSecurity(prePostEnabled = true)
class WebSecurityConfiguration {
    val logger: Logger = LoggerFactory.getLogger(javaClass)

    @Bean
    fun customPermissionEvaluator() = CustomPermissionEvaluator()

    @Bean
    fun singleSignOutFilter(): SingleSignOutFilter = SingleSignOutFilter().apply {
        setIgnoreInitConfiguration(true)
    }

    @Bean
    fun securityFilterChain(
        http: HttpSecurity,
        authenticationEntryPoint: AuthenticationEntryPoint,
        singleSignOutFilter: SingleSignOutFilter,
        casAuthenticationFilter: CasAuthenticationFilter,
        casConfig: CasConfig,
        @Value("\${spring.profiles.active}") activeProfiles: String
    ): SecurityFilterChain {
        // todo: enable csrf for non local environments
        http.csrf().disable()

        logger.info("Initializing SecurityFilterChain with active profiles: '$activeProfiles'")

        if (activeProfiles == "local") {
            http.authorizeHttpRequests().antMatchers("/**").permitAll().anyRequest().authenticated()
            return http.build()
        }

        http.logout()
            .logoutSuccessUrl(casConfig.getCasLogoutUrl())
            .logoutUrl(casConfig.logoutUrl)

        http.authorizeHttpRequests()
            .antMatchers("/assets/**").permitAll()
            .antMatchers("/api/health-check").permitAll()

        http.authorizeHttpRequests()
            .antMatchers("/**").authenticated().and().addFilter(casAuthenticationFilter)
            .exceptionHandling().authenticationEntryPoint(authenticationEntryPoint).and()
            .addFilterBefore(singleSignOutFilter, CasAuthenticationFilter::class.java)

        return http.build()
    }
}

class CustomPermissionEvaluator : PermissionEvaluator {

    override fun hasPermission(authentication: Authentication?, targetDomainObject: Any?, permission: Any?): Boolean {
        println("plzzzz $authentication, $targetDomainObject, $permission")

        return RoleChecker.hasRole(permission as String)
    }
    override fun hasPermission(
        authentication: Authentication?,
        targetId: Serializable?,
        targetType: String?,
        permission: Any?
    ): Boolean {
        return false
    }
}

object RoleChecker {
    fun hasRole(permission: String): Boolean {
        return permission == getRole().toString()
    }

    fun getRole(): Role {
        val userDetails = getUserDetails()
        val userRights = userDetails.organisaatiot
            .flatMap { it.kayttooikeudet }
            .filter { it.palvelu == "LUDOS" }

        val roleMapping = mapOf(
            "LUKU_MUOKKAUS_POISTO" to Role.YLLAPITAJA,
            "LUKU" to Role.OPETTAJA
        )

        return userRights.firstOrNull()?.oikeus?.let { roleMapping[it] } ?: Role.UNAUTHORIZED
    }

    private fun getUserDetails() =
        requireNotNull(SecurityContextHolder.getContext().authentication?.principal as? Kayttajatiedot) { "User details not available" }
}
