package fi.oph.ludos

import fi.oph.ludos.cas.CasConfig
import org.jasig.cas.client.session.SingleSignOutFilter
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
        @Value("\${myapp.env}") env: String
    ): SecurityFilterChain {
        // todo: enable csrf for non local environments
        http.csrf().disable()

        println("securityFilterChain: env: $env")

        if (env != "prod") {
            http.authorizeHttpRequests().antMatchers("/**").permitAll().anyRequest().authenticated()

            return http.build()
        }

        http.logout()
            .logoutSuccessUrl("https://${casConfig.opintopolkuHostname}/cas/logout?service=${casConfig.appUrl}")
            .logoutUrl(casConfig.logoutUrl)

        http.authorizeHttpRequests().anyRequest().authenticated().and()
            .addFilter(casAuthenticationFilter).exceptionHandling().authenticationEntryPoint(authenticationEntryPoint)
            .and().addFilterBefore(singleSignOutFilter, CasAuthenticationFilter::class.java)

        return http.build()
    }
}