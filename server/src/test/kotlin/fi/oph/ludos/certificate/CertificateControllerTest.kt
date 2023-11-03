package fi.oph.ludos.certificate

import com.fasterxml.jackson.core.type.TypeReference
import com.fasterxml.jackson.module.kotlin.jacksonTypeRef
import com.fasterxml.jackson.module.kotlin.readValue
import fi.oph.ludos.*
import jakarta.transaction.Transactional
import org.hamcrest.CoreMatchers
import org.hamcrest.MatcherAssert.assertThat
import org.hamcrest.Matchers.emptyString
import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.BeforeAll
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.TestInstance
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.mock.web.MockMultipartFile
import org.springframework.test.context.TestPropertySource
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.status

const val attachmentFileNameToCreate = "fixture1.pdf"
const val attachmentFileNameToUpdate = "fixture2.pdf"

val sukoCertificateToCreate = TestSukoCertificateIn(
    Exam.SUKO,
    "Test Certificate FI",
    "",
    "Certificate content FI",
    "",
    PublishState.PUBLISHED,
)

val sukoCertificateToUpdate = TestSukoCertificateIn(
    Exam.SUKO,
    "Test Certificate FI updated",
    "",
    "Certificate content FI updated",
    "",
    PublishState.PUBLISHED,
)

val puhviCertificateToCreate = TestPuhviCertificateIn(
    Exam.PUHVI,
    "Test Certificate FI",
    "Test Certificate SV",
    "Certificate content Fi",
    "Certificate content SV",
    PublishState.PUBLISHED,
)

val puhviCertificateToUpdate = TestPuhviCertificateIn(
    Exam.PUHVI,
    "Test Certificate FI updated",
    "Test Certificate SV updated",
    "Certificate content FI updated",
    "Certificate content SV updated",
    PublishState.PUBLISHED,
)

val ldCertificateToCreate = TestLdCertificateIn(
    Exam.LD,
    "Test Certificate FI",
    "Test Certificate SV",
    PublishState.PUBLISHED,
    "1"
)

val ldCertificateToUpdate = TestLdCertificateIn(
    Exam.LD,
    "Test Certificate FI updated",
    "Test Certificate SV updated",
    PublishState.PUBLISHED,
    "2"
)

@TestPropertySource(locations = ["classpath:application.properties"])
@SpringBootTest
@AutoConfigureMockMvc
@Transactional
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
class CertificateControllerTest : CertificateRequests() {
    var idsOfSukoCertificateDrafts = listOf<Int>()
    var idsOfLdCertificateDrafts = listOf<Int>()
    var idsOfPuhviCertificateDrafts = listOf<Int>()

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

    private fun <T : CertificateOut> assertAttachment(
        updatedCertificateById: T,
        newAttachment: MockMultipartFile,
    ) {
        val newAttachmentFixtureFileName = attachmentFileNameToUpdate

        when (updatedCertificateById) {
            is SukoCertificateDtoOut -> {
                assertEquals(newAttachmentFixtureFileName, updatedCertificateById.attachmentFi.fileName)
                validateFileKey(updatedCertificateById.attachmentFi.fileKey)
                assertNotNull(updatedCertificateById.attachmentFi.fileUploadDate)

                assertGetReturnsExpectedAttachment(
                    updatedCertificateById.attachmentFi.fileKey, newAttachmentFixtureFileName, newAttachment.bytes
                )
            }

            is LdCertificateDtoOut -> {
                assertEquals(newAttachmentFixtureFileName, updatedCertificateById.attachmentFi.fileName)
                validateFileKey(updatedCertificateById.attachmentFi.fileKey)
                assertNotNull(updatedCertificateById.attachmentFi.fileUploadDate)

                assertGetReturnsExpectedAttachment(
                    updatedCertificateById.attachmentFi.fileKey, newAttachmentFixtureFileName, newAttachment.bytes
                )
            }

            is PuhviCertificateDtoOut -> {
                assertEquals(newAttachmentFixtureFileName, updatedCertificateById.attachmentFi.fileName)
                validateFileKey(updatedCertificateById.attachmentFi.fileKey)
                assertNotNull(updatedCertificateById.attachmentFi.fileUploadDate)

                assertGetReturnsExpectedAttachment(
                    updatedCertificateById.attachmentFi.fileKey, newAttachmentFixtureFileName, newAttachment.bytes
                )
            }
        }
    }

    private fun assertPuhviDescription(dtoIn: TestPuhviCertificateIn, dtoOut: PuhviCertificateDtoOut) {
        assertEquals(dtoIn.descriptionFi, dtoOut.descriptionFi)
        assertEquals(dtoIn.descriptionSv, dtoOut.descriptionSv)
    }

    private fun assertCommonFields(
        dtoIn: TestCertificate,
        dtoOut: CertificateOut
    ) {
        assertNotNull(dtoOut.id)
        assertEquals(dtoIn.exam, dtoOut.exam)
        assertEquals(dtoIn.publishState, dtoOut.publishState)
        assertEquals(dtoIn.nameFi, dtoOut.nameFi)
        assertEquals(dtoIn.nameSv, dtoOut.nameSv)
        assertEquals(YllapitajaSecurityContextFactory().kayttajatiedot().oidHenkilo, dtoOut.authorOid)
        assertNotNull(dtoOut.createdAt)
        assertNotNull(dtoOut.updatedAt)
    }

    private fun <T : CertificateOut> createCertificateAndCheckIt(
        certificateToCreate: TestCertificate,
        expectedDtoClass: Class<T>,
        attachmentFileName: String,
        additionalCertificationAssertions: (T) -> Unit = {},
    ): T {
        val certificateToCreateStr = mapper.writeValueAsString(certificateToCreate)

        val createdCertificateStr = mockMvc.perform(postCertificate(certificateToCreateStr, attachmentFileName))
            .andExpect(status().isOk)
            .andReturn().response.contentAsString

        val createdCertificate = mapper.readValue(createdCertificateStr, expectedDtoClass)

        assertCommonFields(certificateToCreate, createdCertificate)
        additionalCertificationAssertions(createdCertificate)

        val getResult = mockMvc.perform(getCertificateById(certificateToCreate.exam, createdCertificate.id))
            .andExpect(status().isOk)
            .andReturn().response.contentAsString

        val certificateById = mapper.readValue(getResult, expectedDtoClass)

        assertCommonFields(certificateToCreate, certificateById)
        additionalCertificationAssertions(createdCertificate)

        return certificateById
    }

    @BeforeAll
    fun setup() {
        authenticateAsYllapitaja()
        mockMvc.perform(emptyDbRequest())
        mockMvc.perform(seedDbWithCertificates())
    }

    @Test
    @WithYllapitajaRole
    fun `get all certificates of each exam`() {
        for (exam in Exam.entries) {
            val res = mockMvc.perform(getAllCertificates(exam)).andExpect(status().isOk())
                .andReturn().response.contentAsString

            val content = when (exam) {
                Exam.SUKO -> getAllCertificatesContent<SukoCertificateDtoOut>(res)
                Exam.LD -> getAllCertificatesContent<LdCertificateDtoOut>(res)
                Exam.PUHVI -> getAllCertificatesContent<PuhviCertificateDtoOut>(res)
                else -> throw Exception("Unknown exam")
            }

            assertEquals(4, content.size)

            when (exam) {
                Exam.SUKO -> idsOfSukoCertificateDrafts =
                    content.filter { it.publishState == PublishState.DRAFT }.map { it.id }

                Exam.PUHVI -> idsOfPuhviCertificateDrafts =
                    content.filter { it.publishState == PublishState.DRAFT }.map { it.id }

                Exam.LD -> idsOfLdCertificateDrafts =
                    content.filter { it.publishState == PublishState.DRAFT }.map { it.id }
            }
        }
    }

    @Test
    @WithYllapitajaRole
    fun publishCertificate() {
        for (exam in exams) {
            when (exam) {
                Exam.SUKO -> createCertificateAndCheckIt(
                    sukoCertificateToCreate,
                    SukoCertificateDtoOut::class.java,
                    attachmentFileNameToCreate
                ) {
                    assertEquals(sukoCertificateToCreate.descriptionFi, it.descriptionFi)
                }

                Exam.LD -> {
                    createCertificateAndCheckIt(
                        ldCertificateToCreate,
                        LdCertificateDtoOut::class.java,
                        attachmentFileNameToCreate
                    ) {
                        assertEquals(ldCertificateToCreate.aineKoodiArvo, it.aineKoodiArvo)
                        assertEquals(attachmentFileNameToCreate, it.attachmentFi.fileName)
                        validateFileKey(it.attachmentFi.fileKey)
                        assertNotNull(it.attachmentFi.fileUploadDate)

                        assertGetReturnsExpectedAttachment(
                            it.attachmentFi.fileKey,
                            attachmentFileNameToCreate,
                            readAttachmentFixtureFile(attachmentFileNameToCreate).bytes
                        )

                        assertGetReturnsExpectedAttachment(
                            it.attachmentFi.fileKey,
                            attachmentFileNameToCreate,
                            readAttachmentFixtureFile(attachmentFileNameToCreate).bytes
                        )
                    }
                }

                Exam.PUHVI -> createCertificateAndCheckIt(
                    puhviCertificateToCreate,
                    PuhviCertificateDtoOut::class.java,
                    attachmentFileNameToCreate
                ) {
                    assertPuhviDescription(puhviCertificateToCreate, it)
                }
            }
        }
    }

    @Test
    @WithYllapitajaRole
    fun `create draft SUKO certificate and publish certificate without updating attachment`() {
        val exam = Exam.SUKO

        val createdCertificate = createCertificateAndCheckIt(
            sukoCertificateToCreate,
            SukoCertificateDtoOut::class.java,
            attachmentFileNameToCreate
        ) {
            assertEquals(sukoCertificateToCreate.descriptionFi, it.descriptionFi)
        }

        val editedCertificate = sukoCertificateToUpdate

        mockMvc.perform(putCertificate(createdCertificate.id, mapper.writeValueAsString(editedCertificate), null))
            .andExpect(status().isOk)
            .andReturn().response.contentAsString

        val updatedCertificateById: SukoCertificateDtoOut = mapper.readValue(
            mockMvc.perform(getCertificateById(exam, createdCertificate.id))
                .andExpect(status().isOk)
                .andReturn().response.contentAsString
        )

        assertEquals(sukoCertificateToUpdate.descriptionFi, updatedCertificateById.descriptionFi)
        assertCommonFields(editedCertificate, updatedCertificateById)
    }

    @Test
    @WithYllapitajaRole
    fun `create draft PUHVI certificate and publish certificate without updating attachment`() {
        val createdCertificate = createCertificateAndCheckIt(
            puhviCertificateToCreate,
            PuhviCertificateDtoOut::class.java,
            attachmentFileNameToCreate
        ) {
            assertPuhviDescription(puhviCertificateToCreate, it)
        }

        val editedCertificate = puhviCertificateToUpdate

        mockMvc.perform(putCertificate(createdCertificate.id, mapper.writeValueAsString(editedCertificate), null))
            .andExpect(status().isOk)
            .andReturn().response.contentAsString

        val updatedCertificateById: PuhviCertificateDtoOut = mapper.readValue(
            mockMvc.perform(getCertificateById(createdCertificate.exam, createdCertificate.id))
                .andExpect(status().isOk)
                .andReturn().response.contentAsString
        )


        assertPuhviDescription(puhviCertificateToUpdate, updatedCertificateById)
        assertCommonFields(editedCertificate, updatedCertificateById)
    }


    @Test
    @WithYllapitajaRole
    fun `create draft LD certificate and publish certificate without updating attachment`() {
        val createdCertificate = createCertificateAndCheckIt(
            ldCertificateToCreate,
            LdCertificateDtoOut::class.java,
            attachmentFileNameToCreate
        ) {
            assertEquals(ldCertificateToCreate.aineKoodiArvo, it.aineKoodiArvo)
        }

        val editedCertificate = ldCertificateToUpdate

        mockMvc.perform(putCertificate(createdCertificate.id, mapper.writeValueAsString(editedCertificate), null))
            .andExpect(status().isOk)
            .andReturn().response.contentAsString

        val updatedCertificateById: LdCertificateDtoOut =
            mapper.readValue(
                mockMvc.perform(getCertificateById(createdCertificate.exam, createdCertificate.id))
                    .andExpect(status().isOk)
                    .andReturn().response.contentAsString
            )

        assertEquals(ldCertificateToUpdate.aineKoodiArvo, updatedCertificateById.aineKoodiArvo)
        assertCommonFields(editedCertificate, updatedCertificateById)
    }

    @Test
    @WithYllapitajaRole
    fun `publish and update SUKO certificate with updated attachment`() {
        val createdCertificate = createCertificateAndCheckIt(
            sukoCertificateToCreate,
            SukoCertificateDtoOut::class.java,
            attachmentFileNameToCreate
        ) {
            assertEquals(sukoCertificateToCreate.descriptionFi, it.descriptionFi)
        }

        val editedCertificate = sukoCertificateToUpdate

        Thread.sleep(1) // Wait a bit to ensure attachmentUploadDate is different
        val newAttachment = readAttachmentFixtureFile(attachmentFileNameToUpdate)
        mockMvc.perform(
            putCertificate(
                createdCertificate.id,
                mapper.writeValueAsString(editedCertificate),
                newAttachment
            )
        ).andExpect(status().isOk).andReturn()

        val updatedCertificateById: SukoCertificateDtoOut = mapper.readValue(
            mockMvc.perform(getCertificateById(createdCertificate.exam, createdCertificate.id)).andExpect(status().isOk)
                .andReturn().response.contentAsString
        )

        assertEquals(sukoCertificateToUpdate.descriptionFi, updatedCertificateById.descriptionFi)
        assertCommonFields(editedCertificate, updatedCertificateById)

        assertAttachment(
            updatedCertificateById,
            newAttachment
        )

        mockMvc.perform(getAttachment(createdCertificate.attachmentFi.fileKey)).andExpect(status().isNotFound)
    }

    @Test
    @WithYllapitajaRole
    fun `publish and update LD certificate with updated attachment`() {
        val createdCertificate = createCertificateAndCheckIt(
            ldCertificateToCreate,
            LdCertificateDtoOut::class.java,
            attachmentFileNameToCreate
        ) {
            assertEquals(ldCertificateToCreate.aineKoodiArvo, it.aineKoodiArvo)
        }

        val editedCertificate = ldCertificateToUpdate

        Thread.sleep(1) // Wait a bit to ensure attachmentUploadDate is different
        val newAttachment = readAttachmentFixtureFile(attachmentFileNameToUpdate)
        mockMvc.perform(
            putCertificate(
                createdCertificate.id,
                mapper.writeValueAsString(editedCertificate),
                newAttachment
            )
        ).andExpect(status().isOk).andReturn()

        val updatedCertificateById: LdCertificateDtoOut = mapper.readValue(
            mockMvc.perform(getCertificateById(createdCertificate.exam, createdCertificate.id)).andExpect(status().isOk)
                .andReturn().response.contentAsString
        )

        assertEquals(ldCertificateToUpdate.aineKoodiArvo, updatedCertificateById.aineKoodiArvo)
        assertCommonFields(editedCertificate, updatedCertificateById)

        assertAttachment(
            updatedCertificateById,
            newAttachment
        )

        mockMvc.perform(getAttachment(createdCertificate.attachmentFi.fileKey)).andExpect(status().isNotFound)
    }

    @Test
    @WithYllapitajaRole
    fun `publish and update PUHVI certificate with updated attachment`() {
        val createdCertificate = createCertificateAndCheckIt(
            puhviCertificateToCreate,
            PuhviCertificateDtoOut::class.java,
            attachmentFileNameToCreate
        ) {
            assertPuhviDescription(puhviCertificateToCreate, it)
        }

        val editedCertificate = puhviCertificateToUpdate

        Thread.sleep(1) // Wait a bit to ensure attachmentUploadDate is different
        val newAttachment = readAttachmentFixtureFile(attachmentFileNameToUpdate)
        mockMvc.perform(
            putCertificate(
                createdCertificate.id,
                mapper.writeValueAsString(editedCertificate),
                newAttachment
            )
        )
            .andExpect(status().isOk).andReturn()

        val updatedCertificateById: PuhviCertificateDtoOut = mapper.readValue(
            mockMvc.perform(getCertificateById(createdCertificate.exam, createdCertificate.id)).andExpect(status().isOk)
                .andReturn().response.contentAsString
        )

        assertPuhviDescription(puhviCertificateToUpdate, updatedCertificateById)
        assertCommonFields(editedCertificate, updatedCertificateById)

        assertAttachment(
            updatedCertificateById,
            newAttachment
        )

        mockMvc.perform(getAttachment(createdCertificate.attachmentFi.fileKey)).andExpect(status().isNotFound)
    }

    @Test
    @WithYllapitajaRole
    fun createDraftCertificate() {
        createCertificateAndCheckIt(
            sukoCertificateToCreate.copy(publishState = PublishState.DRAFT),
            SukoCertificateDtoOut::class.java,
            attachmentFileNameToCreate
        ) {
            assertEquals(sukoCertificateToCreate.descriptionFi, it.descriptionFi)
        }
    }

    @Test
    @WithYllapitajaRole
    fun putNonExistentCertificate() = assertEquals(
        "Certificate -1 not found",
        mockMvc.perform(putCertificate(-1, mapper.writeValueAsString(sukoCertificateToCreate), null))
            .andExpect(status().isNotFound)
            .andReturn().response.contentAsString
    )

    @Test
    @WithYllapitajaRole
    fun postCertificateWithInvalidExam() {
        val body = """
            {
                "name": "Test Certificate",
                "description": "Certificate content",
                "publishState": "PUBLISHED",
                "exam": "WRONG"
            }
        """

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
        val createdCertificateOut = createCertificateAndCheckIt(
            sukoCertificateToCreate,
            SukoCertificateDtoOut::class.java,
            attachmentFileNameToCreate
        )

        val body = """
            {
                "name": "Test Certificate",
                "description": "Certificate content",
                "publishState": "NON_EXISTENT_PUBLISH_STATE",
                "exam": "PUHVI"
            }
        """

        val putResponseBody = mockMvc.perform(putCertificate(createdCertificateOut.id, body, null))
            .andExpect(status().isBadRequest)
            .andReturn().response.contentAsString

        assertThat(
            putResponseBody,
            CoreMatchers.containsString("String \"NON_EXISTENT_PUBLISH_STATE\": not one of the values accepted for Enum class: [DRAFT, ARCHIVED, PUBLISHED, DELETED]")
        )
    }

    @Test
    @WithYllapitajaRole
    fun getCertificateByIdWhenExamDoesNotExist() = assertEquals(
        mockMvc.perform(getCertificateById(Exam.SUKO, 999))
            .andExpect(status().isNotFound())
            .andReturn().response.contentAsString, "Certificate not found 999"
    )

    @Test
    @WithOpettajaRole
    fun getCertificateDraftAsOpettaja() = exams.forEach { exam ->
        when (exam) {
            Exam.SUKO -> idsOfSukoCertificateDrafts.forEach {
                mockMvc.perform(getCertificateById(exam, it)).andExpect(status().isNotFound())
            }

            Exam.PUHVI -> idsOfPuhviCertificateDrafts.forEach {
                mockMvc.perform(getCertificateById(exam, it)).andExpect(status().isNotFound())
            }

            Exam.LD -> idsOfLdCertificateDrafts.forEach {
                mockMvc.perform(getCertificateById(exam, it)).andExpect(status().isNotFound())
            }
        }
    }

    @Test
    @WithOpettajaRole
    fun getCertificatesAsOpettaja() {
        val res = mockMvc.perform(getAllCertificates(Exam.SUKO))
            .andExpect(status().isOk())
            .andReturn().response.contentAsString

        val certificates: CertificatesOut = mapper.readValue(res)
        val content = certificates.content
        // make sure that draft certificate is not returned
        assertTrue(
            content.none { it.publishState == PublishState.DRAFT }, "Opettaja should not see draft certificates"
        )

        assertEquals(2, content.size)
    }

    private fun <T : TestCertificate, Y : CertificateOut> deleteCertificateTest(
        exam: Exam,
        certificateInInput: T,
        certificateOutType: Class<Y>,
        certificateOutTypeRef: TypeReference<CertificatesOut>,
        updateCertificate: (Y) -> T
    ) {
        val createdCertificateOut = createCertificateAndCheckIt(
            certificateInInput,
            certificateOutType,
            attachmentFileNameToCreate
        )

        mockMvc.perform(
            putCertificate(
                createdCertificateOut.id,
                mapper.writeValueAsString(updateCertificate(createdCertificateOut)),
                null
            )
        ).andExpect(status().isOk).andReturn().response.contentAsString

        mockMvc.perform(getCertificateById(exam, createdCertificateOut.id))
            .andExpect(status().isNotFound())

        val certificatesResponse = mockMvc.perform(getAllCertificates(exam))
            .andExpect(status().isOk)
            .andReturn().response.contentAsString

        val certificates = mapper.readValue(certificatesResponse, certificateOutTypeRef)

        assertTrue(
            certificates.content.none { it.id == createdCertificateOut.id },
            "No certificate should have the ID of the deleted one"
        )
    }

    @Test
    @WithYllapitajaRole
    fun `test deleting SUKO certificate`() = deleteCertificateTest(
        Exam.SUKO,
        sukoCertificateToCreate,
        SukoCertificateDtoOut::class.java,
        jacksonTypeRef<CertificatesOut>()
    ) {
        TestSukoCertificateIn(
            it.exam,
            it.nameFi,
            it.nameSv,
            it.descriptionFi,
            it.descriptionSv,
            PublishState.DELETED
        )
    }

    @Test
    @WithYllapitajaRole
    fun `test deleting PUHVI certificate`() = deleteCertificateTest(
        Exam.PUHVI,
        puhviCertificateToCreate,
        PuhviCertificateDtoOut::class.java,
        jacksonTypeRef<CertificatesOut>()
    ) {
        TestPuhviCertificateIn(
            it.exam,
            it.nameFi,
            it.nameSv,
            it.descriptionFi,
            it.descriptionSv,
            PublishState.DELETED
        )
    }

    @Test
    @WithYllapitajaRole
    fun `test deleting LD certificate`() = deleteCertificateTest(
        Exam.LD,
        ldCertificateToCreate,
        LdCertificateDtoOut::class.java,
        jacksonTypeRef<CertificatesOut>()
    ) {
        TestLdCertificateIn(
            it.exam,
            it.nameFi,
            it.nameSv,
            PublishState.DELETED,
            it.aineKoodiArvo
        )
    }
}
