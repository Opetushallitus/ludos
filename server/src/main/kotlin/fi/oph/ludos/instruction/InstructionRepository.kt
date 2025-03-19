package fi.oph.ludos.instruction

import fi.oph.ludos.Exam
import fi.oph.ludos.INITIAL_VERSION_NUMBER
import fi.oph.ludos.Language
import fi.oph.ludos.PublishState
import fi.oph.ludos.auth.Kayttajatiedot
import fi.oph.ludos.auth.Role
import fi.oph.ludos.aws.Bucket
import fi.oph.ludos.aws.S3Helper
import fi.oph.ludos.repository.getKotlinArray
import fi.oph.ludos.repository.getKotlinList
import org.slf4j.Logger
import org.slf4j.LoggerFactory
import org.springframework.dao.DataIntegrityViolationException
import org.springframework.dao.EmptyResultDataAccessException
import org.springframework.http.HttpStatus
import org.springframework.jdbc.core.JdbcTemplate
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate
import org.springframework.stereotype.Component
import org.springframework.transaction.support.TransactionTemplate
import org.springframework.web.multipart.MultipartFile
import org.springframework.web.server.ResponseStatusException
import software.amazon.awssdk.core.exception.SdkException
import java.sql.ResultSet
import java.sql.Timestamp
import java.util.*

@Component
class InstructionRepository(
    private val namedJdbcTemplate: NamedParameterJdbcTemplate,
    private val jdbcTemplate: JdbcTemplate,
    private val transactionTemplate: TransactionTemplate,
    private val s3Helper: S3Helper
) {
    val logger: Logger = LoggerFactory.getLogger(javaClass)

    fun tableNameByExam(exam: Exam) = when (exam) {
        Exam.SUKO -> "suko_instruction"
        Exam.PUHVI -> "puhvi_instruction"
        Exam.LD -> "ld_instruction"
    }

    fun publishStateFilter(role: Role) = when (role) {
        Role.OPETTAJA -> "AND i.instruction_publish_state = '${PublishState.PUBLISHED}'"
        else -> "AND i.instruction_publish_state in ('${PublishState.PUBLISHED}', '${PublishState.DRAFT}')"
    }

    fun newInstructionAttachmentFileKey() = "ohjeliite_${UUID.randomUUID()}"

    fun createInstruction(instruction: Instruction, attachment: List<InstructionAttachmentIn>) = when (instruction) {
        is SukoInstructionDtoIn -> createSukoInstruction(instruction, attachment)
        is PuhviInstructionDtoIn -> createPuhviInstruction(instruction, attachment)
        is LdInstructionDtoIn -> createLdInstruction(instruction, attachment)
        else -> throw ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid certificate type")
    }

    fun createInstruction(
        instruction: Instruction,
        attachments: List<InstructionAttachmentIn>,
        insertInstructionRow: (version: Int) -> Long?
    ) = transactionTemplate.execute { _ ->
        val instructionVersion = INITIAL_VERSION_NUMBER
        val id = insertInstructionRow(instructionVersion) ?: return@execute null

        val attachmentWithInstructionVersion = { metadata: InstructionAttachmentMetadataDtoIn ->
            metadata.copy(instructionVersion = instructionVersion)
        }

        for (attachment in attachments) {
            val fileKey = newInstructionAttachmentFileKey()
            uploadInstructionAttachmentToS3(fileKey, attachment.file)
            insertInstructionAttachment(
                tableNameByExam(instruction.exam),
                id,
                attachmentWithInstructionVersion(attachment.metadata),
                attachment.file.originalFilename!!,
                fileKey
            )
        }

        getInstructionById(instruction.exam, id.toInt())
    }!!

    fun createSukoInstruction(
        instruction: SukoInstructionDtoIn,
        attachments: List<InstructionAttachmentIn>
    ): InstructionOut = createInstruction(instruction, attachments) { instructionVersion ->
        jdbcTemplate.queryForObject(
            """INSERT INTO suko_instruction (
                instruction_name_fi, 
                instruction_name_sv, 
                instruction_content_fi, 
                instruction_content_sv, 
                suko_instruction_short_description_fi,
                suko_instruction_short_description_sv,
                instruction_publish_state, 
                instruction_author_oid,
                instruction_updater_oid,
                instruction_version
            ) 
            VALUES (?, ?, ?, ?, ?, ?, ?::publish_state, ?, ?, ?) 
            RETURNING instruction_id""".trimIndent(),
            Long::class.java,
            instruction.nameFi,
            instruction.nameSv,
            instruction.contentFi,
            instruction.contentSv,
            instruction.shortDescriptionFi,
            instruction.shortDescriptionSv,
            instruction.publishState.toString(),
            Kayttajatiedot.fromSecurityContext().oidHenkilo,
            Kayttajatiedot.fromSecurityContext().oidHenkilo,
            instructionVersion
        )
    }

    fun createLdInstruction(
        instruction: LdInstructionDtoIn,
        attachments: List<InstructionAttachmentIn>
    ): InstructionOut = createInstruction(instruction, attachments) { instructionVersion ->
        jdbcTemplate.queryForObject(
            """INSERT INTO ld_instruction (
                instruction_name_fi, 
                instruction_name_sv, 
                instruction_content_fi, 
                instruction_content_sv, 
                instruction_publish_state, 
                instruction_author_oid,
                instruction_updater_oid,
                ld_instruction_aine_koodi_arvo,
                instruction_version
            ) 
            VALUES (?, ?, ?, ?, ?::publish_state, ?, ?, ?, ?) 
            RETURNING instruction_id""".trimIndent(),
            Long::class.java,
            instruction.nameFi,
            instruction.nameSv,
            instruction.contentFi,
            instruction.contentSv,
            instruction.publishState.toString(),
            Kayttajatiedot.fromSecurityContext().oidHenkilo,
            Kayttajatiedot.fromSecurityContext().oidHenkilo,
            instruction.aineKoodiArvo,
            instructionVersion
        )
    }

    fun createPuhviInstruction(
        instruction: PuhviInstructionDtoIn,
        attachments: List<InstructionAttachmentIn>
    ): InstructionOut = createInstruction(instruction, attachments) { instructionVersion ->
        jdbcTemplate.queryForObject(
            """INSERT INTO puhvi_instruction (
                instruction_name_fi, 
                instruction_name_sv, 
                instruction_content_fi, 
                instruction_content_sv, 
                puhvi_instruction_short_description_fi,
                puhvi_instruction_short_description_sv,
                instruction_publish_state, 
                instruction_author_oid,
                instruction_updater_oid,
                instruction_version
            ) 
            VALUES (?, ?, ?, ?, ?, ?, ?::publish_state, ?, ?, ?) 
            RETURNING instruction_id""".trimIndent(),
            Long::class.java,
            instruction.nameFi,
            instruction.nameSv,
            instruction.contentFi,
            instruction.contentSv,
            instruction.shortDescriptionFi,
            instruction.shortDescriptionSv,
            instruction.publishState.toString(),
            Kayttajatiedot.fromSecurityContext().oidHenkilo,
            Kayttajatiedot.fromSecurityContext().oidHenkilo,
            instructionVersion
        )
    }

    private fun uploadInstructionAttachmentToS3(fileKey: String, attachment: MultipartFile) {
        try {
            s3Helper.putObject(Bucket.INSTRUCTION, fileKey, attachment)
        } catch (ex: SdkException) {
            val errorMsg = "Failed to upload file '${attachment.originalFilename}' to S3"
            logger.error(errorMsg, ex)
            throw ResponseStatusException(HttpStatus.BAD_GATEWAY, errorMsg)
        }
    }

    private fun insertInstructionAttachment(
        table: String,
        instructionId: Long,
        metadata: InstructionAttachmentMetadataDtoIn,
        originalFilename: String,
        fileKey: String
    ): InstructionAttachmentDtoOut {
        val uploadDates = jdbcTemplate.query(
            """INSERT INTO ${table}_attachment (
                        attachment_file_key, 
                        attachment_file_name, 
                        attachment_upload_date,
                        instruction_id, 
                        instruction_version,
                        instruction_attachment_name,
                        instruction_attachment_language
                    )
               VALUES (?, ?, clock_timestamp(), ?, ?, ?, ?::language)
               RETURNING attachment_upload_date""".trimIndent(),
            { rs: ResultSet, _: Int -> rs.getTimestamp("attachment_upload_date") },
            fileKey,
            originalFilename,
            instructionId,
            metadata.instructionVersion,
            metadata.name,
            metadata.language.toString()
        )

        return InstructionAttachmentDtoOut(
            fileKey, originalFilename, uploadDates[0], metadata.name, metadata.language, metadata.instructionVersion
        )
    }

    private fun mapResultSetInstructionAttachment(rs: ResultSet): List<InstructionAttachmentDtoOut> {
        val attachmentFileKeys = rs.getKotlinArray<String?>("attachment_file_keys")
        val attachmentFileNames = rs.getKotlinArray<String>("attachment_file_names")
        val attachmentUploadDates = rs.getKotlinArray<Timestamp>("attachment_upload_dates")
        val instructionAttachmentNames = rs.getKotlinArray<String>("instruction_attachment_names")
        val instructionAttachmentLanguages = rs.getKotlinArray<String>("instruction_attachment_languages")

        val attachments = if (attachmentFileKeys[0] != null && attachmentFileNames.isNotEmpty()) {
            attachmentFileKeys.indices.map { i ->
                InstructionAttachmentDtoOut(
                    attachmentFileKeys[i]!!,
                    attachmentFileNames[i],
                    attachmentUploadDates[i],
                    instructionAttachmentNames[i],
                    Language.valueOf(
                        instructionAttachmentLanguages[i],
                    ),
                    rs.getInt("instruction_version")
                )
            }.sortedBy { it.fileUploadDate }
        } else emptyList()

        return attachments
    }

    val mapResultSetSuko: (ResultSet, Int) -> SukoInstructionDtoOut? =
        { rs: ResultSet, _: Int ->
            val attachments = mapResultSetInstructionAttachment(rs)

            SukoInstructionDtoOut(
                rs.getInt("instruction_id"),
                rs.getString("instruction_name_fi"),
                rs.getString("instruction_name_sv"),
                rs.getString("instruction_content_fi"),
                rs.getString("instruction_content_sv"),
                rs.getString("suko_instruction_short_description_fi"),
                rs.getString("suko_instruction_short_description_sv"),
                PublishState.valueOf(rs.getString("instruction_publish_state")),
                attachments,
                rs.getString("instruction_author_oid"),
                rs.getString("instruction_updater_oid"),
                null,
                rs.getTimestamp("instruction_created_at"),
                rs.getTimestamp("instruction_updated_at"),
                rs.getInt("instruction_version"),
                Exam.SUKO,
            )
        }

    val mapResultSetLd: (ResultSet, Int) -> LdInstructionDtoOut? = { rs: ResultSet, _: Int ->
        val attachments = mapResultSetInstructionAttachment(rs)

        LdInstructionDtoOut(
            rs.getInt("instruction_id"),
            rs.getString("instruction_name_fi"),
            rs.getString("instruction_name_sv"),
            rs.getString("instruction_content_fi"),
            rs.getString("instruction_content_sv"),
            PublishState.valueOf(rs.getString("instruction_publish_state")),
            rs.getString("ld_instruction_aine_koodi_arvo"),
            attachments,
            rs.getString("instruction_author_oid"),
            rs.getString("instruction_updater_oid"),
            null,
            rs.getTimestamp("instruction_created_at"),
            rs.getTimestamp("instruction_updated_at"),
            rs.getInt("instruction_version"),
            Exam.LD,
        )
    }

    val mapResultSetPuhvi: (ResultSet, Int) -> PuhviInstructionDtoOut? =
        { rs: ResultSet, _: Int ->
            val attachments = mapResultSetInstructionAttachment(rs)

            PuhviInstructionDtoOut(
                rs.getInt("instruction_id"),
                rs.getString("instruction_name_fi"),
                rs.getString("instruction_name_sv"),
                rs.getString("instruction_content_fi"),
                rs.getString("instruction_content_sv"),
                rs.getString("puhvi_instruction_short_description_fi"),
                rs.getString("puhvi_instruction_short_description_sv"),
                PublishState.valueOf(rs.getString("instruction_publish_state")),
                attachments,
                rs.getString("instruction_author_oid"),
                rs.getString("instruction_updater_oid"),
                null,
                rs.getTimestamp("instruction_created_at"),
                rs.getTimestamp("instruction_updated_at"),
                rs.getInt("instruction_version"),
                Exam.PUHVI,
            )
        }

    fun getInstructionById(exam: Exam, id: Int, version: Int? = null): InstructionOut? {
        val role = Kayttajatiedot.fromSecurityContext().role
        val table = tableNameByExam(exam)
        val mapper = when (exam) {
            Exam.SUKO -> mapResultSetSuko
            Exam.LD -> mapResultSetLd
            Exam.PUHVI -> mapResultSetPuhvi
        }

        val versionCondition = version?.let { "AND i.instruction_version = $version" }
            ?: "AND i.instruction_version = (SELECT MAX(instruction_version) FROM $table WHERE instruction_id = i.instruction_id)"

        val groupByConditionByExam = when (exam) {
            Exam.SUKO -> "i.suko_instruction_short_description_fi, i.suko_instruction_short_description_sv"
            Exam.LD -> "i.ld_instruction_aine_koodi_arvo"
            Exam.PUHVI -> "i.puhvi_instruction_short_description_fi, i.puhvi_instruction_short_description_sv"
        }

        val sql = """
            SELECT
                 i.*,
                 ARRAY_AGG(ia.attachment_file_key) AS attachment_file_keys,
                 ARRAY_AGG(ia.attachment_file_name) AS attachment_file_names,
                 ARRAY_AGG(ia.attachment_upload_date) AS attachment_upload_dates,
                 ARRAY_AGG(ia.instruction_attachment_name) AS instruction_attachment_names,
                 ARRAY_AGG(ia.instruction_attachment_language) AS instruction_attachment_languages
            FROM $table i
            LEFT JOIN ${table}_attachment ia ON i.instruction_id = ia.instruction_id AND i.instruction_version = ia.instruction_version
            WHERE i.instruction_id = ? $versionCondition ${publishStateFilter(role)}
            GROUP BY
                i.instruction_id, 
                i.instruction_version, 
                i.instruction_name_fi, 
                i.instruction_name_sv, 
                i.instruction_content_fi, 
                i.instruction_content_sv, 
                i.instruction_publish_state, 
                i.instruction_author_oid,
                i.instruction_updater_oid,
                $groupByConditionByExam;"""

        return jdbcTemplate.query(sql, mapper, id).firstOrNull()
    }

    fun getAllVersionsOfInstruction(id: Int, exam: Exam): List<InstructionOut> {
        val (table, mapper) = when (exam) {
            Exam.SUKO -> "suko_instruction" to mapResultSetSuko
            Exam.LD -> "ld_instruction" to mapResultSetLd
            Exam.PUHVI -> "puhvi_instruction" to mapResultSetPuhvi
        }

        val groupByConditionByExam = when (exam) {
            Exam.SUKO -> "i.suko_instruction_short_description_fi, i.suko_instruction_short_description_sv"
            Exam.LD -> "i.ld_instruction_aine_koodi_arvo"
            Exam.PUHVI -> "i.puhvi_instruction_short_description_fi, i.puhvi_instruction_short_description_sv"
        }

        val sql = """
            SELECT
                 i.*,
                 ARRAY_AGG(ia.attachment_file_key) AS attachment_file_keys,
                 ARRAY_AGG(ia.attachment_file_name) AS attachment_file_names,
                 ARRAY_AGG(ia.attachment_upload_date) AS attachment_upload_dates,
                 ARRAY_AGG(ia.instruction_attachment_name) AS instruction_attachment_names,
                 ARRAY_AGG(ia.instruction_attachment_language) AS instruction_attachment_languages
            FROM $table i
            LEFT JOIN ${table}_attachment ia ON i.instruction_id = ia.instruction_id AND i.instruction_version = ia.instruction_version
            WHERE i.instruction_id = ?
            GROUP BY
                i.instruction_id, 
                i.instruction_version, 
                i.instruction_name_fi, 
                i.instruction_name_sv, 
                i.instruction_content_fi, 
                i.instruction_content_sv, 
                i.instruction_publish_state, 
                i.instruction_author_oid,
                i.instruction_updater_oid,
                $groupByConditionByExam
            ORDER BY i.instruction_version;"""

        return jdbcTemplate.query(sql, mapper, id)
    }

    private fun examSpecificFilters(
        filters: InstructionBaseFilters,
    ): Pair<String, MapSqlParameterSource> {
        val queryBuilder = StringBuilder()
        val parameters = MapSqlParameterSource()
        if (filters is LdInstructionFilters && filters.aine != null) {
            val values = filters.aine.split(",")
            queryBuilder.append(" AND ld_instruction_aine_koodi_arvo IN (:aineKoodiArvo)")
            parameters.addValue("aineKoodiArvo", values)
        }
        return Pair(queryBuilder.toString(), parameters)
    }

    private fun listMetadata(
        filters: InstructionBaseFilters,
        role: Role,
    ): InstructionFilterOptions {
        return when (filters) {
            is SukoInstructionFilters -> SukoInstructionFilterOptionsDtoOut()
            is LdInstructionFilters -> ldListMetadata(filters, role)
            is PuhviInstructionFilters -> PuhviInstructionFilterOptionsDtoOut()
        }
    }

    private val ldListMetadataResultSetExtractor: (ResultSet) -> LdInstructionFilterOptionsDtoOut = { rs: ResultSet ->
        rs.next()

        LdInstructionFilterOptionsDtoOut(
            aine = rs.getKotlinList("aine_array"),
        )
    }

    private fun ldListMetadata(
        filters: LdInstructionFilters,
        role: Role
    ): LdInstructionFilterOptionsDtoOut {
        val parameters = MapSqlParameterSource()

        fun buildFilters(filters: LdInstructionFilters): String {
            val (ldFilterString, ldFilterParameters) = examSpecificFilters(filters)
            parameters.addValues(ldFilterParameters.values)
            return "$ldFilterString ${publishStateFilter(role)}"
        }

        val queryBuilder = StringBuilder(
            """
            SELECT ARRAY(SELECT DISTINCT ld_instruction_aine_koodi_arvo
                         FROM ld_instruction i WHERE TRUE ${buildFilters(filters.copy(aine = null))}
                         ORDER BY ld_instruction_aine_koodi_arvo) as aine_array
         """.trimIndent()
        )

        return namedJdbcTemplate.query(queryBuilder.toString(), parameters, ldListMetadataResultSetExtractor)!!
    }

    private fun listInstructions(filters: InstructionBaseFilters, exam: Exam, role: Role): List<InstructionOut> {
        val table = tableNameByExam(exam)
        val mapper = when (exam) {
            Exam.SUKO -> mapResultSetSuko
            Exam.PUHVI -> mapResultSetPuhvi
            Exam.LD -> mapResultSetLd
        }

        val parameters = MapSqlParameterSource()
        val filterBuilder = StringBuilder()

        filterBuilder.append("true ${publishStateFilter(role)}")

        val (examSpecificFilterQuery, examSpecificFilterParameters) = examSpecificFilters(filters)
        filterBuilder.append(examSpecificFilterQuery)
        parameters.addValues(examSpecificFilterParameters.values)

        val orderDirection = filters.jarjesta ?: ""

        val additionalSelectFields = when (exam) {
            Exam.SUKO -> "i.suko_instruction_short_description_fi, i.suko_instruction_short_description_sv"
            Exam.LD -> "i.ld_instruction_aine_koodi_arvo"
            Exam.PUHVI -> "i.puhvi_instruction_short_description_fi, i.puhvi_instruction_short_description_sv"
        }

        val sql = """SELECT
                     i.*,
                     ARRAY_AGG(ia.attachment_file_key) AS attachment_file_keys,
                     ARRAY_AGG(ia.attachment_file_name) AS attachment_file_names,
                     ARRAY_AGG(ia.attachment_upload_date) AS attachment_upload_dates,
                     ARRAY_AGG(ia.instruction_attachment_name) AS instruction_attachment_names,
                     ARRAY_AGG(ia.instruction_attachment_language) AS instruction_attachment_languages
                FROM
                    $table i 
                INNER JOIN (
                    SELECT instruction_id, MAX(instruction_version) as latest_version
                    FROM $table
                    GROUP BY instruction_id
                ) latest ON i.instruction_id = latest.instruction_id AND i.instruction_version = latest.latest_version
                LEFT JOIN ${table}_attachment ia on i.instruction_id = ia.instruction_id AND i.instruction_version = ia.instruction_version
                WHERE $filterBuilder
                GROUP BY
                    i.instruction_id, 
                    i.instruction_version,
                    i.instruction_name_fi, 
                    i.instruction_name_sv, 
                    i.instruction_content_fi, 
                    i.instruction_content_sv, 
                    i.instruction_publish_state, 
                    i.instruction_author_oid,
                    i.instruction_updater_oid,
                    $additionalSelectFields
                ORDER BY i.instruction_updated_at $orderDirection;"""

        return namedJdbcTemplate.query(sql, parameters, mapper)
    }

    fun getInstructions(
        exam: Exam,
        filters: InstructionBaseFilters
    ): InstructionListDtoOut<InstructionOut, InstructionFilterOptions> {
        val role = Kayttajatiedot.fromSecurityContext().role
        val result = listInstructions(filters, exam, role)

        val metadata = listMetadata(
            filters,
            role
        )

        return InstructionListDtoOut(
            result,
            metadata
        )
    }

    private fun getLatestInstructioDataForNewVersion(id: Int, exam: Exam): Triple<Int, String, Timestamp>? = try {
        jdbcTemplate.queryForObject(
            """
            SELECT instruction_version, instruction_author_oid, instruction_created_at
            FROM ${tableNameByExam(exam)}
            WHERE instruction_id = ? AND instruction_version = (SELECT MAX(instruction_version) FROM ${
                tableNameByExam(
                    exam
                )
            } WHERE instruction_id = ?) FOR UPDATE;""".trimIndent(),
            { rs, _ ->
                Triple(
                    rs.getInt("instruction_version"),
                    rs.getString("instruction_author_oid"),
                    rs.getTimestamp("instruction_created_at")
                )
            },
            id, id
        )
    } catch (e: EmptyResultDataAccessException) {
        null
    }

    fun <T : Instruction> createNewVersionOfInstruction(
        id: Int,
        instructionDtoIn: T,
        attachmentsMetadata: List<InstructionAttachmentMetadataDtoIn>,
        newAttachments: List<InstructionAttachmentIn>,
        updateInstructionRow: (versionToCreate: Int, authorOid: String, originalCreatedAt: Timestamp) -> Unit
    ): Int? = transactionTemplate.execute { _ ->
        val (currentLatestVersion, authorOid, createdAt) = getLatestInstructioDataForNewVersion(
            id,
            instructionDtoIn.exam
        )
            ?: return@execute null

        val versionToCreate = currentLatestVersion + 1

        updateInstructionRow(versionToCreate, authorOid, createdAt)

        val attachmentWithInstructionVersion = { metadata: InstructionAttachmentMetadataDtoIn ->
            metadata.copy(instructionVersion = versionToCreate)
        }

        val table = tableNameByExam(instructionDtoIn.exam)

        for (attachment in newAttachments) {
            val fileKey = newInstructionAttachmentFileKey()
            uploadInstructionAttachmentToS3(fileKey, attachment.file)
            insertInstructionAttachment(
                table,
                id.toLong(),
                attachmentWithInstructionVersion(attachment.metadata),
                attachment.file.originalFilename!!,
                fileKey
            )
        }

        for (attachmentMetadata in attachmentsMetadata) {
            val sql = """
            INSERT INTO ${table}_attachment (
                attachment_file_key, 
                attachment_file_name, 
                attachment_upload_date,
                instruction_id, 
                instruction_version,
                instruction_attachment_name,
                instruction_attachment_language
            )
            VALUES (
                :attachmentFileKey, 
                (SELECT attachment_file_name FROM ${table}_attachment ia WHERE ia.attachment_file_key = :attachmentFileKey LIMIT 1), 
                clock_timestamp(), 
                :instructionId, 
                :instructionVersion, 
                :attachmentName, 
                :attachmentLanguage::language
            )
            """.trimIndent()

            val params = MapSqlParameterSource()
                .addValue("attachmentFileKey", attachmentMetadata.fileKey)
                .addValue("instructionId", id)
                .addValue("instructionVersion", versionToCreate)
                .addValue("attachmentName", attachmentMetadata.name)
                .addValue("attachmentLanguage", attachmentMetadata.language.toString())

            try {
                namedJdbcTemplate.update(sql, params)
            } catch (e: DataIntegrityViolationException) {
                if (e.mostSpecificCause.message?.contains("null value in column \"attachment_file_name\"") == true) throw ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Attachment '${attachmentMetadata.fileKey}' not found"
                )
                else throw e
            }
        }

        return@execute versionToCreate
    }

    fun createNewVersionOfSukoInstruction(
        id: Int,
        instruction: SukoInstructionDtoIn,
        attachmentsMetadata: List<InstructionAttachmentMetadataDtoIn>,
        newAttachments: List<InstructionAttachmentIn>
    ): Int? =
        createNewVersionOfInstruction(
            id,
            instruction,
            attachmentsMetadata,
            newAttachments
        ) { versionToCreate, authorOid, originalCreatedAt ->
            jdbcTemplate.update(
                """
            INSERT INTO suko_instruction (
                instruction_id,
                instruction_name_fi, 
                instruction_name_sv, 
                instruction_content_fi, 
                instruction_content_sv, 
                instruction_publish_state,
                suko_instruction_short_description_fi,
                suko_instruction_short_description_sv,
                instruction_author_oid,
                instruction_updater_oid,
                instruction_version,
                instruction_created_at
            ) VALUES (?, ?, ?, ?, ?, ?::publish_state, ?, ?, ?, ?, ?, ?)
            """.trimIndent(),
                id,
                instruction.nameFi,
                instruction.nameSv,
                instruction.contentFi,
                instruction.contentSv,
                instruction.publishState.toString(),
                instruction.shortDescriptionFi,
                instruction.shortDescriptionSv,
                authorOid,
                Kayttajatiedot.fromSecurityContext().oidHenkilo,
                versionToCreate,
                originalCreatedAt
            )
        }

    fun createNewVersionOfLdInstruction(
        id: Int,
        instruction: LdInstructionDtoIn,
        attachmentsMetadata: List<InstructionAttachmentMetadataDtoIn>,
        newAttachments: List<InstructionAttachmentIn>
    ): Int? =
        createNewVersionOfInstruction(
            id,
            instruction,
            attachmentsMetadata,
            newAttachments
        ) { versionToCreate, authorOid, originalCreatedAt ->
            jdbcTemplate.update(
                """INSERT INTO ld_instruction (
                instruction_id,
                instruction_name_fi, 
                instruction_name_sv, 
                instruction_content_fi, 
                instruction_content_sv, 
                instruction_publish_state, 
                instruction_author_oid,
                instruction_updater_oid,
                ld_instruction_aine_koodi_arvo,
                instruction_version,
                instruction_created_at
            ) 
            VALUES (?, ?, ?, ?, ?, ?::publish_state, ?, ?, ?, ?, ?)""".trimIndent(),
                id,
                instruction.nameFi,
                instruction.nameSv,
                instruction.contentFi,
                instruction.contentSv,
                instruction.publishState.toString(),
                authorOid,
                Kayttajatiedot.fromSecurityContext().oidHenkilo,
                instruction.aineKoodiArvo,
                versionToCreate,
                originalCreatedAt
            )
        }

    fun createNewVersionOfPuhviInstruction(
        id: Int,
        instruction: PuhviInstructionDtoIn,
        attachmentsMetadata: List<InstructionAttachmentMetadataDtoIn>,
        newAttachments: List<InstructionAttachmentIn>
    ): Int? =
        createNewVersionOfInstruction(
            id,
            instruction,
            attachmentsMetadata,
            newAttachments
        ) { versionToCreate, authorOid, originalCreatedAt ->
            jdbcTemplate.update(
                """INSERT INTO puhvi_instruction (
                instruction_id,
                instruction_name_fi, 
                instruction_name_sv, 
                instruction_content_fi, 
                instruction_content_sv, 
                puhvi_instruction_short_description_fi,
                puhvi_instruction_short_description_sv,
                instruction_publish_state, 
                instruction_author_oid,
                instruction_updater_oid,
                instruction_version,
                instruction_created_at
            ) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?::publish_state, ?, ?, ?, ?) """.trimIndent(),
                id,
                instruction.nameFi,
                instruction.nameSv,
                instruction.contentFi,
                instruction.contentSv,
                instruction.shortDescriptionFi,
                instruction.shortDescriptionSv,
                instruction.publishState.toString(),
                authorOid,
                Kayttajatiedot.fromSecurityContext().oidHenkilo,
                versionToCreate,
                originalCreatedAt
            )
        }

    fun getAttachmentByFileKey(exam: Exam, fileKey: String, version: Int?): InstructionAttachmentDtoOut? {
        val tableName = tableNameByExam(exam)
        val paramMap = mapOf("fileKey" to fileKey, "version" to version)

        val versionCondition = version?.let { "AND ia.instruction_version = :version" }
            ?: "AND ia.instruction_version = (SELECT MAX(i.instruction_version) FROM $tableName i WHERE ia.instruction_id = i.instruction_id)"

        val results = namedJdbcTemplate.query(
            """
                SELECT 
                    attachment_file_key, 
                    attachment_file_name, 
                    attachment_upload_date, 
                    instruction_attachment_name, 
                    instruction_attachment_language, 
                    instruction_version
                FROM ${tableName}_attachment ia
                WHERE ia.attachment_file_key = :fileKey $versionCondition
            """.trimIndent(), paramMap
        ) { rs, _ ->
            InstructionAttachmentDtoOut(
                rs.getString("attachment_file_key"),
                rs.getString("attachment_file_name"),
                rs.getTimestamp("attachment_upload_date"),
                rs.getString("instruction_attachment_name"),
                Language.valueOf(rs.getString("instruction_attachment_language")),
                rs.getInt("instruction_version")
            )
        }

        return results.firstOrNull()
    }
}
