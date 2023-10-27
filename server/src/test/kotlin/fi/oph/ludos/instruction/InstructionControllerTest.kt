package fi.oph.ludos.instruction

import Language
import com.fasterxml.jackson.module.kotlin.readValue
import fi.oph.ludos.*
import jakarta.transaction.Transactional
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Assertions
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertNotNull
import org.junit.jupiter.api.BeforeAll
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.TestInstance
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.test.context.TestPropertySource
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.status
import java.time.ZonedDateTime

@TestPropertySource(locations = ["classpath:application.properties"])
@SpringBootTest
@AutoConfigureMockMvc
@Transactional
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
class InstructionControllerTest : InstructionRequests() {
    var idsOfSukoInstructionDrafts = listOf<Int>()

    val attachments: List<TestInstructionAttachmentData> = listOf(
        TestInstructionAttachmentData(
            readAttachmentFixtureFile("fixture1.pdf", "attachments"),
            TestInstructionAttachmentMetadata(null, "Fixture1 pdf", Language.FI.toString())
        ), TestInstructionAttachmentData(
            readAttachmentFixtureFile("fixture2.pdf", "attachments"),
            TestInstructionAttachmentMetadata(null, "Fixture2 pdf", Language.SV.toString())
        )
    )

    fun assertCommonFieldsBetweenInAndOutEqual(instructionIn: TestInstruction, instructionOut: TestInstructionOut) {
        assertEquals(instructionIn.nameFi, instructionOut.nameFi)
        assertEquals(instructionIn.nameSv, instructionOut.nameSv)
        assertEquals(instructionIn.contentFi, instructionOut.contentFi)
        assertEquals(instructionIn.contentSv, instructionOut.contentSv)
        assertEquals(instructionIn.publishState, instructionOut.publishState)
    }

    fun assertFieldsInAndOutEqual(
        instructionIn: TestInstruction,
        instructionOut: TestInstructionOut
    ) {
        when (instructionIn) {
            is TestLdInstructionDtoIn -> if (instructionOut is TestLdInstructionDtoOut) {
                assertEquals(instructionIn.aineKoodiArvo, instructionOut.aineKoodiArvo)
            }

            is TestSukoOrPuhviInstructionDtoIn -> if (instructionOut is TestSukoOrPuhviInstructionDtoOut) {
                assertEquals(instructionIn.shortDescriptionFi, instructionOut.shortDescriptionFi)
                assertEquals(instructionIn.shortDescriptionSv, instructionOut.shortDescriptionSv)
            }
        }
        assertCommonFieldsBetweenInAndOutEqual(instructionIn, instructionOut)
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

    private fun assertInstructionDtoOut(
        createdInstruction: TestInstructionOut,
        timeBeforeCreate: ZonedDateTime,
        timeAfterCreate: ZonedDateTime
    ) {
        assertEquals(YllapitajaSecurityContextFactory().kayttajatiedot().oidHenkilo, createdInstruction.authorOid)
        assertNotNull(createdInstruction.id)
        assertNotNull(createdInstruction.createdAt)
        assertNotNull(createdInstruction.updatedAt)
        assertAttachments(attachments, createdInstruction.attachments, Pair(timeBeforeCreate, timeAfterCreate))
        assertTimeIsRoughlyBetween(timeBeforeCreate, createdInstruction.createdAt, timeAfterCreate, "createdAt")
    }

    data class UpdatedInstructionAssertionData(
        val updatedInstructionDtoIn: TestInstruction,
        val updatedInstructionById: TestInstructionOut,
        val createdInstruction: TestInstructionOut,
        val timeBeforeUpdate: ZonedDateTime,
        val timeAfterUpdate: ZonedDateTime,
        val updatedInstructionAttachmentsMetadata: List<TestInstructionAttachmentMetadata>,
        val attachmentToAdd: TestInstructionAttachmentData,
        val addedAttachmentFileKey: String
    )

    private fun assertUpdatedInstruction(exam: Exam, assertionData: UpdatedInstructionAssertionData) {
        with(assertionData) {
            when (exam) {
                Exam.SUKO, Exam.PUHVI -> {
                    assertFieldsInAndOutEqual(
                        updatedInstructionDtoIn as TestSukoOrPuhviInstructionDtoIn,
                        updatedInstructionById as TestSukoOrPuhviInstructionDtoOut
                    )
                }

                Exam.LD -> {
                    assertFieldsInAndOutEqual(
                        updatedInstructionDtoIn as TestLdInstructionDtoIn,
                        updatedInstructionById as TestLdInstructionDtoOut
                    )
                }
            }

            assertEquals(createdInstruction.authorOid, updatedInstructionById.authorOid, "Author OIDs should be equal")
            assertEquals(createdInstruction.id, updatedInstructionById.id, "Instruction IDs should be equal")
            assertTimeIsRoughlyBetween(timeBeforeUpdate, updatedInstructionById.updatedAt, timeAfterUpdate, "updatedAt")

            val expectedAttachmentDataAfterUpdate = listOf(
                attachments[1].copy(instructionAttachmentMetadata = updatedInstructionAttachmentsMetadata[0]),
                attachmentToAdd.copy(
                    instructionAttachmentMetadata = attachmentToAdd.instructionAttachmentMetadata.copy(fileKey = addedAttachmentFileKey)
                )
            )

            assertAttachments(expectedAttachmentDataAfterUpdate, updatedInstructionById.attachments)
        }
    }

    private fun generateUpdatedInstructionAttachmentsMetadata(
        createdInstructionFileKey: String,
        attachmentToAdd: TestInstructionAttachmentData,
        addedAttachmentFileKey: String
    ): List<TestInstructionAttachmentMetadata> = listOf(
        attachments[1].instructionAttachmentMetadata.copy(
            fileKey = createdInstructionFileKey,
            name = "Fixture2 pdf updated"
        ),
        attachmentToAdd.instructionAttachmentMetadata.copy(fileKey = addedAttachmentFileKey)
    )

    private fun performInstructionUpdate(
        instructionId: Int,
        updatedInstructionDtoInStr: String,
        updatedInstructionAttachmentsMetadata: List<TestInstructionAttachmentMetadata>
    ): Int = mockMvc.perform(
        updateInstruction(
            instructionId,
            updatedInstructionDtoInStr,
            updatedInstructionAttachmentsMetadata,
            mapper
        )
    ).andExpect(status().isOk).andReturn().response.contentAsString.toInt()


    private fun updateInstructionTest(
        exam: Exam,
        createdInstruction: TestInstructionOut,
        updatedInstructionDtoIn: TestInstruction,
        attachmentToAdd: TestInstructionAttachmentData,
        addedAttachmentFileKey: String

    ) {
        val updatedInstructionAttachmentsMetadata = generateUpdatedInstructionAttachmentsMetadata(
            createdInstruction.attachments[1].fileKey,
            attachmentToAdd,
            addedAttachmentFileKey
        )

        val timeBeforeUpdate = nowFromDb(mockMvc)
        val updatedId = performInstructionUpdate(
            createdInstruction.id,
            mapper.writeValueAsString(updatedInstructionDtoIn),
            updatedInstructionAttachmentsMetadata
        )
        val timeAfterUpdate = nowFromDb(mockMvc)

        assertEquals(createdInstruction.id, updatedId)

        val updatedInstructionById: TestInstructionOut = assertInstructionDataClass(
            updatedInstructionDtoIn,
            mockMvc.perform(getInstruction(exam, createdInstruction.id)).andExpect(status().isOk)
                .andReturn().response.contentAsString
        )

        val assertionData = UpdatedInstructionAssertionData(
            updatedInstructionDtoIn,
            updatedInstructionById,
            createdInstruction,
            timeBeforeUpdate,
            timeAfterUpdate,
            updatedInstructionAttachmentsMetadata,
            attachmentToAdd,
            addedAttachmentFileKey
        )
        assertUpdatedInstruction(exam, assertionData)
    }

    fun testInstruction(
        exam: Exam,
        instructionDtoIn: TestInstruction,
        updatedInstructionDtoIn: TestInstruction
    ) {
        val timeBeforeCreate = nowFromDb(mockMvc)
        val createdInstructionStr = mockMvc.perform(
            postInstruction(
                mapper.writeValueAsString(instructionDtoIn), attachments, mapper
            )
        ).andExpect(status().isOk).andReturn().response.contentAsString
        val timeAfterCreate = nowFromDb(mockMvc)

        val createdInstruction = assertInstructionDataClass(instructionDtoIn, createdInstructionStr)

        assertFieldsInAndOutEqual(instructionDtoIn, createdInstruction)
        assertInstructionDtoOut(createdInstruction, timeBeforeCreate, timeAfterCreate)

        val createdInstructionByIdStr =
            mockMvc.perform(getInstructionById(exam, createdInstruction.id)).andExpect(status().isOk)
                .andReturn().response.contentAsString

        val createdInstructionById = assertInstructionDataClass(instructionDtoIn, createdInstructionByIdStr)

        assertEquals(createdInstruction, createdInstructionById)

        val firstAttachmentBytes =
            mockMvc.perform(downloadInstructionAttachment(createdInstruction.attachments[0].fileKey))
                .andExpect(status().isOk).andReturn().response.contentAsByteArray
        val firstAttachmentExpectedBytes = readAttachmentFixtureFile("fixture1.pdf", "file").bytes
        assertThat(firstAttachmentBytes.size).isEqualTo(firstAttachmentExpectedBytes.size)
        assertThat(firstAttachmentBytes).isEqualTo(firstAttachmentExpectedBytes)

        // Delete fixture1.pdf attachment and assert it disappears
        mockMvc.perform(deleteInstructionAttachment(createdInstruction.attachments[0].fileKey)).andExpect(status().isOk)

        val instructionByIdAfterDeletingAttachmentRes =
            mockMvc.perform(getInstruction(exam, createdInstruction.id)).andExpect(status().isOk)
                .andReturn().response.contentAsString

        val instructionByIdAfterDeletingAttachment: TestInstructionOut =
            assertInstructionDataClass(instructionDtoIn, instructionByIdAfterDeletingAttachmentRes)

        assertFieldsInAndOutEqual(instructionDtoIn, instructionByIdAfterDeletingAttachment)
        assertAttachments(listOf(attachments[1]), instructionByIdAfterDeletingAttachment.attachments)

        mockMvc.perform(downloadInstructionAttachment(createdInstruction.attachments[0].fileKey))
            .andExpect(status().isNotFound)

        // Upload new attachment and assert it appears
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
                mapper
            )
        ).andExpect(status().isOk).andReturn().response.contentAsString
        val timeAfterUpload = nowFromDb(mockMvc)
        val addedAttachment: TestAttachmentOut = mapper.readValue(addedAttachmentStr)

        val instructionByIdAfterAddingAttachmentStr =
            mockMvc.perform(getInstruction(exam, createdInstruction.id)).andExpect(status().isOk)
                .andReturn().response.contentAsString

        val instructionByIdAfterAddingAttachment: TestInstructionOut =
            assertInstructionDataClass(instructionDtoIn, instructionByIdAfterAddingAttachmentStr)

        assertFieldsInAndOutEqual(instructionDtoIn, instructionByIdAfterAddingAttachment)
        assertAttachments(listOf(attachments[1], attachmentToAdd), instructionByIdAfterAddingAttachment.attachments)
        assertTimeIsRoughlyBetween(
            timeBeforeUpload,
            addedAttachment.fileUploadDate,
            timeAfterUpload,
            "separately uploaded attachment uploadDate"
        )
        assertEquals(createdInstruction.createdAt, createdInstruction.updatedAt)

        val addedAttachmentBytes =
            mockMvc.perform(downloadInstructionAttachment(addedAttachment.fileKey)).andExpect(status().isOk)
                .andReturn().response.contentAsByteArray
        val addedAttachmentExpectedBytes = readAttachmentFixtureFile("fixture3.pdf", "file").bytes
        assertThat(addedAttachmentBytes.size).isEqualTo(addedAttachmentExpectedBytes.size)
        assertThat(addedAttachmentBytes).isEqualTo(addedAttachmentExpectedBytes)

        updateInstructionTest(
            exam,
            createdInstruction,
            updatedInstructionDtoIn,
            attachmentToAdd,
            addedAttachment.fileKey
        )
    }

    private fun assertInstructionDataClass(
        updatedInstructionDtoIn: TestInstruction,
        res: String
    ) = when (updatedInstructionDtoIn) {
        is TestLdInstructionDtoIn -> mapper.readValue(
            res,
            TestLdInstructionDtoOut::class.java
        )

        is TestSukoOrPuhviInstructionDtoIn -> mapper.readValue(
            res,
            TestSukoOrPuhviInstructionDtoOut::class.java
        )

        else -> throw Exception("Unknown instruction type")
    }

    @BeforeAll
    fun setup() {
        authenticateAsYllapitaja()
        mockMvc.perform(emptyDbRequest())
        mockMvc.perform(seedDbWithInstructions())
        val res = mockMvc.perform(getAllInstructions(Exam.SUKO)).andExpect(status().isOk())
            .andReturn().response.contentAsString
        val content = getAllInstructionsContent<TestSukoOrPuhviInstructionDtoOut>(res)

        idsOfSukoInstructionDrafts = content.filter { it.publishState == PublishState.DRAFT.toString() }.map { it.id }
    }

    @Test
    @WithYllapitajaRole
    fun sukoInstructionTest() = testInstruction(
        exam = Exam.SUKO,
        instructionDtoIn = TestSukoOrPuhviInstructionDtoIn(
            nameFi = "SUKO Test Instruction FI",
            nameSv = "SUKO Test Instruction SV",
            contentFi = "SUKO Instruction content FI",
            contentSv = "SUKO Instruction content SV",
            shortDescriptionFi = "SUKO Short description FI",
            shortDescriptionSv = "SUKO Short description SV",
            publishState = PublishState.PUBLISHED.toString(),
            exam = Exam.SUKO.toString()
        ),
        updatedInstructionDtoIn = TestSukoOrPuhviInstructionDtoIn(
            nameFi = "SUKO Test Instruction FI updated",
            nameSv = "SUKO Test Instruction SV updated",
            contentFi = "SUKO Instruction content FI updated",
            contentSv = "SUKO Instruction content SV updated",
            shortDescriptionFi = "SUKO Short description FI updated",
            shortDescriptionSv = "SUKO Short description SV updated",
            publishState = PublishState.DRAFT.toString(),
            exam = Exam.SUKO.toString()
        )
    )

    @Test
    @WithYllapitajaRole
    fun puhviInstructionTest() = testInstruction(
        exam = Exam.PUHVI,
        instructionDtoIn = TestSukoOrPuhviInstructionDtoIn(
            nameFi = "PUHVI Test Instruction FI",
            nameSv = "PUHVI Test Instruction SV",
            contentFi = "PUHVI Instruction content FI",
            contentSv = "PUHVI Instruction content SV",
            shortDescriptionFi = "PUHVI Short description FI",
            shortDescriptionSv = "PUHVI Short description SV",
            publishState = PublishState.PUBLISHED.toString(),
            exam = Exam.PUHVI.toString()
        ),
        updatedInstructionDtoIn = TestSukoOrPuhviInstructionDtoIn(
            nameFi = "PUHVI Test Instruction FI updated",
            nameSv = "PUHVI Test Instruction SV updated",
            contentFi = "PUHVI Instruction content FI updated",
            contentSv = "PUHVI Instruction content SV updated",
            shortDescriptionFi = "PUHVI Short description FI updated",
            shortDescriptionSv = "PUHVI Short description SV updated",
            publishState = PublishState.DRAFT.toString(),
            exam = Exam.PUHVI.toString()
        )
    )

    @Test
    @WithYllapitajaRole
    fun ldInstructionTest() = testInstruction(
        Exam.LD,
        instructionDtoIn = TestLdInstructionDtoIn(
            nameFi = "LD Test Instruction FI",
            nameSv = "LD Test Instruction SV",
            contentFi = "LD Instruction content FI",
            contentSv = "LD Instruction content SV",
            publishState = PublishState.PUBLISHED.toString(),
            exam = Exam.LD.toString(),
            aineKoodiArvo = "1"
        ),
        updatedInstructionDtoIn = TestLdInstructionDtoIn(
            nameFi = "LD Test Instruction FI updated",
            nameSv = "LD Test Instruction SV updated",
            contentFi = "LD Instruction content FI updated",
            contentSv = "LD Instruction content SV updated",
            publishState = PublishState.DRAFT.toString(),
            exam = Exam.LD.toString(),
            aineKoodiArvo = "9"
        )
    )

    private fun getLdInstructionsWithFilters(filters: InstructionFilters): List<TestLdInstructionDtoOut> {
        val res = mockMvc.perform(getLdInstructionsReq(filters))
            .andExpect(status().isOk())
            .andReturn().response.contentAsString
        return getAllInstructionsContent<TestLdInstructionDtoOut>(res)
    }

    private fun assertFilteredLdInstructionList(
        filters: InstructionFilters,
        expectedSize: Int,
        expectedNumbersInList: List<Int>
    ) {
        val aineContent = getLdInstructionsWithFilters(filters)
        assertEquals(expectedSize, aineContent.size)

        val actualNumbersInName1 = aineContent.flatMap { assignment ->
            Regex("\\d+").findAll(assignment.nameFi).map { it.value.toInt() }.toList()
        }
        assertEquals(expectedNumbersInList, actualNumbersInName1)
    }

    @Test
    @WithOpettajaRole
    fun `get ld instruction list as opettaja while filtering`() {
        val filters = InstructionFilters(
            jarjesta = "asc",
            aine = null
        )

        assertFilteredLdInstructionList(filters, 8, listOf(4, 5, 6, 7, 8, 9, 10, 11))
        assertFilteredLdInstructionList(filters.copy(aine = "1"), 1, listOf(9))
        assertFilteredLdInstructionList(filters.copy(aine = "9"), 1, listOf(8))
        assertFilteredLdInstructionList(filters.copy(aine = "1,9"), 2, listOf(8, 9))
        assertFilteredLdInstructionList(filters.copy(jarjesta = "desc", aine = "1,9"), 2, listOf(8, 9))
        assertFilteredLdInstructionList(filters.copy(jarjesta = null, aine = "1,9"), 2, listOf(8, 9))
    }

    val minimalInstruction = TestSukoOrPuhviInstructionDtoIn(
        nameFi = "nameFi",
        nameSv = "",
        contentFi = "",
        contentSv = "",
        shortDescriptionFi = "",
        shortDescriptionSv = "",
        publishState = PublishState.PUBLISHED.toString(),
        exam = Exam.SUKO.toString(),
    )

    @Test
    @WithYllapitajaRole
    fun createMinimalInstruction() {
        val responseContent = mockMvc.perform(
            postInstruction(mapper.writeValueAsString(minimalInstruction), emptyList(), mapper)
        ).andExpect(status().isOk).andReturn().response.contentAsString

        val createdInstruction: TestSukoOrPuhviInstructionDtoOut = mapper.readValue(responseContent)

        assertCommonFieldsBetweenInAndOutEqual(minimalInstruction, createdInstruction)
        assertEquals(0, createdInstruction.attachments.size)
    }

    @Test
    @WithYllapitajaRole
    fun createInstructionWithBothNamesBlank() {
        val responseContent = mockMvc.perform(
            postInstruction(
                mapper.writeValueAsString(minimalInstruction.copy(nameFi = "")),
                emptyList(),
                mapper
            )
        ).andExpect(status().isBadRequest).andReturn().response.contentAsString
        assertThat(responseContent).isEqualTo("Global error: At least one of the name fields must be non-empty")
    }

    @Test
    @WithYllapitajaRole
    fun updateInstructionWithNonExistentId() {
        val nonExistentId = -1
        val failUpdate =
            mockMvc.perform(
                updateInstruction(
                    nonExistentId,
                    mapper.writeValueAsString(minimalInstruction),
                    emptyList(),
                    mapper
                )
            )
                .andReturn().response.contentAsString

        assertEquals("Instruction $nonExistentId not found", failUpdate)
    }

    @Test
    @WithYllapitajaRole
    fun createWithInvalidExam() {
        val body = mapper.writeValueAsString(minimalInstruction.copy(exam = "WRONG"))
        val responseContent =
            mockMvc.perform(postInstruction(body, emptyList(), mapper)).andExpect(status().isBadRequest())
                .andReturn().response.contentAsString

        assertThat(responseContent).contains("Could not resolve type id 'WRONG' as a subtype")
    }

    @Test
    @WithYllapitajaRole
    fun createWithInvalidPublishState() {
        val body = mapper.writeValueAsString(minimalInstruction.copy(publishState = "WRONG"))
        val responseContent =
            mockMvc.perform(postInstruction(body, emptyList(), mapper)).andExpect(status().isBadRequest())
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
        val instructions = mapper.readValue(res, TestInstructionsOut::class.java).content

        assertThat(instructions.size).isEqualTo(12)
    }

    @Test
    @WithOpettajaRole
    fun getInstructionsAsOpettaja() {
        val res = mockMvc.perform(getAllInstructions(Exam.SUKO)).andExpect(status().isOk())
            .andReturn().response.contentAsString

        val instructions = mapper.readValue(res, TestInstructionsOut::class.java).content
        assertThat(instructions.size).isEqualTo(8)
    }

    @Test
    @WithYllapitajaRole
    fun getInstructionDraftAsYllapitaja() {
        idsOfSukoInstructionDrafts.forEach() {
            mockMvc.perform(getInstructionById(Exam.SUKO, it)).andExpect(status().isOk)
        }
    }

    @Test
    @WithOpettajaRole
    fun getInstructionDraftAsOpettaja() {
        idsOfSukoInstructionDrafts.forEach() {
            mockMvc.perform(getInstructionById(Exam.SUKO, it)).andExpect(status().isNotFound())
        }
    }

    @Test
    @WithOpettajaRole
    fun opettajaCannotCallYllapitajaRoutes() {
        mockMvc.perform(postInstruction(mapper.writeValueAsString(minimalInstruction), emptyList(), mapper))
            .andExpect(status().isUnauthorized())
        mockMvc.perform(
            updateInstruction(
                1,
                mapper.writeValueAsString(minimalInstruction),
                emptyList(),
                mapper
            )
        )
            .andExpect(status().isUnauthorized())
        mockMvc.perform(
            uploadInstructionAttachment(
                Exam.SUKO,
                0,
                attachments[0].instructionAttachmentMetadata,
                readAttachmentFixtureFile("fixture1.pdf", "file"),
                mapper
            )
        ).andExpect(status().isUnauthorized)
        mockMvc.perform(deleteInstructionAttachment("does_not_matter")).andExpect(status().isUnauthorized)
    }

    @Test
    @WithYllapitajaRole
    fun `test deleting a instruction`() {
        val instructionOut: TestSukoOrPuhviInstructionDtoOut = mapper.readValue(
            mockMvc.perform(
                postInstruction(
                    mapper.writeValueAsString(minimalInstruction),
                    emptyList(),
                    mapper
                )
            ).andExpect(status().isOk).andReturn().response.contentAsString
        )

        mockMvc.perform(
            updateInstruction(
                instructionOut.id,
                mapper.writeValueAsString(minimalInstruction.copy(publishState = PublishState.DELETED.toString())),
                emptyList(),
                mapper
            )
        ).andReturn().response.contentAsString

        mockMvc.perform(getInstructionById(Exam.SUKO, instructionOut.id)).andExpect(status().isNotFound)

        val content: TestInstructionsOut<TestSukoOrPuhviInstructionDtoOut> = mapper.readValue(
            mockMvc.perform(getAllInstructions(Exam.SUKO)).andExpect(status().isOk())
                .andReturn().response.contentAsString
        )

        val instructions = content.content

        val noneHaveMatchingId = instructions.none { it.id == instructionOut.id }

        Assertions.assertTrue(noneHaveMatchingId, "No instructions should have the ID of the deleted one")
    }
}