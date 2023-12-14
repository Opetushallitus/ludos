package fi.oph.ludos.certificate

import com.fasterxml.jackson.module.kotlin.jacksonObjectMapper
import com.fasterxml.jackson.module.kotlin.readValue
import fi.oph.ludos.Constants
import fi.oph.ludos.Exam
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc
import org.springframework.http.HttpMethod
import org.springframework.http.MediaType
import org.springframework.mock.web.MockMultipartFile
import org.springframework.mock.web.MockPart
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders
import org.springframework.test.web.servlet.request.RequestPostProcessor
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.status
import java.nio.file.Files
import java.nio.file.Paths
import kotlin.reflect.KClass

@AutoConfigureMockMvc
abstract class CertificateRequests {
    @Autowired
    lateinit var mockMvc: MockMvc
    val mapper = jacksonObjectMapper()

    fun examByTestCertificateOutClass(testCertificateOutClass: KClass<out CertificateOut>): Exam =
        when (testCertificateOutClass) {
            SukoCertificateDtoOut::class -> Exam.SUKO
            LdCertificateDtoOut::class -> Exam.LD
            PuhviCertificateDtoOut::class -> Exam.PUHVI
            else -> throw RuntimeException("unsupported CertificateOutClass '$testCertificateOutClass'")
        }

    fun readAttachmentFixtureFile(
        attachmentFixtureFileName: String,
        partName: String = "attachmentFi"
    ): MockMultipartFile {
        val file = Paths.get("src/main/resources/fixtures/$attachmentFixtureFileName")
        val fileContents = Files.readAllBytes(file)
        return MockMultipartFile(partName, attachmentFixtureFileName, MediaType.APPLICATION_PDF_VALUE, fileContents)
    }

    fun postCertificate(
        certificate: String,
        attachmentName: String?,
        attachmentNameSv: String? = null
    ): MockHttpServletRequestBuilder {
        val certificatePart = MockPart("certificate", certificate.toByteArray())
        val attachmentPartFi = attachmentName?.let { readAttachmentFixtureFile(it) }

        val attachmentPartSv = if (attachmentNameSv != null) {
            readAttachmentFixtureFile(attachmentNameSv, "attachmentSv")
        } else {
            attachmentName?.let { readAttachmentFixtureFile(it) }
        }

        certificatePart.headers.contentType = MediaType.APPLICATION_JSON

        val reqBuilder =
            MockMvcRequestBuilders.multipart(HttpMethod.POST, "${Constants.API_PREFIX}/certificate")
                .part(certificatePart)
        attachmentPartFi?.let { reqBuilder.file(it) }
        attachmentPartSv?.let { reqBuilder.file(it) }
        return reqBuilder
    }

    private inline fun <reified T : CertificateOut> getAllCertificatesContent(res: String): List<T> {
        val content = mapper.readValue<TestCertificatesOut<T>>(res)

        return content.content
    }

    fun getCertificateByIdReq(exam: Exam, id: Int, version: Int? = null): MockHttpServletRequestBuilder {
        val url = "${Constants.API_PREFIX}/certificate/$exam/$id" + (if (version != null) "/$version" else "")
        return MockMvcRequestBuilders.get(url)
    }

    inline fun <reified T : CertificateOut> getCertificateById(
        id: Int,
        version: Int? = null,
        user: RequestPostProcessor? = null
    ): T {
        val exam = examByTestCertificateOutClass(T::class)
        val builder = getCertificateByIdReq(exam, id, version)

        if (user != null) {
            builder.with(user)
        }

        val getUpdatedByIdStr = mockMvc.perform(builder).andExpect(
            status().isOk()
        ).andReturn().response.contentAsString
        return mapper.readValue(getUpdatedByIdStr)
    }

    fun getCertificateById(
        exam: Exam,
        id: Int,
        version: Int? = null,
        user: RequestPostProcessor? = null
    ): CertificateOut = when (exam) {
        Exam.SUKO -> getCertificateById<SukoCertificateDtoOut>(id, version, user)
        Exam.LD -> getCertificateById<LdCertificateDtoOut>(id, version, user)
        Exam.PUHVI -> getCertificateById<PuhviCertificateDtoOut>(id, version, user)
    }

    fun putCertificate(
        id: Int,
        certificate: String,
        attachmentPart: MockMultipartFile? = null,
        attachmentPartSv: MockMultipartFile? = null
    ): MockHttpServletRequestBuilder {
        val certificatePart = MockPart("certificate", certificate.toByteArray())
        certificatePart.headers.contentType = MediaType.APPLICATION_JSON

        val reqBuilder = MockMvcRequestBuilders.multipart(HttpMethod.PUT, "${Constants.API_PREFIX}/certificate/$id")
            .part(certificatePart)
        attachmentPart?.let { reqBuilder.file(it) }
        attachmentPartSv?.let { reqBuilder.file(it) }

        return reqBuilder
    }

    fun restoreCertificateReq(
        exam: Exam,
        id: Int,
        version: Int
    ): MockHttpServletRequestBuilder {
        val url = "${Constants.API_PREFIX}/certificate/$exam/$id/$version/restore"
        return MockMvcRequestBuilders.post(url)
    }

    fun getAttachment(fileKey: String) =
        MockMvcRequestBuilders.get("${Constants.API_PREFIX}/certificate/attachment/$fileKey")

    private fun getAllCertificatesReq(
        exam: Exam,
        filters: CertificateFilters? = null,
        user: RequestPostProcessor? = null
    ): MockHttpServletRequestBuilder {
        val builder = MockMvcRequestBuilders.get("${Constants.API_PREFIX}/certificate/$exam")

        if (filters != null) {
            filters.jarjesta?.let { builder.queryParam("jarjesta", it) }
        }

        if (user != null) {
            builder.with(user)
        }

        return builder.contentType(MediaType.APPLICATION_JSON)
    }

    fun getAllCertificates(
        exam: Exam,
        filters: CertificateFilters? = null,
        user: RequestPostProcessor? = null
    ): List<CertificateOut> {
        val res = mockMvc.perform(getAllCertificatesReq(exam, filters, user))
            .andExpect(status().isOk())
            .andReturn().response.contentAsString

        return getAllCertificatesContent<CertificateOut>(res)
    }

    fun getAllCertificateVersionsReq(exam: Exam, id: Int) =
        MockMvcRequestBuilders.get("${Constants.API_PREFIX}/certificate/$exam/$id/versions")
            .contentType(MediaType.APPLICATION_JSON)

    inline fun <reified T : CertificateOut> getAllCertificateVersions(id: Int): List<T> {
        val exam = examByTestCertificateOutClass(T::class)

        val responseContent =
            mockMvc.perform(getAllCertificateVersionsReq(exam, id)).andExpect(status().isOk())
                .andReturn().response.contentAsString
        return mapper.readValue<List<T>>(responseContent)
    }

    fun getAllCertificateVersions(
        exam: Exam,
        id: Int
    ): List<CertificateOut> =
        when (exam) {
            Exam.SUKO -> getAllCertificateVersions<SukoCertificateDtoOut>(id)
            Exam.LD -> getAllCertificateVersions<LdCertificateDtoOut>(id)
            Exam.PUHVI -> getAllCertificateVersions<PuhviCertificateDtoOut>(id)
        }

}