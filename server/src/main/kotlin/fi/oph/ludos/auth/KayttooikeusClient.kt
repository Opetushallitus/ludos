package fi.oph.ludos.auth

import com.fasterxml.jackson.module.kotlin.readValue
import org.apache.http.client.methods.HttpGet
import org.apache.http.util.EntityUtils
import org.springframework.security.core.GrantedAuthority
import org.springframework.security.core.userdetails.UserDetails
import org.springframework.stereotype.Component
import java.io.Serializable

@Component
class KayttooikeusClient : CasAuthenticationClient("kayttooikeus-service") {
    fun kayttooikeudet(username: String): List<KayttooikeusServiceKayttaja> {
        val req = HttpGet("https://$opintopolkuHostname/kayttooikeus-service/kayttooikeus/kayttaja?username=$username")

        return executeRequest(req, httpContext).use { response ->
            val body = EntityUtils.toString(response.entity)
            return@use mapper.readValue<List<KayttooikeusServiceKayttaja>>(body)
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

// 🆘 If you do changes on this data class you must truncate spring_session table 🆘
data class Kayttajatiedot(
    val oidHenkilo: String,
    private val username: String,
    val kayttajaTyyppi: String,
    val organisaatiot: List<Organisaatio>,
    val etunimet: String,
    val sukunimi: String,
    val asiointiKieli: String?,
) : UserDetails {
    override fun getAuthorities(): MutableCollection<out GrantedAuthority> = mutableListOf()
    override fun getPassword(): String? = null
    override fun getUsername(): String = username
    override fun isAccountNonExpired(): Boolean = true
    override fun isAccountNonLocked(): Boolean = true
    override fun isCredentialsNonExpired(): Boolean = true
    override fun isEnabled(): Boolean = true
}

data class Organisaatio(
    val organisaatioOid: String,
    val kayttooikeudet: List<Kayttooikeus>,
) : Serializable

data class Kayttooikeus(
    val palvelu: String,
    val oikeus: String,
) : Serializable