package fi.oph.ludos.certificate

import fi.oph.ludos.Exam
import fi.oph.ludos.PublishState
import fi.oph.ludos.exception.ApiRequestException
import org.springframework.http.HttpStatus
import org.springframework.jdbc.core.JdbcTemplate
import org.springframework.stereotype.Component
import org.springframework.transaction.support.TransactionTemplate
import org.springframework.web.server.ResponseStatusException
import java.sql.ResultSet
import java.time.ZoneOffset
import java.time.ZonedDateTime

@Component
class CertificateRepository(
    private val jdbcTemplate: JdbcTemplate, private val transactionTemplate: TransactionTemplate
) {
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

    fun createAttachment(file: FileUpload): FileUpload {
        val sql = """
            INSERT INTO certificate_attachment (attachment_file_key, attachment_file_name, attachment_upload_date)
            VALUES (?, ?, now())
            RETURNING attachment_file_key, attachment_file_name, attachment_upload_date
        """.trimIndent()

        val result = jdbcTemplate.query(
            sql,
            { rs: ResultSet, _: Int ->
                FileUpload(
                    file.fileName, file.fileKey, getZonedDateTimeFromResultSet(rs, "attachment_upload_date")
                )
            },
            file.fileKey,
            file.fileName,
        )

        return result[0]
    }

    fun deleteAttachment(oldFileKey: String) {
        val sql = """
            DELETE FROM certificate_attachment WHERE attachment_file_key = ?
        """.trimIndent()

        jdbcTemplate.update(sql, oldFileKey)
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

    fun updateCertificate(id: Int, certificateDtoIn: CertificateDtoIn) {
        val table = when (certificateDtoIn.exam) {
            Exam.SUKO -> "suko_certificate"
            Exam.PUHVI -> "puhvi_certificate"
            Exam.LD -> "ld_certificate"
        }

        transactionTemplate.execute { status ->
            try {
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

                result == 1
            } catch (ex: Exception) {
                status.setRollbackOnly()
                throw ex
            }
        }
    }

}