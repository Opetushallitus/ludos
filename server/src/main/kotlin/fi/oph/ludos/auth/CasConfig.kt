package fi.oph.ludos.auth

import fi.oph.ludos.AUDIT_LOGGER_NAME
import fi.oph.ludos.Constants.Companion.API_PREFIX
import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import org.apereo.cas.client.validation.Cas30ServiceTicketValidator
import org.apereo.cas.client.validation.TicketValidator
import org.slf4j.Logger
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Value
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.security.cas.ServiceProperties
import org.springframework.security.cas.authentication.CasAssertionAuthenticationToken
import org.springframework.security.cas.authentication.CasAuthenticationProvider
import org.springframework.security.cas.web.CasAuthenticationEntryPoint
import org.springframework.security.cas.web.CasAuthenticationFilter
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration
import org.springframework.security.core.Authentication
import org.springframework.security.core.AuthenticationException
import org.springframework.security.core.userdetails.AuthenticationUserDetailsService
import org.springframework.security.web.AuthenticationEntryPoint
import org.springframework.security.web.authentication.AuthenticationFailureHandler
import org.springframework.security.web.authentication.SavedRequestAwareAuthenticationSuccessHandler


@Configuration
class CasConfig {

    @Value("\${ludos.appUrl}")
    lateinit var appUrl: String

    @Value("\${ludos.opintopolkuHostname}")
    lateinit var opintopolkuHostname: String

    val logoutUrl = "${API_PREFIX}/logout"

    @Bean
    fun serviceProperties(): ServiceProperties = ServiceProperties().apply {
        service = "$appUrl/j_spring_cas_security_check"
        isSendRenew = false
        isAuthenticateAllArtifacts = true
    }

    @Bean
    fun getCasLogoutUrl() = "https://${opintopolkuHostname}/cas/logout?service=${appUrl}"

    @Bean
    fun casAuthenticationFilter(
        authenticationConfiguration: AuthenticationConfiguration
    ): CasAuthenticationFilter {
        val casAuthenticationFilter = CasAuthenticationFilter()
        casAuthenticationFilter.setAuthenticationManager(authenticationConfiguration.authenticationManager)
        casAuthenticationFilter.setFilterProcessesUrl("/j_spring_cas_security_check")
        casAuthenticationFilter.setAuthenticationSuccessHandler(LudosAuthenticationSuccessHandler())
        casAuthenticationFilter.setAuthenticationFailureHandler(LudosAuthenticationFailureHandler())
        return casAuthenticationFilter
    }

    @Bean
    fun ticketValidator(): TicketValidator = Cas30ServiceTicketValidator("https://$opintopolkuHostname/cas")

    @Bean
    fun authenticationEntryPoint(
        serviceProperties: ServiceProperties
    ): AuthenticationEntryPoint {
        val entryPoint = CasAuthenticationEntryPoint()
        entryPoint.loginUrl = "https://$opintopolkuHostname/cas/login"
        entryPoint.serviceProperties = serviceProperties
        return entryPoint
    }

    @Bean
    fun casAuthenticationProvider(
        userDetailsService: AuthenticationUserDetailsService<CasAssertionAuthenticationToken>,
        serviceProperties: ServiceProperties,
        ticketValidator: TicketValidator,
    ): CasAuthenticationProvider = CasAuthenticationProvider().apply {
        setAuthenticationUserDetailsService(userDetailsService)
        setServiceProperties(serviceProperties)
        setTicketValidator(ticketValidator)
        setKey("ludos")
    }
}

class LudosAuthenticationSuccessHandler : SavedRequestAwareAuthenticationSuccessHandler() {
    private val ludosLogger = LoggerFactory.getLogger(javaClass)
    private val auditLogger = LoggerFactory.getLogger(AUDIT_LOGGER_NAME)

    override fun onAuthenticationSuccess(
        request: HttpServletRequest?, response: HttpServletResponse?, authentication: Authentication?
    ) {
        val principal = authentication?.principal as? Kayttajatiedot

        if (principal != null) {
            val userInfo = "username='${principal.username}' oid='${principal.oidHenkilo}' ip='${request?.remoteAddr}'"
            ludosLogger.info("Successful login: $userInfo")
            if (principal.role == Role.YLLAPITAJA) {
                auditLogger.info("Admin login: $userInfo")
            }
        } else {
            ludosLogger.warn("Successful login but principal was null")
        }

        super.onAuthenticationSuccess(request, response, authentication)
    }
}

class LudosAuthenticationFailureHandler : AuthenticationFailureHandler {
    private val ludosLogger: Logger = LoggerFactory.getLogger(javaClass)

    override fun onAuthenticationFailure(
        request: HttpServletRequest, response: HttpServletResponse, exception: AuthenticationException?
    ) {
        ludosLogger.warn("Login failed: ${exception?.message}")
        response.status = HttpServletResponse.SC_UNAUTHORIZED
        response.contentType = "text/html"
        response.writer.write("""<h1>Odottamaton virhe kirjautuessa sisään. Yritä uudestaan <a href="/">tästä.</a></h1>""")
        response.writer.write("""<h1>Oväntat fel vid inloggning. Försök igen <a href="/">här.</a></h1>""")
        response.writer.flush()
    }
}