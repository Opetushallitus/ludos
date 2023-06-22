package fi.oph.ludos.auth

import org.springframework.beans.factory.annotation.Autowired
import org.springframework.security.cas.authentication.CasAssertionAuthenticationToken
import org.springframework.security.core.userdetails.AuthenticationUserDetailsService
import org.springframework.security.core.userdetails.UsernameNotFoundException
import org.springframework.stereotype.Component

@Component
class CasUserDetailsService(
    @Autowired val kayttooikeusClient: KayttooikeusClient,
    @Autowired val oppijanumerorekisteriClient: OppijanumerorekisteriClient
) : AuthenticationUserDetailsService<CasAssertionAuthenticationToken> {
    override fun loadUserDetails(token: CasAssertionAuthenticationToken): Kayttajatiedot {
        val username = token.name
        val users = kayttooikeusClient.kayttooikeudet(username)
        val user =
            users.find { it.username == username } ?: throw UsernameNotFoundException("User '$username' not found")

        val details = user.let { oppijanumerorekisteriClient.getUserDetailsByOid(it.oidHenkilo) }

        return Kayttajatiedot(
            oidHenkilo = user.oidHenkilo,
            username = user.username,
            kayttajaTyyppi = user.kayttajaTyyppi,
            organisaatiot = user.organisaatiot,
            etunimet = details.etunimet,
            sukunimi = details.sukunimi,
            asiointiKieli = details.asiointiKieli?.kieliKoodi,
        )
    }
}
