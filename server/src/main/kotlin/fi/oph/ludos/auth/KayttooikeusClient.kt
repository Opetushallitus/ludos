package fi.oph.ludos.auth

import com.fasterxml.jackson.module.kotlin.readValue
import fi.vm.sade.javautils.http.OphHttpRequest
import org.slf4j.LoggerFactory
import org.springframework.http.HttpStatus
import org.springframework.security.core.GrantedAuthority
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.security.core.userdetails.UserDetails
import org.springframework.stereotype.Component
import org.springframework.web.client.RestClientException
import java.io.Serializable

@Component
class KayttooikeusClient : CasAuthenticationClient("kayttooikeus-service") {
    private val logger = LoggerFactory.getLogger(javaClass)

    fun kayttooikeudet(username: String): List<KayttooikeusServiceKayttaja> {
        val req = OphHttpRequest.Builder.get("https://$opintopolkuHostname/kayttooikeus-service/kayttooikeus/kayttaja?username=$username").build()

        return try {
            this.httpClient.execute<List<KayttooikeusServiceKayttaja>>(req).expectedStatus(HttpStatus.OK.value())
                .mapWith { s -> mapper.readValue<List<KayttooikeusServiceKayttaja>>(s) }
                .orElseThrow { RestClientException("Got 204 or 404 code from kayttooikeus-service") }
        } catch (e: Exception) {
            logger.error("Could not get kayttooikeudet for user '$username'")
            throw e
        }
    }
}

data class OppijanumeroRekisteriHenkilo(
    val etunimet: String,
    val sukunimi: String,
    val asiointiKieli: Asiointikieli?
)

data class KayttooikeusServiceKayttaja(
    val oidHenkilo: String,
    val username: String,
    val kayttajaTyyppi: String,
    val organisaatiot: List<Organisaatio>
)

data class Asiointikieli(val kieliKoodi: String, val kieliTyyppi: String)

// NOTE If you do changes on this data class you must truncate spring_session table NOTE
data class Kayttajatiedot(
    val oidHenkilo: String,
    private val username: String,
    val kayttajaTyyppi: String,
    val organisaatiot: List<Organisaatio>,
    val etunimet: String?,
    val sukunimi: String?,
    val asiointiKieli: String?,
) : UserDetails {
    val role: Role = Role.fromKayttajatiedot(this)
    override fun getAuthorities(): Collection<GrantedAuthority> = role.getAuthorities()
    override fun getPassword(): String? = null
    override fun getUsername(): String = username
    override fun isAccountNonExpired(): Boolean = true
    override fun isAccountNonLocked(): Boolean = true
    override fun isCredentialsNonExpired(): Boolean = true
    override fun isEnabled(): Boolean = true

    companion object {
        fun fromSecurityContext(): Kayttajatiedot =
            requireNotNull(SecurityContextHolder.getContext().authentication?.principal as? Kayttajatiedot) { "User details not available" }
    }
}

data class Organisaatio(
    val organisaatioOid: String,
    val kayttooikeudet: List<Kayttooikeus>,
) : Serializable

data class Kayttooikeus(
    val palvelu: String,
    val oikeus: String
) : Serializable {
    companion object {
        const val LUDOS_PALVELU = "LUDOS"
        fun ludosOikeus(oikeus: String): Kayttooikeus = Kayttooikeus(LUDOS_PALVELU, oikeus)
    }
}