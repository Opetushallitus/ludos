package fi.oph.ludos.cas

import fi.oph.ludos.Constants.Companion.API_PREFIX
import fi.vm.sade.java_utils.security.OpintopolkuCasAuthenticationFilter
import org.jasig.cas.client.validation.Cas30ServiceTicketValidator
import org.jasig.cas.client.validation.TicketValidator
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.security.cas.ServiceProperties
import org.springframework.security.cas.authentication.CasAssertionAuthenticationToken
import org.springframework.security.cas.authentication.CasAuthenticationProvider
import org.springframework.security.cas.web.CasAuthenticationEntryPoint
import org.springframework.security.cas.web.CasAuthenticationFilter
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration
import org.springframework.security.core.GrantedAuthority
import org.springframework.security.core.userdetails.*
import org.springframework.security.web.AuthenticationEntryPoint

@Configuration
class CasConfig {
    val appUrl = "http://localhost:8080"
    val opintopolkuHostname = "virkailija.testiopintopolku.fi"
    val logoutUrl = "${API_PREFIX}/logout"

    @Bean
    fun serviceProperties(): ServiceProperties = ServiceProperties().apply {
        service = "$appUrl/j_spring_cas_security_check"
        isSendRenew = false
        isAuthenticateAllArtifacts = true
    }

    @Bean
    fun casAuthenticationFilter(
        authenticationConfiguration: AuthenticationConfiguration,
        serviceProperties: ServiceProperties,
    ): CasAuthenticationFilter {
        val casAuthenticationFilter = OpintopolkuCasAuthenticationFilter(serviceProperties)
        casAuthenticationFilter.setAuthenticationManager(authenticationConfiguration.authenticationManager)
        casAuthenticationFilter.setFilterProcessesUrl("/j_spring_cas_security_check")
        return casAuthenticationFilter
    }

    @Bean
    fun ticketValidator(): TicketValidator = Cas30ServiceTicketValidator("https://$opintopolkuHostname/cas")

    @Bean
    fun authenticationEntryPoint(
        serviceProperties: ServiceProperties,
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