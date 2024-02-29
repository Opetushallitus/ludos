package fi.oph.ludos.certificate

import arrow.core.Either
import fi.oph.ludos.Exam
import fi.oph.ludos.auth.OppijanumerorekisteriClient
import fi.oph.ludos.aws.Bucket
import fi.oph.ludos.aws.S3Helper
import org.slf4j.Logger
import org.slf4j.LoggerFactory
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Service
import org.springframework.web.multipart.MultipartFile
import org.springframework.web.server.ResponseStatusException
import software.amazon.awssdk.core.exception.SdkException
import java.io.InputStream

@Service
class CertificateService(
    val repository: CertificateRepository,
    val s3Helper: S3Helper,
    val oppijanumerorekisteriClient: OppijanumerorekisteriClient
) {
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

    fun getCertificateById(id: Int, exam: Exam, version: Int?): CertificateOut? =
        repository.getCertificateById(id, exam, version)

    fun getAllVersionsOfCertificate(exam: Exam, id: Int): List<CertificateOut> =
        addUpdaterNames(repository.getAllVersionsOfCertificate(id, exam))

    fun addUpdaterNames(assignments: List<CertificateOut>): List<CertificateOut> {
        val uniqueOids = assignments.map { it.updaterOid }.toSet()
        val oidToName = uniqueOids.associateWith { oppijanumerorekisteriClient.getUserDetailsByOid(it) }
        return assignments.map {
            val updaterName = oidToName.getOrDefault(it.updaterOid, null)?.formatName()
            when (it) {
                is SukoCertificateDtoOut -> it.copy(updaterName = updaterName)
                is LdCertificateDtoOut -> it.copy(updaterName = updaterName)
                is PuhviCertificateDtoOut -> it.copy(updaterName = updaterName)
            }
        }
    }


    fun createNewVersionOfCertificate(
        id: Int,
        certificate: Certificate,
        attachmentFi: MultipartFile?,
        attachmentSv: MultipartFile?
    ) = when (certificate) {
        is SukoCertificateDtoIn -> repository.createNewVersionOfSukoCertificate(
            id,
            certificate,
            Either.Right(attachmentFi)
        )

        is LdCertificateDtoIn -> repository.createNewVersionOfLdCertificate(
            id,
            certificate,
            Either.Right(Pair(attachmentFi, attachmentSv))
        )

        is PuhviCertificateDtoIn -> repository.createNewVersionOfPuhviCertificate(
            id,
            certificate,
            Either.Right(Pair(attachmentFi, attachmentSv))
        )

        else -> throw ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid certificate type")
    }

    fun restoreOldVersionOfCertificate(
        exam: Exam,
        id: Int,
        version: Int
    ): Int? {
        val certificateToRestore = repository.getCertificateById(id, exam, version) ?: return null
        return when (certificateToRestore) {
            is SukoCertificateDtoOut -> repository.createNewVersionOfSukoCertificate(
                id, SukoCertificateDtoIn(certificateToRestore), Either.Left(version)
            )

            is LdCertificateDtoOut -> repository.createNewVersionOfLdCertificate(
                id, LdCertificateDtoIn(certificateToRestore), Either.Left(version)
            )

            is PuhviCertificateDtoOut -> repository.createNewVersionOfPuhviCertificate(
                id, PuhviCertificateDtoIn(certificateToRestore), Either.Left(version)
            )
        }
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