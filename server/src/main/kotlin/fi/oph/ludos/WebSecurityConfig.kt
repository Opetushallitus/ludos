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