package fi.oph.ludos.instruction

import Language
import com.fasterxml.jackson.module.kotlin.readValue
import fi.oph.ludos.*
import jakarta.transaction.Transactional
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.*
import org.junit.jupiter.api.Assertions.*
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.test.context.TestPropertySource
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.status
import java.time.ZonedDateTime
import java.util.stream.Stream

@TestPropertySource(locations = ["classpath:application.properties"])
@SpringBootTest
@AutoConfigureMockMvc
@Transactional
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
class InstructionControllerTest : InstructionRequests() {
    val attachments: List<InstructionAttachmentIn> = listOf(
        InstructionAttachmentIn(
            readAttachmentFixtureFile("fixture1.pdf", "attachments"),
            InstructionAttachmentMetadataDtoIn(null, "Fixture1 pdf", Language.FI)
        ), InstructionAttachmentIn(
            readAttachmentFixtureFile("fixture2.pdf", "attachments"),
            InstructionAttachmentMetadataDtoIn(null, "Fixture2 pdf", Language.SV)
        )
    )

    fun assertCommonFieldsBetweenInAndOutEqual(instructionIn: TestInstruction, instructionOut: InstructionOut) {
        assertEquals(instructionIn.nameFi, instructionOut.nameFi)
        assertEquals(instructionIn.nameSv, instructionOut.nameSv)
        assertEquals(instructionIn.contentFi, instructionOut.contentFi)
        assertEquals(instructionIn.contentSv, instructionOut.contentSv)
        assertEquals(instructionIn.publishState, instructionOut.publishState)
    }

    fun assertFieldsInAndOutEqual(
        instructionIn: TestInstruction,
        instructionOut: InstructionOut
    ) {
        when (instructionIn) {
            is TestLdInstructionDtoIn -> if (instructionOut is LdInstructionDtoOut) {
                assertEquals(instructionIn.aineKoodiArvo, instructionOut.aineKoodiArvo)
            }

            is TestSukoInstructionDtoIn -> if (instructionOut is SukoInstructionDtoOut) {
                assertEquals(instructionIn.shortDescriptionFi, instructionOut.shortDescriptionFi)
                assertEquals(instructionIn.shortDescriptionSv, instructionOut.shortDescriptionSv)
            }

            is TestPuhviInstructionDtoIn -> if (instructionOut is PuhviInstructionDtoOut) {
                assertEquals(instructionIn.shortDescriptionFi, instructionOut.shortDescriptionFi)
                assertEquals(instructionIn.shortDescriptionSv, instructionOut.shortDescriptionSv)
            }
        }
        assertCommonFieldsBetweenInAndOutEqual(instructionIn, instructionOut)
    }

    fun assertAttachments(
        expected: List<InstructionAttachmentIn>,
        actual: List<InstructionAttachmentDtoOut>,
        uploadDateRange: Pair<ZonedDateTime, ZonedDateTime>? = null
    ) {
        assertEquals(expected.size, actual.size)
        expected.forEachIndexed { i, expectedAttachmentData ->
            val expectedAttachmentMetadata = expectedAttachmentData.metadata
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
        createdInstruction: InstructionOut,
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
        val updatedInstructionById: InstructionOut,
        val createdInstruction: InstructionOut,
        val timeBeforeUpdate: ZonedDateTime,
        val timeAfterUpdate: ZonedDateTime,
        val updatedInstructionAttachmentsMetadata: List<InstructionAttachmentMetadataDtoIn>,
        val attachmentToAdd: InstructionAttachmentIn,
        val addedAttachmentFileKey: String
    )

    private fun assertUpdatedInstruction(assertionData: UpdatedInstructionAssertionData) {
        with(assertionData) {
            assertFieldsInAndOutEqual(updatedInstructionDtoIn, updatedInstructionById)
            assertEquals(createdInstruction.authorOid, updatedInstructionById.authorOid, "Author OIDs should be equal")
            assertEquals(createdInstruction.id, updatedInstructionById.id, "Instruction IDs should be equal")
            assertTimeIsRoughlyBetween(timeBeforeUpdate, updatedInstructionById.updatedAt, timeAfterUpdate, "updatedAt")

            val expectedAttachmentDataAfterUpdate = listOf(
                attachments[1].copy(metadata = updatedInstructionAttachmentsMetadata[0]),
                attachmentToAdd.copy(
                    metadata = attachmentToAdd.metadata.copy(fileKey = addedAttachmentFileKey)
                )
            )

            assertAttachments(expectedAttachmentDataAfterUpdate, updatedInstructionById.attachments)
        }
    }

    private fun generateUpdatedInstructionAttachmentsMetadata(
        createdInstructionFileKey: String,
        attachmentToAdd: InstructionAttachmentIn,
        addedAttachmentFileKey: String
    ): List<InstructionAttachmentMetadataDtoIn> = listOf(
        attachments[1].metadata.copy(
            fileKey = createdInstructionFileKey,
            name = "Fixture2 pdf updated"
        ),
        attachmentToAdd.metadata.copy(fileKey = addedAttachmentFileKey)
    )

    private fun performInstructionUpdate(
        instructionId: Int,
        updatedInstructionDtoInStr: String,
        updatedInstructionAttachmentsMetadata: List<InstructionAttachmentMetadataDtoIn>
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
        createdInstruction: InstructionOut,
        updatedInstructionDtoIn: TestInstruction,
        attachmentToAdd: InstructionAttachmentIn,
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

        val updatedInstructionById: InstructionOut = assertInstructionDataClass(
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
        assertUpdatedInstruction(assertionData)
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
        mockMvc.perform(deleteInstructionAttachment(createdInstruction.attachments[0].fileKey))
            .andExpect(status().isOk)

        val instructionByIdAfterDeletingAttachmentRes =
            mockMvc.perform(getInstruction(exam, createdInstruction.id)).andExpect(status().isOk)
                .andReturn().response.contentAsString

        val instructionByIdAfterDeletingAttachment =
            assertInstructionDataClass(instructionDtoIn, instructionByIdAfterDeletingAttachmentRes)

        assertFieldsInAndOutEqual(instructionDtoIn, instructionByIdAfterDeletingAttachment)

        assertAttachments(
            listOf(attachments[1]),
            instructionByIdAfterDeletingAttachment.attachments
        )

        mockMvc.perform(downloadInstructionAttachment(createdInstruction.attachments[0].fileKey))
            .andExpect(status().isNotFound)

        // Upload new attachment and assert it appears
        val attachmentToAdd = InstructionAttachmentIn(
            readAttachmentFixtureFile("fixture3.pdf", "file"),
            InstructionAttachmentMetadataDtoIn(null, "Fixture3 pdf", Language.FI)
        )

        val timeBeforeUpload = nowFromDb(mockMvc)
        val addedAttachmentStr = mockMvc.perform(
            uploadInstructionAttachment(
                exam,
                createdInstruction.id,
                attachmentToAdd.metadata,
                attachmentToAdd.file,
                mapper
            )
        ).andExpect(status().isOk).andReturn().response.contentAsString
        val timeAfterUpload = nowFromDb(mockMvc)
        val addedAttachment: InstructionAttachmentDtoOut = mapper.readValue(addedAttachmentStr)

        val instructionByIdAfterAddingAttachmentStr =
            mockMvc.perform(getInstruction(exam, createdInstruction.id)).andExpect(status().isOk)
                .andReturn().response.contentAsString

        val instructionByIdAfterAddingAttachment: InstructionOut =
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
        is TestSukoInstructionDtoIn -> mapper.readValue(res, SukoInstructionDtoOut::class.java)
        is TestLdInstructionDtoIn -> mapper.readValue(res, LdInstructionDtoOut::class.java)
        is TestPuhviInstructionDtoIn -> mapper.readValue(res, PuhviInstructionDtoOut::class.java)
        else -> throw Exception("Unknown instruction type")
    }

    @BeforeAll
    fun setup() {
        mockMvc.perform(emptyDbRequest().with(yllapitajaUser)).andExpect(status().is3xxRedirection)
        mockMvc.perform(seedDbWithInstructions().with(yllapitajaUser)).andExpect(status().is3xxRedirection)
    }

    @TestFactory
    @WithYllapitajaRole
    fun `get all instructions of each exam`(): Stream<DynamicTest> = Exam.entries.stream().map { exam ->
        DynamicTest.dynamicTest("Get all instructions for $exam") {
            val instructions = when (exam!!) {
                Exam.SUKO -> getAllInstructions<SukoInstructionFilters, SukoInstructionDtoOut, SukoInstructionFilterOptionsDtoOut>(
                    exam
                ).content

                Exam.LD -> getAllInstructions<LdInstructionFilters, LdInstructionDtoOut, LdInstructionFilterOptionsDtoOut>(
                    exam
                ).content

                Exam.PUHVI -> getAllInstructions<PuhviInstructionFilters, PuhviInstructionDtoOut, PuhviInstructionFilterOptionsDtoOut>(
                    exam
                ).content
            }

            assertEquals(12, instructions.size)
            assertTrue(
                instructions.all { it.exam == exam },
                "Wrong exam in list, expected: $exam, got ${instructions.map { it.exam }}"
            )

            val expectedNumbersInPage = (0..11).toList()
            val actualNumbersInName = instructions.flatMap { cert ->
                Regex("\\d+").findAll(cert.nameFi).map { it.value.toInt() }.toList()
            }

            assertEquals(expectedNumbersInPage, actualNumbersInName)
        }
    }

    @Test
    @WithYllapitajaRole
    fun sukoInstructionTest() = testInstruction(
        exam = Exam.SUKO,
        instructionDtoIn = TestSukoInstructionDtoIn(
            nameFi = "SUKO Test Instruction FI",
            nameSv = "SUKO Test Instruction SV",
            contentFi = "SUKO Instruction content FI",
            contentSv = "SUKO Instruction content SV",
            shortDescriptionFi = "SUKO Short description FI",
            shortDescriptionSv = "SUKO Short description SV",
            publishState = PublishState.PUBLISHED,
            exam = Exam.SUKO
        ),
        updatedInstructionDtoIn = TestSukoInstructionDtoIn(
            nameFi = "SUKO Test Instruction FI updated",
            nameSv = "SUKO Test Instruction SV updated",
            contentFi = "SUKO Instruction content FI updated",
            contentSv = "SUKO Instruction content SV updated",
            shortDescriptionFi = "SUKO Short description FI updated",
            shortDescriptionSv = "SUKO Short description SV updated",
            publishState = PublishState.DRAFT,
            exam = Exam.SUKO
        )
    )

    @Test
    @WithYllapitajaRole
    fun puhviInstructionTest() = testInstruction(
        exam = Exam.PUHVI,
        instructionDtoIn = TestPuhviInstructionDtoIn(
            nameFi = "PUHVI Test Instruction FI",
            nameSv = "PUHVI Test Instruction SV",
            contentFi = "PUHVI Instruction content FI",
            contentSv = "PUHVI Instruction content SV",
            shortDescriptionFi = "PUHVI Short description FI",
            shortDescriptionSv = "PUHVI Short description SV",
            publishState = PublishState.PUBLISHED,
            exam = Exam.PUHVI
        ),
        updatedInstructionDtoIn = TestPuhviInstructionDtoIn(
            nameFi = "PUHVI Test Instruction FI updated",
            nameSv = "PUHVI Test Instruction SV updated",
            contentFi = "PUHVI Instruction content FI updated",
            contentSv = "PUHVI Instruction content SV updated",
            shortDescriptionFi = "PUHVI Short description FI updated",
            shortDescriptionSv = "PUHVI Short description SV updated",
            publishState = PublishState.DRAFT,
            exam = Exam.PUHVI
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
            publishState = PublishState.PUBLISHED,
            exam = Exam.LD,
            aineKoodiArvo = "1"
        ),
        updatedInstructionDtoIn = TestLdInstructionDtoIn(
            nameFi = "LD Test Instruction FI updated",
            nameSv = "LD Test Instruction SV updated",
            contentFi = "LD Instruction content FI updated",
            contentSv = "LD Instruction content SV updated",
            publishState = PublishState.DRAFT,
            exam = Exam.LD,
            aineKoodiArvo = "9"
        )
    )

    private fun assertFilteredLdInstructionList(
        filters: LdInstructionFilters,
        expectedSize: Int,
        expectedNumbersInList: List<Int>,
        expectedAineOptions: List<Int>
    ) {
        val instructionsOut: LdInstructionListDtoOut = getAllInstructions(Exam.LD, filters)
        assertEquals(expectedSize, instructionsOut.content.size)
        assertTrue(
            instructionsOut.content.all { it.exam == Exam.LD },
            "Wrong exam in list, expected: ${Exam.LD}, got ${instructionsOut.content.map { it.exam }}"
        )

        val expectedFilterOptions = LdInstructionFilterOptionsDtoOut(
            aine = expectedAineOptions.map { it.toString() }
        )

        assertEquals(expectedFilterOptions, instructionsOut.instructionFilterOptions)

        val actualNumbersInName = instructionsOut.content.flatMap { instruction ->
            Regex("\\d+").findAll(instruction.nameFi).map { it.value.toInt() }.toList()
        }
        assertEquals(expectedNumbersInList, actualNumbersInName)
    }

    @Test
    @WithOpettajaRole
    fun `get suko instruction list as opettaja while filtering`() {
        val filters = SukoInstructionFilters(
            jarjesta = "asc"
        )
        val instructionsOut: SukoInstructionListDtoOut = getAllInstructions(Exam.SUKO, filters)
        assertTrue(
            instructionsOut.content.all { it.exam == Exam.SUKO },
            "Wrong exam in list, expected: ${Exam.SUKO}, got ${instructionsOut.content.map { it.exam }}"
        )

        assertEquals(0, instructionsOut.instructionFilterOptions.dummy)
    }

    @Test
    @WithOpettajaRole
    fun `get ld instruction list as opettaja while filtering`() {
        val filters = LdInstructionFilters(
            jarjesta = "asc",
            aine = null
        )

        assertFilteredLdInstructionList(filters, 8, listOf(4, 5, 6, 7, 8, 9, 10, 11), listOf(1, 2, 3, 5, 6, 7, 8, 9))
        assertFilteredLdInstructionList(filters.copy(aine = "1"), 1, listOf(9), listOf(1))
        assertFilteredLdInstructionList(filters.copy(aine = "9"), 1, listOf(8), listOf(9))
        assertFilteredLdInstructionList(filters.copy(aine = "1,9"), 2, listOf(8, 9), listOf(1, 9))
        assertFilteredLdInstructionList(filters.copy(jarjesta = "desc", aine = "1,9"), 2, listOf(9, 8), listOf(1, 9))
        assertFilteredLdInstructionList(filters.copy(jarjesta = null, aine = "1,9"), 2, listOf(8, 9), listOf(1, 9))
    }

    @Test
    @WithOpettajaRole
    fun `get puhvi instruction list as opettaja while filtering`() {
        val filters = PuhviInstructionFilters(
            jarjesta = "asc",
        )

        val instructionsOut: PuhviInstructionListDtoOut = getAllInstructions(Exam.PUHVI, filters)
        assertTrue(
            instructionsOut.content.all { it.exam == Exam.PUHVI },
            "Wrong exam in list, expected: ${Exam.PUHVI}, got ${instructionsOut.content.map { it.exam }}"
        )

        assertEquals(0, instructionsOut.instructionFilterOptions.dummy)
    }

    val minimalSukoInstruction = TestSukoInstructionDtoIn(
        nameFi = "nameFi",
        nameSv = "",
        contentFi = "",
        contentSv = "",
        shortDescriptionFi = "",
        shortDescriptionSv = "",
        publishState = PublishState.PUBLISHED,
        exam = Exam.SUKO,
    )

    @Test
    @WithYllapitajaRole
    fun createMinimalInstruction() {
        val responseContent = mockMvc.perform(
            postInstruction(mapper.writeValueAsString(minimalSukoInstruction), emptyList(), mapper)
        ).andExpect(status().isOk).andReturn().response.contentAsString

        val createdInstruction: SukoInstructionDtoOut = mapper.readValue(responseContent)

        assertCommonFieldsBetweenInAndOutEqual(minimalSukoInstruction, createdInstruction)
        assertEquals(0, createdInstruction.attachments.size)
    }

    @Test
    @WithYllapitajaRole
    fun createInstructionWithBothNamesBlank() {
        val responseContent = mockMvc.perform(
            postInstruction(
                mapper.writeValueAsString(minimalSukoInstruction.copy(nameFi = "")),
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
                    mapper.writeValueAsString(minimalSukoInstruction),
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
        val body = mapper.writeValueAsString(minimalSukoInstruction).replace("SUKO", "WRONG")
        val responseContent =
            mockMvc.perform(postInstruction(body, emptyList(), mapper)).andExpect(status().isBadRequest())
                .andReturn().response.contentAsString

        assertThat(responseContent).contains("Could not resolve type id 'WRONG' as a subtype")
    }

    @Test
    @WithYllapitajaRole
    fun createWithInvalidPublishState() {
        val body = mapper.writeValueAsString(minimalSukoInstruction).replace("PUBLISHED", "WRONG")
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
        val instructions: SukoInstructionListDtoOut = getAllInstructions(Exam.SUKO, SukoInstructionFilters())
        assertThat(instructions.content.size).isEqualTo(12)
    }

    @Test
    @WithOpettajaRole
    fun getInstructionsAsOpettaja() {
        val instructions: SukoInstructionListDtoOut = getAllInstructions(Exam.SUKO, SukoInstructionFilters())
        assertThat(instructions.content.size).isEqualTo(8)
    }

    @Test
    @WithOpettajaRole
    fun getInstructionsDraftAsOpettaja() {
        val instructions: SukoInstructionListDtoOut = getAllInstructions(Exam.SUKO, SukoInstructionFilters())

        val idsOfDrafts = instructions.content.filter { it.publishState == PublishState.DRAFT }.map { it.id }

        idsOfDrafts.forEach {
            mockMvc.perform(getInstructionById(Exam.SUKO, it)).andExpect(status().isNotFound())
        }
    }

    @Test
    @WithOpettajaRole
    fun opettajaCannotCallYllapitajaRoutes() {
        mockMvc.perform(postInstruction(mapper.writeValueAsString(minimalSukoInstruction), emptyList(), mapper))
            .andExpect(status().isUnauthorized())
        mockMvc.perform(
            updateInstruction(
                1,
                mapper.writeValueAsString(minimalSukoInstruction),
                emptyList(),
                mapper
            )
        )
            .andExpect(status().isUnauthorized())
        mockMvc.perform(
            uploadInstructionAttachment(
                Exam.SUKO,
                0,
                attachments[0].metadata,
                readAttachmentFixtureFile("fixture1.pdf", "file"),
                mapper
            )
        ).andExpect(status().isUnauthorized)
        mockMvc.perform(deleteInstructionAttachment("does_not_matter")).andExpect(status().isUnauthorized)
    }

    @Test
    @WithYllapitajaRole
    fun `test deleting a instruction`() {
        val instructionOut: SukoInstructionDtoOut = mapper.readValue(
            mockMvc.perform(
                postInstruction(
                    mapper.writeValueAsString(minimalSukoInstruction),
                    emptyList(),
                    mapper
                )
            ).andExpect(status().isOk).andReturn().response.contentAsString
        )

        mockMvc.perform(
            updateInstruction(
                instructionOut.id,
                mapper.writeValueAsString(minimalSukoInstruction.copy(publishState = PublishState.DELETED)),
                emptyList(),
                mapper
            )
        ).andReturn().response.contentAsString

        mockMvc.perform(getInstructionById(Exam.SUKO, instructionOut.id)).andExpect(status().isNotFound)

        val instructions: SukoInstructionListDtoOut = getAllInstructions(Exam.SUKO, SukoInstructionFilters())

        val noneHaveMatchingId = instructions.content.none { it.id == instructionOut.id }

        assertTrue(noneHaveMatchingId, "No instructions should have the ID of the deleted one")
    }

    @Test
    @WithYllapitajaRole
    fun `Test image html validator`() {
        mockMvc.perform(
            postInstruction(
                mapper.writeValueAsString(
                    minimalSukoInstruction.copy(
                        contentFi = "<p>Text before image</p><img src=\"/api/image?fileKey=image_123\" alt=\"Alt text\" class=\"image-size-large image-align-left\" /><p>Text after</p>"
                    )
                ),
                emptyList(),
                mapper
            )
        ).andExpect(status().isOk)
    }
}
