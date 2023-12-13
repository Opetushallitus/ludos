package fi.oph.ludos.certificate

import fi.oph.ludos.Exam
import fi.oph.ludos.PublishState
import fi.oph.ludos.auth.Kayttajatiedot
import fi.oph.ludos.auth.Role
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

    fun publishStateFilter(role: Role) = when (role) {
        Role.OPETTAJA -> "AND c.certificate_publish_state = '${PublishState.PUBLISHED}'"
        else -> "AND c.certificate_publish_state in ('${PublishState.PUBLISHED}', '${PublishState.DRAFT}')"
    }

    fun <T : Certificate, Y : CertificateOut> createSukoCertificate(
        certificate: T,
        attachment: MultipartFile,
        insertCertificateRow: (attachment: CertificateAttachmentDtoOut) -> Y
    ) = transactionTemplate.execute { _ ->
        val certificateAttachment = createAttachment(attachment)

        insertCertificateRow(certificateAttachment)
    }!!

    fun createSukoCertificate(
        attachment: MultipartFile,
        certificateDtoIn: SukoCertificateDtoIn
    ): SukoCertificateDtoOut = createSukoCertificate(certificateDtoIn, attachment) { createdAttachment ->
        jdbcTemplate.query(
            """
                INSERT INTO suko_certificate (
                    certificate_name_fi,
                    suko_certificate_description_fi,
                    certificate_publish_state,
                    attachment_file_key_fi,
                    attachment_file_key_sv,
                    certificate_author_oid,
                    certificate_updater_oid
                )
                VALUES (?, ?, ?::publish_state, ?, ?, ?, ?)
                RETURNING certificate_id, certificate_created_at, certificate_author_oid, certificate_updater_oid, certificate_updated_at
            """.trimIndent(),
            { rs: ResultSet, _: Int ->
                SukoCertificateDtoOut(
                    id = rs.getInt("certificate_id"),
                    nameFi = certificateDtoIn.nameFi,
                    nameSv = "",
                    publishState = certificateDtoIn.publishState,
                    attachmentFi = createdAttachment,
                    attachmentSv = createdAttachment, // only attachmentFi field is actually used in SUKO
                    authorOid = rs.getString("certificate_author_oid"),
                    updaterOid = rs.getString("certificate_updater_oid"),
                    createdAt = rs.getTimestamp("certificate_created_at"),
                    updatedAt = rs.getTimestamp("certificate_updated_at"),
                    descriptionFi = certificateDtoIn.descriptionFi,
                    descriptionSv = "",
                    exam = certificateDtoIn.exam
                )
            },
            certificateDtoIn.nameFi,
            certificateDtoIn.descriptionFi,
            certificateDtoIn.publishState.toString(),
            createdAttachment.fileKey,
            createdAttachment.fileKey,
            Kayttajatiedot.fromSecurityContext().oidHenkilo,
            Kayttajatiedot.fromSecurityContext().oidHenkilo,
        )[0]
    }

    fun <T : Certificate, Y : CertificateOut> createCertificate(
        certificate: T,
        attachmentFi: MultipartFile,
        attachmentSv: MultipartFile,
        insertCertificateRow: (attachmentFi: CertificateAttachmentDtoOut, attachmentSv: CertificateAttachmentDtoOut) -> Y
    ) = transactionTemplate.execute { _ ->
        val certificateAttachmentFi = createAttachment(attachmentFi)
        val certificateAttachmentSv = createAttachment(attachmentSv)

        insertCertificateRow(certificateAttachmentFi, certificateAttachmentSv)
    }!!

    fun createLdCertificate(
        attachmentFi: MultipartFile,
        attachmentSv: MultipartFile,
        certificateDtoIn: LdCertificateDtoIn
    ): LdCertificateDtoOut =
        createCertificate(certificateDtoIn, attachmentFi, attachmentSv) { createdAttachmentFi, createdAttachmentSv ->
            jdbcTemplate.query(
                """
                INSERT INTO ld_certificate (
                    certificate_name_fi,
                    certificate_name_sv,
                    ld_certificate_aine_koodi_arvo,
                    certificate_publish_state,
                    attachment_file_key_fi,
                    attachment_file_key_sv,
                    certificate_author_oid,
                    certificate_updater_oid
                )
                VALUES (?, ?, ?, ?::publish_state, ?, ?, ?, ?)
                RETURNING certificate_id, certificate_created_at, certificate_author_oid, certificate_updater_oid, certificate_updated_at
            """.trimIndent(),
                { rs: ResultSet, _: Int ->
                    LdCertificateDtoOut(
                        id = rs.getInt("certificate_id"),
                        nameFi = certificateDtoIn.nameFi,
                        nameSv = certificateDtoIn.nameSv,
                        publishState = certificateDtoIn.publishState,
                        attachmentFi = createdAttachmentFi,
                        attachmentSv = createdAttachmentSv,
                        authorOid = rs.getString("certificate_author_oid"),
                        updaterOid = rs.getString("certificate_updater_oid"),
                        createdAt = rs.getTimestamp("certificate_created_at"),
                        updatedAt = rs.getTimestamp("certificate_updated_at"),
                        certificateDtoIn.aineKoodiArvo,
                        exam = certificateDtoIn.exam
                    )
                },
                certificateDtoIn.nameFi,
                certificateDtoIn.nameSv,
                certificateDtoIn.aineKoodiArvo,
                certificateDtoIn.publishState.toString(),
                createdAttachmentFi.fileKey,
                createdAttachmentSv.fileKey,
                Kayttajatiedot.fromSecurityContext().oidHenkilo,
                Kayttajatiedot.fromSecurityContext().oidHenkilo,
            )[0]
        }

    fun createPuhviCertificate(
        attachmentFi: MultipartFile,
        attachmentSv: MultipartFile,
        certificateDtoIn: PuhviCertificateDtoIn
    ): PuhviCertificateDtoOut =
        createCertificate(certificateDtoIn, attachmentFi, attachmentSv) { createdAttachmentFi, createdAttachmentSv ->
            jdbcTemplate.query(
                """
                INSERT INTO puhvi_certificate (
                    certificate_name_fi,
                    certificate_name_Sv,
                    puhvi_certificate_description_fi,
                    puhvi_certificate_description_sv,
                    certificate_publish_state,
                    attachment_file_key_fi,
                    attachment_file_key_sv,
                    certificate_author_oid,
                    certificate_updater_oid
                )
                VALUES (?, ?, ?, ?, ?::publish_state, ?, ?, ?, ?)
                RETURNING certificate_id, certificate_created_at, certificate_author_oid, certificate_updater_oid, certificate_updated_at
            """.trimIndent(),
                { rs: ResultSet, _: Int ->
                    PuhviCertificateDtoOut(
                        id = rs.getInt("certificate_id"),
                        nameFi = certificateDtoIn.nameFi,
                        nameSv = certificateDtoIn.nameSv,
                        publishState = certificateDtoIn.publishState,
                        attachmentFi = createdAttachmentFi,
                        attachmentSv = createdAttachmentSv,
                        authorOid = rs.getString("certificate_author_oid"),
                        updaterOid = rs.getString("certificate_updater_oid"),
                        createdAt = rs.getTimestamp("certificate_created_at"),
                        updatedAt = rs.getTimestamp("certificate_updated_at"),
                        descriptionFi = certificateDtoIn.descriptionFi,
                        descriptionSv = certificateDtoIn.descriptionSv,
                        exam = certificateDtoIn.exam
                    )
                },
                certificateDtoIn.nameFi,
                certificateDtoIn.nameSv,
                certificateDtoIn.descriptionFi,
                certificateDtoIn.descriptionSv,
                certificateDtoIn.publishState.toString(),
                createdAttachmentFi.fileKey,
                createdAttachmentSv.fileKey,
                Kayttajatiedot.fromSecurityContext().oidHenkilo,
                Kayttajatiedot.fromSecurityContext().oidHenkilo,
            )[0]
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
                    fileKey, fileName, rs.getTimestamp("attachment_upload_date")
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

    fun mapResultSetSuko(rs: ResultSet, exam: Exam): SukoCertificateDtoOut {
        val attachment = CertificateAttachmentDtoOut(
            rs.getString("attachment_file_key"),
            rs.getString("attachment_file_name"),
            rs.getTimestamp("attachment_upload_date")
        )
        return SukoCertificateDtoOut(
            id = rs.getInt("certificate_id"),
            nameFi = rs.getString("certificate_name_fi"),
            nameSv = rs.getString("certificate_name_sv"),
            publishState = PublishState.valueOf(rs.getString("certificate_publish_state")),
            attachmentFi = attachment,
            attachmentSv = attachment, // only attachmentFi field is actually used in SUKO
            authorOid = rs.getString("certificate_author_oid"),
            updaterOid = rs.getString("certificate_updater_oid"),
            createdAt = rs.getTimestamp("certificate_created_at"),
            updatedAt = rs.getTimestamp("certificate_updated_at"),
            descriptionFi = rs.getString("suko_certificate_description_fi"),
            descriptionSv = rs.getString("suko_certificate_description_sv"),
            exam = exam
        )
    }

    fun mapResultSetLd(rs: ResultSet, exam: Exam): LdCertificateDtoOut {
        val attachmentFileKeySv = rs.getString("attachment_file_key_sv")
        val attachmentSv = if (attachmentFileKeySv != null) {
            CertificateAttachmentDtoOut(
                attachmentFileKeySv,
                rs.getString("attachment_file_name_sv"),
                rs.getTimestamp("attachment_upload_date_sv")
            )
        } else null

        return LdCertificateDtoOut(
            id = rs.getInt("certificate_id"),
            nameFi = rs.getString("certificate_name_fi"),
            nameSv = rs.getString("certificate_name_sv"),
            publishState = PublishState.valueOf(rs.getString("certificate_publish_state")),
            attachmentFi = CertificateAttachmentDtoOut(
                rs.getString("attachment_file_key_fi"),
                rs.getString("attachment_file_name_fi"),
                rs.getTimestamp("attachment_upload_date_fi")
            ),
            attachmentSv = attachmentSv,
            authorOid = rs.getString("certificate_author_oid"),
            updaterOid = rs.getString("certificate_updater_oid"),
            createdAt = rs.getTimestamp("certificate_created_at"),
            updatedAt = rs.getTimestamp("certificate_updated_at"),
            aineKoodiArvo = rs.getString("ld_certificate_aine_koodi_arvo"),
            exam = exam
        )
    }


    fun mapResultSetPuhvi(rs: ResultSet, exam: Exam): PuhviCertificateDtoOut {
        val attachmentFileKeySv = rs.getString("attachment_file_key_sv")
        val attachmentSv = if (attachmentFileKeySv != null) {
            CertificateAttachmentDtoOut(
                attachmentFileKeySv,
                rs.getString("attachment_file_name_sv"),
                rs.getTimestamp("attachment_upload_date_sv")
            )
        } else null

        return PuhviCertificateDtoOut(
            id = rs.getInt("certificate_id"),
            nameFi = rs.getString("certificate_name_fi"),
            nameSv = rs.getString("certificate_name_sv"),
            publishState = PublishState.valueOf(rs.getString("certificate_publish_state")),
            attachmentFi = CertificateAttachmentDtoOut(
                rs.getString("attachment_file_key_fi"),
                rs.getString("attachment_file_name_fi"),
                rs.getTimestamp("attachment_upload_date_fi")
            ),
            attachmentSv = attachmentSv,
            authorOid = rs.getString("certificate_author_oid"),
            updaterOid = rs.getString("certificate_updater_oid"),
            createdAt = rs.getTimestamp("certificate_created_at"),
            updatedAt = rs.getTimestamp("certificate_updated_at"),
            descriptionFi = rs.getString("puhvi_certificate_description_fi"),
            descriptionSv = rs.getString("puhvi_certificate_description_sv"),
            exam = exam
        )
    }

    fun getCertificateById(id: Int, exam: Exam): CertificateOut? {
        val role = Kayttajatiedot.fromSecurityContext().role
        val (sql, mapper) = when (exam) {
            Exam.SUKO -> Pair(
                """
                SELECT 
                    c.*, 
                    ca.attachment_file_key AS attachment_file_key, 
                    ca.attachment_file_name AS attachment_file_name, 
                    ca.attachment_upload_date AS attachment_upload_date
                FROM suko_certificate AS c 
                LEFT JOIN certificate_attachment AS ca ON c.attachment_file_key_fi = ca.attachment_file_key
                WHERE c.certificate_id = ? ${publishStateFilter(role)}
            """.trimIndent(), ::mapResultSetSuko
            )

            Exam.LD -> Pair(
                """
                SELECT
                    c.*,
                    a_fi.attachment_file_key AS attachment_file_key_fi,
                    a_fi.attachment_file_name AS attachment_file_name_fi,
                    a_fi.attachment_upload_date AS attachment_upload_date_fi,
                    a_sv.attachment_file_key AS attachment_file_key_sv,
                    a_sv.attachment_file_name AS attachment_file_name_sv,
                    a_sv.attachment_upload_date AS attachment_upload_date_sv
                FROM ld_certificate AS c
                JOIN
                    certificate_attachment AS a_fi ON c.attachment_file_key_fi = a_fi.attachment_file_key
                LEFT JOIN
                    certificate_attachment AS a_sv ON c.attachment_file_key_sv = a_sv.attachment_file_key
                WHERE c.certificate_id = ? ${publishStateFilter(role)}
            """.trimIndent(), ::mapResultSetLd
            )

            Exam.PUHVI -> Pair(
                """
                SELECT
                    c.*,
                    a_fi.attachment_file_key AS attachment_file_key_fi,
                    a_fi.attachment_file_name AS attachment_file_name_fi,
                    a_fi.attachment_upload_date AS attachment_upload_date_fi,
                    a_sv.attachment_file_key AS attachment_file_key_sv,
                    a_sv.attachment_file_name AS attachment_file_name_sv,
                    a_sv.attachment_upload_date AS attachment_upload_date_sv
                FROM puhvi_certificate AS c
                JOIN
                    certificate_attachment AS a_fi ON c.attachment_file_key_fi = a_fi.attachment_file_key
                LEFT JOIN
                    certificate_attachment AS a_sv ON c.attachment_file_key_sv = a_sv.attachment_file_key
                WHERE c.certificate_id = ? ${publishStateFilter(role)}
            """.trimIndent(), ::mapResultSetPuhvi
            )
        }

        return jdbcTemplate.query(sql, { rs, _ -> mapper(rs, exam) }, id).firstOrNull()
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
                    rs.getTimestamp("attachment_upload_date")
                )
            }, fileKey
        )

        return results.firstOrNull()
    }

    fun getCertificates(exam: Exam, filters: CertificateFilters): List<CertificateOut> {
        val role = Kayttajatiedot.fromSecurityContext().role
        val orderDirection = filters.jarjesta ?: ""

        val (sql, mapper) = when (exam) {
            Exam.SUKO -> Pair(
                """
                SELECT 
                    c.*, 
                    ca.attachment_file_key AS attachment_file_key, 
                    ca.attachment_file_name AS attachment_file_name, 
                    ca.attachment_upload_date AS attachment_upload_date
                FROM suko_certificate AS c 
                LEFT JOIN certificate_attachment AS ca ON c.attachment_file_key_fi = ca.attachment_file_key
                WHERE true ${publishStateFilter(role)}
                ORDER BY c.certificate_updated_at $orderDirection
            """.trimIndent(), ::mapResultSetSuko
            )

            Exam.LD -> Pair(
                """
                SELECT
                    c.*,
                    a_fi.attachment_file_key AS attachment_file_key_fi,
                    a_fi.attachment_file_name AS attachment_file_name_fi,
                    a_fi.attachment_upload_date AS attachment_upload_date_fi,
                    a_sv.attachment_file_key AS attachment_file_key_sv,
                    a_sv.attachment_file_name AS attachment_file_name_sv,
                    a_sv.attachment_upload_date AS attachment_upload_date_sv
                FROM ld_certificate AS c
                JOIN
                    certificate_attachment AS a_fi ON c.attachment_file_key_fi = a_fi.attachment_file_key
                LEFT JOIN
                    certificate_attachment AS a_sv ON c.attachment_file_key_sv = a_sv.attachment_file_key
                WHERE true ${publishStateFilter(role)}
                ORDER BY c.certificate_updated_at $orderDirection
            """.trimIndent(), ::mapResultSetLd
            )

            Exam.PUHVI -> Pair(
                """
                SELECT
                    c.*,
                    a_fi.attachment_file_key AS attachment_file_key_fi,
                    a_fi.attachment_file_name AS attachment_file_name_fi,
                    a_fi.attachment_upload_date AS attachment_upload_date_fi,
                    a_sv.attachment_file_key AS attachment_file_key_sv,
                    a_sv.attachment_file_name AS attachment_file_name_sv,
                    a_sv.attachment_upload_date AS attachment_upload_date_sv
                FROM puhvi_certificate AS c
                JOIN
                    certificate_attachment AS a_fi ON c.attachment_file_key_fi = a_fi.attachment_file_key
                LEFT JOIN
                    certificate_attachment AS a_sv ON c.attachment_file_key_sv = a_sv.attachment_file_key
                WHERE true ${publishStateFilter(role)}
                ORDER BY c.certificate_updated_at $orderDirection
            """.trimIndent(), ::mapResultSetPuhvi
            )
        }

        return jdbcTemplate.query(sql) { rs, _ -> mapper(rs, exam) }
    }

    fun updateSukoCertificate(id: Int, certificateDtoIn: SukoCertificateDtoIn, attachment: MultipartFile?): Int? =
        updateCertificate(id, certificateDtoIn, attachment) { createdAttachmentFi ->
            jdbcTemplate.update(
                """
                    UPDATE suko_certificate
                    SET 
                    certificate_name_fi = ?,
                    certificate_name_sv = '',
                    certificate_publish_state = ?::publish_state, 
                    certificate_updater_oid = ?,
                    certificate_updated_at = clock_timestamp(),
                    attachment_file_key_fi = ?,
                    attachment_file_key_sv = ?,
                    suko_certificate_description_fi = ?,
                    suko_certificate_description_sv = ''
                    WHERE certificate_id = ?
                """.trimIndent(),
                certificateDtoIn.nameFi,
                certificateDtoIn.publishState.toString(),
                Kayttajatiedot.fromSecurityContext().oidHenkilo,
                createdAttachmentFi[0],
                createdAttachmentFi[0],
                certificateDtoIn.descriptionFi,
                id
            )
        }

    fun updateLdCertificate(
        id: Int,
        certificateDtoIn: LdCertificateDtoIn,
        attachmentFi: MultipartFile?,
        attachmentSv: MultipartFile?
    ): Int? =
        updateCertificate(
            id,
            certificateDtoIn,
            attachmentFi,
            attachmentSv
        ) { createdAttachments ->
            jdbcTemplate.update(
                """
                    UPDATE ld_certificate
                    SET 
                    certificate_name_fi = ?, 
                    certificate_name_sv = ?, 
                    certificate_publish_state = ?::publish_state, 
                    certificate_updater_oid = ?,
                    certificate_updated_at = clock_timestamp(),
                    attachment_file_key_fi = ?,
                    attachment_file_key_sv = ?,
                    ld_certificate_aine_koodi_arvo = ?
                    WHERE certificate_id = ?
                """.trimIndent(),
                certificateDtoIn.nameFi,
                certificateDtoIn.nameSv,
                certificateDtoIn.publishState.toString(),
                Kayttajatiedot.fromSecurityContext().oidHenkilo,
                createdAttachments[0],
                createdAttachments[1],
                certificateDtoIn.aineKoodiArvo,
                id
            )

        }

    fun updatePuhviCertificate(
        id: Int,
        certificateDtoIn: PuhviCertificateDtoIn,
        attachmentFi: MultipartFile?,
        attachmentSv: MultipartFile?
    ): Int? =
        updateCertificate(
            id,
            certificateDtoIn,
            attachmentFi,
            attachmentSv
        ) { createdAttachments ->
            jdbcTemplate.update(
                """
                    UPDATE puhvi_certificate
                    SET 
                    certificate_name_fi = ?, 
                    certificate_name_sv = ?, 
                    certificate_publish_state = ?::publish_state, 
                    certificate_updater_oid = ?,
                    certificate_updated_at = clock_timestamp(),
                    attachment_file_key_fi = ?,
                    attachment_file_key_sv = ?,
                    puhvi_certificate_description_fi = ?,
                    puhvi_certificate_description_sv = ?
                    WHERE certificate_id = ?
                """.trimIndent(),
                certificateDtoIn.nameFi,
                certificateDtoIn.nameSv,
                certificateDtoIn.publishState.toString(),
                Kayttajatiedot.fromSecurityContext().oidHenkilo,
                createdAttachments[0],
                createdAttachments[1],
                certificateDtoIn.descriptionFi,
                certificateDtoIn.descriptionSv,
                id
            )
        }

    private fun createNewAttachmentIfPresent(attachment: MultipartFile?): String? =
        attachment?.let { createAttachment(it).fileKey }

    private fun getCurrentOrNewAttachmentKeys(
        certificateOut: CertificateOut,
        vararg attachments: MultipartFile?
    ): List<String> = when (certificateOut) {
        is SukoCertificateDtoOut -> listOf(
            createNewAttachmentIfPresent(attachments.getOrNull(0)) ?: certificateOut.attachmentFi.fileKey
        )

        is LdCertificateDtoOut, is PuhviCertificateDtoOut -> listOfNotNull(
            createNewAttachmentIfPresent(attachments.getOrNull(0)) ?: certificateOut.attachmentFi.fileKey,
            createNewAttachmentIfPresent(attachments.getOrNull(1)) ?: certificateOut.attachmentSv?.fileKey
        )

        else -> throw IllegalArgumentException("Invalid certificate type")
    }

    fun updateCertificate(
        id: Int,
        certificateDtoIn: Certificate,
        vararg attachments: MultipartFile?,
        updateCertificateRow: (List<String>) -> Int
    ): Int? = transactionTemplate.execute { _ ->
        val certificateOut: CertificateOut = getCertificateById(id, certificateDtoIn.exam)
            ?: throw ResponseStatusException(HttpStatus.NOT_FOUND, "Certificate $id not found")

        val attachmentKeys = getCurrentOrNewAttachmentKeys(certificateOut, *attachments)

        val updatedRowCount = updateCertificateRow(attachmentKeys)

        if (updatedRowCount != 1) {
            throw ResponseStatusException(
                HttpStatus.INTERNAL_SERVER_ERROR,
                "Updated row count was $updatedRowCount but 1 was expected when updating Certificate $id"
            )
        }

        // Delete the old attachments if new ones were provided
        certificateOut.let {
            when (it) {
                is SukoCertificateDtoOut -> attachments.getOrNull(0)?.also { _ ->
                    deleteAttachment(it.attachmentFi.fileKey)
                }

                is LdCertificateDtoOut, is PuhviCertificateDtoOut -> {
                    attachments.getOrNull(0)?.also { _ ->
                        deleteAttachment(it.attachmentFi.fileKey)
                    }
                    attachments.getOrNull(1)?.also { _ ->
                        it.attachmentSv?.let { file -> deleteAttachment(file.fileKey) }
                    }
                }

                else -> throw IllegalArgumentException("Invalid certificate type")
            }
        }

        return@execute id
    }
}
