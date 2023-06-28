package fi.oph.ludos.certificate

import fi.oph.ludos.Exam
import fi.oph.ludos.s3.S3Service
import org.slf4j.Logger
import org.slf4j.LoggerFactory
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Service
import org.springframework.web.multipart.MultipartFile
import org.springframework.web.server.ResponseStatusException
import software.amazon.awssdk.core.ResponseInputStream
import software.amazon.awssdk.core.exception.SdkException
import software.amazon.awssdk.services.s3.model.GetObjectResponse
import java.time.ZoneOffset
import java.time.ZonedDateTime
import java.util.*

@Service
class CertificateService(val db: CertificateRepository, val s3Service: S3Service) {
    val logger: Logger = LoggerFactory.getLogger(javaClass)

    fun getCertificates(exam: Exam): List<CertificateDtoOut> = db.getCertificates(exam)

    fun createCertificate(certificate: CertificateDtoIn): CertificateDtoOut = db.createCertificate(certificate)

    fun getCertificateById(id: Int, exam: Exam): CertificateDtoOut? = db.getCertificateById(id, exam)

    fun updateCertificate(id: Int, certificate: CertificateDtoIn) = db.updateCertificate(id, certificate)

    fun uploadFile(file: MultipartFile, oldFileKey: String?): FileUpload? {
        val key = "todistuspohja_${UUID.randomUUID()}"

        try {
            s3Service.putObject(file, key)
        } catch (ex: SdkException) {
            val errorMsg = "Failed to upload file '${file.originalFilename}' to S3"
            logger.error(errorMsg, ex)
            throw ResponseStatusException(HttpStatus.BAD_GATEWAY, errorMsg)
        }

        val fileToCreate = FileUpload(file.originalFilename!!, key, ZonedDateTime.now(ZoneOffset.UTC))

        return db.createAttachment(fileToCreate)
    }

    fun getFile(key: String): Pair<FileUpload, ResponseInputStream<GetObjectResponse>> {
        val fileUpload = db.getCertificateAttachmentByFileKey(key) ?: throw ResponseStatusException(
            HttpStatus.NOT_FOUND, "Certificate attachment '${key}' not found in db"
        )

        val responseInputStream = s3Service.getObject(key) ?: throw ResponseStatusException(
            HttpStatus.INTERNAL_SERVER_ERROR, "Certificate attachment '${key}' not found in S3"
        )

        return Pair(fileUpload, responseInputStream)
    }
}