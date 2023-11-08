package fi.oph.ludos.instruction

import Language
import fi.oph.ludos.Exam
import fi.oph.ludos.PublishState
import fi.oph.ludos.auth.Kayttajatiedot
import fi.oph.ludos.auth.Role
import fi.oph.ludos.repository.getKotlinArray
import fi.oph.ludos.s3.Bucket
import fi.oph.ludos.s3.S3Helper
import org.slf4j.Logger
import org.slf4j.LoggerFactory
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

    fun getTableNameByExam(exam: Exam) = when (exam) {
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
        insertInstructionRow: () -> Long
    ) = transactionTemplate.execute { _ ->
        val id = insertInstructionRow()

        for (attachment in attachments) {
            val fileKey = newInstructionAttachmentFileKey()
            uploadInstructionAttachmentToS3(fileKey, attachment.file)
            insertInstructionAttachment(
                getTableNameByExam(instruction.exam),
                id,
                attachment.metadata,
                attachment.file.originalFilename!!,
                fileKey
            )
        }

        getInstructionById(instruction.exam, id.toInt())
    }!!

    fun createSukoInstruction(
        instruction: SukoInstructionDtoIn,
        attachments: List<InstructionAttachmentIn>
    ): InstructionOut = createInstruction(instruction, attachments) {
        jdbcTemplate.queryForObject(
            """INSERT INTO suko_instruction (
                instruction_name_fi, 
                instruction_name_sv, 
                instruction_content_fi, 
                instruction_content_sv, 
                suko_instruction_short_description_fi,
                suko_instruction_short_description_sv,
                instruction_publish_state, 
                instruction_author_oid
            ) 
            VALUES (?, ?, ?, ?, ?, ?, ?::publish_state, ?) 
            RETURNING instruction_id""".trimIndent(),
            Long::class.java,
            instruction.nameFi,
            instruction.nameSv,
            instruction.contentFi,
            instruction.contentSv,
            instruction.shortDescriptionFi,
            instruction.shortDescriptionSv,
            instruction.publishState.toString(),
            Kayttajatiedot.fromSecurityContext().oidHenkilo
        )
    }

    fun createLdInstruction(
        instruction: LdInstructionDtoIn,
        attachments: List<InstructionAttachmentIn>
    ): InstructionOut = createInstruction(instruction, attachments) {
        jdbcTemplate.queryForObject(
            """INSERT INTO ld_instruction (
                instruction_name_fi, 
                instruction_name_sv, 
                instruction_content_fi, 
                instruction_content_sv, 
                instruction_publish_state, 
                instruction_author_oid,
                ld_instruction_aine_koodi_arvo
            ) 
            VALUES (?, ?, ?, ?, ?::publish_state, ?, ?) 
            RETURNING instruction_id""".trimIndent(),
            Long::class.java,
            instruction.nameFi,
            instruction.nameSv,
            instruction.contentFi,
            instruction.contentSv,
            instruction.publishState.toString(),
            Kayttajatiedot.fromSecurityContext().oidHenkilo,
            instruction.aineKoodiArvo
        )
    }

    fun createPuhviInstruction(
        instruction: PuhviInstructionDtoIn,
        attachments: List<InstructionAttachmentIn>
    ): InstructionOut = createInstruction(instruction, attachments) {
        jdbcTemplate.queryForObject(
            """INSERT INTO puhvi_instruction (
                instruction_name_fi, 
                instruction_name_sv, 
                instruction_content_fi, 
                instruction_content_sv, 
                puhvi_instruction_short_description_fi,
                puhvi_instruction_short_description_sv,
                instruction_publish_state, 
                instruction_author_oid
            ) 
            VALUES (?, ?, ?, ?, ?, ?, ?::publish_state, ?) 
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
        )
    }

    private fun uploadInstructionAttachmentToS3(fileKey: String, attachment: MultipartFile) {
        try {
            // todo: oma ämpäri ohjeille
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
                        instruction_attachment_name,
                        instruction_attachment_language
                    )
               VALUES (?, ?, clock_timestamp(), ?, ?, ?::language)
               RETURNING attachment_upload_date""".trimIndent(),
            { rs: ResultSet, _: Int -> rs.getTimestamp("attachment_upload_date") },
            fileKey,
            originalFilename,
            instructionId,
            metadata.name,
            metadata.language.toString()
        )

        return InstructionAttachmentDtoOut(
            fileKey, originalFilename, uploadDates[0], metadata.name, metadata.language
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
                    Language.valueOf(instructionAttachmentLanguages[i])
                )
            }.sortedBy { it.fileUploadDate }
        } else emptyList()

        return attachments
    }

    fun mapResultSetSukoOrPuhvi(exam: Exam, table: String): (ResultSet, Int) -> SukoOrPuhviInstructionDtoOut? =
        { rs: ResultSet, _: Int ->
            val attachments = mapResultSetInstructionAttachment(rs)

            SukoOrPuhviInstructionDtoOut(
                rs.getInt("instruction_id"),
                exam,
                rs.getString("instruction_name_fi"),
                rs.getString("instruction_name_sv"),
                rs.getString("instruction_content_fi"),
                rs.getString("instruction_content_sv"),
                rs.getString("${table}_short_description_fi"),
                rs.getString("${table}_short_description_sv"),
                PublishState.valueOf(rs.getString("instruction_publish_state")),
                attachments,
                rs.getString("instruction_author_oid"),
                rs.getTimestamp("instruction_created_at"),
                rs.getTimestamp("instruction_updated_at"),
            )
        }

    fun mapResultSetLd(exam: Exam, table: String): (ResultSet, Int) -> LdInstructionDtoOut? = { rs: ResultSet, _: Int ->
        val attachments = mapResultSetInstructionAttachment(rs)

        LdInstructionDtoOut(
            rs.getInt("instruction_id"),
            exam,
            rs.getString("instruction_name_fi"),
            rs.getString("instruction_name_sv"),
            rs.getString("instruction_content_fi"),
            rs.getString("instruction_content_sv"),
            PublishState.valueOf(rs.getString("instruction_publish_state")),
            rs.getString("ld_instruction_aine_koodi_arvo"),
            attachments,
            rs.getString("instruction_author_oid"),
            rs.getTimestamp("instruction_created_at"),
            rs.getTimestamp("instruction_updated_at"),
        )
    }

    fun getInstructionById(exam: Exam, id: Int): InstructionOut? {
        val role = Kayttajatiedot.fromSecurityContext().role
        val table = getTableNameByExam(exam)
        val mapper = when (exam) {
            Exam.SUKO -> ::mapResultSetSukoOrPuhvi
            Exam.PUHVI -> ::mapResultSetSukoOrPuhvi
            Exam.LD -> ::mapResultSetLd
        }

        val additionalGroupBy = if (exam === Exam.LD) """
            i.ld_instruction_aine_koodi_arvo
        """.trimIndent() else """
            i.${table}_short_description_fi, 
            i.${table}_short_description_sv
        """.trimIndent()

        val sql = """SELECT
                     i.*,
                     ARRAY_AGG(ia.attachment_file_key) AS attachment_file_keys,
                     ARRAY_AGG(ia.attachment_file_name) AS attachment_file_names,
                     ARRAY_AGG(ia.attachment_upload_date) AS attachment_upload_dates,
                     ARRAY_AGG(ia.instruction_attachment_name) AS instruction_attachment_names,
                     ARRAY_AGG(ia.instruction_attachment_language) AS instruction_attachment_languages
                FROM $table i
                NATURAL LEFT JOIN ${table}_attachment ia
                WHERE instruction_id = ? ${publishStateFilter(role)}
                GROUP BY
                    i.instruction_id, 
                    i.instruction_name_fi, 
                    i.instruction_name_sv, 
                    i.instruction_content_fi, 
                    i.instruction_content_sv, 
                    i.instruction_publish_state, 
                    i.instruction_author_oid,
                    $additionalGroupBy;"""


        val results = jdbcTemplate.query(
            sql, mapper(exam, table), id
        )

        return results.firstOrNull()
    }

    private val ldListMetadataResultSetExtractor: (ResultSet) -> InstructionFilterOptionsDtoOut = { rs: ResultSet ->
        val aineOptions: SortedSet<String> = sortedSetOf()

        while (rs.next()) {
            aineOptions.add(rs.getString("ld_instruction_aine_koodi_arvo"))
        }

        InstructionFilterOptionsDtoOut(
            aine = aineOptions.toList(),
        )
    }

    private fun buildLdListMetadataQuery(
        filters: InstructionFilters,
        role: Role,
        userOid: String
    ): Triple<String, MapSqlParameterSource, (ResultSet) -> InstructionFilterOptionsDtoOut> {
        val queryBuilder = StringBuilder(
            """
            SELECT
                i.ld_instruction_aine_koodi_arvo
            FROM ld_instruction i
            WHERE true 
         """.trimIndent()
        )

        val parameters = MapSqlParameterSource()
        parameters.addValue("userOid", userOid)

        if (filters.aine != null) {
            val values = filters.aine.split(",")
            queryBuilder.append(" AND ld_instruction_aine_koodi_arvo IN (:aineKoodiArvo)")
            parameters.addValue("aineKoodiArvo", values)
        }
        queryBuilder.append(publishStateFilter(role))
        return Triple(queryBuilder.toString(), parameters, ldListMetadataResultSetExtractor)
    }

    fun buildListQuery(filters: InstructionFilters, exam: Exam, role: Role): List<InstructionOut> {
        val table = getTableNameByExam(exam)
        val mapper = when (exam) {
            Exam.SUKO -> ::mapResultSetSukoOrPuhvi
            Exam.PUHVI -> ::mapResultSetSukoOrPuhvi
            Exam.LD -> ::mapResultSetLd
        }

        val parameters = MapSqlParameterSource()
        val queryBuilder = StringBuilder()

        queryBuilder.append("true ${publishStateFilter(role)}")

        if (filters.aine != null) {
            val values = filters.aine.split(",")
            queryBuilder.append(" AND ld_instruction_aine_koodi_arvo IN (:aineKoodiArvo)")
            parameters.addValue("aineKoodiArvo", values)
        }

        val orderDirection = filters.jarjesta ?: ""

        val additionalSelectFields = if (exam == Exam.LD) {
            "i.ld_instruction_aine_koodi_arvo"
        } else {
            "i.${table}_short_description_fi, i.${table}_short_description_sv"
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
                NATURAL LEFT JOIN ${table}_attachment ia
                WHERE $queryBuilder
                GROUP BY
                    i.instruction_id, 
                    i.instruction_name_fi, 
                    i.instruction_name_sv, 
                    i.instruction_content_fi, 
                    i.instruction_content_sv, 
                    i.instruction_publish_state, 
                    i.instruction_author_oid,
                    $additionalSelectFields
                ORDER BY i.instruction_updated_at $orderDirection;"""

        // fixme: is this right to use filterNotNull() here?
        return namedJdbcTemplate.query(sql, parameters, mapper(exam, table)).filterNotNull()
    }

    fun getInstructions(exam: Exam, filters: InstructionFilters): InstructionListDtoOut {
        val role = Kayttajatiedot.fromSecurityContext().role
        val result = buildListQuery(filters, exam, role)

        val (metadataQuery, metadataParameters, metadataExtractor) = buildLdListMetadataQuery(
            filters,
            role,
            Kayttajatiedot.fromSecurityContext().oidHenkilo
        )
        val metadata = namedJdbcTemplate.query(metadataQuery, metadataParameters, metadataExtractor)

        return InstructionListDtoOut(
            result,
            InstructionFilterOptionsDtoOut(
                metadata?.aine
            )
        )
    }

    fun uploadAttachmentToInstruction(
        exam: Exam, instructionId: Int, metadata: InstructionAttachmentMetadataDtoIn, file: MultipartFile
    ): InstructionAttachmentDtoOut {
        val table = getTableNameByExam(exam)
        val fileKey = newInstructionAttachmentFileKey()

        uploadInstructionAttachmentToS3(fileKey, file)

        return insertInstructionAttachment(
            table,
            instructionId.toLong(),
            metadata,
            file.originalFilename!!,
            fileKey
        )
    }

    fun <T : Instruction> updateInstruction(
        id: Int,
        instructionDtoIn: T,
        attachmentsMetadata: List<InstructionAttachmentMetadataDtoIn>,
        updateInstructionRow: () -> Int?
    ): Int? = transactionTemplate.execute { _ ->
        getInstructionById(instructionDtoIn.exam, id) ?: throw ResponseStatusException(
            HttpStatus.NOT_FOUND, "Instruction $id not found"
        )
        val table = getTableNameByExam(instructionDtoIn.exam)

        val updatedRowCount = updateInstructionRow()
        if (updatedRowCount != 1) {
            throw ResponseStatusException(
                HttpStatus.INTERNAL_SERVER_ERROR,
                "Updated row count was $updatedRowCount but 1 was expected when updating Instruction $id"
            )
        }

        attachmentsMetadata.forEach {
            jdbcTemplate.update(
                """UPDATE ${table}_attachment
                   SET instruction_attachment_name = ?
                   WHERE attachment_file_key = ?""".trimIndent(),
                it.name,
                it.fileKey
            )
        }

        return@execute id
    }

    fun updateSukoInstruction(
        id: Int,
        instruction: SukoInstructionDtoIn,
        attachmentsMetadata: List<InstructionAttachmentMetadataDtoIn>
    ): Int? = updateInstruction(id, instruction, attachmentsMetadata) {
        jdbcTemplate.update(
            """UPDATE suko_instruction
        SET instruction_name_fi = ?,
        instruction_name_sv = ?,
        instruction_content_fi = ?,
        instruction_content_sv = ?,
        instruction_publish_state = ?::publish_state,
        instruction_updated_at = clock_timestamp(),
        suko_instruction_short_description_fi = ?,
        suko_instruction_short_description_sv = ?
        WHERE instruction_id = ?
        """.trimIndent(),
            instruction.nameFi,
            instruction.nameSv,
            instruction.contentFi,
            instruction.contentSv,
            instruction.publishState.toString(),
            instruction.shortDescriptionFi,
            instruction.shortDescriptionSv,
            id
        )
    }

    fun updateLdInstruction(
        id: Int,
        instruction: LdInstructionDtoIn,
        attachmentsMetadata: List<InstructionAttachmentMetadataDtoIn>
    ): Int? = updateInstruction(id, instruction, attachmentsMetadata) {
        jdbcTemplate.update(
            """UPDATE ld_instruction
        SET instruction_name_fi = ?,
        instruction_name_sv = ?,
        instruction_content_fi = ?,
        instruction_content_sv = ?,
        instruction_publish_state = ?::publish_state,
        instruction_updated_at = clock_timestamp(),
        ld_instruction_aine_koodi_arvo = ?
        WHERE instruction_id = ?
        """.trimIndent(),
            instruction.nameFi,
            instruction.nameSv,
            instruction.contentFi,
            instruction.contentSv,
            instruction.publishState.toString(),
            instruction.aineKoodiArvo,
            id
        )
    }

    fun updatePuhviInstruction(
        id: Int,
        instruction: PuhviInstructionDtoIn,
        attachmentsMetadata: List<InstructionAttachmentMetadataDtoIn>
    ): Int? = updateInstruction(id, instruction, attachmentsMetadata) {
        jdbcTemplate.update(
            """UPDATE puhvi_instruction
        SET instruction_name_fi = ?,
        instruction_name_sv = ?,
        instruction_content_fi = ?,
        instruction_content_sv = ?,
        instruction_publish_state = ?::publish_state,
        instruction_updated_at = clock_timestamp(),
        puhvi_instruction_short_description_fi = ?,
        puhvi_instruction_short_description_sv = ?
        WHERE instruction_id = ?
        """.trimIndent(),
            instruction.nameFi,
            instruction.nameSv,
            instruction.contentFi,
            instruction.contentSv,
            instruction.publishState.toString(),
            instruction.shortDescriptionFi,
            instruction.shortDescriptionSv,
            id
        )
    }

    fun deleteAttachment(fileKey: String) {
        val sql = "DELETE FROM attachment WHERE attachment_file_key = ?"

        val updatedRowCount = jdbcTemplate.update(sql, fileKey)

        if (updatedRowCount != 1) {
            logger.warn("Tried to delete non-existent certificate attachment '${fileKey}'. Ignoring error.")
        }

        try {
            s3Helper.deleteObject(Bucket.INSTRUCTION, fileKey)
        } catch (ex: SdkException) {
            logger.warn("Failed to delete certificate attachment '${fileKey}' from S3. Ignoring error.", ex)
        }
    }

    fun getAttachmentByFileKey(fileKey: String): InstructionAttachmentDtoOut? {
        val results = jdbcTemplate.query(
            """
            SELECT attachment_file_key, attachment_file_name, attachment_upload_date, instruction_attachment_name, instruction_attachment_language
            FROM instruction_attachment
            WHERE attachment_file_key = ?
            """.trimIndent(), { rs, _ ->
                InstructionAttachmentDtoOut(
                    rs.getString("attachment_file_key"),
                    rs.getString("attachment_file_name"),
                    rs.getTimestamp("attachment_upload_date"),
                    rs.getString("instruction_attachment_name"),
                    Language.valueOf(rs.getString("instruction_attachment_language"))
                )
            }, fileKey
        )

        return results.firstOrNull()
    }
}
