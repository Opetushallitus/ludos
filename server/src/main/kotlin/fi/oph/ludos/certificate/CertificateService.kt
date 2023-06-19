package fi.oph.ludos.certificate

import fi.oph.ludos.Exam
import fi.oph.ludos.s3.S3Service
import org.springframework.data.crossstore.ChangeSetPersister
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Service
import org.springframework.web.multipart.MultipartFile
import org.springframework.web.server.ResponseStatusException
import software.amazon.awssdk.core.ResponseInputStream
import software.amazon.awssdk.services.s3.model.GetObjectResponse
import java.text.SimpleDateFormat
import java.util.*

@Service
class CertificateService(val db: CertificateRepository, val s3Service: S3Service) {
    fun getCertificates(exam: Exam): List<CertificateDtoOut> {
        // Check that exam value is valid
        val validExams = setOf(Exam.SUKO, Exam.PUHVI, Exam.LD)
        if (exam !in validExams) {
            throw IllegalArgumentException("Invalid exam value: $exam")
        }

        return db.getCertificates(exam)
    }

    fun createCertificate(certificate: CertificateDtoIn) = db.saveCertificate(certificate)

    fun getCertificateById(id: Int, exam: Exam): CertificateDtoOut = try {
        db.getCertificateById(id, exam)
    } catch (e: ChangeSetPersister.NotFoundException) {
        throw ResponseStatusException(HttpStatus.NOT_FOUND, "Certificate not found $id")
    }

    fun updateCertificate(id: Int, certificate: CertificateDtoIn): Int = try {
        db.updateCertificate(id, certificate)
    } catch (e: ChangeSetPersister.NotFoundException) {
        throw ResponseStatusException(HttpStatus.NOT_FOUND, "Certificate not found $id")
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