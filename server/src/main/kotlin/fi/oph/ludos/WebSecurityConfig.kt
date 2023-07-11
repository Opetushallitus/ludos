package fi.oph.ludos

import fi.oph.ludos.auth.CasConfig
import fi.oph.ludos.test.TestController
import org.jasig.cas.client.session.SingleSignOutFilter
import org.slf4j.Logger
import org.slf4j.LoggerFactory
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.security.cas.web.CasAuthenticationFilter
import org.springframework.security.config.annotation.method.configuration.EnableGlobalMethodSecurity
import org.springframework.security.config.annotation.web.builders.HttpSecurity
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity
import org.springframework.security.config.http.SessionCreationPolicy
import org.springframework.security.web.AuthenticationEntryPoint
import org.springframework.security.web.SecurityFilterChain

@Configuration
@EnableWebSecurity
@EnableGlobalMethodSecurity(prePostEnabled = true)
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
        http.csrf().disable()

        http.logout()
            .logoutSuccessUrl(casConfig.getCasLogoutUrl())
            .logoutUrl(casConfig.logoutUrl)

        http.authorizeHttpRequests()
            .antMatchers("/assets/**").permitAll()
            .antMatchers("/api/health-check").permitAll()

        if (TestController.isEnabled()) {
            logger.info("TestController is enabled")
            http.authorizeHttpRequests()
                .antMatchers("/api/test/mocklogin/**").permitAll().and()
                .sessionManagement().sessionCreationPolicy(SessionCreationPolicy.IF_REQUIRED)
        }

        http.authorizeHttpRequests()
            .antMatchers("/**").authenticated().and().addFilter(casAuthenticationFilter)
            .exceptionHandling().authenticationEntryPoint(authenticationEntryPoint).and()
            .addFilterBefore(singleSignOutFilter, CasAuthenticationFilter::class.java)

        return http.build()
    }
}