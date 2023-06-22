package fi.oph.ludos.auth

import fi.oph.ludos.Constants.Companion.API_PREFIX
import fi.vm.sade.java_utils.security.OpintopolkuCasAuthenticationFilter
import org.jasig.cas.client.validation.Cas30ServiceTicketValidator
import org.jasig.cas.client.validation.TicketValidator
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
import org.springframework.security.core.userdetails.*
import org.springframework.security.web.AuthenticationEntryPoint
import org.springframework.security.web.authentication.SavedRequestAwareAuthenticationSuccessHandler
import org.springframework.security.web.authentication.SimpleUrlAuthenticationFailureHandler
import javax.servlet.http.HttpServletRequest
import javax.servlet.http.HttpServletResponse


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
        authenticationConfiguration: AuthenticationConfiguration,
        serviceProperties: ServiceProperties,
    ): CasAuthenticationFilter {
        val casAuthenticationFilter = OpintopolkuCasAuthenticationFilter(serviceProperties)
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
    override fun onAuthenticationSuccess(
        request: HttpServletRequest?, response: HttpServletResponse?, authentication: Authentication?
    ) {
        val principal = authentication?.principal as? Kayttajatiedot

        if (principal != null) {
            ludosLogger.info("✅ Successful login: '${principal.username}'")
        } else {
            ludosLogger.warn("✅ Successful login: principal was null 🤔")
        }

        super.onAuthenticationSuccess(request, response, authentication)
    }
}

class LudosAuthenticationFailureHandler() : SimpleUrlAuthenticationFailureHandler() {
    private val ludosLogger: Logger = LoggerFactory.getLogger(javaClass)

    override fun onAuthenticationFailure(
        request: HttpServletRequest?, response: HttpServletResponse?, exception: AuthenticationException?
    ) {
        ludosLogger.warn("Login failed: ${exception?.message}")
        super.onAuthenticationFailure(request, response, exception)
    }
}