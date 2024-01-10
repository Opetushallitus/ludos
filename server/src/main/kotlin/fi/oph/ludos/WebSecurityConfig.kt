package fi.oph.ludos

import fi.oph.ludos.auth.CasConfig
import fi.oph.ludos.test.TestController
import org.apereo.cas.client.session.SingleSignOutFilter
import org.slf4j.Logger
import org.slf4j.LoggerFactory
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.security.cas.web.CasAuthenticationFilter
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity
import org.springframework.security.config.annotation.web.builders.HttpSecurity
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity
import org.springframework.security.config.http.SessionCreationPolicy
import org.springframework.security.web.AuthenticationEntryPoint
import org.springframework.security.web.SecurityFilterChain
import org.springframework.security.web.savedrequest.HttpSessionRequestCache

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
class WebSecurityConfiguration {
    val logger: Logger = LoggerFactory.getLogger(WebSecurityConfiguration::class.java)

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
    ): SecurityFilterChain {
        // todo: enable csrf for non local environments
        http.csrf { it.disable() }

        val requestCache = HttpSessionRequestCache()
        requestCache.setMatchingRequestParameterName("j")
        http.requestCache { it.requestCache(requestCache) }

        http.logout {
            it.logoutSuccessUrl(casConfig.getCasLogoutUrl())
            it.logoutUrl(casConfig.logoutUrl)
        }

        http.authorizeHttpRequests {
            it.requestMatchers("/assets/**").permitAll()
            it.requestMatchers("/api/health-check").permitAll()
        }

        if (TestController.isEnabled()) {
            logger.warn("TestController is enabled")
            http.authorizeHttpRequests {
                it.requestMatchers("/api/test/mocklogin/**").permitAll()
            }
            http.sessionManagement {
                it.sessionCreationPolicy(SessionCreationPolicy.IF_REQUIRED)
            }
        }

        http.authorizeHttpRequests {
            it.requestMatchers("/**").authenticated()
        }
        http.addFilter(casAuthenticationFilter)
        http.exceptionHandling {
            it.authenticationEntryPoint(authenticationEntryPoint)
        }
        http.addFilterBefore(singleSignOutFilter, CasAuthenticationFilter::class.java)

        return http.build()
    }
}