package fi.oph.ludos.certificate

import fi.oph.ludos.Exam
import fi.oph.ludos.PublishState
import fi.oph.ludos.auth.Kayttajatiedot
import fi.oph.ludos.auth.Role
import fi.oph.ludos.repository.getZonedDateTime
import fi.oph.ludos.s3.Bucket
import fi.oph.ludos.s3.S3Helper
import org.slf4j.Logger
import org.slf4j.LoggerFactory
import org.springframework.http.HttpStatus
import org.springframework.jdbc.core.JdbcTemplate
import org.springframework.stereotype.Component
import org.springframework.transaction.support.TransactionTemplate
import org.springframework.web.multipart.MultipartFile
import org.springframework.web.server.ResponseStatusException
import software.amazon.awssdk.core.exception.SdkException
import java.sql.ResultSet
import java.util.*

@Component
class CertificateRepository(
    private val jdbcTemplate: JdbcTemplate,
    private val transactionTemplate: TransactionTemplate,
    private val s3Helper: S3Helper
) {
    val logger: Logger = LoggerFactory.getLogger(javaClass)

    fun tableNameFromExam(exam: Exam): String = when (exam) {
        Exam.SUKO -> "suko_certificate"
        Exam.PUHVI -> "puhvi_certificate"
        Exam.LD -> "ld_certificate"
    }

    fun createCertificate(certificateDtoIn: CertificateDtoIn, attachment: MultipartFile): CertificateDtoOut {
        val createdCertificate = transactionTemplate.execute { _ ->
            val certificateAttachment = createAttachment(attachment)

            val certificateInsertSql = """
                INSERT INTO ${tableNameFromExam(certificateDtoIn.exam)} (
                    certificate_name,
                    certificate_description,
                    certificate_publish_state,
                    attachment_file_key,
                    certificate_author_oid
                )
                VALUES (?, ?, ?::publish_state, ?, ?)
                RETURNING certificate_id, certificate_created_at, certificate_author_oid, certificate_updated_at
            """.trimIndent()

            jdbcTemplate.query(
                certificateInsertSql,
                { rs: ResultSet, _: Int ->
                    CertificateDtoOut(
                        rs.getInt("certificate_id"),
                        certificateDtoIn.exam,
                        certificateDtoIn.name,
                        certificateDtoIn.description,
                        certificateDtoIn.publishState,
                        certificateAttachment,
                        rs.getString("certificate_author_oid"),
                        rs.getTimestamp("certificate_created_at"),
                        rs.getTimestamp("certificate_updated_at")
                    )
                },
                certificateDtoIn.name,
                certificateDtoIn.description,
                certificateDtoIn.publishState.toString(),
                certificateAttachment.fileKey,
                Kayttajatiedot.fromSecurityContext().oidHenkilo,
            )[0]
        }!!

        return createdCertificate
    }

    fun createAttachment(file: MultipartFile): CertificateAttachmentDtoOut {
        val fileKey = "todistuspohja_${UUID.randomUUID()}"

        try {
            s3Helper.putObject(Bucket.CERTIFICATE, fileKey, file)
        } catch (ex: SdkException) {
            val errorMsg = "Failed to upload file '${file.originalFilename}' to S3"
            logger.error(errorMsg, ex)
            throw ResponseStatusException(HttpStatus.BAD_GATEWAY, errorMsg)
        }

        val fileName = file.originalFilename!!

        val result = jdbcTemplate.query(
            """
                INSERT INTO certificate_attachment (attachment_file_key, attachment_file_name, attachment_upload_date)
                VALUES (?, ?, clock_timestamp())
                RETURNING attachment_upload_date
            """.trimIndent(),
            { rs: ResultSet, _: Int ->
                CertificateAttachmentDtoOut(
                    fileKey, fileName, rs.getZonedDateTime("attachment_upload_date")
                )
            },
            fileKey,
            fileName,
        )

        return result[0]
    }

    fun deleteAttachment(fileKey: String) {
        val sql = "DELETE FROM certificate_attachment WHERE attachment_file_key = ?"

        val updatedRowCount = jdbcTemplate.update(sql, fileKey)
        if (updatedRowCount != 1) {
            logger.warn("Tried to delete non-existent certificate attachment '${fileKey}'. Ignoring error.")
        }

        try {
            s3Helper.deleteObject(Bucket.CERTIFICATE, fileKey)
        } catch (ex: SdkException) {
            logger.warn("Failed to delete certificate attachment '${fileKey}' from S3. Ignoring error.", ex)
        }
    }

    fun mapResultSet(rs: ResultSet, exam: Exam): CertificateDtoOut = CertificateDtoOut(
        rs.getInt("certificate_id"),
        exam,
        rs.getString("certificate_name"),
        rs.getString("certificate_description"),
        PublishState.valueOf(rs.getString("certificate_publish_state")),
        CertificateAttachmentDtoOut(
            rs.getString("attachment_file_key"),
            rs.getString("attachment_file_name"),
            rs.getZonedDateTime("attachment_upload_date")
        ),
        rs.getString("certificate_author_oid"),
        rs.getTimestamp("certificate_created_at"),
        rs.getTimestamp("certificate_updated_at")
    )

    fun getCertificateById(id: Int, exam: Exam): CertificateDtoOut? {
        val role = Kayttajatiedot.fromSecurityContext().role

        val isPublishedIfOpettaja = if (role == Role.OPETTAJA) "AND c.certificate_publish_state = 'PUBLISHED'" else ""

        return jdbcTemplate.query(
            """
            SELECT c.*, ca.attachment_file_key, ca.attachment_file_name, ca.attachment_upload_date
            FROM ${tableNameFromExam(exam)} c
            NATURAL JOIN certificate_attachment ca
            WHERE c.certificate_id = ? $isPublishedIfOpettaja
            """.trimIndent(), { rs, _ -> mapResultSet(rs, exam) }, id
        ).firstOrNull()
    }

    fun getCertificateAttachmentByFileKey(fileKey: String): CertificateAttachmentDtoOut? {
        val results = jdbcTemplate.query(
            """
            SELECT attachment_file_key, attachment_file_name, attachment_upload_date
            FROM certificate_attachment
            WHERE attachment_file_key = ?
            """.trimIndent(), { rs, _ ->
                CertificateAttachmentDtoOut(
                    rs.getString("attachment_file_key"),
                    rs.getString("attachment_file_name"),
                    rs.getZonedDateTime("attachment_upload_date")
                )
            }, fileKey
        )

        return results.firstOrNull()
    }

    fun getCertificates(exam: Exam): List<CertificateDtoOut> {
        val role = Kayttajatiedot.fromSecurityContext().role

        val isPublishedIfOpettaja = if (role == Role.OPETTAJA) "WHERE certificate_publish_state = 'PUBLISHED'" else ""

        return jdbcTemplate.query(
            """
            SELECT 
                c.*, 
                ca.attachment_file_key AS attachment_file_key, 
                ca.attachment_file_name AS attachment_file_name, 
                ca.attachment_upload_date AS attachment_upload_date 
            FROM ${tableNameFromExam(exam)} AS c 
            NATURAL JOIN certificate_attachment AS ca
             $isPublishedIfOpettaja
            """.trimIndent()
        ) { rs, _ ->
            mapResultSet(rs, exam)
        }

    }

    fun updateCertificate(id: Int, certificateDtoIn: CertificateDtoIn, attachment: MultipartFile?): Int? =
        transactionTemplate.execute { _ ->
            val currentCertificate = getCertificateById(id, certificateDtoIn.exam) ?: throw ResponseStatusException(
                HttpStatus.NOT_FOUND, "Certificate $id not found"
            )

            val createdAttachment: CertificateAttachmentDtoOut? = attachment?.let { createAttachment(it) }

            val updatedRowCount = jdbcTemplate.update(
                """
                UPDATE ${tableNameFromExam(certificateDtoIn.exam)}
                SET
                    certificate_name = ?,
                    certificate_description = ?,
                    certificate_publish_state = ?::publish_state,
                    certificate_updated_at = clock_timestamp(),
                    attachment_file_key = ?
                WHERE
                    certificate_id = ?
                """.trimIndent(),
                certificateDtoIn.name,
                certificateDtoIn.description,
                certificateDtoIn.publishState.toString(),
                createdAttachment?.fileKey ?: currentCertificate.attachment.fileKey,
                id
            )

            if (updatedRowCount != 1) {
                throw ResponseStatusException(
                    HttpStatus.INTERNAL_SERVER_ERROR,
                    "Updated row count was $updatedRowCount but 1 was expected when updating Certificate $id"
                )
            }

            if (attachment != null) {
                deleteAttachment(currentCertificate.attachment.fileKey)
            }

            return@execute id
        }

}