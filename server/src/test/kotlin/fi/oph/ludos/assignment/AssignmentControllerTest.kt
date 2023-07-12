package fi.oph.ludos.assignment

import com.fasterxml.jackson.module.kotlin.jacksonObjectMapper
import fi.oph.ludos.*
import org.hamcrest.CoreMatchers.containsString
import org.hamcrest.MatcherAssert.assertThat
import org.hamcrest.CoreMatchers.equalTo
import org.hibernate.validator.internal.util.Contracts.assertTrue
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.test.context.TestPropertySource
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.status
import javax.transaction.Transactional

@TestPropertySource(locations = ["classpath:application.properties"])
@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class AssignmentControllerTest(@Autowired val mockMvc: MockMvc) {
    val objectMapper = jacksonObjectMapper()

    @Test
    @WithYllapitajaRole
    fun sukoAssignmentTest() {
        val testAssignmentStr = """{
            "exam": "SUKO",
            "nameFi": "suomi",
            "nameSv": "ruotsi",
            "contentFi": "suomi",
            "contentSv": "ruotsi",
            "instructionFi": "suomi",
            "instructionSv": "ruotsi",
            "publishState": "PUBLISHED",
            "assignmentTypeKoodiArvo": "003",
            "oppimaaraKoodiArvo": "ET",
            "tavoitetasoKoodiArvo": "0004",
            "aiheKoodiArvos": ["002", "003"],
            "laajaalainenOsaaminenKoodiArvos": ["06", "03"]
        }""".trimIndent()

        // post assignment DTO IN
        val createResult = mockMvc.perform(postAssignment(testAssignmentStr)).andExpect(status().isOk())
            .andReturn().response.contentAsString
        val createdAssignment = objectMapper.readValue(createResult, TestSukoOut::class.java)

        // get assignment DTO OUT
        val getByIdResult = mockMvc.perform(getAssignment(Exam.SUKO, createdAssignment.id)).andExpect(status().isOk())
            .andReturn().response.contentAsString
        val assignmentById = objectMapper.readValue(getByIdResult, TestSukoOut::class.java)

        assertEquals(createdAssignment.id, assignmentById.id)
        assertEquals(createdAssignment.nameFi, assignmentById.nameFi)
        assertEquals(createdAssignment.nameSv, assignmentById.nameSv)
        assertEquals(createdAssignment.contentFi, assignmentById.contentFi)
        assertEquals(createdAssignment.contentSv, assignmentById.contentSv)
        assertEquals(createdAssignment.publishState, assignmentById.publishState)
        assertEquals(createdAssignment.assignmentTypeKoodiArvo, assignmentById.assignmentTypeKoodiArvo)
        assertEquals(createdAssignment.oppimaaraKoodiArvo, assignmentById.oppimaaraKoodiArvo)
        assertEquals(createdAssignment.tavoitetasoKoodiArvo, assignmentById.tavoitetasoKoodiArvo)
        assertThat(createdAssignment.aiheKoodiArvos, equalTo(assignmentById.aiheKoodiArvos))
        assertThat(createdAssignment.laajaalainenOsaaminenKoodiArvos, equalTo(assignmentById.laajaalainenOsaaminenKoodiArvos))
        assertThat(createdAssignment.authorOid, equalTo(YllapitajaSecurityContextFactory().kayttajatiedot().oidHenkilo))
        assertEquals(createdAssignment.createdAt, assignmentById.createdAt)
        assertEquals(createdAssignment.updatedAt, assignmentById.updatedAt)

        // update request
        val editedAssignment = """{
                "id": "${assignmentById.id}",
                "exam": "SUKO",
                "nameFi": "New test name",
                "contentFi": "${assignmentById.contentFi}",
                "instructionFi": "${assignmentById.instructionFi}",
                "nameSv": "New test name",
                "contentSv": "content",
                "instructionSv": "${assignmentById.instructionSv}",
                "publishState": "PUBLISHED",
                "assignmentTypeKoodiArvo": "001",
                "oppimaaraKoodiArvo": "ET",
                "tavoitetasoKoodiArvo": "0010",
                "aiheKoodiArvos": ["002", "003"],
                "laajaalainenOsaaminenKoodiArvos": ["06", "03"]
            }"""

        val updatedAssignmentId =
            mockMvc.perform(updateAssignment(assignmentById.id, editedAssignment)).andExpect(status().isOk())
                .andReturn().response.contentAsString

        assertEquals(updatedAssignmentId, assignmentById.id.toString())
        // TODO: assert that update actually happened
    }

    @Test
    @WithYllapitajaRole
    fun failAssignmentUpdate() {
        val nonExistentId = -1
        val editedAssignmentFail = """{
                "id": "$nonExistentId",
                "exam": "SUKO",
                "nameFi": "New test name",
                "contentFi": "content",
                "instructionFi": "instruction",
                "nameSv": "New test name",
                "contentSv": "content",
                "instructionSv": "instruction",
                "publishState": "PUBLISHED",
                "assignmentTypeKoodiArvo": "001",
                "oppimaaraKoodiArvo": "ET",
                "tavoitetasoKoodiArvo": "0004",
                "aiheKoodiArvos": ["002", "003"],
                "laajaalainenOsaaminenKoodiArvos": ["06", "03"]
            }"""

        val failUpdate =
            mockMvc.perform(updateAssignment(nonExistentId, editedAssignmentFail)).andReturn().response.contentAsString

        assertThat(failUpdate, equalTo("Assignment not found $nonExistentId"))
    }

    @Test
    @WithYllapitajaRole
    fun failKoodistoValidation() {
        val assignmentFail = """{
                "exam": "SUKO",
                "nameFi": "New test name",
                "contentFi": "content",
                "instructionFi": "instruction",
                "nameSv": "New test name",
                "contentSv": "content",
                "instructionSv": "instruction",
                "publishState": "PUBLISHED",
                "assignmentTypeKoodiArvo": "epavalidi",
                "oppimaaraKoodiArvo": "epavalidi",
                "tavoitetasoKoodiArvo": "epavalidi",
                "aiheKoodiArvos": ["epavalidi1", "epavalidi2"],
                "laajaalainenOsaaminenKoodiArvos": ["epavalidi1", "epavalidi2"]
            }"""

        val errorMessage =
            mockMvc.perform(postAssignment(assignmentFail)).andReturn().response.contentAsString.trimIndent()

        assertThat(errorMessage, equalTo(
            """
                aiheKoodiArvos: Invalid KoodiArvos
                assignmentTypeKoodiArvo: Invalid KoodiArvo
                laajaalainenOsaaminenKoodiArvos: Invalid KoodiArvos
                oppimaaraKoodiArvo: Invalid KoodiArvo
                tavoitetasoKoodiArvo: Invalid KoodiArvo
            """.trimIndent())
        )
    }

    @Test
    @WithYllapitajaRole
    fun failForMissingField() {
        val assignmentFail = """{
                "exam": "SUKO",
                "contentFi": "content",
                "instructionFi": "instruction",
                "nameSv": "New test name",
                "contentSv": "content",
                "instructionSv": "instruction",
                "publishState": "PUBLISHED",
                "assignmentTypeKoodiArvo": "001",
                "oppimaaraKoodiArvo": "ET",
                "tavoitetasoKoodiArvo": "0004",
                "aiheKoodiArvos": ["003", "002"],
                "laajaalainenOsaaminenKoodiArvos": ["06", "03"]
            }"""

        val errorMessage = mockMvc.perform(postAssignment(assignmentFail)).andReturn().response.contentAsString

        val substring = "failed for JSON property nameFi due to missing (therefore NULL)"

        assertTrue(errorMessage.contains(substring), "Error message should contain substring: $substring")
    }

    @Test
    @WithYllapitajaRole
    fun ldAssignmentTest() {
        val testAssignment = """
            {
              "nameFi": "Lukiodiplomi assignment FI",
              "contentFi": "Lukiodiplomi assignment content FI",
              "instructionFi": "Lukiodiplomi assignment instruction FI",
              "nameSv": "Lukiodiplomi assignment SV",
              "contentSv": "Lukiodiplomi assignment content SV",
              "instructionSv": "Lukiodiplomi assignment instruction SV",
              "publishState": "PUBLISHED",
              "exam": "LD",
              "laajaalainenOsaaminenKoodiArvos": ["06", "03"],
              "lukuvuosiKoodiArvos": ["20202021", "20222023"],
              "aineKoodiArvo": "1"
            }
        """.trimIndent()

        // post assignment DTO IN
        val createResult = mockMvc.perform(postAssignment(testAssignment)).andExpect(status().isOk())
            .andReturn().response.contentAsString
        val createdAssignment = objectMapper.readValue(createResult, TestLdOut::class.java)

        // get assignment DTO OUT
        val getByIdResult = mockMvc.perform(getAssignment(Exam.LD, createdAssignment.id)).andExpect(status().isOk())
            .andReturn().response.contentAsString
        val assignmentById = objectMapper.readValue(getByIdResult, TestLdOut::class.java)

        assertEquals(assignmentById.id, assignmentById.id)
        assertEquals(assignmentById.nameFi, "Lukiodiplomi assignment FI")
        assertEquals(assignmentById.contentFi, "Lukiodiplomi assignment content FI")
        assertEquals(assignmentById.publishState, PublishState.PUBLISHED)
        assertThat(assignmentById.laajaalainenOsaaminenKoodiArvos, equalTo(arrayOf("06", "03")))
        assertThat(createdAssignment.authorOid, equalTo(YllapitajaSecurityContextFactory().kayttajatiedot().oidHenkilo))
        assertEquals(assignmentById.lukuvuosiKoodiArvos[0], "20202021")
        assertEquals(assignmentById.aineKoodiArvo, "1")

        // update assignment
        val editedAssignment = """{
                "id": "${assignmentById.id}",
                "exam": "${Exam.LD}",
                "nameFi": "New test name",
                "contentFi": "content",
                "instructionFi": "${assignmentById.instructionFi}",
                "nameSv": "New test name",
                "contentSv": "content",
                "instructionSv": "${assignmentById.instructionSv}",
                "publishState": "PUBLISHED",
                "laajaalainenOsaaminenKoodiArvos": ["02"],
                "lukuvuosiKoodiArvos": ["20222023"],
                "aineKoodiArvo": "2"
            }"""

        mockMvc.perform(updateAssignment(assignmentById.id, editedAssignment)).andExpect(status().isOk())
            .andReturn().response.contentAsString

        val getUpdatedAssignment = mockMvc.perform(getAssignment(Exam.LD, assignmentById.id)).andExpect(status().isOk())
            .andReturn().response.contentAsString

        val updatedAssignment = objectMapper.readValue(getUpdatedAssignment, TestLdOut::class.java)

        assertEquals(updatedAssignment.nameFi, "New test name")
        assertEquals(updatedAssignment.contentFi, "content")
        assertEquals(updatedAssignment.instructionFi, assignmentById.instructionFi)
        assertEquals(updatedAssignment.nameSv, "New test name")
        assertEquals(updatedAssignment.contentSv, "content")
        assertEquals(updatedAssignment.instructionSv, assignmentById.instructionSv)
        assertEquals(updatedAssignment.publishState, PublishState.PUBLISHED)
        assertThat(updatedAssignment.laajaalainenOsaaminenKoodiArvos, equalTo(arrayOf("02")))
        assertThat(createdAssignment.authorOid, equalTo(assignmentById.authorOid))
        assertThat(updatedAssignment.lukuvuosiKoodiArvos, equalTo(arrayOf("20222023")))
        assertEquals(updatedAssignment.aineKoodiArvo, "2")

    }

    @Test
    @WithYllapitajaRole
    fun puhviAssignmentTest() {
        val body = """
            {
                "nameFi": "Puhvi assignment",
                "nameSv": "Puhvi assignment",
                "contentFi": "Puhvi assignment content",
                "contentSv": "Puhvi assignment content",
                "instructionFi": "Puhvi assignment instruction",
                "instructionSv": "Puhvi assignment instruction",
                "publishState": "PUBLISHED",
                "exam": "PUHVI",
                "assignmentTypeKoodiArvo": "001",
                "laajaalainenOsaaminenKoodiArvos": ["06", "03"],
                "lukuvuosiKoodiArvos": ["20222023"]
            }
        """

        // post assignment DTO IN
        val createResult =
            mockMvc.perform(postAssignment(body)).andExpect(status().isOk()).andReturn().response.contentAsString
        val createdAssignment = objectMapper.readValue(createResult, TestPuhviOut::class.java)
        // get assignment DTO OUT
        val getByIdResult = mockMvc.perform(getAssignment(Exam.PUHVI, createdAssignment.id)).andExpect(status().isOk())
            .andReturn().response.contentAsString
        val assignmentById = objectMapper.readValue(getByIdResult, TestPuhviOut::class.java)

        assertEquals(assignmentById.id, assignmentById.id)
        assertEquals(assignmentById.nameFi, "Puhvi assignment")
        assertEquals(assignmentById.nameSv, "Puhvi assignment")
        assertEquals(assignmentById.contentFi, "Puhvi assignment content")
        assertEquals(assignmentById.contentSv, "Puhvi assignment content")
        assertEquals(assignmentById.instructionFi, "Puhvi assignment instruction")
        assertEquals(assignmentById.instructionSv, "Puhvi assignment instruction")
        assertEquals(assignmentById.publishState, PublishState.PUBLISHED)
        assertThat(assignmentById.lukuvuosiKoodiArvos, equalTo(arrayOf("20222023")))
        assertEquals(assignmentById.assignmentTypeKoodiArvo, "001")
        assertThat(assignmentById.laajaalainenOsaaminenKoodiArvos, equalTo(arrayOf("06", "03")))
        assertThat(createdAssignment.authorOid, equalTo(YllapitajaSecurityContextFactory().kayttajatiedot().oidHenkilo))

        // update assignment
        val editedAssignment = """{
                "id": "${assignmentById.id}",
                "exam": "${Exam.PUHVI}",
                "nameFi": "Puhvi assignment edited",
                "nameSv": "Puhvi assignment edited",
                "contentFi": "Puhvi assignment content edited",
                "contentSv": "Puhvi assignment content edited",
                "instructionFi": "Puhvi assignment instruction",
                "instructionSv": "Puhvi assignment instruction",
                "publishState": "PUBLISHED",
                "exam": "PUHVI",
                "assignmentTypeKoodiArvo": "002",
                "laajaalainenOsaaminenKoodiArvos": ["06", "01"],
                "lukuvuosiKoodiArvos": ["20202021"]
            }"""

        mockMvc.perform(updateAssignment(assignmentById.id, editedAssignment)).andExpect(status().isOk())
            .andReturn().response.contentAsString

        val getUpdatedAssignment =
            mockMvc.perform(getAssignment(Exam.PUHVI, assignmentById.id)).andExpect(status().isOk())
                .andReturn().response.contentAsString

        val updatedAssignment = objectMapper.readValue(getUpdatedAssignment, TestPuhviOut::class.java)

        assertEquals(updatedAssignment.nameFi, "Puhvi assignment edited")
        assertEquals(updatedAssignment.contentFi, "Puhvi assignment content edited")
        assertEquals(updatedAssignment.instructionFi, assignmentById.instructionFi)
        assertEquals(updatedAssignment.nameSv, "Puhvi assignment edited")
        assertEquals(updatedAssignment.contentSv, "Puhvi assignment content edited")
        assertEquals(updatedAssignment.instructionSv, assignmentById.instructionSv)
        assertEquals(updatedAssignment.publishState, PublishState.PUBLISHED)
        assertEquals(updatedAssignment.assignmentTypeKoodiArvo, "002")
        assertThat(updatedAssignment.laajaalainenOsaaminenKoodiArvos, equalTo(arrayOf("06", "01")))
        assertThat(updatedAssignment.authorOid, equalTo(assignmentById.authorOid))
        assertThat(updatedAssignment.lukuvuosiKoodiArvos, equalTo(arrayOf("20202021")))
    }

    @Test
    @WithYllapitajaRole
    fun invalidExam() {
        // Invalid exam type
        val body =
            "{\"name\":\"Suko Test Assignment\",\"content\":\"Suko assignment content\",\"publishState\":\"PUBLISHED\",\"assignmentTypeKoodiArvo\":\"LUKEMINEN\",\"exam\":\"WRONG\"}\n"

        val postResult = mockMvc.perform(postAssignment(body)).andExpect(status().isBadRequest()).andReturn()
        val responseContent = postResult.response.contentAsString

        assertThat(responseContent, containsString("Could not resolve type id 'WRONG' as a subtype"))
    }

    @Test
    @WithYllapitajaRole
    fun invalidState() {
        // Invalid assignment type
        val body =
            "{\"name\":\"Suko Test Assignment\",\"content\":\"Suko assignment content\",\"publishState\":\"TEST\",\"exam\":\"SUKO\"}\n"

        val postResult = mockMvc.perform(postAssignment(body)).andExpect(status().isBadRequest()).andReturn()
        val responseContent = postResult.response.contentAsString

        assertThat(responseContent, containsString("Cannot deserialize value of type"))
    }

    @Test
    @WithYllapitajaRole
    fun assignmentNotFound() {
        val getResult = mockMvc.perform(getAssignment(Exam.SUKO, 999)).andExpect(status().isNotFound()).andReturn()
        val responseContent = getResult.response.contentAsString

        assertThat(responseContent, equalTo("Assignment not found 999"))
    }

    @Test
    @WithOpettajaRole
    fun testInsufficientRole() {
        val testAssignmentStr = """{
            "exam": "SUKO",
            "nameFi": "suomi",
            "nameSv": "ruotsi",
            "contentFi": "suomi",
            "contentSv": "ruotsi",
            "instructionFi": "suomi",
            "instructionSv": "ruotsi",
            "publishState": "PUBLISHED",
            "assignmentTypeKoodiArvo": "003",
            "oppimaaraKoodiArvo": "ET",
            "tavoitetasoKoodiArvo": "0004",
            "aiheKoodiArvos": ["002", "003"],
            "laajaalainenOsaaminenKoodiArvos": ["06", "03"]
        }""".trimIndent()

        mockMvc.perform(postAssignment(testAssignmentStr)).andExpect(status().isUnauthorized())
        mockMvc.perform(updateAssignment(1, testAssignmentStr)).andExpect(status().isUnauthorized())
    }

    @Test
    @WithOpettajaRole
    fun getAssignmentsAsOpettaja() {
        mockMvc.perform(getAllAssignments(Exam.SUKO)).andExpect(status().isOk())
    }

    @Test
    fun getAssignmentsWithNoRole() {
        mockMvc.perform(getAllAssignments(Exam.SUKO)).andExpect(status().is3xxRedirection())
    }
}