package fi.oph.ludos.instruction

import Language
import com.fasterxml.jackson.module.kotlin.jacksonObjectMapper
import fi.oph.ludos.*
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.BeforeAll
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.TestInstance
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.test.context.TestPropertySource
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.status
import java.time.ZonedDateTime
import javax.transaction.Transactional

@TestPropertySource(locations = ["classpath:application.properties"])
@SpringBootTest
@AutoConfigureMockMvc
@Transactional
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
class InstructionControllerTest(@Autowired val mockMvc: MockMvc) {
    val objectMapper = jacksonObjectMapper()
    var idsOfInstructionDrafts = listOf<Int>()

    val attachments: List<TestInstructionAttachmentData> = listOf(
        TestInstructionAttachmentData(
            readAttachmentFixtureFile("fixture1.pdf", "attachments"),
            TestInstructionAttachmentMetadata(null, "Fixture1 pdf", Language.FI.toString())
        ), TestInstructionAttachmentData(
            readAttachmentFixtureFile("fixture2.pdf", "attachments"),
            TestInstructionAttachmentMetadata(null, "Fixture2 pdf", Language.SV.toString())
        )
    )

    @BeforeAll
    fun setup() {
        authenticateAsYllapitaja()
        mockMvc.perform(emptyDb())
        mockMvc.perform(seedDbWithInstructions())
        val res = mockMvc.perform(getAllInstructions(Exam.SUKO)).andExpect(status().isOk())
            .andReturn().response.contentAsString
        idsOfInstructionDrafts = objectMapper.readValue(res, Array<TestInstructionOut>::class.java)
            .filter { it.publishState == PublishState.DRAFT.toString() }.map { it.id }
    }

    fun assertCommonFieldsBetweenInAndOutEqual(instructionIn: TestInstructionIn, instructionOut: TestInstructionOut) {
        assertEquals(instructionIn.nameFi, instructionOut.nameFi)
        assertEquals(instructionIn.nameSv, instructionOut.nameSv)
        assertEquals(instructionIn.contentFi, instructionOut.contentFi)
        assertEquals(instructionIn.contentSv, instructionOut.contentSv)
        assertEquals(instructionIn.shortDescriptionFi, instructionOut.shortDescriptionFi)
        assertEquals(instructionIn.shortDescriptionSv, instructionOut.shortDescriptionSv)
        assertEquals(instructionIn.publishState, instructionOut.publishState)
    }

    fun assertAttachments(
        expected: List<TestInstructionAttachmentData>,
        actual: List<TestAttachmentOut>,
        uploadDateRange: Pair<ZonedDateTime, ZonedDateTime>? = null
    ) {
        assertEquals(expected.size, actual.size)
        expected.forEachIndexed { i, expectedAttachmentData ->
            val expectedAttachmentMetadata = expectedAttachmentData.instructionAttachmentMetadata
            if (expectedAttachmentMetadata.fileKey != null) {
                assertEquals(expectedAttachmentMetadata.fileKey, actual[i].fileKey)
            } else {
                assertNotNull(actual[i].fileKey)
            }
            assertEquals(expectedAttachmentData.file.originalFilename, actual[i].fileName)
            assertEquals(expectedAttachmentMetadata.name, actual[i].name)
            assertEquals(expectedAttachmentMetadata.language, actual[i].language)
            assertNotNull(actual[i].fileUploadDate)
            if (uploadDateRange != null) {
                assertTimeIsRoughlyBetween(
                    uploadDateRange.first,
                    actual[i].fileUploadDate,
                    uploadDateRange.second,
                    "uploadDateTime of ${expectedAttachmentMetadata.name}"
                )
            }
        }
    }

    fun testInstruction(exam: Exam) {
        /// CREATE INSTRUCTION AND ASSERT IT WAS AS EXPECTED

        val testInstruction = TestInstructionIn(
            nameFi = "$exam Test Instruction FI",
            nameSv = "$exam Test Instruction SV",
            contentFi = "$exam Instruction content FI",
            contentSv = "$exam Instruction content SV",
            shortDescriptionFi = "$exam Short description FI",
            shortDescriptionSv = "$exam Short description SV",
            publishState = PublishState.PUBLISHED.toString(),
            exam = exam.toString()
        )

        val timeBeforeCreate = nowFromDb(mockMvc)
        val createdInstructionStr = mockMvc.perform(
            postInstruction(
                objectMapper.writeValueAsString(testInstruction), attachments, objectMapper
            )
        ).andExpect(status().isOk).andReturn().response.contentAsString
        val timeAfterCreate = nowFromDb(mockMvc)

        val createdInstruction = objectMapper.readValue(createdInstructionStr, TestInstructionOut::class.java)
        assertCommonFieldsBetweenInAndOutEqual(testInstruction, createdInstruction)
        assertEquals(YllapitajaSecurityContextFactory().kayttajatiedot().oidHenkilo, createdInstruction.authorOid)
        assertNotNull(createdInstruction.id)
        assertNotNull(createdInstruction.createdAt)
        assertNotNull(createdInstruction.updatedAt)
        assertAttachments(attachments, createdInstruction.attachments, Pair(timeBeforeCreate, timeAfterCreate))
        assertTimeIsRoughlyBetween(timeBeforeCreate, createdInstruction.createdAt, timeAfterCreate, "createdAt")

        val createdInstructionByIdStr =
            mockMvc.perform(getInstructionById(exam, createdInstruction.id)).andExpect(status().isOk)
                .andReturn().response.contentAsString
        val createdInstructionById = objectMapper.readValue(createdInstructionByIdStr, TestInstructionOut::class.java)
        assertEquals(createdInstruction, createdInstructionById)

        val firstAttachmentBytes = mockMvc.perform(downloadInstructionAttachment(createdInstruction.attachments[0].fileKey)).andExpect(status().isOk).andReturn().response.contentAsByteArray
        val firstAttachmentExpectedBytes = readAttachmentFixtureFile("fixture1.pdf", "file").bytes
        assertThat(firstAttachmentBytes.size).isEqualTo(firstAttachmentExpectedBytes.size)
        assertThat(firstAttachmentBytes).isEqualTo(firstAttachmentExpectedBytes)

        /// DELETE fixture1.pdf ATTACHMENT AND ASSERT IT DISAPPEARED

        mockMvc.perform(deleteInstructionAttachment(createdInstruction.attachments[0].fileKey)).andExpect(status().isOk)
        val instructionByIdAfterDeletingAttachment = objectMapper.readValue(
            mockMvc.perform(getInstruction(exam, createdInstruction.id)).andExpect(status().isOk)
                .andReturn().response.contentAsString, TestInstructionOut::class.java
        )
        assertCommonFieldsBetweenInAndOutEqual(testInstruction, instructionByIdAfterDeletingAttachment)
        assertAttachments(listOf(attachments[1]), instructionByIdAfterDeletingAttachment.attachments)
        mockMvc.perform(downloadInstructionAttachment(createdInstruction.attachments[0].fileKey)).andExpect(status().isNotFound)

        /// UPLOAD A NEW ATTACHMENT AND ASSERT IT APPEARED

        val attachmentToAdd = TestInstructionAttachmentData(
            readAttachmentFixtureFile("fixture3.pdf", "file"),
            TestInstructionAttachmentMetadata(null, "Fixture3 pdf", Language.FI.toString())
        )

        val timeBeforeUpload = nowFromDb(mockMvc)
        val addedAttachmentStr = mockMvc.perform(
            uploadInstructionAttachment(
                exam,
                createdInstruction.id,
                attachmentToAdd.instructionAttachmentMetadata,
                attachmentToAdd.file,
                objectMapper
            )
        ).andExpect(status().isOk).andReturn().response.contentAsString
        val timeAfterUpload = nowFromDb(mockMvc)
        val addedAttachment = objectMapper.readValue(addedAttachmentStr, TestAttachmentOut::class.java)

        val instructionByIdAfterAddingAttachmentStr =
            mockMvc.perform(getInstruction(exam, createdInstruction.id)).andExpect(status().isOk)
                .andReturn().response.contentAsString
        val instructionByIdAfterAddingAttachment =
            objectMapper.readValue(instructionByIdAfterAddingAttachmentStr, TestInstructionOut::class.java)

        assertCommonFieldsBetweenInAndOutEqual(testInstruction, instructionByIdAfterAddingAttachment)
        assertAttachments(listOf(attachments[1], attachmentToAdd), instructionByIdAfterAddingAttachment.attachments)
        assertTimeIsRoughlyBetween(
            timeBeforeUpload,
            addedAttachment.fileUploadDate,
            timeAfterUpload,
            "separately uploaded attachment uploadDate"
        )
        assertEquals(createdInstruction.createdAt, createdInstruction.updatedAt)

        val addedAttachmentBytes = mockMvc.perform(downloadInstructionAttachment(addedAttachment.fileKey)).andExpect(status().isOk).andReturn().response.contentAsByteArray
        val addedAttachmentExpectedBytes = readAttachmentFixtureFile("fixture3.pdf", "file").bytes
        assertThat(addedAttachmentBytes.size).isEqualTo(addedAttachmentExpectedBytes.size)
        assertThat(addedAttachmentBytes).isEqualTo(addedAttachmentExpectedBytes)

        // UPDATE ALL FIELDS AND THE NAME OF fixture2.pdf ATTACHMENT

        val updatedInstructionIn = TestInstructionIn(
            nameFi = "$exam Test Instruction FI updated",
            nameSv = "$exam Test Instruction SV updated",
            contentFi = "$exam Instruction content FI updated",
            contentSv = "$exam Instruction content SV updated",
            shortDescriptionFi = "$exam Short description FI updated",
            shortDescriptionSv = "$exam Short description SV updated",
            publishState = PublishState.DRAFT.toString(),
            exam = exam.toString()
        )
        val updatedInstructionInStr = objectMapper.writeValueAsString(updatedInstructionIn)

        val updatedInstructionAttachmentsMetadata = listOf(
            attachments[1].instructionAttachmentMetadata.copy(
                fileKey = createdInstruction.attachments[1].fileKey,
                name = "Fixture2 pdf updated"
            ),
            attachmentToAdd.instructionAttachmentMetadata.copy(fileKey = addedAttachment.fileKey)
        )

        val timeBeforeUpdate = nowFromDb(mockMvc)
        mockMvc.perform(
            updateInstruction(
                createdInstruction.id,
                updatedInstructionInStr,
                updatedInstructionAttachmentsMetadata,
                objectMapper
            )
        ).andExpect(status().isOk)
        val timeAfterUpdate = nowFromDb(mockMvc)

        val updatedInstructionByIdStr =
            mockMvc.perform(getInstruction(exam, createdInstruction.id)).andExpect(status().isOk)
                .andReturn().response.contentAsString
        val updatedInstructionById = objectMapper.readValue(updatedInstructionByIdStr, TestInstructionOut::class.java)

        assertCommonFieldsBetweenInAndOutEqual(updatedInstructionIn, updatedInstructionById)
        assertEquals(createdInstruction.authorOid, updatedInstructionById.authorOid)
        assertEquals(createdInstruction.id, updatedInstructionById.id)
        assertTimeIsRoughlyBetween(timeBeforeUpdate, updatedInstructionById.updatedAt, timeAfterUpdate, "updatedAt")

        val expectedAttachmentDataAfterUpdate = listOf(
            attachments[1].copy(instructionAttachmentMetadata = updatedInstructionAttachmentsMetadata[0]),
            attachmentToAdd.copy(
                instructionAttachmentMetadata = attachmentToAdd.instructionAttachmentMetadata.copy(fileKey = addedAttachment.fileKey)
            )
        )

        assertAttachments(expectedAttachmentDataAfterUpdate, updatedInstructionById.attachments)
    }

    @Test
    @WithYllapitajaRole
    fun sukoInstructionTest() = testInstruction(Exam.SUKO)

    @Test
    @WithYllapitajaRole
    fun puhviInstructionTest() = testInstruction(Exam.PUHVI)

    @Test
    @WithYllapitajaRole
    fun ldInstructionTest() = testInstruction(Exam.LD)

    val minimalInstruction = TestInstructionIn(
        nameFi = "",
        nameSv = "",
        contentFi = "",
        contentSv = "",
        shortDescriptionFi = "",
        shortDescriptionSv = "",
        publishState = PublishState.PUBLISHED.toString(),
        exam = Exam.SUKO.toString()
    )

    @Test
    @WithYllapitajaRole
    fun createMinimalInstruction() {
        val responseContent = mockMvc.perform(
            postInstruction(objectMapper.writeValueAsString(minimalInstruction), emptyList(), objectMapper)
        ).andExpect(status().isOk).andReturn().response.contentAsString
        val createdInstruction = objectMapper.readValue(responseContent, TestInstructionOut::class.java)
        assertCommonFieldsBetweenInAndOutEqual(minimalInstruction, createdInstruction)
        assertEquals(0, createdInstruction.attachments.size)
    }

    @Test
    @WithYllapitajaRole
    fun updateInstructionWithNonExistentId() {
        val nonExistentId = -1
        val failUpdate =
            mockMvc.perform(updateInstruction(nonExistentId, objectMapper.writeValueAsString(minimalInstruction), emptyList(), objectMapper))
                .andReturn().response.contentAsString

        assertEquals("Instruction $nonExistentId not found", failUpdate)
    }

    @Test
    @WithYllapitajaRole
    fun createWithInvalidExam() {
        val body = objectMapper.writeValueAsString(minimalInstruction.copy(exam = "WRONG"))
        val responseContent =
            mockMvc.perform(postInstruction(body, emptyList(), objectMapper)).andExpect(status().isBadRequest())
                .andReturn().response.contentAsString

        assertThat(responseContent).contains("Could not resolve type id 'WRONG' as a subtype")
    }

    @Test
    @WithYllapitajaRole
    fun createWithInvalidPublishState() {
        val body = objectMapper.writeValueAsString(minimalInstruction.copy(publishState = "WRONG"))
        val responseContent =
            mockMvc.perform(postInstruction(body, emptyList(), objectMapper)).andExpect(status().isBadRequest())
                .andReturn().response.contentAsString

        assertThat(responseContent).contains("Cannot deserialize value of type `fi.oph.ludos.PublishState` from String \"WRONG\": not one of the values accepted for Enum class")
    }

    @Test
    @WithYllapitajaRole
    fun getInstructionByNonExistentId() {
        val getResult = mockMvc.perform(getInstructionById(Exam.SUKO, -1)).andExpect(status().isNotFound()).andReturn()
        val responseContent = getResult.response.contentAsString

        assertThat(responseContent).isEqualTo("Instruction not found -1")
    }

    @Test
    @WithYllapitajaRole
    fun getInstructionsAsYllapitaja() {
        val res = mockMvc.perform(getAllInstructions(Exam.SUKO)).andExpect(status().isOk())
            .andReturn().response.contentAsString
        val instructions = objectMapper.readValue(res, Array<TestInstructionOut>::class.java)

        assertThat(instructions.size).isEqualTo(12)
        assertThat(instructions).anySatisfy { it.publishState == PublishState.DRAFT.toString() }
        assertThat(instructions).anySatisfy { it.publishState == PublishState.PUBLISHED.toString() }
    }

    @Test
    @WithOpettajaRole
    fun getInstructionsAsOpettaja() {
        val res = mockMvc.perform(getAllInstructions(Exam.SUKO)).andExpect(status().isOk())
            .andReturn().response.contentAsString
        val instructions = objectMapper.readValue(res, Array<TestInstructionOut>::class.java)
        assertThat(instructions.size).isEqualTo(8)
        assertThat(instructions).allSatisfy { it.publishState == PublishState.PUBLISHED.toString() }
    }

    @Test
    @WithYllapitajaRole
    fun getInstructionDraftAsYllapitaja() {
        idsOfInstructionDrafts.forEach() {
            mockMvc.perform(getInstructionById(Exam.SUKO, it)).andExpect(status().isOk)
        }
    }

    @Test
    @WithOpettajaRole
    fun getInstructionDraftAsOpettaja() {
        idsOfInstructionDrafts.forEach() {
            mockMvc.perform(getInstructionById(Exam.SUKO, it)).andExpect(status().isNotFound())
        }
    }

    @Test
    @WithOpettajaRole
    fun opettajaCannotCallYllapitajaRoutes() {
        mockMvc.perform(postInstruction(objectMapper.writeValueAsString(minimalInstruction), emptyList(), objectMapper))
            .andExpect(status().isUnauthorized())
        mockMvc.perform(updateInstruction(1, objectMapper.writeValueAsString(minimalInstruction), emptyList(), objectMapper))
            .andExpect(status().isUnauthorized())
        mockMvc.perform(
            uploadInstructionAttachment(
                Exam.SUKO,
                0,
                attachments[0].instructionAttachmentMetadata,
                readAttachmentFixtureFile("fixture1.pdf", "file"),
                objectMapper
            )
        ).andExpect(status().isUnauthorized)
        mockMvc.perform(deleteInstructionAttachment("does_not_matter")).andExpect(status().isUnauthorized)
    }
}