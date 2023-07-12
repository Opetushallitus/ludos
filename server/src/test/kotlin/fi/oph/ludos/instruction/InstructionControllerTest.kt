package fi.oph.ludos.instruction

import com.fasterxml.jackson.module.kotlin.jacksonObjectMapper
import fi.oph.ludos.Constants
import fi.oph.ludos.PublishState
import fi.oph.ludos.Exam
import fi.oph.ludos.WithYllapitajaRole
import fi.oph.ludos.*
import fi.oph.ludos.assignment.getAllInstructions
import org.junit.jupiter.api.Assertions.assertEquals
import org.assertj.core.api.Assertions.assertThat
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

@TestPropertySource(locations = ["classpath:application.properties"])
@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class InstructionControllerTest(@Autowired val mockMvc: MockMvc) {
    val objectMapper = jacksonObjectMapper()

    data class TestIn(
        val nameFi: String,
        val nameSv: String,
        val contentFi: String,
        val contentSv: String,
        val publishState: PublishState,
        val exam: Exam
    )

    data class TestOut(
        val id: Int,
        val nameFi: String,
        val nameSv: String,
        val contentFi: String,
        val contentSv: String,
        val publishState: PublishState,
        val authorOid: String,
        val createdAt: Timestamp,
        val updatedAt: Timestamp
    )

    fun testInstruction(exam: Exam) {
        val testInstruction = TestIn(
            nameFi = "$exam Test Instruction FI",
            nameSv = "$exam Test Instruction SV",
            contentFi = "$exam Instruction content FI",
            contentSv = "$exam Instruction content SV",
            publishState = PublishState.PUBLISHED,
            exam = exam
        )

        val testInstructionStr = objectMapper.writeValueAsString(testInstruction)

        val createdInstructionStr = mockMvc.perform(postInstruction(testInstructionStr)).andExpect(status().isOk)
            .andReturn().response.contentAsString

        val createdInstruction = objectMapper.readValue(createdInstructionStr, TestOut::class.java)

        assertEquals(testInstruction.nameFi, createdInstruction.nameFi)
        assertEquals(testInstruction.nameSv, createdInstruction.nameSv)
        assertEquals(testInstruction.contentFi, createdInstruction.contentFi)
        assertEquals(testInstruction.contentSv, createdInstruction.contentSv)
        assertEquals(testInstruction.publishState, createdInstruction.publishState)
        assertEquals(YllapitajaSecurityContextFactory().kayttajatiedot().oidHenkilo, createdInstruction.authorOid)
        assertNotNull(createdInstruction.id)
        assertNotNull(createdInstruction.createdAt)
        assertNotNull(createdInstruction.updatedAt)

        val getResult = mockMvc.perform(getInstruction(exam, createdInstruction.id)).andExpect(status().isOk)
            .andReturn().response.contentAsString

        val instructionOut = objectMapper.readValue(getResult, TestOut::class.java)

        assertEquals(createdInstruction, instructionOut)

        val updatedInstructionIn = TestIn(
            nameFi = "$exam Test Instruction FI updated",
            nameSv = "$exam Test Instruction SV updated",
            contentFi = "$exam Instruction content FI updated",
            contentSv = "$exam Instruction content SV updated",
            publishState = PublishState.PUBLISHED,
            exam = exam
        )
        val updatedInstructionInStr = objectMapper.writeValueAsString(updatedInstructionIn)

        val updateResult =
            mockMvc.perform(updateInstruction(createdInstruction.id, updatedInstructionInStr)).andExpect(status().isOk)
                .andReturn().response.contentAsString

        val updatedInstructionByIdStr = mockMvc.perform(getInstruction(exam, updateResult.toInt())).andExpect(status().isOk)
            .andReturn().response.contentAsString
        val updatedInstructionById = objectMapper.readValue(updatedInstructionByIdStr, TestOut::class.java)

        assertEquals(updatedInstructionById.nameFi, updatedInstructionIn.nameFi)
        assertEquals(updatedInstructionById.nameSv, updatedInstructionIn.nameSv)
        assertEquals(updatedInstructionById.contentFi, updatedInstructionIn.contentFi)
        assertEquals(updatedInstructionById.contentSv, updatedInstructionIn.contentSv)
        assertEquals(updatedInstructionById.publishState, updatedInstructionIn.publishState)
        assertEquals(updatedInstructionById.authorOid, createdInstruction.authorOid)
        assertEquals(updatedInstructionById.id, createdInstruction.id)
    }

    @Test
    @WithYllapitajaRole
    fun sukoInstructionTest() {
        testInstruction(Exam.SUKO)
    }

    @Test
    @WithYllapitajaRole
    fun puhviInstructionTest() {
        testInstruction(Exam.PUHVI)
    }

    @Test
    @WithYllapitajaRole
    fun ldInstructionTest() {
        testInstruction(Exam.LD)
    }

    @Test
    @WithYllapitajaRole
    fun failInstructionsUpdate() {
        val nonExistentId = -1
        val editedInstruction =
            "{\"id\": \"$nonExistentId\",\"exam\":\"SUKO\",\"nameFi\":\"New test name\",\"contentFi\":\"content\",\"nameSv\":\"New test name\",\"contentSv\":\"content\",\"publishState\":\"PUBLISHED\"}\n"

        val failUpdate =
            mockMvc.perform(updateInstruction(nonExistentId, editedInstruction)).andReturn().response.contentAsString

        assertEquals("Instruction not found $nonExistentId", failUpdate)
    }

    @Test
    @WithYllapitajaRole
    fun invalidExam() {
        val body =
            "{\"name\":\"Suko Test Assignment\",\"content\":\"Instructions content\",\"publishState\":\"PUBLISHED\",\"exam\":\"WRONG\"}\n"

        val postResult = mockMvc.perform(postInstruction(body)).andExpect(status().isBadRequest()).andReturn()
        val responseContent = postResult.response.contentAsString

        assertThat(responseContent).contains("Could not resolve type id 'WRONG' as a subtype")
    }

    @Test
    @WithYllapitajaRole
    fun invalidState() {
        // Invalid assignment type
        val body =
            "{\"name\":\"Suko Test Assignment\",\"exam\":\"SUKO\",\"content\":\"Instructions content\",\"publishState\":\"TEST\",\"exam\":\"SUKO\"}\n"

        val postResult = mockMvc.perform(postInstruction(body)).andExpect(status().isBadRequest()).andReturn()
        val responseContent = postResult.response.contentAsString

        assertThat(responseContent).contains("Cannot deserialize value of type")
    }

    @Test
    @WithYllapitajaRole
    fun instructionNotFound() {
        val getResult = mockMvc.perform(getInstruction(Exam.SUKO, 999)).andExpect(status().isNotFound()).andReturn()
        val responseContent = getResult.response.contentAsString

        assertThat(responseContent).isEqualTo("Instruction not found 999")
    }

    @Test
    @WithOpettajaRole
    fun testInsufficientRole() {
        val testAssignmentStr =
            "{\"id\": \"1\",\"nameFi\":\"Puhvi Test Instruction FI updated\",\"exam\":\"PUHVI\",\"contentFi\":\"Puhvi Instruction content Fi updated\",\"nameSv\":\"Puhvi Test Instruction SV updated\",\"contentSv\":\"Puhvi Instruction content Sv updated\",\"publishState\":\"PUBLISHED\"}"


        mockMvc.perform(postInstruction(testAssignmentStr)).andExpect(status().isUnauthorized())
        mockMvc.perform(updateInstruction(1, testAssignmentStr)).andExpect(status().isUnauthorized())
    }

    @Test
    @WithOpettajaRole
    fun getAssignmentsAsOpettaja() {
        mockMvc.perform(getAllInstructions(Exam.SUKO)).andExpect(status().isOk())
    }
}