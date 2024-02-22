package fi.oph.ludos.certificate

import arrow.core.Either
import fi.oph.ludos.Exam
import fi.oph.ludos.INITIAL_VERSION_NUMBER
import fi.oph.ludos.PublishState
import fi.oph.ludos.auth.Kayttajatiedot
import fi.oph.ludos.auth.Role
import fi.oph.ludos.s3.Bucket
import fi.oph.ludos.s3.S3Helper
import org.slf4j.Logger
import org.slf4j.LoggerFactory
import org.springframework.dao.EmptyResultDataAccessException
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

    fun <T : CertificateOut> createSukoCertificate(
        attachment: MultipartFile,
        insertCertificateRow: (attachment: CertificateAttachmentDtoOut) -> T
    ) = transactionTemplate.execute { _ ->
        val certificateAttachment = createAttachment(attachment)

        insertCertificateRow(certificateAttachment)
    }!!

    fun createSukoCertificate(
        attachment: MultipartFile,
        certificateDtoIn: SukoCertificateDtoIn
    ): SukoCertificateDtoOut = createSukoCertificate(attachment) { createdAttachment ->
        jdbcTemplate.query(
            """
                INSERT INTO suko_certificate (
                    certificate_name_fi,
                    suko_certificate_description_fi,
                    certificate_publish_state,
                    attachment_file_key_fi,
                    attachment_file_key_sv,
                    certificate_author_oid,
                    certificate_updater_oid,
                    certificate_version
                )
                VALUES (?, ?, ?::publish_state, ?, ?, ?, ?, ?)
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
                    updaterName = null,
                    createdAt = rs.getTimestamp("certificate_created_at"),
                    updatedAt = rs.getTimestamp("certificate_updated_at"),
                    version = INITIAL_VERSION_NUMBER,
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
            1 // version
        )[0]
    }

    fun <T : CertificateOut> createCertificate(
        attachmentFi: MultipartFile,
        attachmentSv: MultipartFile,
        insertCertificateRow: (attachmentFi: CertificateAttachmentDtoOut, attachmentSv: CertificateAttachmentDtoOut) -> T
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
        createCertificate(attachmentFi, attachmentSv) { createdAttachmentFi, createdAttachmentSv ->
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
                    certificate_updater_oid,
                    certificate_version
                )
                VALUES (?, ?, ?, ?::publish_state, ?, ?, ?, ?, ?)
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
                        updaterName = null,
                        createdAt = rs.getTimestamp("certificate_created_at"),
                        updatedAt = rs.getTimestamp("certificate_updated_at"),
                        version = INITIAL_VERSION_NUMBER,
                        aineKoodiArvo = certificateDtoIn.aineKoodiArvo,
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
                1 // version
            )[0]
        }

    fun createPuhviCertificate(
        attachmentFi: MultipartFile,
        attachmentSv: MultipartFile,
        certificateDtoIn: PuhviCertificateDtoIn
    ): PuhviCertificateDtoOut =
        createCertificate(attachmentFi, attachmentSv) { createdAttachmentFi, createdAttachmentSv ->
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
                    certificate_updater_oid,
                    certificate_version
                )
                VALUES (?, ?, ?, ?, ?::publish_state, ?, ?, ?, ?, ?)
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
                        updaterName = null,
                        createdAt = rs.getTimestamp("certificate_created_at"),
                        updatedAt = rs.getTimestamp("certificate_updated_at"),
                        version = INITIAL_VERSION_NUMBER,
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
                1 // version
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
            updaterName = null,
            createdAt = rs.getTimestamp("certificate_created_at"),
            updatedAt = rs.getTimestamp("certificate_updated_at"),
            version = rs.getInt("certificate_version"),
            descriptionFi = rs.getString("suko_certificate_description_fi"),
            descriptionSv = rs.getString("suko_certificate_description_sv"),
            exam = exam
        )
    }

    fun mapResultSetLd(rs: ResultSet, exam: Exam): LdCertificateDtoOut {
        val attachmentFileKeySv = rs.getString("attachment_file_key_sv")
        val attachmentSv = CertificateAttachmentDtoOut(
            attachmentFileKeySv,
            rs.getString("attachment_file_name_sv"),
            rs.getTimestamp("attachment_upload_date_sv")
        )

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
            updaterName = null,
            createdAt = rs.getTimestamp("certificate_created_at"),
            updatedAt = rs.getTimestamp("certificate_updated_at"),
            version = rs.getInt("certificate_version"),
            aineKoodiArvo = rs.getString("ld_certificate_aine_koodi_arvo"),
            exam = exam
        )
    }


    fun mapResultSetPuhvi(rs: ResultSet, exam: Exam): PuhviCertificateDtoOut {
        val attachmentFileKeySv = rs.getString("attachment_file_key_sv")
        val attachmentSv = CertificateAttachmentDtoOut(
            attachmentFileKeySv,
            rs.getString("attachment_file_name_sv"),
            rs.getTimestamp("attachment_upload_date_sv")
        )

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
            updaterName = null,
            createdAt = rs.getTimestamp("certificate_created_at"),
            updatedAt = rs.getTimestamp("certificate_updated_at"),
            version = rs.getInt("certificate_version"),
            descriptionFi = rs.getString("puhvi_certificate_description_fi"),
            descriptionSv = rs.getString("puhvi_certificate_description_sv"),
            exam = exam
        )
    }

    fun tableNameAndMapperByExam(exam: Exam) = when (exam) {
        Exam.SUKO -> Pair("suko_certificate", ::mapResultSetSuko)
        Exam.LD -> Pair("ld_certificate", ::mapResultSetLd)
        Exam.PUHVI -> Pair("puhvi_certificate", ::mapResultSetPuhvi)
    }

    fun getCertificateById(id: Int, exam: Exam, version: Int?): CertificateOut? {
        val role = Kayttajatiedot.fromSecurityContext().role
        val (table, mapper) = tableNameAndMapperByExam(exam)

        val versionCondition = version?.let { "AND c.certificate_version = $version" }
            ?: "AND c.certificate_version = (SELECT MAX(certificate_version) FROM $table WHERE certificate_id = c.certificate_id)"

        val sql = when (exam) {
            Exam.SUKO -> """
                SELECT 
                    c.*, 
                    ca.attachment_file_key AS attachment_file_key, 
                    ca.attachment_file_name AS attachment_file_name, 
                    ca.attachment_upload_date AS attachment_upload_date
                FROM suko_certificate AS c 
                LEFT JOIN certificate_attachment AS ca ON c.attachment_file_key_fi = ca.attachment_file_key
                WHERE c.certificate_id = ? $versionCondition ${publishStateFilter(role)}
            """.trimIndent()

            Exam.LD, Exam.PUHVI -> """
                SELECT
                    c.*,
                    a_fi.attachment_file_key AS attachment_file_key_fi,
                    a_fi.attachment_file_name AS attachment_file_name_fi,
                    a_fi.attachment_upload_date AS attachment_upload_date_fi,
                    a_sv.attachment_file_key AS attachment_file_key_sv,
                    a_sv.attachment_file_name AS attachment_file_name_sv,
                    a_sv.attachment_upload_date AS attachment_upload_date_sv
                FROM $table AS c
                JOIN certificate_attachment AS a_fi ON c.attachment_file_key_fi = a_fi.attachment_file_key
                LEFT JOIN certificate_attachment AS a_sv ON c.attachment_file_key_sv = a_sv.attachment_file_key
                WHERE c.certificate_id = ? $versionCondition ${publishStateFilter(role)}
            """.trimIndent()
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
        val (table, mapper) = tableNameAndMapperByExam(exam)

        val orderDirection = filters.jarjesta ?: ""

        val sql = when (exam) {
            Exam.SUKO -> """
                SELECT 
                    c.*, 
                    ca.attachment_file_key AS attachment_file_key, 
                    ca.attachment_file_name AS attachment_file_name, 
                    ca.attachment_upload_date AS attachment_upload_date
                FROM suko_certificate AS c
                INNER JOIN (
                    SELECT certificate_id, MAX(certificate_version) as latest_version
                    FROM suko_certificate
                    GROUP BY certificate_id
                ) latest ON c.certificate_id = latest.certificate_id AND c.certificate_version = latest.latest_version
                LEFT JOIN certificate_attachment AS ca ON c.attachment_file_key_fi = ca.attachment_file_key
                WHERE true ${publishStateFilter(role)}
                ORDER BY c.certificate_updated_at $orderDirection
            """.trimIndent()

            Exam.LD, Exam.PUHVI -> """
                SELECT
                    c.*,
                    a_fi.attachment_file_key AS attachment_file_key_fi,
                    a_fi.attachment_file_name AS attachment_file_name_fi,
                    a_fi.attachment_upload_date AS attachment_upload_date_fi,
                    a_sv.attachment_file_key AS attachment_file_key_sv,
                    a_sv.attachment_file_name AS attachment_file_name_sv,
                    a_sv.attachment_upload_date AS attachment_upload_date_sv
                FROM $table AS c
                INNER JOIN (
                    SELECT certificate_id, MAX(certificate_version) as latest_version
                    FROM $table
                    GROUP BY certificate_id
                ) latest ON c.certificate_id = latest.certificate_id AND c.certificate_version = latest.latest_version
                JOIN certificate_attachment AS a_fi ON c.attachment_file_key_fi = a_fi.attachment_file_key
                LEFT JOIN certificate_attachment AS a_sv ON c.attachment_file_key_sv = a_sv.attachment_file_key
                WHERE true ${publishStateFilter(role)}
                ORDER BY c.certificate_updated_at $orderDirection
            """.trimIndent()
        }

        return jdbcTemplate.query(sql) { rs, _ -> mapper(rs, exam) }
    }

    fun getAllVersionsOfCertificate(id: Int, exam: Exam): List<CertificateOut> {
        val (table, mapper) = tableNameAndMapperByExam(exam)

        val sql = when (exam) {
            Exam.SUKO -> """
                SELECT 
                    c.*, 
                    ca.attachment_file_key AS attachment_file_key, 
                    ca.attachment_file_name AS attachment_file_name, 
                    ca.attachment_upload_date AS attachment_upload_date
                FROM suko_certificate AS c
                LEFT JOIN certificate_attachment AS ca ON c.attachment_file_key_fi = ca.attachment_file_key
                WHERE c.certificate_id = ?
                ORDER BY c.certificate_version
            """.trimIndent()

            Exam.LD, Exam.PUHVI -> """
                SELECT
                    c.*,
                    a_fi.attachment_file_key AS attachment_file_key_fi,
                    a_fi.attachment_file_name AS attachment_file_name_fi,
                    a_fi.attachment_upload_date AS attachment_upload_date_fi,
                    a_sv.attachment_file_key AS attachment_file_key_sv,
                    a_sv.attachment_file_name AS attachment_file_name_sv,
                    a_sv.attachment_upload_date AS attachment_upload_date_sv
                FROM $table AS c
                JOIN certificate_attachment AS a_fi ON c.attachment_file_key_fi = a_fi.attachment_file_key
                LEFT JOIN certificate_attachment AS a_sv ON c.attachment_file_key_sv = a_sv.attachment_file_key
                WHERE c.certificate_id = ?
                ORDER BY c.certificate_version
            """.trimIndent()
        }

        return jdbcTemplate.query(sql, { rs, _ -> mapper(rs, exam) }, id)
    }

    fun createNewVersionOfSukoCertificate(
        id: Int,
        certificateDtoIn: SukoCertificateDtoIn,
        sukoAttachmentSource: Either<Int, MultipartFile?>
    ): Int? {
        val attachmentSource = when (sukoAttachmentSource) {
            is Either.Left -> Either.Left(sukoAttachmentSource.value)
            is Either.Right -> Either.Right(Pair(sukoAttachmentSource.value, sukoAttachmentSource.value))
        }
        return createNewVersionOfCertificate(
            id,
            certificateDtoIn,
            attachmentSource
        ) { attachmentKeys, version, authorOid ->
            jdbcTemplate.update(
                """
                INSERT INTO suko_certificate (
                    certificate_id,                                
                    certificate_name_fi,
                    suko_certificate_description_fi,
                    certificate_publish_state,
                    attachment_file_key_fi,
                    attachment_file_key_sv,
                    certificate_author_oid,
                    certificate_updater_oid,
                    certificate_version
                )
                VALUES (?, ?, ?, ?::publish_state, ?, ?, ?, ?, ?)
                """.trimIndent(),
                id,
                certificateDtoIn.nameFi,
                certificateDtoIn.descriptionFi,
                certificateDtoIn.publishState.toString(),
                attachmentKeys.first,
                attachmentKeys.first,
                authorOid,
                Kayttajatiedot.fromSecurityContext().oidHenkilo,
                version
            )
        }
    }

    fun createNewVersionOfLdCertificate(
        id: Int,
        certificateDtoIn: LdCertificateDtoIn,
        attachmentSource: Either<Int, Pair<MultipartFile?, MultipartFile?>>,
    ): Int? =
        createNewVersionOfCertificate(
            id,
            certificateDtoIn,
            attachmentSource
        ) { createdAttachments, version, authorOid ->
            jdbcTemplate.update(
                """
                INSERT INTO ld_certificate (
                    certificate_id,
                    certificate_name_fi,
                    certificate_name_sv,
                    ld_certificate_aine_koodi_arvo,
                    certificate_publish_state,
                    attachment_file_key_fi,
                    attachment_file_key_sv,
                    certificate_author_oid,
                    certificate_updater_oid,
                    certificate_version
                )
                VALUES (?, ?, ?, ?, ?::publish_state, ?, ?, ?, ?, ?)
                """.trimIndent(),
                id,
                certificateDtoIn.nameFi,
                certificateDtoIn.nameSv,
                certificateDtoIn.aineKoodiArvo,
                certificateDtoIn.publishState.toString(),
                createdAttachments.first,
                createdAttachments.second,
                authorOid,
                Kayttajatiedot.fromSecurityContext().oidHenkilo,
                version
            )

        }

    fun createNewVersionOfPuhviCertificate(
        id: Int,
        certificateDtoIn: PuhviCertificateDtoIn,
        attachmentSource: Either<Int, Pair<MultipartFile?, MultipartFile?>>
    ): Int? =
        createNewVersionOfCertificate(
            id,
            certificateDtoIn,
            attachmentSource
        ) { createdAttachments, version, authorOid ->
            jdbcTemplate.update(
                """
                INSERT INTO puhvi_certificate (
                    certificate_id,
                    certificate_name_fi,
                    certificate_name_Sv,
                    puhvi_certificate_description_fi,
                    puhvi_certificate_description_sv,
                    certificate_publish_state,
                    attachment_file_key_fi,
                    attachment_file_key_sv,
                    certificate_author_oid,
                    certificate_updater_oid,
                    certificate_version
                )
                VALUES (?, ?, ?, ?, ?, ?::publish_state, ?, ?, ?, ?, ?)
                """.trimIndent(),
                id,
                certificateDtoIn.nameFi,
                certificateDtoIn.nameSv,
                certificateDtoIn.descriptionFi,
                certificateDtoIn.descriptionSv,
                certificateDtoIn.publishState.toString(),
                createdAttachments.first,
                createdAttachments.second,
                authorOid,
                Kayttajatiedot.fromSecurityContext().oidHenkilo,
                version
            )
        }

    private fun createNewAttachmentIfPresent(attachment: MultipartFile?): String? =
        attachment?.let { createAttachment(it).fileKey }

    private fun getCurrentOrNewAttachmentKeys(
        attachmentSourceCertificate: CertificateOut,
        attachmentSource: Either<Int, Pair<MultipartFile?, MultipartFile?>>,
    ): Pair<String, String> = when (attachmentSource) {
        is Either.Left -> Pair(
            attachmentSourceCertificate.attachmentFi.fileKey,
            attachmentSourceCertificate.attachmentSv.fileKey
        )

        is Either.Right -> when (attachmentSourceCertificate.exam) {
            Exam.SUKO -> {
                val attachmentFileKey = createNewAttachmentIfPresent(attachmentSource.value.first)
                    ?: attachmentSourceCertificate.attachmentFi.fileKey
                Pair(attachmentFileKey, attachmentFileKey)
            }

            Exam.PUHVI, Exam.LD -> Pair(
                createNewAttachmentIfPresent(attachmentSource.value.first)
                    ?: attachmentSourceCertificate.attachmentFi.fileKey,
                createNewAttachmentIfPresent(attachmentSource.value.second)
                    ?: attachmentSourceCertificate.attachmentSv.fileKey
            )
        }
    }

    private fun getLatestAssignmentVersionAndAuthor(id: Int, exam: Exam): Pair<Int, String>? = try {
        jdbcTemplate.queryForObject(
            """
            SELECT certificate_version, certificate_author_oid
            FROM ${tableNameAndMapperByExam(exam).first}
            WHERE certificate_id = ? AND certificate_version = (SELECT MAX(certificate_version) FROM ${
                tableNameAndMapperByExam(
                    exam
                ).first
            } WHERE certificate_id = ?);""".trimIndent(),
            { rs, _ -> Pair(rs.getInt("certificate_version"), rs.getString("certificate_author_oid")) },
            id, id
        )
    } catch (e: EmptyResultDataAccessException) {
        null
    }


    private fun createNewVersionOfCertificate(
        id: Int,
        certificateDtoIn: Certificate,
        attachmentSource: Either<Int, Pair<MultipartFile?, MultipartFile?>>,
        updateCertificateRow: (Pair<String, String>, version: Int, authorOid: String) -> Unit
    ): Int? = transactionTemplate.execute { _ ->
        val (latestAssignmentVersion, author) =
            getLatestAssignmentVersionAndAuthor(id, certificateDtoIn.exam) ?: return@execute null

        if (attachmentSource is Either.Left && attachmentSource.value == latestAssignmentVersion) {
            throw ResponseStatusException(HttpStatus.BAD_REQUEST, "Cannot restore latest version")
        }

        val attachmentSourceCertificate: CertificateOut =
            getCertificateById(id, certificateDtoIn.exam, attachmentSource.leftOrNull()) ?: return@execute null
        val attachmentKeys = getCurrentOrNewAttachmentKeys(attachmentSourceCertificate, attachmentSource)

        val newVersion = latestAssignmentVersion + 1
        updateCertificateRow(attachmentKeys, newVersion, author)

        return@execute id
    }
}
