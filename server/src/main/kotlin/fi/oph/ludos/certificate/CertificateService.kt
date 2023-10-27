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

    fun getCertificates(exam: Exam, filters: CertificateFilters): List<CertificateOut> =
        repository.getCertificates(exam, filters)

    fun createSukoCertificate(certificate: SukoCertificateDtoIn, attachment: MultipartFile): CertificateOut =
        repository.createSukoCertificate(attachment, certificate)

    fun createLdCertificate(
        certificate: LdCertificateDtoIn,
        attachmentFi: MultipartFile,
        attachmentSv: MultipartFile
    ): CertificateOut =
        repository.createLdCertificate(attachmentFi, attachmentSv, certificate)

    fun createPuhviCertificate(
        certificate: PuhviCertificateDtoIn,
        attachmentFi: MultipartFile,
        attachmentSv: MultipartFile
    ): CertificateOut =
        repository.createPuhviCertificate(attachmentFi, attachmentSv, certificate)

    fun getCertificateById(id: Int, exam: Exam): CertificateOut? = repository.getCertificateById(id, exam)

    fun updateSukoCertificate(
        id: Int,
        certificateDtoIn: SukoCertificateDtoIn,
        attachmentFi: MultipartFile?
    ) = repository.updateSukoCertificate(id, certificateDtoIn, attachmentFi)

    fun updateLdCertificate(
        id: Int,
        certificateDtoIn: LdCertificateDtoIn,
        attachmentFi: MultipartFile?,
        attachmentSv: MultipartFile?
    ) = repository.updateLdCertificate(id, certificateDtoIn, attachmentFi, attachmentSv)

    fun updatePuhviCertificate(
        id: Int,
        certificateDtoIn: PuhviCertificateDtoIn,
        attachmentFi: MultipartFile?,
        attachmentSv: MultipartFile?
    ) = repository.updatePuhviCertificate(id, certificateDtoIn, attachmentFi, attachmentSv)


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