package fi.oph.ludos

import fi.oph.ludos.cas.CasConfig
import org.jasig.cas.client.session.SingleSignOutFilter
import org.slf4j.Logger
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Value
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.security.cas.web.CasAuthenticationFilter
import org.springframework.security.config.annotation.web.builders.HttpSecurity
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity
import org.springframework.security.web.AuthenticationEntryPoint
import org.springframework.security.web.SecurityFilterChain
import javax.servlet.Filter
import javax.servlet.http.HttpServletRequest

@Configuration
@EnableWebSecurity
class WebSecurityConfiguration {
    val logger: Logger = LoggerFactory.getLogger(javaClass)

    @Bean
    fun singleSignOutFilter(): SingleSignOutFilter = SingleSignOutFilter().apply {
        setIgnoreInitConfiguration(true)
    }

    @Bean
    fun securityFilterChain(
        realHttpSecurity: HttpSecurity,
        dummyHttpSecurity: HttpSecurity,
        authenticationEntryPoint: AuthenticationEntryPoint,
        singleSignOutFilter: SingleSignOutFilter,
        casAuthenticationFilter: CasAuthenticationFilter,
        casConfig: CasConfig,
        @Value("\${spring.profiles.active}") activeProfiles: String
    ): SecurityFilterChain {
        // todo: enable csrf for non local environments
        realHttpSecurity.csrf().disable()
        dummyHttpSecurity.csrf().disable()

        logger.info("Initializing SecurityFilterChain with active profiles: '$activeProfiles'")

        println("$realHttpSecurity, $dummyHttpSecurity")

        dummyHttpSecurity.authorizeHttpRequests().antMatchers("/**").permitAll().anyRequest().authenticated()

        realHttpSecurity.logout()
            .logoutSuccessUrl(casConfig.getCasLogoutUrl())
            .logoutUrl(casConfig.logoutUrl)

        realHttpSecurity.authorizeHttpRequests()
            .antMatchers("/assets/**").permitAll()
            .antMatchers("/api/health-check").permitAll()
            .antMatchers("/api/test/setAuthenticationEnabled").permitAll()

        realHttpSecurity.authorizeHttpRequests()
            .antMatchers("/**").authenticated().and().addFilter(casAuthenticationFilter)
            .exceptionHandling().authenticationEntryPoint(authenticationEntryPoint).and()
            .addFilterBefore(singleSignOutFilter, CasAuthenticationFilter::class.java)

        if (activeProfiles == "local") {
            DisableableSecurityFilterChain.setAuthenticationEnabled(false)
        }

        return DisableableSecurityFilterChain(realHttpSecurity.build(), dummyHttpSecurity.build())
    }
}

class DisableableSecurityFilterChain(val realChain: SecurityFilterChain, val dummyChain: SecurityFilterChain) : SecurityFilterChain {
    companion object {
        private var isAuthenticationEnabled = true

        fun setAuthenticationEnabled(isAuthenticationEnabled: Boolean) {
            this.isAuthenticationEnabled = isAuthenticationEnabled
        }
    }
    override fun matches(request: HttpServletRequest?): Boolean {
        return if (isAuthenticationEnabled) realChain.matches(request) else dummyChain.matches(request)
    }

    override fun getFilters(): MutableList<Filter> {
        return if (isAuthenticationEnabled) realChain.filters else dummyChain.filters
    }
}