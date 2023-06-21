package fi.oph.ludos.certificate

import fi.oph.ludos.Exam
import fi.oph.ludos.s3.S3Service
import fi.oph.ludos.validateExamValue
import org.springframework.stereotype.Service
import org.springframework.web.multipart.MultipartFile
import software.amazon.awssdk.core.ResponseInputStream
import software.amazon.awssdk.services.s3.model.GetObjectResponse
import java.text.SimpleDateFormat
import java.util.*

@Service
class CertificateService(val db: CertificateRepository, val s3Service: S3Service) {
    fun getCertificates(exam: Exam): List<CertificateDtoOut> {
        validateExamValue(exam)
        return db.getCertificates(exam)
    }

    fun createCertificate(certificate: CertificateDtoIn): CertificateDtoOut {
        validateExamValue(certificate.exam)
        return db.saveCertificate(certificate)
    }

    fun getCertificateById(id: Int, exam: Exam): CertificateDtoOut? {
        validateExamValue(exam)
        return db.getCertificateById(id, exam)
    }

    fun updateCertificate(id: Int, certificate: CertificateDtoIn): Int? {
        validateExamValue(certificate.exam)
        return db.updateCertificate(id, certificate)
    }

    fun uploadFile(file: MultipartFile): FileUpload? = try {
        val key = "todistuspohja_${UUID.randomUUID()}"
        s3Service.putObject(file, key)

        FileUpload(file.originalFilename!!, key, getCurrentDate())
    } catch (e: Exception) {
        null
    }

    private fun getCurrentDate(): String {
        val dateFormat = SimpleDateFormat("yyyy-MM-dd")
        val currentDate = Date()
        return dateFormat.format(currentDate)
    }

    fun getFile(key: String): ResponseInputStream<GetObjectResponse>? = s3Service.getObject(key)
}