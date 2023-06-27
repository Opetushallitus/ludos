package fi.oph.ludos.certificate

import fi.oph.ludos.Exam
import fi.oph.ludos.s3.S3Service
import org.springframework.stereotype.Service
import org.springframework.web.multipart.MultipartFile
import software.amazon.awssdk.core.ResponseInputStream
import software.amazon.awssdk.services.s3.model.GetObjectResponse
import java.time.ZoneOffset
import java.time.ZonedDateTime
import java.util.*

@Service
class CertificateService(val db: CertificateRepository, val s3Service: S3Service) {
    fun getCertificates(exam: Exam): List<CertificateDtoOut> = db.getCertificates(exam)

    fun createCertificate(certificate: CertificateDtoIn): CertificateDtoOut = db.createCertificate(certificate)

    fun getCertificateById(id: Int, exam: Exam): CertificateDtoOut? = db.getCertificateById(id, exam)

    fun updateCertificate(id: Int, certificate: CertificateDtoIn): Boolean = db.updateCertificate(id, certificate)

    fun uploadFile(file: MultipartFile): FileUpload? = try {
        val key = "todistuspohja_${UUID.randomUUID()}"
        s3Service.putObject(file, key)

        // todo: when form is 1 step upload remove timestamp
        FileUpload(file.originalFilename!!, key, ZonedDateTime.now(ZoneOffset.UTC))
    } catch (e: Exception) {
        null
    }

    fun getFile(key: String): ResponseInputStream<GetObjectResponse>? = s3Service.getObject(key)
}