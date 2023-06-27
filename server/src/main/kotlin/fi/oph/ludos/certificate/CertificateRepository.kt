package fi.oph.ludos.certificate

import fi.oph.ludos.Exam
import fi.oph.ludos.PublishState
import org.springframework.jdbc.core.JdbcTemplate
import org.springframework.stereotype.Component
import org.springframework.transaction.support.TransactionTemplate
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
        val attachmentInsertSql = """
    INSERT INTO certificate_attachment (attachment_file_key, attachment_file_name, attachment_upload_date)
    VALUES (?, ?, ?::timestamptz)
""".trimIndent()

        jdbcTemplate.update(
            attachmentInsertSql,
            certificateDtoIn.fileKey,
            certificateDtoIn.fileName,
            certificateDtoIn.fileUploadDate.toOffsetDateTime(),
        )

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
                    certificateDtoIn.fileName,
                    certificateDtoIn.fileKey,
                    certificateDtoIn.fileUploadDate,
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
        rs.getString("attachment_file_name"),
        rs.getString("attachment_file_key"),
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
            """SELECT c.*, a.attachment_file_key, a.attachment_file_name, a.attachment_upload_date
           FROM $table c
           JOIN certificate_attachment a ON c.attachment_file_key = a.attachment_file_key
           WHERE c.certificate_id = ?""", { rs, _ -> mapResultSet(rs, exam) }, id
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
            """SELECT 
            |c.*, 
            |ca.attachment_file_key AS attachment_file_key, 
            |ca.attachment_file_name AS attachment_file_name, 
            |ca.attachment_upload_date AS attachment_upload_date 
            |FROM $table AS c 
            |JOIN certificate_attachment AS ca ON c.attachment_file_key = ca.attachment_file_key""".trimMargin()
        ) { rs, _ ->
            mapResultSet(rs, exam)
        }
    }

    fun updateCertificate(id: Int, certificateDtoIn: CertificateDtoIn): Boolean {
        val table = when (certificateDtoIn.exam) {
            Exam.SUKO -> "suko_certificate"
            Exam.PUHVI -> "puhvi_certificate"
            Exam.LD -> "ld_certificate"
        }

        val transactionResult = transactionTemplate.execute { status ->
            try {
                val currentCert = getCertificateById(id, certificateDtoIn.exam) ?: return@execute false

                if (certificateDtoIn.fileKey != currentCert.fileKey) {
                    jdbcTemplate.update(
                        """
                        INSERT INTO certificate_attachment (
                            attachment_file_key,
                            attachment_file_name,
                            attachment_upload_date
                        )
                        VALUES(?, ?, now())
                        """.trimIndent(), certificateDtoIn.fileKey, certificateDtoIn.fileName
                    )

                    jdbcTemplate.update(
                        """
                        DELETE FROM certificate_attachment WHERE attachment_file_key = ?
                    """.trimIndent(), currentCert.fileKey
                    )
                }

                jdbcTemplate.update(
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

                true
            } catch (ex: Exception) {
                status.setRollbackOnly()
                throw ex
            }
        }

        return transactionResult ?: false
    }
}