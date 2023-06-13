package fi.oph.ludos.certificate

import com.fasterxml.jackson.module.kotlin.jacksonObjectMapper
import fi.oph.ludos.Constants
import fi.oph.ludos.Exam
import fi.oph.ludos.PublishState
import fi.oph.ludos.WithYllapitajaRole
import org.assertj.core.api.Assertions.assertThat
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

fun postCertificate(body: String) =
    MockMvcRequestBuilders.post("${Constants.API_PREFIX}/certificate").contentType(MediaType.APPLICATION_JSON)
        .content(body)

fun getCertificate(exam: Exam, id: Int) =
    MockMvcRequestBuilders.get("${Constants.API_PREFIX}/certificate/$exam/$id").contentType(MediaType.APPLICATION_JSON)

fun updateCertificate(id: Int, body: String) =
    MockMvcRequestBuilders.put("${Constants.API_PREFIX}/certificate/$id").contentType(MediaType.APPLICATION_JSON)
        .content(body)

@TestPropertySource(
    properties = ["LUDOS_PALVELUKAYTTAJA_USERNAME=test_username", "LUDOS_PALVELUKAYTTAJA_PASSWORD=test_password"]
)
@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class CertificateControllerTest(@Autowired val mockMvc: MockMvc) {
    val objectMapper = jacksonObjectMapper()

    data class TestCertificateIn(
        val exam: Exam,
        val nameFi: String,
        val contentFi: String,
        val publishState: PublishState,
        val fileName: String,
        val fileUrl: String,
        val fileUploadDate: String,
    )

    data class TestCertificateOut(
        val id: Int,
        val exam: Exam,
        val nameFi: String,
        val contentFi: String,
        val publishState: PublishState,
        val fileName: String,
        val fileUrl: String,
        val fileUploadDate: String,
        val createdAt: Timestamp,
        val updatedAt: Timestamp
    )

    @Test
    @WithYllapitajaRole
    fun createCertificateTest() {
        // todo: figure out what to do with dates
        val testCertificate = TestCertificateIn(
            exam = Exam.SUKO,
            nameFi = "Test Certificate FI",
            contentFi = "Certificate content Fi",
            publishState = PublishState.PUBLISHED,
            fileName = "test_certificate.pdf",
            fileUrl = "https://amazon_url.com/test_certificate.pdf",
            fileUploadDate = "2023-06-13T09:40:57.559+00:00"
        )

        val testCertificateStr = objectMapper.writeValueAsString(testCertificate)

        val postResult = mockMvc.perform(postCertificate(testCertificateStr)).andExpect(status().isOk)
            .andReturn().response.contentAsString

        val certificateIn = objectMapper.readValue(postResult, TestCertificateOut::class.java)

        assertEquals(testCertificate.nameFi, certificateIn.nameFi)
        assertEquals(testCertificate.exam, certificateIn.exam)
        assertEquals(testCertificate.contentFi, certificateIn.contentFi)
        assertEquals(testCertificate.publishState, certificateIn.publishState)
        assertEquals(testCertificate.fileName, certificateIn.fileName)
        assertEquals(testCertificate.fileUrl, certificateIn.fileUrl)
        assertNotNull(testCertificate.fileUploadDate)
        assertNotNull(certificateIn.id)
        assertNotNull(certificateIn.createdAt)
        assertNotNull(certificateIn.updatedAt)

        val getResult = mockMvc.perform(getCertificate(Exam.SUKO, certificateIn.id)).andExpect(status().isOk)
            .andReturn().response.contentAsString

        val certificateOut = objectMapper.readValue(getResult, TestCertificateOut::class.java)

        assertEquals(certificateIn.id, certificateOut.id)
        assertEquals(certificateIn.nameFi, certificateOut.nameFi)
        assertEquals(certificateIn.contentFi, certificateOut.contentFi)
        assertEquals(certificateIn.publishState, certificateOut.publishState)
        assertEquals(certificateIn.fileName, certificateOut.fileName)
        assertEquals(certificateIn.fileUrl, certificateOut.fileUrl)
        assertNotNull(certificateOut.fileUploadDate)
        assertNotNull(certificateOut.createdAt)
        assertNotNull(certificateOut.updatedAt)

        val editedCertificate = """
        {
            "id": "${certificateIn.id}",
            "nameFi": "Suko Test Certificate FI updated",
            "exam": "SUKO",
            "contentFi": "Suko Certificate content Fi updated",
            "publishState": "PUBLISHED",
            "fileName": "updated_certificate.pdf",
            "fileUrl": "https://amazon_url.com/updated_certificate.pdf",
            "fileUploadDate": "${testCertificate.fileUploadDate}"
        }
        """.trimMargin()

        val updateResult =
            mockMvc.perform(updateCertificate(certificateIn.id, editedCertificate)).andExpect(status().isOk)
                .andReturn().response.contentAsString

        val getUpdatedResult = mockMvc.perform(getCertificate(Exam.SUKO, updateResult.toInt())).andExpect(status().isOk)
            .andReturn().response.contentAsString

        val updatedCertificate = objectMapper.readValue(getUpdatedResult, TestCertificateOut::class.java)

        assertEquals("Suko Test Certificate FI updated", updatedCertificate.nameFi)
        assertEquals("Suko Certificate content Fi updated", updatedCertificate.contentFi)
        assertEquals(PublishState.PUBLISHED, updatedCertificate.publishState)
        assertEquals("updated_certificate.pdf", updatedCertificate.fileName)
        assertEquals("https://amazon_url.com/updated_certificate.pdf", updatedCertificate.fileUrl)
        assertNotNull(updatedCertificate.fileUploadDate)
        assertEquals(certificateIn.id, updatedCertificate.id)
    }

    @Test
    @WithYllapitajaRole
    fun failCertificateUpdate() {
        val nonExistentId = -1


        val editedCertificate = """
            {
                "id": "$nonExistentId",
                "exam": "SUKO",
                "nameFi": "New test name",
                "contentFi": "content",
                "contentSv": "content",
                "publishState": "PUBLISHED",
                "fileName": "updated_certificate.pdf",
                "fileUrl": "https://amazon_url.com/updated_certificate.pdf",
                "fileUploadDate": "2023-06-13T09:40:57.559+00:00"
            }
        """.trimMargin()

        val failUpdate =
            mockMvc.perform(updateCertificate(nonExistentId, editedCertificate)).andReturn().response.contentAsString

        assertEquals(failUpdate, "404 NOT_FOUND \"Certificate not found $nonExistentId\"")
    }

    @Test
    @WithYllapitajaRole
    fun invalidExam() {
        val body = """
            {
                "nameFi": "Test Certificate",
                "contentFi": "Certificate content",
                "publishState": "PUBLISHED",
                "exam": "WRONG",
                "fileName": "test_certificate.pdf",
                "fileUrl": "https://amazon_url.com/test_certificate.pdf",
                "fileUploadDate": "2023-06-13T09:40:57.559+00:00"
            }
        """

        mockMvc.perform(postCertificate(body)).andExpect(status().isBadRequest()).andReturn()
    }

    @Test
    @WithYllapitajaRole
    fun invalidState() {
        val body = """
        {
            "nameFi": "Test Certificate",
            "contentFi": "Certificate content",
            "publishState": "",
            "exam": "SUKO",
            "fileName": "test_certificate.pdf",
            "fileUrl": "https://amazon_url.com/test_certificate.pdf",
            "fileUploadDate": "2023-06-13T09:40:57.559+00:00"
        }
        """

        val postResult = mockMvc.perform(postCertificate(body)).andExpect(status().isBadRequest()).andReturn()
        val responseContent = postResult.response.contentAsString

        assertThat(responseContent).contains("Invalid JSON payload: JSON parse error")
    }

    @Test
    @WithYllapitajaRole
    fun certificateNotFound() {
        val getResult = mockMvc.perform(getCertificate(Exam.SUKO, 999)).andExpect(status().isNotFound()).andReturn()
        val responseContent = getResult.response.contentAsString

        assertEquals(responseContent, "404 NOT_FOUND \"Certificate not found 999\"")
    }
}
