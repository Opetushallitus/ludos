package fi.oph.ludos.certificate

import com.fasterxml.jackson.module.kotlin.readValue
import fi.oph.ludos.*
import jakarta.transaction.Transactional
import org.hamcrest.CoreMatchers
import org.hamcrest.MatcherAssert.assertThat
import org.hamcrest.Matchers.emptyString
import org.junit.jupiter.api.*
import org.junit.jupiter.api.Assertions.*
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.test.context.TestPropertySource
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.status
import java.util.stream.Stream

const val attachmentFileNameToCreate = "fixture1.pdf"
const val attachmentFileNameToCreateSv = "fixture2.pdf"
const val attachmentFileNameToUpdate = "fixture2.pdf"
const val attachmentFileNameToUpdateSv = "fixture3.pdf"

val sukoCertificateToCreate = TestSukoCertificateIn(
    Exam.SUKO,
    "Test Certificate FI",
    "",
    "Certificate content FI",
    "",
    TestPublishState.PUBLISHED,
)

val sukoCertificateToUpdate = TestSukoCertificateIn(
    Exam.SUKO,
    "Test Certificate FI updated",
    "",
    "Certificate content FI updated",
    "",
    TestPublishState.PUBLISHED,
)

val puhviCertificateToCreate = TestPuhviCertificateIn(
    Exam.PUHVI,
    "Test Certificate FI",
    "Test Certificate SV",
    "Certificate content Fi",
    "Certificate content SV",
    TestPublishState.PUBLISHED,
)

val puhviCertificateToUpdate = TestPuhviCertificateIn(
    Exam.PUHVI,
    "Test Certificate FI updated",
    "Test Certificate SV updated",
    "Certificate content FI updated",
    "Certificate content SV updated",
    TestPublishState.PUBLISHED,
)

val ldCertificateToCreate = TestLdCertificateIn(
    Exam.LD,
    "Test Certificate FI",
    "Test Certificate SV",
    TestPublishState.PUBLISHED,
    "1"
)

val ldCertificateToUpdate = TestLdCertificateIn(
    Exam.LD,
    "Test Certificate FI updated",
    "Test Certificate SV updated",
    TestPublishState.PUBLISHED,
    "2"
)

@TestPropertySource(locations = ["classpath:application.properties"])
@SpringBootTest
@AutoConfigureMockMvc
@Transactional
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
class CertificateControllerTest : CertificateRequests() {
    val fileKeyRegex = "^todistuspohja_[0-9a-fA-F]{8}-([0-9a-fA-F]{4}-){3}[0-9a-fA-F]{12}$".toRegex()
    val exams = listOf(Exam.SUKO, Exam.PUHVI, Exam.LD)

    private fun validateFileKey(fileKey: String) =
        assertTrue(fileKey.matches(fileKeyRegex), "Invalid fileKey: $fileKey")

    private fun assertGetReturnsExpectedAttachment(
        fileKey: String, expectedFileName: String, expectedFileContent: ByteArray
    ) {
        val attachmentGetResponse =
            mockMvc.perform(getAttachment(fileKey)).andExpect(status().isOk).andReturn().response

        assertArrayEquals(expectedFileContent, attachmentGetResponse.contentAsByteArray)
        assertEquals("application/pdf", attachmentGetResponse.contentType)
        assertEquals(
            "inline; filename=\"${expectedFileName}\"", attachmentGetResponse.getHeader("content-disposition")
        )
    }

    private fun assertAttachment(
        expectedAttachmentName: String,
        updatedAttachmentDtoOut: CertificateAttachmentDtoOut,
    ) {
        assertEquals(expectedAttachmentName, updatedAttachmentDtoOut.fileName)
        validateFileKey(updatedAttachmentDtoOut.fileKey)
        assertNotNull(updatedAttachmentDtoOut.fileUploadDate)

        assertGetReturnsExpectedAttachment(
            updatedAttachmentDtoOut.fileKey,
            expectedAttachmentName,
            readAttachmentFixtureFile(expectedAttachmentName).bytes
        )
    }

    private fun assertPuhviDescription(dtoIn: TestPuhviCertificateIn, dtoOut: PuhviCertificateDtoOut) {
        assertEquals(dtoIn.descriptionFi, dtoOut.descriptionFi)
        assertEquals(dtoIn.descriptionSv, dtoOut.descriptionSv)
    }

    private fun assertCommonFields(
        dtoIn: TestCertificate,
        dtoOut: CertificateOut,
        newAttachment: String,
        newAttachmentSv: String
    ) {
        assertNotNull(dtoOut.id)
        assertEquals(dtoIn.exam, dtoOut.exam)
        assertEquals(dtoIn.publishState.toString(), dtoOut.publishState.toString())
        assertEquals(dtoIn.nameFi, dtoOut.nameFi)
        assertEquals(dtoIn.nameSv, dtoOut.nameSv)
        assertEquals(YllapitajaSecurityContextFactory().kayttajatiedot().oidHenkilo, dtoOut.authorOid)
        assertNotNull(dtoOut.createdAt)
        assertNotNull(dtoOut.updatedAt)

        assertAttachment(
            newAttachment,
            dtoOut.attachmentFi
        )
        if ((dtoIn.exam != Exam.SUKO)) {
            assertAttachment(
                newAttachmentSv,
                dtoOut.attachmentSv!!
            )
        }

        when (dtoOut) {
            is SukoCertificateDtoOut -> {
                dtoIn as TestSukoCertificateIn
                assertEquals(dtoIn.descriptionFi, dtoOut.descriptionFi)
            }

            is LdCertificateDtoOut -> {
                dtoIn as TestLdCertificateIn
                assertEquals(dtoIn.aineKoodiArvo, dtoOut.aineKoodiArvo)
            }

            is PuhviCertificateDtoOut -> {
                dtoIn as TestPuhviCertificateIn
                assertPuhviDescription(dtoIn, dtoOut)
            }
        }
    }

    private inline fun <reified T : CertificateOut> createCertificateAndCheckIt(
        certificateToCreate: TestCertificate,
    ): T {
        val attachmentFileName = attachmentFileNameToCreate
        val attachmentFileNameSv = attachmentFileNameToCreateSv

        val certificateToCreateStr = mapper.writeValueAsString(certificateToCreate)
        val createdCertificateStr =
            mockMvc.perform(postCertificate(certificateToCreateStr, attachmentFileName, attachmentFileNameSv))
                .andExpect(status().isOk)
                .andReturn().response.contentAsString

        val createdCertificate = mapper.readValue<T>(createdCertificateStr)

        assertCommonFields(certificateToCreate, createdCertificate, attachmentFileName, attachmentFileNameSv)

        val getResult = mockMvc.perform(getCertificateById(certificateToCreate.exam, createdCertificate.id))
            .andExpect(status().isOk)
            .andReturn().response.contentAsString

        val certificateById = mapper.readValue<T>(getResult)

        assertCommonFields(certificateToCreate, certificateById, attachmentFileName, attachmentFileNameSv)

        return certificateById
    }


    private fun assertReplacedAttachmentsHasBeenDeleted(createdCertificate: CertificateOut) {
        fun req(attachmentFileKey: String) = mockMvc.perform(getAttachment(attachmentFileKey))
            .andExpect(status().isNotFound)

        req(createdCertificate.attachmentFi.fileKey)

        when (createdCertificate) {
            is LdCertificateDtoOut, is PuhviCertificateDtoOut -> {
                req(createdCertificate.attachmentSv!!.fileKey)
            }
        }
    }

    private fun updateCertificateAndAssert(
        createdCertificate: CertificateOut,
        editedCertificate: TestCertificate,
    ): CertificateOut {
        Thread.sleep(1) // Wait a bit to ensure attachmentUploadDate is different
        val newAttachment = readAttachmentFixtureFile(attachmentFileNameToUpdate)
        val newAttachmentSv = readAttachmentFixtureFile(attachmentFileNameToUpdateSv, "attachmentSv")

        mockMvc.perform(
            putCertificate(
                createdCertificate.id,
                mapper.writeValueAsString(editedCertificate),
                newAttachment,
                newAttachmentSv
            )
        ).andExpect(status().isOk)

        val updatedCertificateById: CertificateOut = mapper.readValue(
            mockMvc.perform(getCertificateById(createdCertificate.exam, createdCertificate.id))
                .andExpect(status().isOk)
                .andReturn().response.contentAsString
        )

        assertCommonFields(
            editedCertificate,
            updatedCertificateById,
            attachmentFileNameToUpdate,
            attachmentFileNameToUpdateSv
        )
        assertReplacedAttachmentsHasBeenDeleted(createdCertificate)

        return updatedCertificateById
    }

    @BeforeAll
    fun setup() {
        mockMvc.perform(emptyDbRequest().with(yllapitajaUser)).andExpect(status().is3xxRedirection)
        mockMvc.perform(seedDbWithCertificates().with(yllapitajaUser)).andExpect(status().is3xxRedirection)
    }

    @TestFactory
    @WithYllapitajaRole
    fun `get all certificates of each exam as yllapitaja`(): Stream<DynamicTest> = exams.stream().map { exam ->
        DynamicTest.dynamicTest("Get all certificates for $exam") {
            val certificates = getAllCertificates(exam)

            assertEquals(4, certificates.size)

            val expectedNumbersInPage = listOf(0, 1, 2, 3)
            val actualNumbersInName = certificates.flatMap { cert ->
                Regex("\\d+").findAll(cert.nameFi).map { it.value.toInt() }.toList()
            }

            assertEquals(expectedNumbersInPage, actualNumbersInName)
        }
    }

    @TestFactory
    @WithOpettajaRole
    fun `get all certificates of each exam as opettaja`(): Stream<DynamicTest> = exams.stream().map { exam ->
        DynamicTest.dynamicTest("$exam") {
            assertOrderedCertificateList(exam, CertificateFilters(jarjesta = "asc"), listOf(0, 2))
            assertOrderedCertificateList(exam, CertificateFilters(jarjesta = "desc"), listOf(2, 0))
        }
    }

    private fun assertOrderedCertificateList(
        exam: Exam,
        filters: CertificateFilters,
        expectedNumbersInList: List<Number>
    ): List<CertificateOut> {
        val certificates = getAllCertificates(exam, filters = filters)
        // make sure that draft certificate is not returned
        assertEquals(2, certificates.size)

        val actualNumbersInName = certificates.flatMap { certificate ->
            Regex("\\d+").findAll(certificate.nameFi).map { it.value.toInt() }.toList()
        }

        assertEquals(expectedNumbersInList, actualNumbersInName)
        return certificates
    }

    @TestFactory
    fun `opettaja cannot get draft certificates by id`(): Stream<DynamicTest> = exams.stream().map { exam ->
        DynamicTest.dynamicTest("$exam") {
            val certificates = getAllCertificates(exam, user = yllapitajaUser)
            assertEquals(4, certificates.size)

            val idsOfDrafts =
                certificates.filter { it.publishState.toString() == TestPublishState.DRAFT.toString() }.map { it.id }
            assertEquals(2, idsOfDrafts.size)

            idsOfDrafts.forEach {
                mockMvc.perform(getCertificateById(exam, it).with(opettajaUser)).andExpect(status().isNotFound)
            }
        }
    }

    @TestFactory
    @WithYllapitajaRole
    fun `publish certificates`(): Stream<DynamicTest> = exams.stream().map { exam ->
        DynamicTest.dynamicTest("$exam") {
            when (exam) {
                Exam.SUKO -> createCertificateAndCheckIt<SukoCertificateDtoOut>(sukoCertificateToCreate)
                Exam.LD -> createCertificateAndCheckIt<LdCertificateDtoOut>(ldCertificateToCreate)
                Exam.PUHVI -> createCertificateAndCheckIt<PuhviCertificateDtoOut>(puhviCertificateToCreate)
                null -> fail("Exam should not be null")
            }
        }
    }

    @TestFactory
    @WithYllapitajaRole
    fun `create draft and publish certificates and update attachments`(): Stream<DynamicTest> =
        exams.stream().map { exam ->
            DynamicTest.dynamicTest("$exam") {
                val (createdCertificate, editedCertificate) = when (exam) {
                    Exam.SUKO -> Pair(
                        createCertificateAndCheckIt<SukoCertificateDtoOut>(
                            sukoCertificateToCreate.copy(publishState = TestPublishState.DRAFT),
                        ),
                        sukoCertificateToUpdate
                    )

                    Exam.LD -> Pair(
                        createCertificateAndCheckIt<LdCertificateDtoOut>(
                            ldCertificateToCreate.copy(publishState = TestPublishState.DRAFT),
                        ),
                        ldCertificateToUpdate
                    )

                    Exam.PUHVI -> Pair(
                        createCertificateAndCheckIt<PuhviCertificateDtoOut>(
                            puhviCertificateToCreate.copy(publishState = TestPublishState.DRAFT),
                        ),
                        puhviCertificateToUpdate
                    )

                    null -> fail("Exam should not be null")
                }

                when (val updatedCertificateById = updateCertificateAndAssert(createdCertificate, editedCertificate)) {
                    is SukoCertificateDtoOut -> assertEquals(
                        (editedCertificate as TestSukoCertificateIn).descriptionFi,
                        updatedCertificateById.descriptionFi
                    )

                    is LdCertificateDtoOut -> assertEquals(
                        (editedCertificate as TestLdCertificateIn).aineKoodiArvo,
                        updatedCertificateById.aineKoodiArvo
                    )

                    is PuhviCertificateDtoOut -> assertPuhviDescription(
                        editedCertificate as TestPuhviCertificateIn,
                        updatedCertificateById
                    )
                }
            }
        }

    @Test
    @WithYllapitajaRole
    fun putNonExistentCertificate() = assertEquals(
        "Certificate -1 not found",
        mockMvc.perform(putCertificate(-1, mapper.writeValueAsString(sukoCertificateToCreate)))
            .andExpect(status().isNotFound)
            .andReturn().response.contentAsString
    )

    @Test
    @WithYllapitajaRole
    fun postCertificateWithInvalidExam() {
        val body = mapper.writeValueAsString(sukoCertificateToCreate).replace("\"SUKO\"", "\"WRONG\"")

        val postResponseBody =
            mockMvc.perform(postCertificate(body, attachmentFileNameToCreate)).andExpect(status().isBadRequest)
                .andReturn().response.contentAsString
        assertThat(
            postResponseBody,
            CoreMatchers.containsString("Invalid type: JSON parse error: Could not resolve type id 'WRONG' as a subtype of `fi.oph.ludos.certificate.Certificate`: known type ids = [LD, PUHVI, SUKO]")
        )
    }

    @Test
    @WithYllapitajaRole
    fun postCertificateWithMissingAttachment() =
        assertThat(
            mockMvc.perform(postCertificate(mapper.writeValueAsString(sukoCertificateToCreate), null))
                .andExpect(status().isBadRequest)
                .andReturn().response.contentAsString, emptyString()
        )

    @Test
    @WithYllapitajaRole
    fun putCertificateWithInvalidPublishState() {
        val createdCertificateOut = createCertificateAndCheckIt<SukoCertificateDtoOut>(sukoCertificateToCreate)

        val body = mapper.writeValueAsString(sukoCertificateToCreate.copy(publishState = TestPublishState.OLEMATON))

        val putResponseBody = mockMvc.perform(putCertificate(createdCertificateOut.id, body))
            .andExpect(status().isBadRequest)
            .andReturn().response.contentAsString

        assertThat(
            putResponseBody,
            CoreMatchers.containsString("String \"OLEMATON\": not one of the values accepted for Enum class: [DRAFT, ARCHIVED, PUBLISHED, DELETED]")
        )
    }

    @Test
    @WithYllapitajaRole
    fun getCertificateByIdWhenExamDoesNotExist() = assertEquals(
        mockMvc.perform(getCertificateById(Exam.SUKO, 999))
            .andExpect(status().isNotFound())
            .andReturn().response.contentAsString, "Certificate not found 999"
    )

    private inline fun <reified T : TestCertificate, reified Y : CertificateOut> deleteCertificateTest(
        exam: Exam,
        certificateInInput: T,
        updateCertificate: (Y) -> T
    ) {
        val createdCertificateOut = createCertificateAndCheckIt<Y>(certificateInInput)

        mockMvc.perform(
            putCertificate(
                createdCertificateOut.id,
                mapper.writeValueAsString(updateCertificate(createdCertificateOut)),
                null,
                null
            )
        ).andExpect(status().isOk).andReturn().response.contentAsString

        mockMvc.perform(getCertificateById(exam, createdCertificateOut.id))
            .andExpect(status().isNotFound())

        val certificates = getAllCertificates(Exam.SUKO)

        assertTrue(
            certificates.none { it.id == createdCertificateOut.id },
            "No certificate should have the ID of the deleted one"
        )
    }

    @Test
    @WithYllapitajaRole
    fun `test deleting SUKO certificate`() = deleteCertificateTest<TestSukoCertificateIn, SukoCertificateDtoOut>(
        Exam.SUKO,
        sukoCertificateToCreate
    ) {
        TestSukoCertificateIn(
            it.exam,
            it.nameFi,
            it.nameSv,
            it.descriptionFi,
            it.descriptionSv,
            TestPublishState.DELETED
        )
    }

    @Test
    @WithYllapitajaRole
    fun `test deleting PUHVI certificate`() = deleteCertificateTest<TestPuhviCertificateIn, PuhviCertificateDtoOut>(
        Exam.PUHVI,
        puhviCertificateToCreate
    ) {
        TestPuhviCertificateIn(
            it.exam,
            it.nameFi,
            it.nameSv,
            it.descriptionFi,
            it.descriptionSv,
            TestPublishState.DELETED
        )
    }

    @Test
    @WithYllapitajaRole
    fun `test deleting LD certificate`() = deleteCertificateTest<TestLdCertificateIn, LdCertificateDtoOut>(
        Exam.LD,
        ldCertificateToCreate
    ) {
        TestLdCertificateIn(
            it.exam,
            it.nameFi,
            it.nameSv,
            TestPublishState.DELETED,
            it.aineKoodiArvo
        )
    }
}
