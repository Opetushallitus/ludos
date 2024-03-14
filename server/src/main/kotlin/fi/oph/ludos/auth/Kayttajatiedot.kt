package fi.oph.ludos.auth

import org.springframework.security.core.GrantedAuthority
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.security.core.userdetails.UserDetails
import java.io.Serializable

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

data class UserInfoForLogging(
    val username: String,
    val oidHenkilo: String,
    val role: Role,
) {
    constructor(kayttajatiedot: Kayttajatiedot) : this(
        kayttajatiedot.username,
        kayttajatiedot.oidHenkilo,
        kayttajatiedot.role,
    )
}