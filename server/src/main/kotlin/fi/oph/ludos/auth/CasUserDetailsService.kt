package fi.oph.ludos.auth

import org.slf4j.Logger
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.security.cas.authentication.CasAssertionAuthenticationToken
import org.springframework.security.core.userdetails.AuthenticationUserDetailsService
import org.springframework.stereotype.Component

@Component
class CasUserDetailsService(
    @Autowired val kayttooikeusClient: KayttooikeusClient,
    @Autowired val oppijanumerorekisteriClient: OppijanumerorekisteriClient
) : AuthenticationUserDetailsService<CasAssertionAuthenticationToken> {
    private val logger: Logger = LoggerFactory.getLogger(javaClass)

    override fun loadUserDetails(token: CasAssertionAuthenticationToken): Kayttajatiedot {
        val username = token.name
        val users = kayttooikeusClient.kayttooikeudet(username)
        val user = users.find { it.username == username }
        if (user == null) {
            logger.warn("Username '${username}' not found in kayttooikeus service")
            return Kayttajatiedot(
                oidHenkilo = "",
                username = username,
                kayttajaTyyppi = "",
                organisaatiot = emptyList(),
                etunimet = "",
                sukunimi = "",
                asiointiKieli = null
            )
        }

        val oppijanumerorekisteriHenkilo = oppijanumerorekisteriClient.getUserDetailsByOid(user.oidHenkilo)

        return Kayttajatiedot(
            oidHenkilo = user.oidHenkilo,
            username = user.username,
            kayttajaTyyppi = user.kayttajaTyyppi,
            organisaatiot = user.organisaatiot,
            etunimet = oppijanumerorekisteriHenkilo?.etunimet,
            sukunimi = oppijanumerorekisteriHenkilo?.sukunimi,
            asiointiKieli = oppijanumerorekisteriHenkilo?.asiointiKieli?.kieliKoodi,
        )
    }
}
