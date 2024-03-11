package fi.oph.ludos.instruction

import fi.oph.ludos.*
import fi.oph.ludos.auth.OppijanumerorekisteriClient
import fi.oph.ludos.auth.OppijanumerorekisteriHenkilo
import jakarta.transaction.Transactional
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.*
import org.junit.jupiter.api.Assertions.*
import org.mockito.ArgumentMatchers.anyString
import org.mockito.Mockito
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.boot.test.mock.mockito.MockBean
import org.springframework.mock.web.MockMultipartFile
import org.springframework.test.context.TestPropertySource
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.status
import java.time.ZonedDateTime
import java.util.stream.Stream
import kotlin.streams.asStream

@TestPropertySource(locations = ["classpath:application.properties"])
@SpringBootTest
@AutoConfigureMockMvc
@Transactional
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
class InstructionControllerTest : InstructionRequests() {
    @MockBean
    private lateinit var mockOppijanumerorekisteriClient: OppijanumerorekisteriClient

    @BeforeAll
    fun setup() {
        emptyDb(mockMvc)
        seedDbWithInstructions(mockMvc)
    }

    @BeforeEach
    fun setupMocks() {
        Mockito.`when`(mockOppijanumerorekisteriClient.getUserDetailsByOid(anyString())) // when does not work in BeforeAll
            .thenReturn(OppijanumerorekisteriHenkilo(YllapitajaSecurityContextFactory().kayttajatiedot()))
    }


    val attachments: List<InstructionAttachmentIn> = listOf(
        InstructionAttachmentIn(
            readAttachmentFixtureFile("fixture1.pdf", "attachments"),
            InstructionAttachmentMetadataDtoIn(null, "Fixture1 pdf", Language.FI, 1)
        ), InstructionAttachmentIn(
            readAttachmentFixtureFile("fixture2.pdf", "attachments"),
            InstructionAttachmentMetadataDtoIn(null, "Fixture2 pdf", Language.SV, 1)
        )
    )

    fun assertFieldsInAndOutEqual(
        instructionIn: TestInstruction,
        instructionOut: InstructionOut
    ) {
        assertEquals(YllapitajaSecurityContextFactory().kayttajatiedot().oidHenkilo, instructionOut.authorOid)
        assertNotNull(instructionOut.id)
        assertNotNull(instructionOut.createdAt)
        assertNotNull(instructionOut.updatedAt)
        assertEquals(instructionIn.nameFi, instructionOut.nameFi)
        assertEquals(instructionIn.nameSv, instructionOut.nameSv)
        assertEquals(instructionIn.contentFi, instructionOut.contentFi)
        assertEquals(instructionIn.contentSv, instructionOut.contentSv)
        assertEquals(instructionIn.publishState, instructionOut.publishState)

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
            assertEquals(expectedAttachmentMetadata.instructionVersion, actual[i].instructionVersion)
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

    data class UpdatedInstructionAssertionData(
        val updatedInstructionDtoIn: TestInstruction,
        val updatedInstructionById: InstructionOut,
        val createdInstruction: InstructionOut,
        val timeBeforeUpdate: ZonedDateTime,
        val timeAfterUpdate: ZonedDateTime,
        val expectedVersion: Int,
        val expectedAttachment: List<InstructionAttachmentIn>
    )

    private fun assertUpdatedInstruction(assertionData: UpdatedInstructionAssertionData) {
        with(assertionData) {
            assertFieldsInAndOutEqual(updatedInstructionDtoIn, updatedInstructionById)
            assertEquals(createdInstruction.authorOid, updatedInstructionById.authorOid, "Author OIDs should be equal")
            assertEquals(createdInstruction.id, updatedInstructionById.id, "Instruction IDs should be equal")
            assertTimeIsRoughlyBetween(timeBeforeUpdate, updatedInstructionById.updatedAt, timeAfterUpdate, "updatedAt")
            assertEquals(expectedVersion, updatedInstructionById.version)

            assertAttachments(expectedAttachment, updatedInstructionById.attachments)
        }
    }

    private fun updateInstructionTest(
        exam: Exam,
        createdInstruction: InstructionOut,
        updatedInstructionIn: TestInstruction
    ) {
        val newAttachment = InstructionAttachmentIn(
            readAttachmentFixtureFile("fixture2.pdf", "new-attachments"),
            InstructionAttachmentMetadataDtoIn(null, "fixture2.pdf", Language.FI, 1)
        )

        val timeBeforeUpdate = nowFromDb(mockMvc)
        val createdVersion = createNewVersionOfInstruction(
            createdInstruction.id,
            updatedInstructionIn,
            listOf(),
            listOf(newAttachment)
        )
        val timeAfterUpdate = nowFromDb(mockMvc)

        assertThat(createdVersion).isEqualTo(createdInstruction.version + 1)

        val updatedInstructionById = getInstructionByIdByExam(exam, createdInstruction.id)

        val assertionData = UpdatedInstructionAssertionData(
            updatedInstructionIn,
            updatedInstructionById,
            createdInstruction,
            timeBeforeUpdate,
            timeAfterUpdate,
            2,
            listOf(
                newAttachment.copy(
                    metadata = newAttachment.metadata.copy(
                        instructionVersion = 2
                    )
                )
            )
        )

        assertUpdatedInstruction(assertionData)
    }

    fun testInstruction(exam: Exam, instructionDtoIn: TestInstruction, updatedInstructionDtoIn: TestInstruction) {
        val timeBeforeCreate = nowFromDb(mockMvc)
        val dtoInStr = mapper.writeValueAsString(instructionDtoIn)
        val createdInstruction = when (exam) {
            Exam.SUKO -> createInstruction<SukoInstructionDtoOut>(dtoInStr, attachments)
            Exam.LD -> createInstruction<LdInstructionDtoOut>(dtoInStr, attachments)
            Exam.PUHVI -> createInstruction<PuhviInstructionDtoOut>(dtoInStr, attachments)
        }
        val timeAfterCreate = nowFromDb(mockMvc)

        assertFieldsInAndOutEqual(instructionDtoIn, createdInstruction)
        assertTimeIsRoughlyBetween(timeBeforeCreate, createdInstruction.createdAt, timeAfterCreate, "createdAt")
        assertAttachments(attachments, createdInstruction.attachments, Pair(timeBeforeCreate, timeAfterCreate))

        val createdInstructionById = getInstructionByIdByExam(exam, createdInstruction.id)

        assertEquals(createdInstruction, createdInstructionById)

        testDownloadingAttachment(createdInstruction, readAttachmentFixtureFile("fixture1.pdf", "file"))

        updateInstructionTest(
            exam,
            createdInstruction,
            updatedInstructionDtoIn
        )
    }

    private fun testDownloadingAttachment(
        createdInstruction: InstructionOut,
        expectedAttachment: MockMultipartFile,
        withVersion: Boolean = true
    ) {
        val firstAttachmentBytes =
            mockMvc.perform(
                downloadInstructionAttachment(
                    createdInstruction.exam,
                    createdInstruction.attachments[0].fileKey,
                    if (withVersion) createdInstruction.version else null
                )
            ).andExpect(status().isOk).andReturn().response.contentAsByteArray

        assertThat(firstAttachmentBytes.size).isEqualTo(expectedAttachment.bytes.size)
        assertThat(firstAttachmentBytes).isEqualTo(expectedAttachment.bytes)
    }

    @TestFactory
    @WithYllapitajaRole
    fun `get all instructions of each exam`(): List<DynamicTest> = Exam.entries.map { exam ->
        DynamicTest.dynamicTest("Get all instructions for $exam") {
            val instructions = getAllInstructionsByExam(exam).content

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
        val instructionsOut: LdInstructionListDtoOut = getAllInstructions(filters)
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
        val instructionsOut: SukoInstructionListDtoOut = getAllInstructions(filters)
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

        val instructionsOut: PuhviInstructionListDtoOut = getAllInstructions(filters)
        assertTrue(
            instructionsOut.content.all { it.exam == Exam.PUHVI },
            "Wrong exam in list, expected: ${Exam.PUHVI}, got ${instructionsOut.content.map { it.exam }}"
        )

        assertEquals(0, instructionsOut.instructionFilterOptions.dummy)
    }

    @TestFactory
    @WithYllapitajaRole
    fun `only latest versions of assignments in get all assignment data`(): Stream<DynamicTest> =
        Exam.entries.asSequence().asStream().map { exam ->
            DynamicTest.dynamicTest("$exam") {
                val createInstruction = when (exam!!) {
                    Exam.SUKO -> createInstruction<SukoInstructionDtoOut>(
                        mapper.writeValueAsString(
                            minimalSukoInstructionIn
                        )
                    )

                    Exam.LD -> createInstruction<LdInstructionDtoOut>(mapper.writeValueAsString(minimalLdInstructionIn))
                    Exam.PUHVI -> createInstruction<PuhviInstructionDtoOut>(
                        mapper.writeValueAsString(
                            minimalPuhviInstructionIn
                        )
                    )
                }

                val updateInstructionIn = when (exam) {
                    Exam.SUKO -> minimalSukoInstructionIn.copy(nameFi = createInstruction.nameFi + " updated")
                    Exam.LD -> minimalLdInstructionIn.copy(nameFi = createInstruction.nameFi + " updated")
                    Exam.PUHVI -> minimalPuhviInstructionIn.copy(nameFi = createInstruction.nameFi + " updated")
                }

                createNewVersionOfInstruction(
                    createInstruction.id,
                    updateInstructionIn,
                )

                val instructions = when (exam) {
                    Exam.SUKO -> getAllInstructions<SukoInstructionFilters, SukoInstructionDtoOut, SukoInstructionFilterOptionsDtoOut>()
                    Exam.LD -> getAllInstructions<LdInstructionFilters, LdInstructionDtoOut, LdInstructionFilterOptionsDtoOut>()
                    Exam.PUHVI -> getAllInstructions<PuhviInstructionFilters, PuhviInstructionDtoOut, PuhviInstructionFilterOptionsDtoOut>()
                }.content

                assertEquals(instructions.size, instructions.distinctBy { it.id }.size)
                assertEquals(2, instructions.find { it.id == createInstruction.id }!!.version)
            }
        }

    @TestFactory
    @WithYllapitajaRole
    fun `updating instruction saves updater oid`(): List<DynamicTest> =
        Exam.entries.map { exam ->
            DynamicTest.dynamicTest("$exam") {
                val instructionIn = this.minimalInstructionIn(exam)

                val createdInstruction = createInstruction<InstructionOut>(mapper.writeValueAsString(instructionIn))

                assertThat(createdInstruction.authorOid).isEqualTo(YllapitajaSecurityContextFactory().kayttajatiedot().oidHenkilo)
                assertThat(createdInstruction.updaterOid).isEqualTo(YllapitajaSecurityContextFactory().kayttajatiedot().oidHenkilo)

                val updatedInstructionIn = when (exam) {
                    Exam.SUKO -> minimalSukoInstructionIn.copy(nameFi = instructionIn.nameFi + " updated")
                    Exam.LD -> minimalLdInstructionIn.copy(nameFi = instructionIn.nameFi + " updated")
                    Exam.PUHVI -> minimalPuhviInstructionIn.copy(nameFi = instructionIn.nameFi + " updated")
                }
                createNewVersionOfInstruction(
                    createdInstruction.id,
                    updatedInstructionIn,
                    emptyList(),
                    emptyList(),
                    yllapitaja2User
                )

                val updatedInstruction =
                    getInstructionByIdByExam(exam, createdInstruction.id)

                assertThat(updatedInstruction.authorOid).isEqualTo(YllapitajaSecurityContextFactory().kayttajatiedot().oidHenkilo)
                assertThat(updatedInstruction.updaterOid).isEqualTo(Yllapitaja2SecurityContextFactory().kayttajatiedot().oidHenkilo)
            }
        }

    @TestFactory
    @WithYllapitajaRole
    fun `get all versions and a certain version of instruction for different exams`(): Stream<DynamicTest> =
        Exam.entries.asSequence().asStream().map { exam ->
            DynamicTest.dynamicTest("$exam get all versions and a certain version of assignment") {
                val createdInstruction = createInstructionByExam(exam)
                val instructions = createFourCopiesOfInstruction(exam, createdInstruction)

                updateInstructionWithVaryingAttachments(instructions, createdInstruction)
                assertUpdatedInstruction(instructions, exam, createdInstruction)

                val kayttajatiedot = YllapitajaSecurityContextFactory().kayttajatiedot()
                val expectedUpdaterName = "${kayttajatiedot.etunimet} ${kayttajatiedot.sukunimi}"
                getAllInstructionVersionsByExam(exam, createdInstruction.id).let { instructionVersions ->
                    assertEquals(5, instructionVersions.size)
                    instructionVersions.forEachIndexed { index, instruction ->
                        assertThat(instruction.updaterName).isEqualTo(expectedUpdaterName)
                        if (index == 0) {
                            assertFieldsInAndOutEqual(this.minimalInstructionIn(exam), instruction)
                            assertEquals(instruction.attachments[0].name, "fixture1.pdf")
                            assertEquals(instruction.attachments[0].instructionVersion, 1)
                        } else {
                            assertFieldsInAndOutEqual(instructions[index - 1], instruction)
                        }
                    }
                }
            }
        }

    private fun createInstructionByExam(exam: Exam): InstructionOut {
        val attachments = listOf(
            InstructionAttachmentIn(
                readAttachmentFixtureFile("fixture1.pdf", "attachments"),
                InstructionAttachmentMetadataDtoIn(null, "fixture1.pdf", Language.FI, 1)
            )
        )

        val createdInstruction = when (exam) {
            Exam.SUKO -> createInstruction<SukoInstructionDtoOut>(
                mapper.writeValueAsString(minimalSukoInstructionIn),
                attachments
            )

            Exam.LD -> createInstruction<LdInstructionDtoOut>(
                mapper.writeValueAsString(minimalLdInstructionIn),
                attachments
            )

            Exam.PUHVI -> createInstruction<PuhviInstructionDtoOut>(
                mapper.writeValueAsString(minimalPuhviInstructionIn),
                attachments
            )
        }

        return createdInstruction
    }

    private fun updateInstructionWithVaryingAttachments(
        instructions: List<TestInstruction>,
        createdInstruction: InstructionOut
    ) = instructions.forEachIndexed { index, instruction ->
        val newAttachments: List<InstructionAttachmentIn> = listOf(
            InstructionAttachmentIn(
                readAttachmentFixtureFile("fixture2.pdf", "new-attachments"),
                InstructionAttachmentMetadataDtoIn(null, "fixture2.pdf", Language.FI, 1)
            )
        )

        val currentAttachmentMetadata = createdInstruction.attachments.map {
            InstructionAttachmentMetadataDtoIn(
                it.fileKey,
                it.name,
                it.language,
                it.instructionVersion
            )
        }

        val (toUpdate, toAdd) = when (index) {
            0 -> Pair(currentAttachmentMetadata, emptyList())
            1, 2 -> Pair(currentAttachmentMetadata, newAttachments)
            3 -> Pair(emptyList(), newAttachments)
            else -> throw Exception("Invalid index")
        }

        createNewVersionOfInstruction(
            createdInstruction.id,
            instruction,
            toUpdate,
            toAdd
        )
    }

    private fun assertUpdatedInstruction(
        instructions: List<TestInstruction>,
        exam: Exam,
        createdInstruction: InstructionOut
    ) = instructions.forEachIndexed { index, instruction ->
        val version = index + 2
        val instructionById = getInstructionByIdByExam(exam, createdInstruction.id, version)

        assertFieldsInAndOutEqual(instruction, instructionById)

        when (index) {
            0 -> {
                assertEquals(instructionById.attachments.size, 1)
                assertEquals(instructionById.attachments[0].name, "fixture1.pdf")
                assertEquals(instructionById.attachments[0].instructionVersion, version)
            }

            1, 2 -> {
                assertEquals(instructionById.attachments.size, 2)
                assertEquals(instructionById.attachments[0].name, "fixture2.pdf")
                assertEquals(instructionById.attachments[0].instructionVersion, version)
                assertEquals(instructionById.attachments[1].name, "fixture1.pdf")
                assertEquals(instructionById.attachments[1].instructionVersion, version)
            }

            3 -> {
                assertEquals(instructionById.attachments.size, 1)
                assertEquals(instructionById.attachments[0].name, "fixture2.pdf")
                assertEquals(instructionById.attachments[0].instructionVersion, version)
            }

            else -> throw Exception("Invalid index")
        }
    }

    private fun createFourCopiesOfInstruction(
        exam: Exam,
        createdInstruction: InstructionOut
    ): List<TestInstruction> = (1..4).map { index ->
        when (exam) {
            Exam.SUKO -> minimalSukoInstructionIn.copy(nameFi = createdInstruction.nameFi + " updated$index")
            Exam.LD -> minimalLdInstructionIn.copy(nameFi = createdInstruction.nameFi + " updated$index")
            Exam.PUHVI -> minimalPuhviInstructionIn.copy(nameFi = createdInstruction.nameFi + " updated$index")
        }
    }


    @Test
    @WithYllapitajaRole
    fun createInstructionWithBothNamesBlank() {
        val responseContent = mockMvc.perform(
            createInstructionReq(
                mapper.writeValueAsString(minimalSukoInstructionIn.copy(nameFi = "")),
                emptyList()
            )
        ).andExpect(status().isBadRequest).andReturn().response.contentAsString
        assertThat(responseContent).isEqualTo("Global error: At least one of the name fields must be non-empty")
    }

    @Test
    @WithYllapitajaRole
    fun updateInstructionWithNonExistentId() {
        val nonExistentId = -1
        val failUpdate = mockMvc.perform(
            createNewVersionOfInstructionReq(
                nonExistentId,
                mapper.writeValueAsString(minimalSukoInstructionIn),
                emptyList(),
                emptyList()
            )
        ).andReturn().response.contentAsString

        assertEquals("Instruction $nonExistentId not found", failUpdate)
    }

    @Test
    @WithYllapitajaRole
    fun updateInstructionWithNonExistentCurrentAttachment() {
        val instruction = createInstructionByExam(Exam.SUKO)

        val failUpdate = mockMvc.perform(
            createNewVersionOfInstructionReq(
                instruction.id,
                mapper.writeValueAsString(minimalSukoInstructionIn),
                listOf(
                    InstructionAttachmentMetadataDtoIn(
                        "nonExistentFileKey",
                        "lorem",
                        Language.FI,
                        instruction.version
                    )
                ),
                emptyList()
            )
        ).andReturn().response.contentAsString

        assertEquals("Attachment 'nonExistentFileKey' not found", failUpdate)
    }

    @Test
    @WithYllapitajaRole
    fun createWithInvalidExam() {
        val body = mapper.writeValueAsString(minimalSukoInstructionIn).replace("SUKO", "WRONG")
        val responseContent =
            mockMvc.perform(createInstructionReq(body, emptyList())).andExpect(status().isBadRequest())
                .andReturn().response.contentAsString

        assertThat(responseContent).contains("Could not resolve type id 'WRONG' as a subtype")
    }

    @Test
    @WithYllapitajaRole
    fun createWithInvalidPublishState() {
        val body = mapper.writeValueAsString(minimalSukoInstructionIn).replace("PUBLISHED", "WRONG")
        val responseContent =
            mockMvc.perform(createInstructionReq(body, emptyList())).andExpect(status().isBadRequest())
                .andReturn().response.contentAsString

        assertThat(responseContent).contains("Cannot deserialize value of type `fi.oph.ludos.PublishState` from String \"WRONG\": not one of the values accepted for Enum class")
    }

    @Test
    @WithYllapitajaRole
    fun getInstructionByNonExistentId() {
        val getResult = mockMvc.perform(getInstructionByIdReq(Exam.SUKO, -1)).andExpect(status().isNotFound())
            .andReturn().response.contentAsString
        assertThat(getResult).isEqualTo("Instruction -1 not found")
    }

    @Test
    @WithYllapitajaRole
    fun getInstructionsAsYllapitaja() {
        val instructions: SukoInstructionListDtoOut = getAllInstructions(SukoInstructionFilters())
        assertThat(instructions.content.size).isEqualTo(12)
    }

    @Test
    @WithOpettajaRole
    fun getInstructionsAsOpettaja() {
        val instructions: SukoInstructionListDtoOut = getAllInstructions(SukoInstructionFilters())
        assertThat(instructions.content.size).isEqualTo(8)
    }

    @Test
    @WithOpettajaRole
    fun getInstructionAttachmentsAsOpettaja() {
        val instruction = createInstruction<SukoInstructionDtoOut>(
            mapper.writeValueAsString(minimalSukoInstructionIn),
            attachments,
            yllapitaja2User
        )

        val fixture2 = readAttachmentFixtureFile("fixture2.pdf", "new-attachments")

        val newAttachment = InstructionAttachmentIn(
            fixture2,
            InstructionAttachmentMetadataDtoIn(null, "fixture2.pdf", Language.FI, 1)
        )

        createNewVersionOfInstruction(
            instruction.id,
            minimalSukoInstructionIn.copy(nameFi = instruction.nameFi + " updated"),
            emptyList(),
            listOf(newAttachment),
            yllapitaja2User
        )

        val newestInstruction = getInstructionByIdByExam(instruction.exam, instruction.id)

        testDownloadingAttachment(newestInstruction, fixture2, false)
    }


    @Test
    @WithOpettajaRole
    fun getInstructionsDraftAsOpettaja() {
        val instructions: SukoInstructionListDtoOut = getAllInstructions(SukoInstructionFilters())
        val idsOfDrafts = instructions.content.filter { it.publishState == PublishState.DRAFT }.map { it.id }

        idsOfDrafts.forEach { mockMvc.perform(getInstructionByIdReq(Exam.SUKO, it)).andExpect(status().isNotFound()) }
    }

    @Test
    @WithOpettajaRole
    fun opettajaCannotCallYllapitajaRoutes() {
        val instructionInStr = mapper.writeValueAsString(minimalSukoInstructionIn)
        mockMvc.perform(createInstructionReq(instructionInStr, emptyList())).andExpect(status().isUnauthorized())
        mockMvc.perform(createNewVersionOfInstructionReq(1, instructionInStr, emptyList(), emptyList()))
            .andExpect(status().isUnauthorized())
    }

    @Test
    @WithYllapitajaRole
    fun `test deleting a instruction`() {
        val (id) = createInstruction<SukoInstructionDtoOut>(
            mapper.writeValueAsString(minimalSukoInstructionIn),
            emptyList()
        )

        createNewVersionOfInstruction(
            id,
            minimalSukoInstructionIn.copy(publishState = PublishState.DELETED),
        )
        mockMvc.perform(getInstructionByIdReq(Exam.SUKO, (id))).andExpect(status().isNotFound)

        val instructions: SukoInstructionListDtoOut = getAllInstructions(SukoInstructionFilters())
        val noneHaveMatchingId = instructions.content.none { it.id == (id) }

        assertTrue(noneHaveMatchingId, "No instructions should have the ID of the deleted one")
    }

    @Test
    @WithYllapitajaRole
    fun `Test image html validator`() {
        createInstruction<SukoInstructionDtoOut>(
            mapper.writeValueAsString(
                minimalSukoInstructionIn.copy(
                    contentFi = "<p>Text before image</p><img src=\"/api/image?fileKey=image_123\" alt=\"Alt text\" class=\"image-size-large image-align-left\" /><p>Text after</p>"
                )
            )
        )
    }

    @TestFactory
    @WithYllapitajaRole
    fun `restoring current version yields 400`() =
        Exam.entries.map { exam ->
            DynamicTest.dynamicTest("$exam") {
                val createdInstruction = createInstructionByExam(exam)
                val errorMessage =
                    mockMvc.perform(restoreInstructionReq(exam, createdInstruction.id, createdInstruction.version))
                        .andExpect(status().isBadRequest).andReturn().response.contentAsString
                assertEquals("Cannot restore latest version", errorMessage)
            }
        }

    @TestFactory
    @WithYllapitajaRole
    fun `restoring non-existent instruction id yields 404`() =
        Exam.entries.map { exam ->
            DynamicTest.dynamicTest("$exam") {
                mockMvc.perform(restoreInstructionReq(exam, -1, 1))
                    .andExpect(status().isNotFound)
            }
        }

    @TestFactory
    @WithYllapitajaRole
    fun `restoring non-existent version yields 404`() =
        Exam.entries.map { exam ->
            DynamicTest.dynamicTest("$exam") {
                val createdInstruction = createInstructionByExam(exam)
                mockMvc.perform(restoreInstructionReq(exam, createdInstruction.id, -1))
                    .andExpect(status().isNotFound)
            }
        }

    private fun updatedMinimalInstructionInByExam(
        exam: Exam,
        createdInstruction: InstructionOut,
        nameSuffix: String = " updated"
    ): TestInstruction {
        val updatedInstructionIn = when (exam) {
            Exam.SUKO -> minimalSukoInstructionIn.copy(nameFi = createdInstruction.nameFi + nameSuffix)
            Exam.LD -> minimalLdInstructionIn.copy(nameFi = createdInstruction.nameFi + nameSuffix)
            Exam.PUHVI -> minimalPuhviInstructionIn.copy(nameFi = createdInstruction.nameFi + nameSuffix)
        }
        return updatedInstructionIn
    }

    @TestFactory
    @WithYllapitajaRole
    fun `restoring an old version creates a new version`() =
        Exam.entries.map { exam ->
            DynamicTest.dynamicTest("$exam") {
                val createdInstruction = createInstructionByExam(exam)
                createNewVersionOfInstruction(
                    createdInstruction.id,
                    updatedMinimalInstructionInByExam(exam, createdInstruction)
                )
                val updatedInstructionById = getInstructionByIdByExam(exam, createdInstruction.id)
                assertNotEquals(createdInstruction.nameFi, updatedInstructionById.nameFi)

                val versionsBeforeRestore = getAllInstructionVersionsByExam(exam, createdInstruction.id)
                assertEquals(2, versionsBeforeRestore.size)

                mockMvc.perform(restoreInstructionReq(exam, createdInstruction.id, createdInstruction.version))
                    .andExpect(status().isOk)
                val versionsAfterRestore = getAllInstructionVersionsByExam(exam, createdInstruction.id)
                val latestVersionById = getInstructionByIdByExam(exam, createdInstruction.id)
                assertEquals(3, versionsAfterRestore.size)
                assertEquals(versionsAfterRestore.last().version, latestVersionById.version)
                assertEquals(3, latestVersionById.version)

                assertEquals(createdInstruction.nameFi, latestVersionById.nameFi)
            }
        }
}
