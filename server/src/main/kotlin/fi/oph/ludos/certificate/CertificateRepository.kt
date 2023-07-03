package fi.oph.ludos.certificate

import fi.oph.ludos.Exam
import fi.oph.ludos.PublishState
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
import java.time.ZoneOffset
import java.time.ZonedDateTime
import java.util.*

@Component
class CertificateRepository(
    private val jdbcTemplate: JdbcTemplate,
    private val transactionTemplate: TransactionTemplate,
    private val s3Helper: S3Helper
) {
    val logger: Logger = LoggerFactory.getLogger(javaClass)

    fun createCertificate(certificateDtoIn: CertificateDtoIn, attachment: MultipartFile): CertificateDtoOut {
        val table = when (certificateDtoIn.exam) {
            Exam.SUKO -> "suko_certificate"
            Exam.PUHVI -> "puhvi_certificate"
            Exam.LD -> "ld_certificate"
        }

        val certificateAttachment = createAttachment(attachment)

        val certificateInsertSql = """
            INSERT INTO $table (
                certificate_name, 
                certificate_description,
                certificate_publish_state,
                attachment_file_key
            )
            VALUES (?, ?, ?::publish_state, ?)
            RETURNING certificate_id, certificate_created_at, certificate_updated_at
         """.trimIndent()

        return jdbcTemplate.query(
            certificateInsertSql,
            { rs: ResultSet, _: Int ->
                CertificateDtoOut(
                    rs.getInt("certificate_id"),
                    certificateDtoIn.exam,
                    certificateDtoIn.name,
                    certificateDtoIn.description,
                    certificateDtoIn.publishState,
                    certificateAttachment.fileKey,
                    certificateAttachment.fileName,
                    certificateAttachment.fileUploadDate,
                    rs.getTimestamp("certificate_created_at"),
                    rs.getTimestamp("certificate_updated_at")
                )
            },
            certificateDtoIn.name,
            certificateDtoIn.description,
            certificateDtoIn.publishState.toString(),
            certificateAttachment.fileKey
        )[0]
    }

    fun createAttachment(file: MultipartFile): CertificateAttachment {
        val fileKey = "todistuspohja_${UUID.randomUUID()}"

        try {
            s3Helper.putObject(file, fileKey)
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
                CertificateAttachment(
                    fileName,
                    fileKey,
                    getZonedDateTimeFromResultSet(rs, "attachment_upload_date")
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
            s3Helper.deleteObject(fileKey)
        } catch (ex: SdkException) {
            logger.warn("Failed to delete certificate attachment '${fileKey}' from S3. Ignoring error.", ex)
        }
    }

    fun getZonedDateTimeFromResultSet(rs: ResultSet, columnName: String): ZonedDateTime {
        val timestamp = rs.getTimestamp(columnName)
        return ZonedDateTime.ofInstant(timestamp.toInstant(), ZoneOffset.UTC)
    }

    fun mapResultSet(rs: ResultSet, exam: Exam): CertificateDtoOut = CertificateDtoOut(
        rs.getInt("certificate_id"),
        exam,
        rs.getString("certificate_name"),
        rs.getString("certificate_description"),
        PublishState.valueOf(rs.getString("certificate_publish_state")),
        rs.getString("attachment_file_key"),
        rs.getString("attachment_file_name"),
        getZonedDateTimeFromResultSet(rs, "attachment_upload_date"),
        rs.getTimestamp("certificate_created_at"),
        rs.getTimestamp("certificate_updated_at")
    )

    fun getCertificateById(id: Int, exam: Exam): CertificateDtoOut? {
        val table = when (exam) {
            Exam.SUKO -> "suko_certificate"
            Exam.PUHVI -> "puhvi_certificate"
            Exam.LD -> "ld_certificate"
        }

        val results = jdbcTemplate.query(
            """
            SELECT c.*, ca.attachment_file_key, ca.attachment_file_name, ca.attachment_upload_date
            FROM $table c
            NATURAL JOIN certificate_attachment ca
            WHERE c.certificate_id = ?
            """.trimIndent(), { rs, _ -> mapResultSet(rs, exam) }, id
        )

        return results.firstOrNull()
    }

    fun getCertificateAttachmentByFileKey(fileKey: String): CertificateAttachment? {
        val results = jdbcTemplate.query(
            """
            SELECT attachment_file_key, attachment_file_name, attachment_upload_date
            FROM certificate_attachment
            WHERE attachment_file_key = ?
            """.trimIndent(), { rs, _ ->
                CertificateAttachment(
                    rs.getString("attachment_file_name"),
                    rs.getString("attachment_file_key"),
                    getZonedDateTimeFromResultSet(rs, "attachment_upload_date")
                )
            }, fileKey
        )

        return results.firstOrNull()
    }

    fun getCertificates(exam: Exam): List<CertificateDtoOut> {
        val table = when (exam) {
            Exam.SUKO -> "suko_certificate"
            Exam.PUHVI -> "puhvi_certificate"
            Exam.LD -> "ld_certificate"
        }

        return jdbcTemplate.query(
            """
            SELECT 
                c.*, 
                ca.attachment_file_key AS attachment_file_key, 
                ca.attachment_file_name AS attachment_file_name, 
                ca.attachment_upload_date AS attachment_upload_date 
            FROM $table AS c 
            NATURAL JOIN certificate_attachment AS ca
            """.trimIndent()
        ) { rs, _ ->
            mapResultSet(rs, exam)
        }
    }

    fun updateCertificate(id: Int, certificateDtoIn: CertificateDtoIn, attachment: MultipartFile?) {
        val table = when (certificateDtoIn.exam) {
            Exam.SUKO -> "suko_certificate"
            Exam.PUHVI -> "puhvi_certificate"
            Exam.LD -> "ld_certificate"
        }

        transactionTemplate.execute { status ->
            try {
                val currentCertificate =
                    getCertificateById(id, certificateDtoIn.exam) ?: throw ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Certificate $id not found"
                    )

                val newAttachment: CertificateAttachment? = attachment?.let { createAttachment(it) }

                val result = jdbcTemplate.update(
                    """
                UPDATE $table
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
                    newAttachment?.fileKey ?: currentCertificate.fileKey,
                    id
                )

                if (newAttachment != null) {
                    deleteAttachment(currentCertificate.fileKey)
                }

                result == 1
            } catch (ex: Exception) {
                status.setRollbackOnly()
                throw ex
            }
        }
    }

}