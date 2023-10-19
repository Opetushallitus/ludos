package fi.oph.ludos.certificate

import com.fasterxml.jackson.module.kotlin.jacksonObjectMapper
import fi.oph.ludos.*
import jakarta.transaction.Transactional
import org.hamcrest.CoreMatchers
import org.hamcrest.MatcherAssert.assertThat
import org.hamcrest.Matchers.emptyString
import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.BeforeAll
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.TestInstance
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.test.context.TestPropertySource
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.status

@TestPropertySource(locations = ["classpath:application.properties"])
@SpringBootTest
@AutoConfigureMockMvc
@Transactional
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
class CertificateControllerTest(@Autowired val mockMvc: MockMvc) {
    val objectMapper = jacksonObjectMapper()
    var idsOfCertificateDrafts = listOf<Int>()

    val fileKeyRegex = "^todistuspohja_[0-9a-fA-F]{8}-([0-9a-fA-F]{4}-){3}[0-9a-fA-F]{12}$".toRegex()
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

    private fun createCertificateAndCheckIt(publishState: PublishState): TestCertificateOut {
        val certificateToCreate = TestCertificateIn(
            exam = Exam.SUKO,
            name = "Test Certificate FI",
            description = "Certificate content Fi",
            publishState = publishState,
        )
        val attachmentFileName = "fixture1.pdf"

        val certificateToCreateStr = objectMapper.writeValueAsString(certificateToCreate)

        val attachmentPart = readAttachmentFixtureFile(attachmentFileName)
        val createdCertificateStr =
            mockMvc.perform(postCertificate(certificateToCreateStr, attachmentPart)).andExpect(status().isOk)
                .andReturn().response.contentAsString

        val createdCertificate = objectMapper.readValue(createdCertificateStr, TestCertificateOut::class.java)

        assertNotNull(createdCertificate.id)
        assertEquals(certificateToCreate.name, createdCertificate.name)
        assertEquals(certificateToCreate.exam, createdCertificate.exam)
        assertEquals(certificateToCreate.description, createdCertificate.description)
        assertEquals(certificateToCreate.publishState, createdCertificate.publishState)
        assertEquals(createdCertificate.attachment.fileName, attachmentFileName)
        validateFileKey(createdCertificate.attachment.fileKey)
        assertEquals(YllapitajaSecurityContextFactory().kayttajatiedot().oidHenkilo, createdCertificate.authorOid)
        assertNotNull(createdCertificate.attachment.fileUploadDate)
        assertNotNull(createdCertificate.createdAt)
        assertNotNull(createdCertificate.updatedAt)

        val getResult = mockMvc.perform(getCertificateById(Exam.SUKO, createdCertificate.id)).andExpect(status().isOk)
            .andReturn().response.contentAsString

        val certificateById = objectMapper.readValue(getResult, TestCertificateOut::class.java)

        assertEquals(createdCertificate.id, certificateById.id)
        assertEquals(certificateToCreate.name, certificateById.name)
        assertEquals(certificateToCreate.description, certificateById.description)
        assertEquals(certificateToCreate.publishState, certificateById.publishState)
        assertEquals(createdCertificate.attachment, certificateById.attachment)
        assertEquals(createdCertificate.authorOid, certificateById.authorOid)
        assertNotNull(certificateById.createdAt)
        assertNotNull(certificateById.updatedAt)

        assertGetReturnsExpectedAttachment(
            certificateById.attachment.fileKey, attachmentFileName, attachmentPart.bytes
        )

        return certificateById
    }

    @Test
    @WithYllapitajaRole
    fun publishCertificate() {
        createCertificateAndCheckIt(PublishState.PUBLISHED)
    }

    @Test
    @WithYllapitajaRole
    fun createDraftCertificateAndPublishCertificateWithoutUpdatingAttachment() {
        val createdCertificate = createCertificateAndCheckIt(PublishState.DRAFT)

        val editedCertificate = TestCertificateIn(
            exam = Exam.SUKO,
            name = "Suko Test Certificate FI updated",
            description = "Suko Certificate content Fi updated",
            publishState = PublishState.PUBLISHED,
        )

        val editedCertificateStr = objectMapper.writeValueAsString(editedCertificate)

        mockMvc.perform(putCertificate(createdCertificate.id, editedCertificateStr, null)).andExpect(status().isOk)
            .andReturn().response.contentAsString

        val getUpdatedResult =
            mockMvc.perform(getCertificateById(Exam.SUKO, createdCertificate.id)).andExpect(status().isOk)
                .andReturn().response.contentAsString

        val updatedCertificateById = objectMapper.readValue(getUpdatedResult, TestCertificateOut::class.java)

        assertEquals(editedCertificate.name, updatedCertificateById.name)
        assertEquals(editedCertificate.description, updatedCertificateById.description)
        assertEquals(PublishState.PUBLISHED, updatedCertificateById.publishState)
        assertEquals(createdCertificate.attachment, updatedCertificateById.attachment)
        assertEquals(createdCertificate.id, updatedCertificateById.id)
        assertEquals(createdCertificate.authorOid, updatedCertificateById.authorOid)
        assertNotEquals(createdCertificate.updatedAt, updatedCertificateById.updatedAt)
    }

    @Test
    @WithYllapitajaRole
    fun publishAndUpdateCertificateWithUpdatedAttachment() {
        val createdCertificate = createCertificateAndCheckIt(PublishState.PUBLISHED)

        val editedCertificate = TestCertificateIn(
            exam = Exam.SUKO,
            name = "Suko Test Certificate FI updated",
            description = "Suko Certificate content Fi updated",
            publishState = PublishState.PUBLISHED,
        )

        val editedCertificateStr = objectMapper.writeValueAsString(editedCertificate)

        Thread.sleep(1) // Wait a bit to ensure attachmentUploadDate is different
        val newAttachmentFixtureFileName = "fixture2.pdf"
        val newAttachment = readAttachmentFixtureFile(newAttachmentFixtureFileName)
        mockMvc.perform(putCertificate(createdCertificate.id, editedCertificateStr, newAttachment))
            .andExpect(status().isOk).andReturn()

        val getUpdatedResult =
            mockMvc.perform(getCertificateById(Exam.SUKO, createdCertificate.id)).andExpect(status().isOk)
                .andReturn().response.contentAsString

        val updatedCertificateById = objectMapper.readValue(getUpdatedResult, TestCertificateOut::class.java)

        assertEquals(editedCertificate.name, updatedCertificateById.name)
        assertEquals(editedCertificate.description, updatedCertificateById.description)
        assertEquals(editedCertificate.publishState, updatedCertificateById.publishState)
        assertEquals(newAttachmentFixtureFileName, updatedCertificateById.attachment.fileName)
        validateFileKey(updatedCertificateById.attachment.fileKey)
        assertNotEquals(updatedCertificateById.attachment.fileKey, createdCertificate.attachment.fileKey)
        assertNotNull(updatedCertificateById.attachment.fileUploadDate)
        assertNotEquals(updatedCertificateById.attachment.fileUploadDate, createdCertificate.attachment.fileUploadDate)
        assertEquals(createdCertificate.authorOid, updatedCertificateById.authorOid)
        assertEquals(createdCertificate.id, updatedCertificateById.id)

        assertGetReturnsExpectedAttachment(
            updatedCertificateById.attachment.fileKey, newAttachmentFixtureFileName, newAttachment.bytes
        )

        mockMvc.perform(getAttachment(createdCertificate.attachment.fileKey)).andExpect(status().isNotFound)
    }

    @Test
    @WithYllapitajaRole
    fun createDraftCertificate() {
        createCertificateAndCheckIt(PublishState.DRAFT)
    }

    @Test
    @WithYllapitajaRole
    fun putNonExistentCertificate() {
        val editedCertificate = TestCertificateIn(
            exam = Exam.SUKO,
            name = "Name",
            description = "Description",
            publishState = PublishState.PUBLISHED,
        )
        val editedCertificateStr = objectMapper.writeValueAsString(editedCertificate)

        val result = mockMvc.perform(putCertificate(-1, editedCertificateStr, null)).andExpect(status().isNotFound)
            .andReturn().response.contentAsString

        assertEquals("Certificate -1 not found", result)
    }

    @Test
    @WithYllapitajaRole
    fun postCertificateWithInvalidExam() {
        val body = """
            {
                "name": "Test Certificate",
                "description": "Certificate content",
                "publishState": "PUBLISHED",
                "exam": "WRONG",
            }
        """

        val attachmentPart = readAttachmentFixtureFile("fixture1.pdf")
        val postResponseBody = mockMvc.perform(postCertificate(body, attachmentPart)).andExpect(status().isBadRequest)
            .andReturn().response.contentAsString
        assertThat(
            postResponseBody,
            CoreMatchers.containsString("String \"WRONG\": not one of the values accepted for Enum class: [LD, SUKO, PUHVI]")
        )
    }

    @Test
    @WithYllapitajaRole
    fun postCertificateWithMissingAttachment() {
        val certificateIn = TestCertificateIn(
            exam = Exam.LD,
            name = "Test Certificate FI",
            description = "Certificate content Fi",
            publishState = PublishState.PUBLISHED,
        )
        val certificateInStr = objectMapper.writeValueAsString(certificateIn)

        val postResponseBody = mockMvc.perform(postCertificate(certificateInStr, null)).andExpect(status().isBadRequest)
            .andReturn().response.contentAsString
        assertThat(postResponseBody, emptyString())
    }

    @Test
    @WithYllapitajaRole
    fun putCertificateWithInvalidPublishState() {
        val createdCertificateOut = createCertificateAndCheckIt(PublishState.PUBLISHED)

        val body = """
            {
                "name": "Test Certificate",
                "description": "Certificate content",
                "publishState": "NON_EXISTENT_PUBLISH_STATE",
                "exam": "PUHVI",
            }
        """

        val putResponseBody =
            mockMvc.perform(putCertificate(createdCertificateOut.id, body, null)).andExpect(status().isBadRequest)
                .andReturn().response.contentAsString
        assertThat(
            putResponseBody,
            CoreMatchers.containsString("String \"NON_EXISTENT_PUBLISH_STATE\": not one of the values accepted for Enum class: [DRAFT, ARCHIVED, PUBLISHED, DELETED]")
        )
    }

    @Test
    @WithYllapitajaRole
    fun getCertificateByIdWhenExamDoesNotExist() {
        val getResult = mockMvc.perform(getCertificateById(Exam.SUKO, 999)).andExpect(status().isNotFound()).andReturn()
        val responseContent = getResult.response.contentAsString

        assertEquals(responseContent, "Certificate not found 999")
    }


    @BeforeAll
    fun setup() {
        authenticateAsYllapitaja()
        mockMvc.perform(emptyDbRequest())
        mockMvc.perform(seedDbWithCertificates())
        val res = mockMvc.perform(getAllCertificates(Exam.SUKO)).andExpect(status().isOk())
            .andReturn().response.contentAsString
        val allCertificates = objectMapper.readValue(res, TestCertificatesOut::class.java).content
        assertEquals(4, allCertificates.size)
        idsOfCertificateDrafts = allCertificates.filter { it.publishState == PublishState.DRAFT }.map { it.id }
    }

    @Test
    @WithOpettajaRole
    fun getCertificateDraftAsOpettaja() {
        idsOfCertificateDrafts.forEach() {
            mockMvc.perform(getCertificateById(Exam.SUKO, it)).andExpect(status().isNotFound())
        }
    }

    @Test
    @WithOpettajaRole
    fun getCertificatesAsOpettaja() {
        val res = mockMvc.perform(getAllCertificates(Exam.SUKO)).andExpect(status().isOk())
            .andReturn().response.contentAsString

        val certificates = objectMapper.readValue(res, TestCertificatesOut::class.java).content

        // make sure that draft certificate is not returned
        assertTrue(
            certificates.none { it.publishState == PublishState.DRAFT }, "Opettaja should not see draft certificates"
        )

        assertEquals(2, certificates.size)
    }

    @Test
    @WithYllapitajaRole
    fun `test deleting a certificate`() {
        val createdCertificateOut = createCertificateAndCheckIt(PublishState.PUBLISHED)

        mockMvc.perform(
            putCertificate(
                createdCertificateOut.id, objectMapper.writeValueAsString(
                    TestCertificateIn(
                        createdCertificateOut.exam,
                        createdCertificateOut.name,
                        createdCertificateOut.description,
                        PublishState.DELETED
                    )
                ), null
            )
        ).andExpect(status().isOk)
            .andReturn().response.contentAsString

        mockMvc.perform(getCertificateById(Exam.SUKO, createdCertificateOut.id)).andExpect(status().isNotFound())

        val certificates = objectMapper.readValue(
            mockMvc.perform(getAllCertificates(Exam.SUKO)).andExpect(status().isOk())
                .andReturn().response.contentAsString, TestCertificatesOut::class.java
        ).content

        val noneHaveMatchingId = certificates.none { it.id == createdCertificateOut.id }

        assertTrue(noneHaveMatchingId, "No certificate should have the ID of the deleted one")
    }
}
