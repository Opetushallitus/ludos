package fi.oph.ludos.certificate

import fi.oph.ludos.Exam
import fi.oph.ludos.s3.Bucket
import fi.oph.ludos.s3.S3Helper
import org.slf4j.Logger
import org.slf4j.LoggerFactory
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Service
import org.springframework.web.multipart.MultipartFile
import org.springframework.web.server.ResponseStatusException
import software.amazon.awssdk.core.exception.SdkException
import java.io.InputStream

@Service
class CertificateService(val repository: CertificateRepository, val s3Helper: S3Helper) {
    val logger: Logger = LoggerFactory.getLogger(javaClass)

    fun getCertificates(exam: Exam): List<CertificateDtoOut> = repository.getCertificates(exam)

    fun createCertificate(certificate: CertificateDtoIn, attachment: MultipartFile): CertificateDtoOut =
        repository.createCertificate(certificate, attachment)

    fun getCertificateById(id: Int, exam: Exam): CertificateDtoOut? = repository.getCertificateById(id, exam)

    fun updateCertificate(id: Int, certificate: CertificateDtoIn, attachment: MultipartFile?) =
        repository.updateCertificate(id, certificate, attachment)

    fun getAttachment(key: String): Pair<CertificateAttachmentDtoOut, InputStream> {
        val fileUpload = repository.getCertificateAttachmentByFileKey(key) ?: throw ResponseStatusException(
            HttpStatus.NOT_FOUND, "Certificate attachment '${key}' not found in db"
        )

        val responseInputStream = try {
            s3Helper.getObject(Bucket.CERTIFICATE, key)
        } catch (ex: SdkException) {
            val errorMsg = "Failed to get attachment '${key}' from S3"
            logger.error(errorMsg, ex)
            throw ResponseStatusException(HttpStatus.BAD_GATEWAY, errorMsg)
        } ?: throw ResponseStatusException(HttpStatus.NOT_FOUND, "Certificate attachment '${key}' not found in S3")

        return Pair(fileUpload, responseInputStream)
    }
}