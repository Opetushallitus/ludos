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

    fun uploadFile(file: MultipartFile, certificateId: Int?): FileUpload? {
        return try {
            val key = "todistuspohja_${UUID.randomUUID()}"
            s3Service.putObject(file, key)

            val fileToCreate = FileUpload(file.originalFilename!!, key, ZonedDateTime.now(ZoneOffset.UTC))
            val result = db.createAttachment(fileToCreate)
//             todo: delete after update
//            if (certificateId != null) {
//                val oldFileKey = db.getCertificateAttachmentByCertificateId(certificateId)
//                if (oldFileKey != null) {
//                    s3Service.deleteObject(oldFileKey)
//                }
//            }

            result
        } catch (e: Exception) {
            null
        }
    }

    fun getFile(key: String): ResponseInputStream<GetObjectResponse>? = s3Service.getObject(key)
}