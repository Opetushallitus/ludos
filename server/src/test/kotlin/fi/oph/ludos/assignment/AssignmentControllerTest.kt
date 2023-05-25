package fi.oph.ludos.assignment

import com.fasterxml.jackson.module.kotlin.jacksonObjectMapper
import fi.oph.ludos.Constants
import fi.oph.ludos.Exam
import fi.oph.ludos.PublishState
import javax.transaction.Transactional
import org.assertj.core.api.Assertions.assertThat
import org.hibernate.validator.internal.util.Contracts.assertTrue
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.http.MediaType
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.status
import java.sql.Timestamp

fun postAssignment(body: String) =
    MockMvcRequestBuilders.post("${Constants.API_PREFIX}/assignment").contentType(MediaType.APPLICATION_JSON)
        .content(body)

fun getAssignment(exam: Exam, id: Int) =
    MockMvcRequestBuilders.get("${Constants.API_PREFIX}/assignment/$exam/$id").contentType(MediaType.APPLICATION_JSON)

fun updateAssignment(id: Int, body: String) =
    MockMvcRequestBuilders.put("${Constants.API_PREFIX}/assignment/$id").contentType(MediaType.APPLICATION_JSON)
        .content(body)

fun seedDb() = MockMvcRequestBuilders.get("${Constants.API_PREFIX}/seed").contentType(MediaType.APPLICATION_JSON)

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class AssignmentControllerTest(@Autowired val mockMvc: MockMvc) {
    val objectMapper = jacksonObjectMapper()

    data class TestSukoOut(
        val id: Int,
        val nameFi: String,
        val nameSv: String,
        val contentFi: String,
        val contentSv: String,
        val instructionFi: String,
        val instructionSv: String,
        val publishState: PublishState,
        val assignmentTypeKoodiArvo: String,
        val oppimaaraKoodiArvo: String,
        val tavoitetasoKoodiArvo: String,
        val aiheKoodiArvos: Array<String>,
        val laajaalainenOsaaminenKoodiArvos: Array<String>,
        val createdAt: Timestamp,
        val updatedAt: Timestamp
    )

    @Test
    fun sukoAssignmentTest() {
        val testAssignmentStr = """{
            "exam": "SUKO",
            "contentType": "ASSIGNMENTS",
            "assignmentTypeKoodiArvo": "003",
            "oppimaaraKoodiArvo": "ET",
            "tavoitetasoKoodiArvo": "0004",
            "aiheKoodiArvos": ["002", "003"],
            "laajaalainenOsaaminenKoodiArvos": ["06", "03"],
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
        val postResult = mockMvc.perform(postAssignment(testAssignmentStr)).andExpect(status().isOk())
            .andReturn().response.contentAsString
        val assignmentIn = objectMapper.readValue(postResult, TestSukoOut::class.java)

        // get assignment DTO OUT
        val getResult = mockMvc.perform(getAssignment(Exam.SUKO, assignmentIn.id)).andExpect(status().isOk())
            .andReturn().response.contentAsString
        val assignmentOut = objectMapper.readValue(getResult, TestSukoOut::class.java)

        assertEquals(assignmentIn.id, assignmentOut.id)
        assertEquals(assignmentIn.nameFi, assignmentOut.nameFi)
        assertEquals(assignmentIn.nameSv, assignmentOut.nameSv)
        assertEquals(assignmentIn.contentFi, assignmentOut.contentFi)
        assertEquals(assignmentIn.contentSv, assignmentOut.contentSv)
        assertEquals(assignmentIn.publishState, assignmentOut.publishState)
        assertEquals(assignmentIn.assignmentTypeKoodiArvo, assignmentOut.assignmentTypeKoodiArvo)
        assertEquals(assignmentIn.oppimaaraKoodiArvo, assignmentOut.oppimaaraKoodiArvo)
        assertEquals(assignmentIn.tavoitetasoKoodiArvo, assignmentOut.tavoitetasoKoodiArvo)
        assertEquals(assignmentIn.aiheKoodiArvos[0], assignmentOut.aiheKoodiArvos[0])
        assertEquals(assignmentIn.aiheKoodiArvos[1], assignmentOut.aiheKoodiArvos[1])
        assertEquals(assignmentIn.laajaalainenOsaaminenKoodiArvos[0], assignmentOut.laajaalainenOsaaminenKoodiArvos[0])
        assertEquals(assignmentIn.laajaalainenOsaaminenKoodiArvos[1], assignmentOut.laajaalainenOsaaminenKoodiArvos[1])
        assertEquals(assignmentIn.createdAt, assignmentOut.createdAt)
        assertEquals(assignmentIn.updatedAt, assignmentOut.updatedAt)

        // update request
        val editedAssignment = """{
                "id": "${assignmentOut.id}",
                "exam": "SUKO",
                "nameFi": "New test name",
                "contentFi": "${assignmentOut.contentFi}",
                "instructionFi": "${assignmentOut.instructionFi}",
                "nameSv": "New test name",
                "contentSv": "content",
                "instructionSv": "${assignmentOut.instructionSv}",
                "publishState": "PUBLISHED",
                "assignmentTypeKoodiArvo": "001",
                "oppimaaraKoodiArvo": "ET",
                "tavoitetasoKoodiArvo": "0010",
                "aiheKoodiArvos": ["002", "003"],
                "laajaalainenOsaaminenKoodiArvos": ["06", "03"]
            }"""

        val updatedAssignmentId =
            mockMvc.perform(updateAssignment(assignmentOut.id, editedAssignment)).andExpect(status().isOk())
                .andReturn().response.contentAsString

        assertEquals(updatedAssignmentId, assignmentOut.id.toString())
    }

    @Test
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

        assertThat(failUpdate).isEqualTo("404 NOT_FOUND \"Assignment not found $nonExistentId\"")
    }

    @Test
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
                "assignmentTypeKoodiArvo": "👃",
                "oppimaaraKoodiArvo": "👁️",
                "tavoitetasoKoodiArvo": "🫣",
                "aiheKoodiArvos": ["🥸", "🫡"],
                "laajaalainenOsaaminenKoodiArvos": ["😧", "👺"]
            }"""

        val errorMessage =
            mockMvc.perform(postAssignment(assignmentFail)).andReturn().response.contentAsString.trimIndent()

        assertThat(errorMessage).isEqualTo(
            """
                aiheKoodiArvos: Invalid KoodiArvos
                assignmentTypeKoodiArvo: Invalid KoodiArvo
                laajaalainenOsaaminenKoodiArvos: Invalid KoodiArvos
                oppimaaraKoodiArvo: Invalid KoodiArvo
                tavoitetasoKoodiArvo: Invalid KoodiArvo
            """.trimIndent()
        )
    }

    @Test
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

    data class TestLdOut(
        val id: Int,
        val nameFi: String,
        val nameSv: String,
        val contentFi: String,
        val contentSv: String,
        val instructionFi: String,
        val instructionSv: String,
        val publishState: PublishState,
        val createdAt: Timestamp,
        val updatedAt: Timestamp,
        val laajaalainenOsaaminenKoodiArvos: Array<String>,
        val lukuvuosiKoodiArvos: Array<String>,
        val aineKoodiArvo: String
    )

    @Test
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
        val postResult = mockMvc.perform(postAssignment(testAssignment)).andExpect(status().isOk())
            .andReturn().response.contentAsString
        val assignmentIn = objectMapper.readValue(postResult, TestLdOut::class.java)

        // get assignment DTO OUT
        val getResult = mockMvc.perform(getAssignment(Exam.LD, assignmentIn.id)).andExpect(status().isOk())
            .andReturn().response.contentAsString
        val assignmentOut = objectMapper.readValue(getResult, TestLdOut::class.java)

        assertEquals(assignmentOut.id, assignmentOut.id)
        assertEquals(assignmentOut.nameFi, "Lukiodiplomi assignment FI")
        assertEquals(assignmentOut.contentFi, "Lukiodiplomi assignment content FI")
        assertEquals(assignmentOut.publishState, PublishState.PUBLISHED)
        assertEquals(
            assignmentOut.laajaalainenOsaaminenKoodiArvos[0], "06"
        )
        assertEquals(
            assignmentOut.laajaalainenOsaaminenKoodiArvos[1], "03"
        )
        assertEquals(assignmentOut.lukuvuosiKoodiArvos[0], "20202021")
        assertEquals(assignmentOut.aineKoodiArvo, "1")

        // update assignment
        val editedAssignment = """{
                "id": "${assignmentOut.id}",
                "exam": "${Exam.LD}",
                "nameFi": "New test name",
                "contentFi": "content",
                "instructionFi": "${assignmentOut.instructionFi}",
                "nameSv": "New test name",
                "contentSv": "content",
                "instructionSv": "${assignmentOut.instructionSv}",
                "publishState": "PUBLISHED",
                "laajaalainenOsaaminenKoodiArvos": ["02"],
                "lukuvuosiKoodiArvos": ["20222023"],
                "aineKoodiArvo": "2"
            }"""

        mockMvc.perform(updateAssignment(assignmentOut.id, editedAssignment)).andExpect(status().isOk())
            .andReturn().response.contentAsString

        val getUpdatedAssignment = mockMvc.perform(getAssignment(Exam.LD, assignmentOut.id)).andExpect(status().isOk())
            .andReturn().response.contentAsString

        val updatedAssignment = objectMapper.readValue(getUpdatedAssignment, TestLdOut::class.java)

        assertEquals(updatedAssignment.nameFi, "New test name")
        assertEquals(updatedAssignment.contentFi, "content")
        assertEquals(updatedAssignment.instructionFi, assignmentOut.instructionFi)
        assertEquals(updatedAssignment.nameSv, "New test name")
        assertEquals(updatedAssignment.contentSv, "content")
        assertEquals(updatedAssignment.instructionSv, assignmentOut.instructionSv)
        assertEquals(updatedAssignment.publishState, PublishState.PUBLISHED)
        assertEquals(updatedAssignment.laajaalainenOsaaminenKoodiArvos[0], "02")
        assertEquals(updatedAssignment.lukuvuosiKoodiArvos[0], "20222023")
        assertEquals(updatedAssignment.aineKoodiArvo, "2")

    }

    data class TestPuhviOut(
        val id: Int,
        val nameFi: String,
        val nameSv: String,
        val contentFi: String,
        val contentSv: String,
        val instructionFi: String,
        val instructionSv: String,
        val publishState: PublishState,
        val laajaalainenOsaaminenKoodiArvos: Array<String>,
        val assignmentTypeKoodiArvo: String,
        val lukuvuosiKoodiArvos: Array<String>,
        val createdAt: Timestamp,
        val updatedAt: Timestamp
    )

    @Test
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
        val postResult =
            mockMvc.perform(postAssignment(body)).andExpect(status().isOk()).andReturn().response.contentAsString
        val assignmentIn = objectMapper.readValue(postResult, TestPuhviOut::class.java)
        // get assignment DTO OUT
        val getResult = mockMvc.perform(getAssignment(Exam.PUHVI, assignmentIn.id)).andExpect(status().isOk())
            .andReturn().response.contentAsString
        val assignmentOut = objectMapper.readValue(getResult, TestPuhviOut::class.java)

        assertEquals(assignmentOut.id, assignmentOut.id)
        assertEquals(assignmentOut.nameFi, "Puhvi assignment")
        assertEquals(assignmentOut.nameSv, "Puhvi assignment")
        assertEquals(assignmentOut.contentFi, "Puhvi assignment content")
        assertEquals(assignmentOut.contentSv, "Puhvi assignment content")
        assertEquals(assignmentOut.instructionFi, "Puhvi assignment instruction")
        assertEquals(assignmentOut.instructionSv, "Puhvi assignment instruction")
        assertEquals(assignmentOut.publishState, PublishState.PUBLISHED)
        assertEquals(assignmentOut.lukuvuosiKoodiArvos[0], "20222023")
        assertEquals(assignmentOut.assignmentTypeKoodiArvo, "001")
        assertEquals(assignmentOut.laajaalainenOsaaminenKoodiArvos[0], "06")

        // update assignment
        val editedAssignment = """{
                "id": "${assignmentOut.id}",
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

        mockMvc.perform(updateAssignment(assignmentOut.id, editedAssignment)).andExpect(status().isOk())
            .andReturn().response.contentAsString

        val getUpdatedAssignment =
            mockMvc.perform(getAssignment(Exam.PUHVI, assignmentOut.id)).andExpect(status().isOk())
                .andReturn().response.contentAsString

        val updatedAssignment = objectMapper.readValue(getUpdatedAssignment, TestPuhviOut::class.java)

        assertEquals(updatedAssignment.nameFi, "Puhvi assignment edited")
        assertEquals(updatedAssignment.contentFi, "Puhvi assignment content edited")
        assertEquals(updatedAssignment.instructionFi, assignmentOut.instructionFi)
        assertEquals(updatedAssignment.nameSv, "Puhvi assignment edited")
        assertEquals(updatedAssignment.contentSv, "Puhvi assignment content edited")
        assertEquals(updatedAssignment.instructionSv, assignmentOut.instructionSv)
        assertEquals(updatedAssignment.publishState, PublishState.PUBLISHED)
        assertEquals(updatedAssignment.assignmentTypeKoodiArvo, "002")
        assertEquals(updatedAssignment.laajaalainenOsaaminenKoodiArvos[0], "06")
        assertEquals(updatedAssignment.laajaalainenOsaaminenKoodiArvos[1], "01")
        assertEquals(updatedAssignment.lukuvuosiKoodiArvos[0], "20202021")
    }

    @Test
    fun invalidExam() {
        // Invalid exam type
        val body =
            "{\"name\":\"Suko Test Assignment\",\"content\":\"Suko assignment content\",\"publishState\":\"PUBLISHED\",\"assignmentTypeKoodiArvo\":\"LUKEMINEN\",\"exam\":\"WRONG\"}\n"

        val postResult = mockMvc.perform(postAssignment(body)).andExpect(status().isBadRequest()).andReturn()
        val responseContent = postResult.response.contentAsString

        assertThat(responseContent).contains("Could not resolve type id 'WRONG' as a subtype")
    }

    @Test
    fun invalidState() {
        // Invalid assignment type
        val body =
            "{\"name\":\"Suko Test Assignment\",\"content\":\"Suko assignment content\",\"publishState\":\"TEST\",\"exam\":\"SUKO\"}\n"

        val postResult = mockMvc.perform(postAssignment(body)).andExpect(status().isBadRequest()).andReturn()
        val responseContent = postResult.response.contentAsString

        assertThat(responseContent).contains("Cannot deserialize value of type")
    }

    @Test
    fun assignmentNotFound() {
        val getResult = mockMvc.perform(getAssignment(Exam.SUKO, 999)).andExpect(status().isNotFound()).andReturn()
        val responseContent = getResult.response.contentAsString

        assertThat(responseContent).isEqualTo("404 NOT_FOUND \"Assignment not found 999\"")
    }

    @Test
    fun testFilters() {
        seedDb()

        val sukoFilters = SukoAssignmentFilter(
            orderDirection = "desc",
            oppimaara = "TKFIA1",
            tehtavatyyppisuko = "002",
            aihe = "",
            tavoitetaitotaso = ""
        )

    }

}