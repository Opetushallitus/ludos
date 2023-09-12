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

@Configuration
@EnableWebSecurity
@EnableMethodSecurity()
class WebSecurityConfiguration {
    val logger: Logger = LoggerFactory.getLogger(WebSecurityConfiguration::class.java)

    @Bean
    fun singleSignOutFilter(): SingleSignOutFilter = SingleSignOutFilter().apply {
        setIgnoreInitConfiguration(true)
    }

    @Bean
    fun securityFilterChain(
        httpSecurity: HttpSecurity,
        authenticationEntryPoint: AuthenticationEntryPoint,
        singleSignOutFilter: SingleSignOutFilter,
        casAuthenticationFilter: CasAuthenticationFilter,
        casConfig: CasConfig,
    ): SecurityFilterChain {
        // todo: enable csrf for non local environments
        httpSecurity.csrf { csrf -> csrf.disable() }

        httpSecurity.logout { l ->
            l.logoutSuccessUrl(casConfig.getCasLogoutUrl())
            l.logoutUrl(casConfig.logoutUrl)
        }

        httpSecurity.authorizeHttpRequests { a ->
            a.requestMatchers("/assets/**").permitAll()
            a.requestMatchers("/api/health-check").permitAll()
        }

        if (TestController.isEnabled()) {
            logger.warn("TestController is enabled")
            httpSecurity.authorizeHttpRequests { a ->
                a.requestMatchers("/api/test/mocklogin/**").permitAll()
            }
            httpSecurity.sessionManagement { s ->
                s.sessionCreationPolicy(SessionCreationPolicy.IF_REQUIRED)
            }
        }

        httpSecurity.authorizeHttpRequests { a ->
            a.requestMatchers("/**").authenticated()
        }
        httpSecurity.addFilter(casAuthenticationFilter)
        httpSecurity.exceptionHandling { e ->
            e.authenticationEntryPoint(authenticationEntryPoint)
        }
        httpSecurity.addFilterBefore(singleSignOutFilter, CasAuthenticationFilter::class.java)

        return httpSecurity.build()
    }
}