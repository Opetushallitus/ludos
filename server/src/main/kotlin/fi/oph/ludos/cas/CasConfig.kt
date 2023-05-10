package fi.oph.ludos.cas

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
import org.springframework.security.core.GrantedAuthority
import org.springframework.security.core.userdetails.*
import org.springframework.security.web.AuthenticationEntryPoint
import org.springframework.security.web.authentication.SavedRequestAwareAuthenticationSuccessHandler
import org.springframework.security.web.authentication.SimpleUrlAuthenticationFailureHandler
import javax.servlet.http.HttpServletRequest
import javax.servlet.http.HttpServletResponse

@Configuration
class CasConfig {
    val logger: Logger = LoggerFactory.getLogger(javaClass)
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
    fun ticketValidator(): TicketValidator =
        Cas30ServiceTicketValidator("https://$opintopolkuHostname/cas")

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

    @Bean
    fun userDetailsService(): AuthenticationUserDetailsService<CasAssertionAuthenticationToken> =
        CasUserDetailsService()
}

class CasUserDetailsService : AuthenticationUserDetailsService<CasAssertionAuthenticationToken> {
    override fun loadUserDetails(token: CasAssertionAuthenticationToken): UserDetails {
        return CasUserDetails(token.name)
    }
}

class CasUserDetails(private val username: String) : UserDetails {
    override fun getAuthorities(): MutableCollection<out GrantedAuthority> = mutableListOf()
    override fun getPassword(): String? = null
    override fun getUsername(): String = username
    override fun isAccountNonExpired(): Boolean = true
    override fun isAccountNonLocked(): Boolean = true
    override fun isCredentialsNonExpired(): Boolean = true
    override fun isEnabled(): Boolean = true
}

class LudosAuthenticationSuccessHandler : SavedRequestAwareAuthenticationSuccessHandler() {
    val ludosLogger: Logger = LoggerFactory.getLogger(javaClass)
    override fun onAuthenticationSuccess(
        request: HttpServletRequest?,
        response: HttpServletResponse?,
        authentication: Authentication?
    ) {
        ludosLogger.info("Successful login: '${((authentication?.principal as CasUserDetails?)?.username)}'")
        super.onAuthenticationSuccess(request, response, authentication)
    }
}

class LudosAuthenticationFailureHandler() : SimpleUrlAuthenticationFailureHandler() {
    val ludosLogger: Logger = LoggerFactory.getLogger(javaClass)

    override fun onAuthenticationFailure(
        request: HttpServletRequest?,
        response: HttpServletResponse?,
        exception: AuthenticationException?
    ) {
        ludosLogger.warn("Login failed: ${exception?.message}")
        super.onAuthenticationFailure(request, response, exception)
    }
}