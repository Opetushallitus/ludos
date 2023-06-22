package fi.oph.ludos.auth

import fi.oph.ludos.*
import org.hamcrest.MatcherAssert.assertThat
import org.hamcrest.CoreMatchers.*
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.test.context.TestPropertySource
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.status
import javax.transaction.Transactional
import kotlin.reflect.full.functions

fun getUserDetails() =
    MockMvcRequestBuilders.get("${Constants.API_PREFIX}/auth/user")

@TestPropertySource(locations = ["classpath:application.properties"])
@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class AuthorizationTest(@Autowired val mockMvc: MockMvc) {

    @Test
    fun assertUserDetailsEndpointHasAnnotationRequiringAtLeastOpettaja() {
        val userEndpointFunction = CasController::class.functions.find { it.name == "user" }
        assertThat(userEndpointFunction, notNullValue())
        assertThat(userEndpointFunction?.annotations, hasItem(instanceOf<RequireAtLeastOpettajaRole>(RequireAtLeastOpettajaRole::class.java)))
    }

    @Test
    @WithUnauhtorizedRole
    fun unauthorizedUserCannotFetchUserDetails() {
        mockMvc.perform(getUserDetails()).andExpect(status().isUnauthorized)
    }

    @Test
    @WithOpettajaRole
    fun opettajaCanFetchUserDetails() {
        mockMvc.perform(getUserDetails()).andExpect(status().isOk())
    }

    @Test
    @WithYllapitajaRole
    fun userWithHigherRoleThanOpettajaCanFetchUserDetails() {
        mockMvc.perform(getUserDetails()).andExpect(status().isOk())
    }
}