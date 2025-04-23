package fi.oph.ludos.auth

import fi.oph.ludos.test.TestController
import jakarta.servlet.FilterChain
import jakarta.servlet.ServletException
import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
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
import org.springframework.security.web.authentication.www.BasicAuthenticationFilter
import org.springframework.security.web.csrf.*
import org.springframework.security.web.savedrequest.HttpSessionRequestCache
import org.springframework.security.web.util.matcher.AntPathRequestMatcher
import org.springframework.util.StringUtils
import org.springframework.web.cors.CorsConfiguration
import org.springframework.web.cors.CorsConfigurationSource
import org.springframework.web.cors.UrlBasedCorsConfigurationSource
import org.springframework.web.filter.OncePerRequestFilter
import java.io.IOException
import java.util.function.Supplier

@Configuration
class CorsConfig {

    @Bean
    fun corsConfigurationSource(): CorsConfigurationSource {
        val config = CorsConfiguration().apply {
            allowedOrigins = emptyList()
            allowedMethods = emptyList()
            allowedHeaders = emptyList()
        }

        return UrlBasedCorsConfigurationSource().apply {
            registerCorsConfiguration("/**", config)
        }
    }
}


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
        corsConfigurationSource: CorsConfigurationSource,
    ): SecurityFilterChain {
        http.csrf {
            it.csrfTokenRepository(CookieCsrfTokenRepository.withHttpOnlyFalse())
            it.csrfTokenRequestHandler(SpaCsrfTokenRequestHandler())
        }


        http.addFilterAfter(SpaCsrfTokenRequestHandler.CsrfCookieFilter(), BasicAuthenticationFilter::class.java)

        val requestCache = HttpSessionRequestCache()
        requestCache.setMatchingRequestParameterName("j")
        http.requestCache { it.requestCache(requestCache) }

        http.logout {
            it.logoutSuccessUrl(casConfig.getCasLogoutUrl())
            it.logoutUrl(casConfig.logoutUrl)
            it.logoutRequestMatcher(AntPathRequestMatcher(casConfig.logoutUrl, "GET"))
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

        http.headers {
            it.contentSecurityPolicy { csp ->
                csp.policyDirectives(CspManager.makeCSPString())
            }
        }

        http.cors {
            it.configurationSource(corsConfigurationSource)
        }

        return http.build()
    }

    // https://docs.spring.io/spring-security/reference/servlet/exploits/csrf.html#csrf-integration-javascript
    class SpaCsrfTokenRequestHandler : CsrfTokenRequestAttributeHandler() {
        private val delegate: CsrfTokenRequestHandler = XorCsrfTokenRequestAttributeHandler()

        override fun handle(
            request: HttpServletRequest,
            response: HttpServletResponse,
            csrfToken: Supplier<CsrfToken>
        ) {
            delegate.handle(request, response, csrfToken)
        }

        override fun resolveCsrfTokenValue(request: HttpServletRequest, csrfToken: CsrfToken): String {
            return if (StringUtils.hasText(request.getHeader(csrfToken.headerName))) super.resolveCsrfTokenValue(
                request,
                csrfToken
            ) else delegate.resolveCsrfTokenValue(request, csrfToken)
        }

        class CsrfCookieFilter : OncePerRequestFilter() {

            @Throws(ServletException::class, IOException::class)
            override fun doFilterInternal(
                request: HttpServletRequest,
                response: HttpServletResponse,
                filterChain: FilterChain
            ) {
                val csrfToken = request.getAttribute("_csrf") as CsrfToken
                // Render the token value to a cookie by causing the deferred token to be loaded
                csrfToken.token
                filterChain.doFilter(request, response)
            }
        }
    }
}
