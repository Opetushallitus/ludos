package fi.oph.ludos.certificate

import fi.oph.ludos.Exam
import org.springframework.data.crossstore.ChangeSetPersister
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Service
import org.springframework.web.server.ResponseStatusException

@Service
class CertificateService(val db: CertificateRepository) {
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
}