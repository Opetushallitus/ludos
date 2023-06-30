package fi.oph.ludos.certificate

import fi.oph.ludos.Exam
import fi.oph.ludos.PublishState
import fi.oph.ludos.exception.ApiRequestException
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

    fun createCertificate(certificateDtoIn: CertificateDtoIn): CertificateDtoOut {
        val table = when (certificateDtoIn.exam) {
            Exam.SUKO -> "suko_certificate"
            Exam.PUHVI -> "puhvi_certificate"
            Exam.LD -> "ld_certificate"
        }

        val getCertificateAttachmentSql = """
            SELECT attachment_file_name, attachment_upload_date
            FROM certificate_attachment
            WHERE attachment_file_key = ?
        """.trimIndent()

        val certificateAttachment = jdbcTemplate.query(
            getCertificateAttachmentSql, { rs: ResultSet, _: Int ->
                FileUpload(
                    rs.getString("attachment_file_name"),
                    certificateDtoIn.fileKey,
                    getZonedDateTimeFromResultSet(rs, "attachment_upload_date")
                )
            }, certificateDtoIn.fileKey
        ).firstOrNull() ?: throw ApiRequestException("Attachment not found")

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
                    certificateDtoIn.fileKey,
                    certificateAttachment.fileName,
                    certificateAttachment.fileUploadDate,
                    rs.getTimestamp("certificate_created_at"),
                    rs.getTimestamp("certificate_updated_at")
                )
            },
            certificateDtoIn.name,
            certificateDtoIn.description,
            certificateDtoIn.publishState.toString(),
            certificateDtoIn.fileKey
        )[0]
    }

    fun createAttachment(file: MultipartFile): FileUpload {
        val key = "todistuspohja_${UUID.randomUUID()}"

        try {
            s3Helper.putObject(file, key)
        } catch (ex: SdkException) {
            val errorMsg = "Failed to upload file '${file.originalFilename}' to S3"
            logger.error(errorMsg, ex)
            throw ResponseStatusException(HttpStatus.BAD_GATEWAY, errorMsg)
        }

        val fileToCreate = FileUpload(file.originalFilename!!, key, ZonedDateTime.now(ZoneOffset.UTC))

        val result = jdbcTemplate.query(
            """
                INSERT INTO certificate_attachment (attachment_file_key, attachment_file_name, attachment_upload_date)
                VALUES (?, ?, now())
                RETURNING attachment_file_key, attachment_file_name, attachment_upload_date
            """.trimIndent(),
            { rs: ResultSet, _: Int ->
                FileUpload(
                    fileToCreate.fileName,
                    fileToCreate.fileKey,
                    getZonedDateTimeFromResultSet(rs, "attachment_upload_date")
                )
            },
            fileToCreate.fileKey,
            fileToCreate.fileName,
        )

        return result[0]
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

    fun getCertificateAttachmentByFileKey(fileKey: String): FileUpload? {
        val results = jdbcTemplate.query(
            """
            SELECT attachment_file_key, attachment_file_name, attachment_upload_date
            FROM certificate_attachment
            WHERE attachment_file_key = ?
            """.trimIndent(), { rs, _ ->
                FileUpload(
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

    fun deleteAttachment(oldFileKey: String) {
        // check if file key is in use by another certificate
        val count = jdbcTemplate.queryForObject(
            "SELECT COUNT(*) FROM certificate_attachment WHERE attachment_file_key = ?", Int::class.java, oldFileKey
        )
        // if not, delete the file from S3
        if (count == 0) {
            val sql = "DELETE FROM certificate_attachment WHERE attachment_file_key = ?"

            jdbcTemplate.update(sql, oldFileKey)
        }
    }

    fun updateCertificate(id: Int, certificateDtoIn: CertificateDtoIn) {
        val table = when (certificateDtoIn.exam) {
            Exam.SUKO -> "suko_certificate"
            Exam.PUHVI -> "puhvi_certificate"
            Exam.LD -> "ld_certificate"
        }

        transactionTemplate.execute { status ->
            try {
                // get attachment of the certificate which will be deleted and replaced with the new one
                val currentCertificateWithAttachment =
                    getCertificateById(id, certificateDtoIn.exam) ?: throw ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Certificate $id not found"
                    )

                getCertificateAttachmentByFileKey(certificateDtoIn.fileKey) ?: throw ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Attachment '${certificateDtoIn.fileKey}' not found for certificate id: $id"
                )

                val result = jdbcTemplate.update(
                    """
                UPDATE $table
                SET
                    certificate_name = ?,
                    certificate_description = ?,
                    certificate_publish_state = ?::publish_state,
                    certificate_updated_at = now(),
                    attachment_file_key = ?
                WHERE
                    certificate_id = ?
                """.trimIndent(),
                    certificateDtoIn.name,
                    certificateDtoIn.description,
                    certificateDtoIn.publishState.toString(),
                    certificateDtoIn.fileKey,
                    id
                )

                // if fileKeys are not equal, delete old attachment from db
                if (currentCertificateWithAttachment.fileKey != certificateDtoIn.fileKey) {
                    deleteAttachment(currentCertificateWithAttachment.fileKey)
                }

                result == 1
            } catch (ex: Exception) {
                status.setRollbackOnly()
                throw ex
            }
        }
    }

}