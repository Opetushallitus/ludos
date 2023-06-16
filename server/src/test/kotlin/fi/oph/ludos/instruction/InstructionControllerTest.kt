package fi.oph.ludos.instruction

import com.fasterxml.jackson.module.kotlin.jacksonObjectMapper
import fi.oph.ludos.Constants
import fi.oph.ludos.PublishState
import fi.oph.ludos.Exam
import fi.oph.ludos.WithYllapitajaRole
import org.assertj.core.api.Assertions
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertNotNull
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.http.MediaType
import org.springframework.test.context.TestPropertySource
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.status
import java.sql.Timestamp
import javax.transaction.Transactional

fun postInstruction(body: String) =
    MockMvcRequestBuilders.post("${Constants.API_PREFIX}/instruction").contentType(MediaType.APPLICATION_JSON)
        .content(body)

fun getInstruction(exam: Exam, id: Int) =
    MockMvcRequestBuilders.get("${Constants.API_PREFIX}/instruction/$exam/$id").contentType(MediaType.APPLICATION_JSON)

fun updateInstruction(id: Int, body: String) =
    MockMvcRequestBuilders.put("${Constants.API_PREFIX}/instruction/$id").contentType(MediaType.APPLICATION_JSON)
        .content(body)

@TestPropertySource(
    properties = [
        "LUDOS_PALVELUKAYTTAJA_USERNAME=test_username",
        "LUDOS_PALVELUKAYTTAJA_PASSWORD=test_password"
    ]
)
@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class InstructionControllerTest(@Autowired val mockMvc: MockMvc) {
    val objectMapper = jacksonObjectMapper()

    data class TestSukoIn(
        val nameFi: String,
        val nameSv: String,
        val contentFi: String,
        val contentSv: String,
        val publishState: PublishState,
        val exam: Exam
    )

    data class TestSukoOut(
        val id: Int,
        val nameFi: String,
        val nameSv: String,
        val contentFi: String,
        val contentSv: String,
        val publishState: PublishState,
        val createdAt: Timestamp,
        val updatedAt: Timestamp
    )

    @Test
    @WithYllapitajaRole
    fun sukoInstructionTest() {
        val testInstruction = TestSukoIn(
            nameFi = "Suko Test Instruction FI",
            nameSv = "Suko Test Instruction SV",
            contentFi = "Suko Instruction content Fi",
            contentSv = "Suko Instruction content Sv",
            publishState = PublishState.PUBLISHED,
            exam = Exam.SUKO
        )

        val testInstructionStr = objectMapper.writeValueAsString(testInstruction)

        val postResult =
            mockMvc.perform(postInstruction(testInstructionStr)).andExpect(status().isOk)
                .andReturn().response.contentAsString

        val instructionIn = objectMapper.readValue(postResult, TestSukoOut::class.java)

        assertEquals(testInstruction.nameFi, instructionIn.nameFi)
        assertEquals(testInstruction.nameSv, instructionIn.nameSv)
        assertEquals(testInstruction.contentFi, instructionIn.contentFi)
        assertEquals(testInstruction.contentSv, instructionIn.contentSv)
        assertEquals(testInstruction.publishState, instructionIn.publishState)
        assertNotNull(instructionIn.id)
        assertNotNull(instructionIn.createdAt)
        assertNotNull(instructionIn.updatedAt)

        val getResult =
            mockMvc.perform(getInstruction(Exam.SUKO, instructionIn.id)).andExpect(status().isOk)
                .andReturn().response.contentAsString

        val instructionOut = objectMapper.readValue(getResult, TestSukoOut::class.java)

        assertEquals(instructionIn, instructionOut)

        // update request
        val editedInstruction =
            "{\"id\": \"${instructionIn.id}\",\"nameFi\":\"Suko Test Instruction FI updated\",\"exam\":\"SUKO\",\"contentFi\":\"Suko Instruction content Fi updated\",\"nameSv\":\"Suko Test Instruction SV updated\",\"contentSv\":\"Suko Instruction content Sv updated\",\"publishState\":\"PUBLISHED\"}"

        val updateResult =
            mockMvc.perform(updateInstruction(instructionIn.id, editedInstruction)).andExpect(status().isOk)
                .andReturn().response.contentAsString

        val getUpdatedResult =
            mockMvc.perform(getInstruction(Exam.SUKO, updateResult.toInt())).andExpect(status().isOk)
                .andReturn().response.contentAsString

        val updatedInstruction = objectMapper.readValue(getUpdatedResult, TestSukoOut::class.java)

        assertEquals(updatedInstruction.nameFi, "Suko Test Instruction FI updated")
        assertEquals(updatedInstruction.nameSv, "Suko Test Instruction SV updated")
        assertEquals(updatedInstruction.contentFi, "Suko Instruction content Fi updated")
        assertEquals(updatedInstruction.contentSv, "Suko Instruction content Sv updated")
        assertEquals(updatedInstruction.publishState, PublishState.PUBLISHED)
        assertEquals(updatedInstruction.id, instructionIn.id)
    }

    data class TestPuhviIn(
        val nameFi: String,
        val nameSv: String,
        val contentFi: String,
        val contentSv: String,
        val publishState: PublishState,
        val exam: Exam
    )

    data class TestPuhviOut(
        val id: Int,
        val nameFi: String,
        val nameSv: String,
        val contentFi: String,
        val contentSv: String,
        val publishState: PublishState,
        val createdAt: Timestamp,
        val updatedAt: Timestamp
    )
    @Test
    @WithYllapitajaRole
    fun puhviInstructionTest() {
        val testInstruction = TestPuhviIn(
            nameFi = "Puhvi Test Instruction FI",
            nameSv = "Puhvi Test Instruction SV",
            contentFi = "Puhvi Instruction content Fi",
            contentSv = "Puhvi Instruction content Sv",
            publishState = PublishState.PUBLISHED,
            exam = Exam.PUHVI
        )

        val testInstructionStr = objectMapper.writeValueAsString(testInstruction)

        val postResult =
            mockMvc.perform(postInstruction(testInstructionStr)).andExpect(status().isOk)
                .andReturn().response.contentAsString

        val instructionIn = objectMapper.readValue(postResult, TestPuhviOut::class.java)

        assertEquals(testInstruction.nameFi, instructionIn.nameFi)
        assertEquals(testInstruction.nameSv, instructionIn.nameSv)
        assertEquals(testInstruction.contentFi, instructionIn.contentFi)
        assertEquals(testInstruction.contentSv, instructionIn.contentSv)
        assertEquals(testInstruction.publishState, instructionIn.publishState)
        assertNotNull(instructionIn.id)
        assertNotNull(instructionIn.createdAt)
        assertNotNull(instructionIn.updatedAt)

        val getResult =
            mockMvc.perform(getInstruction(Exam.PUHVI, instructionIn.id)).andExpect(status().isOk)
                .andReturn().response.contentAsString

        val instructionOut = objectMapper.readValue(getResult, TestPuhviOut::class.java)

        assertEquals(instructionIn, instructionOut)

        // update request
        val editedInstruction =
            "{\"id\": \"${instructionIn.id}\",\"nameFi\":\"Puhvi Test Instruction FI updated\",\"exam\":\"PUHVI\",\"contentFi\":\"Puhvi Instruction content Fi updated\",\"nameSv\":\"Puhvi Test Instruction SV updated\",\"contentSv\":\"Puhvi Instruction content Sv updated\",\"publishState\":\"PUBLISHED\"}"

        val updateResult =
            mockMvc.perform(updateInstruction(instructionIn.id, editedInstruction)).andExpect(status().isOk)
                .andReturn().response.contentAsString

        val getUpdatedResult =
            mockMvc.perform(getInstruction(Exam.PUHVI, updateResult.toInt())).andExpect(status().isOk)
                .andReturn().response.contentAsString

        val updatedInstruction = objectMapper.readValue(getUpdatedResult, TestPuhviOut::class.java)

        assertEquals(updatedInstruction.nameFi, "Puhvi Test Instruction FI updated")
        assertEquals(updatedInstruction.nameSv, "Puhvi Test Instruction SV updated")
        assertEquals(updatedInstruction.contentFi, "Puhvi Instruction content Fi updated")
        assertEquals(updatedInstruction.contentSv, "Puhvi Instruction content Sv updated")
        assertEquals(updatedInstruction.publishState, PublishState.PUBLISHED)
        assertEquals(updatedInstruction.id, instructionIn.id)
    }

    data class TestLdIn(
        val nameFi: String,
        val nameSv: String,
        val contentFi: String,
        val contentSv: String,
        val publishState: PublishState,
        val exam: Exam
    )

    data class TestLdOut(
        val id: Int,
        val nameFi: String,
        val nameSv: String,
        val contentFi: String,
        val contentSv: String,
        val publishState: PublishState,
        val createdAt: Timestamp,
        val updatedAt: Timestamp
    )

    @Test
    @WithYllapitajaRole
    fun ldInstructionTest() {
        val testInstruction = TestLdIn(
            nameFi = "Ld Test Instruction FI",
            nameSv = "Ld Test Instruction SV",
            contentFi = "Ld Instruction content Fi",
            contentSv = "Ld Instruction content Sv",
            publishState = PublishState.PUBLISHED,
            exam = Exam.LD
        )

        val testInstructionStr = objectMapper.writeValueAsString(testInstruction)

        val postResult =
            mockMvc.perform(postInstruction(testInstructionStr)).andExpect(status().isOk)
                .andReturn().response.contentAsString

        val instructionIn = objectMapper.readValue(postResult, TestLdOut::class.java)

        assertEquals(testInstruction.nameFi, instructionIn.nameFi)
        assertEquals(testInstruction.nameSv, instructionIn.nameSv)
        assertEquals(testInstruction.contentFi, instructionIn.contentFi)
        assertEquals(testInstruction.contentSv, instructionIn.contentSv)
        assertEquals(testInstruction.publishState, instructionIn.publishState)
        assertNotNull(instructionIn.id)
        assertNotNull(instructionIn.createdAt)
        assertNotNull(instructionIn.updatedAt)

        val getResult =
            mockMvc.perform(getInstruction(Exam.LD, instructionIn.id)).andExpect(status().isOk)
                .andReturn().response.contentAsString

        val instructionOut = objectMapper.readValue(getResult, TestLdOut::class.java)

        assertEquals(instructionIn, instructionOut)

        // update request
        val editedInstruction =
            "{\"id\": \"${instructionIn.id}\",\"nameFi\":\"Ld Test Instruction FI updated\",\"exam\":\"LD\",\"contentFi\":\"Ld Instruction content Fi updated\",\"nameSv\":\"Ld Test Instruction SV updated\",\"contentSv\":\"Ld Instruction content Sv updated\",\"publishState\":\"PUBLISHED\"}"

        val updateResult =
            mockMvc.perform(updateInstruction(instructionIn.id, editedInstruction)).andExpect(status().isOk)
                .andReturn().response.contentAsString

        val getUpdatedResult =
            mockMvc.perform(getInstruction(Exam.LD, updateResult.toInt())).andExpect(status().isOk)
                .andReturn().response.contentAsString

        val updatedInstruction = objectMapper.readValue(getUpdatedResult, TestLdOut::class.java)

        assertEquals(updatedInstruction.nameFi, "Ld Test Instruction FI updated")
        assertEquals(updatedInstruction.nameSv, "Ld Test Instruction SV updated")
        assertEquals(updatedInstruction.contentFi, "Ld Instruction content Fi updated")
        assertEquals(updatedInstruction.contentSv, "Ld Instruction content Sv updated")
        assertEquals(updatedInstruction.publishState, PublishState.PUBLISHED)
        assertEquals(updatedInstruction.id, instructionIn.id)
    }

    @Test
    @WithYllapitajaRole
    fun failInstructionsUpdate() {
        val nonExistentId = -1
        val editedInstruction =
            "{\"id\": \"$nonExistentId\",\"exam\":\"SUKO\",\"nameFi\":\"New test name\",\"contentFi\":\"content\",\"nameSv\":\"New test name\",\"contentSv\":\"content\",\"publishState\":\"PUBLISHED\"}\n"

        val failUpdate = mockMvc.perform(updateInstruction(nonExistentId, editedInstruction))
            .andReturn().response.contentAsString

        Assertions.assertThat(failUpdate).isEqualTo("404 NOT_FOUND \"Instruction not found $nonExistentId\"")
    }

    @Test
    @WithYllapitajaRole
    fun invalidExam() {
        val body =
            "{\"name\":\"Suko Test Assignment\",\"content\":\"Instructions content\",\"publishState\":\"PUBLISHED\",\"exam\":\"WRONG\"}\n"

        val postResult = mockMvc.perform(postInstruction(body)).andExpect(status().isBadRequest()).andReturn()
        val responseContent = postResult.response.contentAsString

        Assertions.assertThat(responseContent).contains("Could not resolve type id 'WRONG' as a subtype")
    }

    @Test
    @WithYllapitajaRole
    fun invalidState() {
        // Invalid assignment type
        val body =
            "{\"name\":\"Suko Test Assignment\",\"exam\":\"SUKO\",\"content\":\"Instructions content\",\"publishState\":\"TEST\",\"exam\":\"SUKO\"}\n"

        val postResult = mockMvc.perform(postInstruction(body)).andExpect(status().isBadRequest()).andReturn()
        val responseContent = postResult.response.contentAsString

        Assertions.assertThat(responseContent).contains("Cannot deserialize value of type")
    }

    @Test
    @WithYllapitajaRole
    fun assignmentNotFound() {
        val getResult = mockMvc.perform(getInstruction(Exam.SUKO, 999)).andExpect(status().isNotFound()).andReturn()
        val responseContent = getResult.response.contentAsString

        Assertions.assertThat(responseContent).isEqualTo("404 NOT_FOUND \"Instruction not found 999\"")
    }
}