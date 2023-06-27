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
import java.time.ZoneOffset
import java.time.ZonedDateTime
import javax.transaction.Transactional

fun postCertificate(body: String) =
    MockMvcRequestBuilders.post("${Constants.API_PREFIX}/certificate").contentType(MediaType.APPLICATION_JSON)
        .content(body)

fun getCertificateById(exam: Exam, id: Int) =
    MockMvcRequestBuilders.get("${Constants.API_PREFIX}/certificate/$exam/$id").contentType(MediaType.APPLICATION_JSON)

fun updateCertificate(id: Int, body: String) =
    MockMvcRequestBuilders.put("${Constants.API_PREFIX}/certificate/$id").contentType(MediaType.APPLICATION_JSON)
        .content(body)

@TestPropertySource(locations = ["classpath:application.properties"])
@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class CertificateControllerTest(@Autowired val mockMvc: MockMvc) {
    val objectMapper = jacksonObjectMapper()

    data class TestCertificateIn(
        val exam: Exam,
        val name: String,
        val description: String,
        val publishState: PublishState,
        val fileName: String,
        val fileKey: String,
        val fileUploadDate: String,
    )

    data class TestCertificateOut(
        val id: Int,
        val exam: Exam,
        val name: String,
        val description: String,
        val publishState: PublishState,
        val fileName: String,
        val fileKey: String,
        val fileUploadDate: String,
        val createdAt: Timestamp,
        val updatedAt: Timestamp
    )

    @Test
    @WithYllapitajaRole
    fun createCertificateTest() {
        val testCertificate = TestCertificateIn(
            exam = Exam.SUKO,
            name = "Test Certificate FI",
            description = "Certificate content Fi",
            publishState = PublishState.PUBLISHED,
            fileName = "test_certificate.pdf",
            fileKey = "https://amazon_url.com/test_certificate.pdf",
            fileUploadDate = ZonedDateTime.now(ZoneOffset.UTC).toString()
        )

        val testCertificateStr = objectMapper.writeValueAsString(testCertificate)

        val postResult = mockMvc.perform(postCertificate(testCertificateStr)).andExpect(status().isOk)
            .andReturn().response.contentAsString

        val certificateIn = objectMapper.readValue(postResult, TestCertificateOut::class.java)

        assertEquals(testCertificate.name, certificateIn.name)
        assertEquals(testCertificate.exam, certificateIn.exam)
        assertEquals(testCertificate.description, certificateIn.description)
        assertEquals(testCertificate.publishState, certificateIn.publishState)
        assertEquals(testCertificate.fileName, certificateIn.fileName)
        assertEquals(testCertificate.fileKey, certificateIn.fileKey)
        assertEquals(testCertificate.fileUploadDate.substring(0, 10), certificateIn.fileUploadDate.substring(0, 10))
        assertNotNull(certificateIn.id)
        assertNotNull(certificateIn.createdAt)
        assertNotNull(certificateIn.updatedAt)

        val getResult = mockMvc.perform(getCertificateById(Exam.SUKO, certificateIn.id)).andExpect(status().isOk)
            .andReturn().response.contentAsString

        val certificateOut = objectMapper.readValue(getResult, TestCertificateOut::class.java)

        assertEquals(certificateIn.id, certificateOut.id)
        assertEquals(certificateIn.name, certificateOut.name)
        assertEquals(certificateIn.description, certificateOut.description)
        assertEquals(certificateIn.publishState, certificateOut.publishState)
        assertEquals(certificateIn.fileName, certificateOut.fileName)
        assertEquals(certificateIn.fileKey, certificateOut.fileKey)
        assertEquals(certificateIn.fileUploadDate.substring(0, 10), certificateOut.fileUploadDate.substring(0, 10))
        assertNotNull(certificateOut.createdAt)
        assertNotNull(certificateOut.updatedAt)

        val editedCertificate = """
        {
            "id": "${certificateIn.id}",
            "name": "Suko Test Certificate FI updated",
            "exam": "SUKO",
            "description": "Suko Certificate content Fi updated",
            "publishState": "PUBLISHED",
            "fileName": "updated_certificate.pdf",
            "fileKey": "https://amazon_url.com/updated_certificate.pdf",
            "fileUploadDate": "${testCertificate.fileUploadDate}"
        }
        """.trimMargin()

        mockMvc.perform(updateCertificate(certificateIn.id, editedCertificate)).andExpect(status().isOk)
            .andReturn().response.contentAsString

        val getUpdatedResult = mockMvc.perform(getCertificateById(Exam.SUKO, certificateIn.id)).andExpect(status().isOk)
            .andReturn().response.contentAsString

        val updatedCertificate = objectMapper.readValue(getUpdatedResult, TestCertificateOut::class.java)

        assertEquals("Suko Test Certificate FI updated", updatedCertificate.name)
        assertEquals("Suko Certificate content Fi updated", updatedCertificate.description)
        assertEquals(PublishState.PUBLISHED, updatedCertificate.publishState)
        assertEquals("updated_certificate.pdf", updatedCertificate.fileName)
        assertEquals("https://amazon_url.com/updated_certificate.pdf", updatedCertificate.fileKey)
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
                "name": "New test name",
                "description": "content",
                "publishState": "PUBLISHED",
                "fileName": "updated_certificate.pdf",
                "fileKey": "https://amazon_url.com/updated_certificate.pdf",
                "fileUploadDate": "${ZonedDateTime.now(ZoneOffset.UTC)}"
            }
        """.trimMargin()

        val failUpdate =
            mockMvc.perform(updateCertificate(nonExistentId, editedCertificate)).andReturn().response.contentAsString

        assertEquals("Certificate not found $nonExistentId", failUpdate)
    }

    @Test
    @WithYllapitajaRole
    fun invalidExam() {
        val body = """
            {
                "name": "Test Certificate",
                "description": "Certificate content",
                "publishState": "PUBLISHED",
                "exam": "WRONG",
                "fileName": "test_certificate.pdf",
                "fileKey": "https://amazon_url.com/test_certificate.pdf",
                "fileUploadDate": "2023-06-13"
            }
        """

        mockMvc.perform(postCertificate(body)).andExpect(status().isBadRequest()).andReturn()
    }

    @Test
    @WithYllapitajaRole
    fun invalidState() {
        val body = """
        {
            "name": "Test Certificate",
            "description": "Certificate content",
            "publishState": "",
            "exam": "SUKO",
            "fileName": "test_certificate.pdf",
            "fileKey": "https://amazon_url.com/test_certificate.pdf",
            "fileUploadDate": "2023-06-13"
        }
        """

        val postResult = mockMvc.perform(postCertificate(body)).andExpect(status().isBadRequest()).andReturn()
        val responseContent = postResult.response.contentAsString

        assertThat(responseContent).contains("Invalid JSON payload: JSON parse error")
    }

    @Test
    @WithOpettajaRole
    fun certificateNotFound() {
        val getResult = mockMvc.perform(getCertificateById(Exam.SUKO, 999)).andExpect(status().isNotFound()).andReturn()
        val responseContent = getResult.response.contentAsString

        assertEquals(responseContent, "Certificate not found 999")
    }
}
