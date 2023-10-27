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

    fun getCertificates(exam: Exam): List<CertificateOut> = repository.getCertificates(exam)

    fun createCertificate(certificate: Certificate, attachment: MultipartFile): CertificateOut = when (certificate) {
        is SukoCertificateDtoIn -> repository.createSukoCertificate(attachment, certificate)
        is PuhviCertificateDtoIn -> repository.createPuhviCertificate(attachment, certificate)
        is LdCertificateDtoIn -> repository.createLdCertificate(attachment, certificate)
        else -> throw ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid certificate type")
    }

    fun getCertificateById(id: Int, exam: Exam): CertificateOut? = repository.getCertificateById(id, exam)

    fun updateCertificate(id: Int, certificateDtoIn: Certificate, attachment: MultipartFile?): Int? =
        when (certificateDtoIn) {
            is SukoCertificateDtoIn -> repository.updateSukoCertificate(id, certificateDtoIn, attachment)
            is LdCertificateDtoIn -> repository.updateLdCertificate(id, certificateDtoIn, attachment)
            is PuhviCertificateDtoIn -> repository.updatePuhviCertificate(id, certificateDtoIn, attachment)
            else -> throw ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid certificate type")
        }

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