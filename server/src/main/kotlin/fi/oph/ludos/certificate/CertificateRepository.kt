package fi.oph.ludos.certificate

import fi.oph.ludos.Exam
import fi.oph.ludos.PublishState
import org.springframework.jdbc.core.JdbcTemplate
import org.springframework.stereotype.Component
import java.sql.ResultSet

@Component
class CertificateRepository(
    private val jdbcTemplate: JdbcTemplate,
) {
    fun createCertificate(certificate: CertificateDtoIn): CertificateDtoOut {
        val table = when (certificate.exam) {
            Exam.SUKO -> "suko_certificate"
            Exam.PUHVI -> "puhvi_certificate"
            Exam.LD -> "ld_certificate"
        }

        return jdbcTemplate.query(
            """INSERT INTO $table (
            |certificate_name, 
            |certificate_description,
            |certificate_publish_state,
            |certificate_file_name,
            |certificate_file_key,
            |certificate_file_upload_date)
            |VALUES (?, ?, ?::publish_state, ?, ?, to_timestamp(?, 'YYYY-MM-DD')) 
            |RETURNING certificate_id, 
            |certificate_created_at,
            |certificate_updated_at""".trimMargin(),
            { rs: ResultSet, _: Int ->
                CertificateDtoOut(
                    rs.getInt("certificate_id"),
                    certificate.exam,
                    certificate.name,
                    certificate.description,
                    certificate.publishState,
                    certificate.fileName,
                    certificate.fileKey,
                    certificate.fileUploadDate,
                    rs.getTimestamp("certificate_created_at"),
                    rs.getTimestamp("certificate_updated_at")
                )
            },
            certificate.name,
            certificate.description,
            certificate.publishState.toString(),
            certificate.fileName,
            certificate.fileKey,
            certificate.fileUploadDate
        )[0]
    }

    fun mapResultSet(rs: ResultSet, exam: Exam): CertificateDtoOut? = CertificateDtoOut(
        rs.getInt("certificate_id"),
        exam,
        rs.getString("certificate_name"),
        rs.getString("certificate_description"),
        PublishState.valueOf(rs.getString("certificate_publish_state")),
        rs.getString("certificate_file_name"),
        rs.getString("certificate_file_key"),
        rs.getString("certificate_file_upload_date"),
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
            "SELECT * FROM $table WHERE certificate_id = ?", { rs, _ ->
                mapResultSet(rs, exam)
            }, id
        )

        return if (results.isEmpty()) {
            null
        } else {
            results[0]
        }
    }

    fun getCertificates(exam: Exam): List<CertificateDtoOut> {
        val table = when (exam) {
            Exam.SUKO -> "suko_certificate"
            Exam.PUHVI -> "puhvi_certificate"
            Exam.LD -> "ld_certificate"
        }

        return jdbcTemplate.query(
            "SELECT * FROM $table"
        ) { rs, _ ->
            mapResultSet(rs, exam)
        }
    }

    fun updateCertificate(id: Int, certificate: CertificateDtoIn): Int? {
        val table = when (certificate.exam) {
            Exam.SUKO -> "suko_certificate"
            Exam.PUHVI -> "puhvi_certificate"
            Exam.LD -> "ld_certificate"
        }

        val results = jdbcTemplate.query(
            """UPDATE $table SET 
                |certificate_name = ?, 
                |certificate_description = ?, 
                |certificate_publish_state = ?::publish_state, 
                |certificate_updated_at = now(),
                |certificate_file_name = ?,
                |certificate_file_key = ?,
                |certificate_file_upload_date = to_timestamp(?, 'YYYY-MM-DD')
                |WHERE certificate_id = ? RETURNING certificate_id""".trimMargin(),
            { rs: ResultSet, _: Int ->
                rs.getInt("certificate_id")
            },
            certificate.name,
            certificate.description,
            certificate.publishState.toString(),
            certificate.fileName,
            certificate.fileKey,
            certificate.fileUploadDate,
            id
        )

        return if (results.isEmpty()) {
            null
        } else {
            results[0]
        }

    }
}