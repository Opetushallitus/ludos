package fi.oph.ludos.auth

import fi.oph.ludos.*
import fi.oph.ludos.test.TestController
import org.hamcrest.MatcherAssert.assertThat
import org.hamcrest.CoreMatchers.*
import org.junit.jupiter.api.Nested
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


@TestPropertySource(locations = ["classpath:application.properties"])
@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class AuthorizationTest(@Autowired public val mockMvc: MockMvc) {

    fun performTestGet(role: Role) =
        mockMvc.perform(MockMvcRequestBuilders.get("${Constants.API_PREFIX}/test/test${role.name.lowercase().replaceFirstChar { it.uppercase() }}Required"))

    fun assertTestControllerFunctionHasAnnotation(functionName: String, expectedAnnotationClass: Any) {
        val userEndpointFunction = TestController::class.functions.find { it.name == functionName }
        assertThat(userEndpointFunction, notNullValue())
        assertThat(userEndpointFunction?.annotations, hasItem(instanceOf<Any>(expectedAnnotationClass as Class<*>)))
    }

    @Nested
    inner class RequireAtLeastOpettajaRoleTest {
        @Test
        fun `assert that opettaja test endpoint has annotation @RequireAtLeastOpettajaRole`() {
            assertTestControllerFunctionHasAnnotation("testOpettajaRequired", RequireAtLeastOpettajaRole::class.java)
        }

        @Test
        @WithUnauhtorizedRole
        fun unauthorizedUserCannotGet() {
            performTestGet(Role.OPETTAJA).andExpect(status().isUnauthorized)
        }

        @Test
        @WithOpettajaRole
        fun opettajaCanGet() {
            performTestGet(Role.OPETTAJA).andExpect(status().isOk)
        }

        @Test
        @WithLaatijaRole
        fun laatijaCanGet() {
            performTestGet(Role.OPETTAJA).andExpect(status().isOk)
        }

        @Test
        @WithYllapitajaRole
        fun yllapitajaCanGet() {
            performTestGet(Role.OPETTAJA).andExpect(status().isOk)
        }
    }

    @Nested
    inner class RequireAtLeastLaatijaRoleTest {
        @Test
        fun `assert that laatija test endpoint has annotation @RequireAtLeastLaatijaRole`() {
            assertTestControllerFunctionHasAnnotation("testLaatijaRequired", RequireAtLeastLaatijaRole::class.java)
        }

        @Test
        @WithUnauhtorizedRole
        fun unauthorizedUserCannotGet() {
            performTestGet(Role.LAATIJA).andExpect(status().isUnauthorized)
        }

        @Test
        @WithOpettajaRole
        fun opettajaCannotGet() {
            performTestGet(Role.LAATIJA).andExpect(status().isUnauthorized)
        }

        @Test
        @WithLaatijaRole
        fun laatijaCanGet() {
            performTestGet(Role.LAATIJA).andExpect(status().isOk)
        }

        @Test
        @WithYllapitajaRole
        fun yllapitajaCanGet() {
            performTestGet(Role.LAATIJA).andExpect(status().isOk)
        }
    }

    @Nested
    inner class RequireAtLeastYllapitajaRoleTest {
        @Test
        fun `assert that yllapitaja test endpoint has annotation @RequireAtLeastYllapitajaRole`() {
            assertTestControllerFunctionHasAnnotation("testYllapitajaRequired", RequireAtLeastYllapitajaRole::class.java)
        }

        @Test
        @WithUnauhtorizedRole
        fun unauthorizedUserCannotGet() {
            performTestGet(Role.YLLAPITAJA).andExpect(status().isUnauthorized)
        }

        @Test
        @WithOpettajaRole
        fun opettajaCannotGet() {
            performTestGet(Role.YLLAPITAJA).andExpect(status().isUnauthorized)
        }

        @Test
        @WithLaatijaRole
        fun laatijaCannotGet() {
            performTestGet(Role.YLLAPITAJA).andExpect(status().isUnauthorized)
        }

        @Test
        @WithYllapitajaRole
        fun yllapitajaCanGet() {
            performTestGet(Role.YLLAPITAJA).andExpect(status().isOk)
        }
    }

    @Nested
    inner class RequireAtLeastYllapitajaRoleByDefaultTest {
        fun performGet() =
            mockMvc.perform(MockMvcRequestBuilders.get("${Constants.API_PREFIX}/test/testYllapitajaRequiredByDefault"))

        @Test
        fun `assert that yllapitaja by default test endpoint does not have annotation @RequireAtLeastYllapitajaRole`() {
            val userEndpointFunction = TestController::class.functions.find { it.name == "testYllapitajaRequiredByDefault" }
            assertThat(userEndpointFunction, notNullValue())
            assertThat(userEndpointFunction?.annotations, not(hasItem(instanceOf<RequireAtLeastYllapitajaRole>(RequireAtLeastYllapitajaRole::class.java))))
        }

        @Test
        @WithUnauhtorizedRole
        fun unauthorizedUserCannotGet() {
            performGet().andExpect(status().isUnauthorized)
        }

        @Test
        @WithOpettajaRole
        fun opettajaCannotGet() {
            performGet().andExpect(status().isUnauthorized)
        }

        @Test
        @WithLaatijaRole
        fun laatijaCannotGet() {
            performGet().andExpect(status().isUnauthorized)
        }

        @Test
        @WithYllapitajaRole
        fun yllapitajaCanGet() {
            performGet().andExpect(status().isOk)
        }
    }
}