package fi.oph.ludos

import fi.oph.ludos.auth.CasConfig
import fi.oph.ludos.auth.Role
import fi.oph.ludos.auth.RoleChecker
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
    val logger: Logger = LoggerFactory.getLogger(javaClass)
    override fun hasPermission(authentication: Authentication?, targetDomainObject: Any?, permission: Any?): Boolean {
        if (permission == null || permission !is String) {
            logger.warn("Null or non-string permission value '${permission}'")
            return false
        }
        val minimumRequiredRole = try {
            Role.valueOf(permission)
        } catch (e: IllegalArgumentException) {
            logger.warn("Invalid permission value: '${permission}'")
            return false
        }
        return RoleChecker.hasAtLeastRole(minimumRequiredRole)
    }

    override fun hasPermission(
        authentication: Authentication?,
        targetId: Serializable?,
        targetType: String?,
        permission: Any?
    ) = hasPermission(authentication, null, permission)
}