package fi.oph.ludos.certificate

import fi.oph.ludos.Exam
import fi.oph.ludos.PublishState
import org.springframework.data.crossstore.ChangeSetPersister
import org.springframework.jdbc.core.JdbcTemplate
import org.springframework.stereotype.Component
import java.sql.ResultSet

@Component
class CertificateRepository(
    private val jdbcTemplate: JdbcTemplate,
) {
    fun saveCertificate(certificate: CertificateDtoIn): CertificateDtoOut {
        val table = when (certificate.exam) {
            Exam.SUKO -> "suko_certificate"
            Exam.PUHVI -> "puhvi_certificate"
            Exam.LD -> "ld_certificate"
        }

        return jdbcTemplate.query(
            """INSERT INTO $table (
            |certificate_name_fi, 
            |certificate_content_fi,
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
                    certificate.nameFi,
                    certificate.contentFi,
                    certificate.publishState,
                    certificate.fileName,
                    certificate.fileKey,
                    certificate.fileUploadDate,
                    rs.getTimestamp("certificate_created_at"),
                    rs.getTimestamp("certificate_updated_at")
                )
            },
            certificate.nameFi,
            certificate.contentFi,
            certificate.publishState.toString(),
            certificate.fileName,
            certificate.fileKey,
            certificate.fileUploadDate
        )[0]
    }

    fun mapResultSet(rs: ResultSet, exam: Exam): CertificateDtoOut? {
        return CertificateDtoOut(
            rs.getInt("certificate_id"),
            exam,
            rs.getString("certificate_name_fi"),
            rs.getString("certificate_content_fi"),
            PublishState.valueOf(rs.getString("certificate_publish_state")),
            rs.getString("certificate_file_name"),
            rs.getString("certificate_file_key"),
            rs.getString("certificate_file_upload_date"),
            rs.getTimestamp("certificate_created_at"),
            rs.getTimestamp("certificate_updated_at")
        )
    }


    fun getCertificateById(id: Int, exam: Exam): CertificateDtoOut = try {
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

        if (results.isEmpty()) {
            throw ChangeSetPersister.NotFoundException()
        }

        results[0]
    } catch (e: ChangeSetPersister.NotFoundException) {
        throw ChangeSetPersister.NotFoundException()
    }

    fun getCertificates(exam: Exam): List<CertificateDtoOut> = try {
        val table = when (exam) {
            Exam.SUKO -> "suko_certificate"
            Exam.PUHVI -> "puhvi_certificate"
            Exam.LD -> "ld_certificate"
        }

        jdbcTemplate.query(
            "SELECT * FROM $table"
        ) { rs, _ ->
            mapResultSet(rs, exam)
        }
    } catch (e: ChangeSetPersister.NotFoundException) {
        throw ChangeSetPersister.NotFoundException()
    }

    fun updateCertificate(id: Int, certificate: CertificateDtoIn): Int = try {
        val results = jdbcTemplate.query(
            """UPDATE suko_certificate SET 
                |certificate_name_fi = ?, 
                |certificate_content_fi = ?, 
                |certificate_publish_state = ?::publish_state, 
                |certificate_updated_at = now(),
                |certificate_file_name = ?,
                |certificate_file_key = ?,
                |certificate_file_upload_date = to_timestamp(?, 'YYYY-MM-DD')
                |WHERE certificate_id = ? RETURNING certificate_id""".trimMargin(),
            { rs: ResultSet, _: Int ->
                rs.getInt("certificate_id")
            },
            certificate.nameFi,
            certificate.contentFi,
            certificate.publishState.toString(),
            certificate.fileName,
            certificate.fileKey,
            certificate.fileUploadDate,
            id
        )

        if (results.isEmpty()) {
            throw ChangeSetPersister.NotFoundException()
        }

        results[0]
    } catch (e: ChangeSetPersister.NotFoundException) {
        throw ChangeSetPersister.NotFoundException()
    }
}