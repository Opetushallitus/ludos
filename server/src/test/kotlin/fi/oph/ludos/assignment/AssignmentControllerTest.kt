package fi.oph.ludos.assignment

import com.fasterxml.jackson.module.kotlin.jacksonObjectMapper
import fi.oph.ludos.Constants
import fi.oph.ludos.Exam
import fi.oph.ludos.ContentType
import fi.oph.ludos.PublishState
import javax.transaction.Transactional
import org.assertj.core.api.Assertions.assertThat
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

fun updateAssignment(exam: Exam, id: Int, body: String) =
    MockMvcRequestBuilders.put("${Constants.API_PREFIX}/assignment/$exam/$id").contentType(MediaType.APPLICATION_JSON)
        .content(body)

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
        val contentType: ContentType,
        val assignmentTypeKoodiArvo: String,
        val oppimaaraKoodiArvo: String,
        val tavoitetasoKoodiArvo: String,
        val aiheKoodiArvo: Array<String>,
        val laajaalainenOsaaminenKoodiArvo: Array<String>,
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
            "tavoitetasoKoodiArvo": "04",
            "aiheKoodiArvo": ["02", "03"],
            "laajaalainenOsaaminenKoodiArvo": ["06", "03"],
            "nameFi": "suomi",
            "nameSv": "ruotsi",
            "contentFi": "suomi",
            "contentSv": "ruotsi",
            "instructionFi": "suomi",
            "instructionSv": "ruotsi",
            "publishState": "PUBLISHED"
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
        assertEquals(assignmentIn.contentType, assignmentOut.contentType)
        assertEquals(assignmentIn.assignmentTypeKoodiArvo, assignmentOut.assignmentTypeKoodiArvo)
        assertEquals(assignmentIn.oppimaaraKoodiArvo, assignmentOut.oppimaaraKoodiArvo)
        assertEquals(assignmentIn.tavoitetasoKoodiArvo, assignmentOut.tavoitetasoKoodiArvo)
        assertEquals(assignmentIn.aiheKoodiArvo[0], assignmentOut.aiheKoodiArvo[0])
        assertEquals(assignmentIn.aiheKoodiArvo[1], assignmentOut.aiheKoodiArvo[1])
        assertEquals(assignmentIn.laajaalainenOsaaminenKoodiArvo[0], assignmentOut.laajaalainenOsaaminenKoodiArvo[0])
        assertEquals(assignmentIn.laajaalainenOsaaminenKoodiArvo[1], assignmentOut.laajaalainenOsaaminenKoodiArvo[1])
        assertEquals(assignmentIn.createdAt, assignmentOut.createdAt)
        assertEquals(assignmentIn.updatedAt, assignmentOut.updatedAt)

        // update request
        val editedAssignment = """{
                "id": "${assignmentOut.id}",
                "nameFi": "New test name",
                "contentFi": "${assignmentOut.contentFi}",
                "instructionFi": "${assignmentOut.instructionFi}",
                "nameSv": "New test name",
                "contentSv": "content",
                "instructionSv": "${assignmentOut.instructionSv}",
                "publishState": "PUBLISHED",
                "contentType": "${ContentType.ASSIGNMENTS}",
                "assignmentTypeKoodiArvo": "001",
                "oppimaaraKoodiArvo": "ET",
                "tavoitetasoKoodiArvo": "04",
                "aiheKoodiArvo": ["2", "3"],
                "laajaalainenOsaaminenKoodiArvo": ["06", "03"]
            }"""

        val updatedAssignmentId =
            mockMvc.perform(updateAssignment(Exam.SUKO, assignmentOut.id, editedAssignment)).andExpect(status().isOk())
                .andReturn().response.contentAsString

        assertEquals(updatedAssignmentId, assignmentOut.id.toString())
    }

    @Test
    fun failAssignmentUpdate() {
        val nonExistentId = -1
        val editedAssignmentFail = """{
                "id": "$nonExistentId",
                "nameFi": "New test name",
                "contentFi": "content",
                "instructionFi": "instruction",
                "nameSv": "New test name",
                "contentSv": "content",
                "instructionSv": "instruction",
                "publishState": "PUBLISHED",
                "contentType": "${ContentType.ASSIGNMENTS}",
                "assignmentTypeKoodiArvo": "001",
                "oppimaaraKoodiArvo": "ET",
                "tavoitetasoKoodiArvo": "04",
                "aiheKoodiArvo": ["2", "3"],
                "laajaalainenOsaaminenKoodiArvo": ["06", "03"]
            }"""

        val failUpdate = mockMvc.perform(updateAssignment(Exam.SUKO, nonExistentId, editedAssignmentFail))
            .andReturn().response.contentAsString

        assertThat(failUpdate).isEqualTo("404 NOT_FOUND \"Assignment not found $nonExistentId\"")
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
        val contentType: ContentType,
        val createdAt: Timestamp,
        val updatedAt: Timestamp
    )

    data class TestLdIn(
        val nameFi: String,
        val nameSv: String,
        val contentFi: String,
        val contentSv: String,
        val instructionFi: String,
        val instructionSv: String,
        val publishState: PublishState,
        val contentType: ContentType,
        val exam: Exam
    )

    @Test
    fun ldAssignmentTest() {
        val testAssignment = TestLdIn(
            nameFi = "Lukiodiplomi assignment FI",
            contentFi = "Lukiodiplomi assignment content FI",
            instructionFi = "Lukiodiplomi assignment instruction FI",
            nameSv = "Lukiodiplomi assignment SV",
            contentSv = "Lukiodiplomi assignment content SV",
            instructionSv = "Lukiodiplomi assignment instruction SV",
            publishState = PublishState.PUBLISHED,
            contentType = ContentType.ASSIGNMENTS,
            exam = Exam.LD
        )

        val testAssignmentToString: String = objectMapper.writeValueAsString(testAssignment)

        // post assignment DTO IN
        val postResult = mockMvc.perform(postAssignment(testAssignmentToString)).andExpect(status().isOk())
            .andReturn().response.contentAsString
        val assignmentIn = objectMapper.readValue(postResult, TestLdOut::class.java)

        // get assignment DTO OUT
        val getResult = mockMvc.perform(getAssignment(Exam.LD, assignmentIn.id)).andExpect(status().isOk())
            .andReturn().response.contentAsString
        val assignmentOut = objectMapper.readValue(getResult, TestLdOut::class.java)

        assertEquals(assignmentOut.id, assignmentOut.id)
        assertEquals(assignmentOut.nameFi, testAssignment.nameFi)
        assertEquals(assignmentOut.contentFi, testAssignment.contentFi)
        assertEquals(assignmentOut.publishState, testAssignment.publishState)
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
        val contentType: ContentType,
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
                "contentType": "${ContentType.ASSIGNMENTS}",
                "exam": "PUHVI"
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
    }

    @Test
    fun invalidExam() {
        // Invalid exam type
        val body =
            "{\"name\":\"Suko Test Assignment\",\"content\":\"Suko assignment content\",\"publishState\":\"PUBLISHED\",\"contentType\": \"${ContentType.ASSIGNMENTS}\",\"assignmentTypeKoodiArvo\":\"LUKEMINEN\",\"exam\":\"WRONG\"}\n"

        val postResult = mockMvc.perform(postAssignment(body)).andExpect(status().isBadRequest()).andReturn()
        val responseContent = postResult.response.contentAsString

        assertThat(responseContent).contains("Could not resolve type id 'WRONG' as a subtype")
    }

    @Test
    fun invalidState() {
        // Invalid assignment type
        val body =
            "{\"name\":\"Suko Test Assignment\",\"content\":\"Suko assignment content\",\"publishState\":\"TEST\",\"contentType\": \"${ContentType.ASSIGNMENTS}\",\"exam\":\"SUKO\"}\n"

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

}