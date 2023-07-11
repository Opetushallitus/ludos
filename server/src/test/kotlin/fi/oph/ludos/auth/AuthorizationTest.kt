package fi.oph.ludos.auth

import fi.oph.ludos.*
import fi.oph.ludos.test.TestController
import org.hamcrest.MatcherAssert.assertThat
import org.hamcrest.CoreMatchers.*
import org.junit.jupiter.api.Nested
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.fail
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.test.context.TestPropertySource
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.ResultActions
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.status
import javax.transaction.Transactional
import kotlin.reflect.full.functions


@TestPropertySource(locations = ["classpath:application.properties"])
@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class AuthorizationTest(@Autowired val mockMvc: MockMvc) {

    fun getRequireRoleAnnotationClassByRole(role: Role): Class<*> =
        when (role) {
            Role.OPETTAJA -> RequireAtLeastOpettajaRole::class.java
            Role.LAATIJA -> RequireAtLeastLaatijaRole::class.java
            Role.YLLAPITAJA -> RequireAtLeastYllapitajaRole::class.java
            else -> fail("Unsupported role $role")
        }

    fun performGetRequiringAtLeast(role: Role): ResultActions {
        val endpointName = "test${role.name.lowercase().replaceFirstChar { it.uppercase() }}Required"
        assertTestControllerFunctionHasAnnotation(endpointName, getRequireRoleAnnotationClassByRole(role))
        return mockMvc.perform(MockMvcRequestBuilders.get("${Constants.API_PREFIX}/test/${endpointName}"))
    }

    fun assertTestControllerFunctionHasAnnotation(functionName: String, expectedAnnotationClass: Any) {
        val userEndpointFunction = TestController::class.functions.find { it.name == functionName }
        assertThat(userEndpointFunction, notNullValue())
        assertThat(userEndpointFunction?.annotations, hasItem(instanceOf<Any>(expectedAnnotationClass as Class<*>)))
    }

    @Nested
    inner class RequireAtLeastOpettajaRoleTest {
        @Test
        @WithUnauhtorizedRole
        fun unauthorizedUserCannotGet() {
            performGetRequiringAtLeast(Role.OPETTAJA).andExpect(status().isUnauthorized)
        }

        @Test
        @WithOpettajaRole
        fun opettajaCanGet() {
            performGetRequiringAtLeast(Role.OPETTAJA).andExpect(status().isOk)
        }

        @Test
        @WithLaatijaRole
        fun laatijaCanGet() {
            performGetRequiringAtLeast(Role.OPETTAJA).andExpect(status().isOk)
        }

        @Test
        @WithOpettajaAndLaatijaRoles
        fun userWithBothOpettajaAndLaatijaRolesCanGet() {
            performGetRequiringAtLeast(Role.OPETTAJA).andExpect(status().isOk)
        }

        @Test
        @WithYllapitajaRole
        fun yllapitajaCanGet() {
            performGetRequiringAtLeast(Role.OPETTAJA).andExpect(status().isOk)
        }
    }

    @Nested
    inner class RequireAtLeastLaatijaRoleTest {
        @Test
        @WithUnauhtorizedRole
        fun unauthorizedUserCannotGet() {
            performGetRequiringAtLeast(Role.LAATIJA).andExpect(status().isUnauthorized)
        }

        @Test
        @WithOpettajaRole
        fun opettajaCannotGet() {
            performGetRequiringAtLeast(Role.LAATIJA).andExpect(status().isUnauthorized)
        }

        @Test
        @WithLaatijaRole
        fun laatijaCanGet() {
            performGetRequiringAtLeast(Role.LAATIJA).andExpect(status().isOk)
        }

        @Test
        @WithOpettajaAndLaatijaRoles
        fun userWithBothOpettajaAndLaatijaRolesCanGet() {
            performGetRequiringAtLeast(Role.LAATIJA).andExpect(status().isOk)
        }

        @Test
        @WithYllapitajaRole
        fun yllapitajaCanGet() {
            performGetRequiringAtLeast(Role.LAATIJA).andExpect(status().isOk)
        }
    }

    @Nested
    inner class RequireAtLeastYllapitajaRoleTest {
        @Test
        @WithUnauhtorizedRole
        fun unauthorizedUserCannotGet() {
            performGetRequiringAtLeast(Role.YLLAPITAJA).andExpect(status().isUnauthorized)
        }

        @Test
        @WithOpettajaRole
        fun opettajaCannotGet() {
            performGetRequiringAtLeast(Role.YLLAPITAJA).andExpect(status().isUnauthorized)
        }

        @Test
        @WithLaatijaRole
        fun laatijaCannotGet() {
            performGetRequiringAtLeast(Role.YLLAPITAJA).andExpect(status().isUnauthorized)
        }

        @Test
        @WithOpettajaAndLaatijaRoles
        fun userWithBothOpettajaAndLaatijaRolesCannotGet() {
            performGetRequiringAtLeast(Role.YLLAPITAJA).andExpect(status().isUnauthorized)
        }

        @Test
        @WithYllapitajaRole
        fun yllapitajaCanGet() {
            performGetRequiringAtLeast(Role.YLLAPITAJA).andExpect(status().isOk)
        }
    }

    @Nested
    inner class RequireAtLeastYllapitajaRoleByDefaultTest {
        private fun performGet() =
            mockMvc.perform(MockMvcRequestBuilders.get("${Constants.API_PREFIX}/test/testYllapitajaRequiredByDefault"))

        @Test
        fun `assert that yllapitaja by default test endpoint does not have annotation @RequireAtLeastYllapitajaRole`() {
            val userEndpointFunction = TestController::class.functions.find { it.name == "testYllapitajaRequiredByDefault" }
            assertThat(userEndpointFunction, notNullValue())
            assertThat(userEndpointFunction?.annotations, not(hasItem(instanceOf<RequireAtLeastYllapitajaRole>(RequireAtLeastYllapitajaRole::class.java))))
        }

        @Test
        fun `assert that TestController has annotation @RequireAtLeastYllapitajaRole`() {
            assertThat(TestController::class.annotations, hasItem(instanceOf<RequireAtLeastYllapitajaRole>(RequireAtLeastYllapitajaRole::class.java)))
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
        @WithOpettajaAndLaatijaRoles
        fun userWithBothOpettajaAndLaatijaRolesCannotGet() {
            performGet().andExpect(status().isUnauthorized)
        }

        @Test
        @WithYllapitajaRole
        fun yllapitajaCanGet() {
            performGet().andExpect(status().isOk)
        }
    }
}