package fi.oph.ludos.instruction

import Language
import fi.oph.ludos.Exam
import fi.oph.ludos.PublishState
import fi.oph.ludos.auth.Kayttajatiedot
import fi.oph.ludos.auth.Role
import fi.oph.ludos.repository.getKotlinArray
import fi.oph.ludos.repository.getZonedDateTime
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
import java.sql.Timestamp
import java.time.ZoneId
import java.util.*

@Component
class InstructionRepository(
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

    fun getTableNameAndExamTypeByInference(instruction: Instruction) = when (instruction) {
        is SukoInstructionDtoIn -> Pair("suko_instruction", Exam.SUKO)
        is PuhviInstructionDtoIn -> Pair("puhvi_instruction", Exam.PUHVI)
        is LdInstructionDtoIn -> Pair("ld_instruction", Exam.LD)
        else -> throw UnknownError("Unreachable, no instruction type found")
    }

    fun newInstructionAttachmentFileKey() = "ohjeliite_${UUID.randomUUID()}"

    fun createInstruction(instruction: Instruction, attachments: List<InstructionAttachmentIn>): InstructionOut {
        val (table, exam) = getTableNameAndExamTypeByInference(instruction)

        val createdInstruction = transactionTemplate.execute { _ ->
            val instructionId = jdbcTemplate.queryForObject(
                """INSERT INTO $table (
                instruction_name_fi, 
                instruction_name_sv, 
                instruction_content_fi, 
                instruction_content_sv, 
                instruction_short_description_fi,
                instruction_short_description_sv,
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

            // Insert attachment records using instructionId
            for (attachment in attachments) {
                val fileKey = newInstructionAttachmentFileKey()

                uploadInstructionAttachmentToS3(fileKey, attachment.file)
                insertInstructionAttachment(
                    table, instructionId, attachment.metadata, attachment.file.originalFilename!!, fileKey
                )
            }

            getInstructionById(exam, instructionId.toInt())
        }!!

        return createdInstruction
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
            { rs: ResultSet, _: Int -> rs.getZonedDateTime("attachment_upload_date") },
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

    fun mapResultSetRow(exam: Exam): (ResultSet, Int) -> InstructionDtoOut? = { rs: ResultSet, _: Int ->
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
                    attachmentUploadDates[i].toInstant().atZone(ZoneId.systemDefault()),
                    instructionAttachmentNames[i],
                    Language.valueOf(instructionAttachmentLanguages[i])
                )
            }.sortedBy { it.fileUploadDate }
        } else {
            emptyList()
        }

        InstructionDtoOut(
            rs.getInt("instruction_id"),
            exam,
            rs.getString("instruction_name_fi"),
            rs.getString("instruction_name_sv"),
            rs.getString("instruction_content_fi"),
            rs.getString("instruction_content_sv"),
            rs.getString("instruction_short_description_fi"),
            rs.getString("instruction_short_description_sv"),
            PublishState.valueOf(rs.getString("instruction_publish_state")),
            attachments,
            rs.getString("instruction_author_oid"),
            rs.getTimestamp("instruction_created_at"),
            rs.getTimestamp("instruction_updated_at")
        )
    }

    fun getInstructionById(exam: Exam, id: Int): InstructionDtoOut? {
        val role = Kayttajatiedot.fromSecurityContext().role
        val table = getTableNameByExam(exam)

        val andIsPublishedIfOpettaja = if (role == Role.OPETTAJA) "AND instruction_publish_state = 'PUBLISHED'" else ""

        val sql = """SELECT
                     i.*,
                     ARRAY_AGG(ia.attachment_file_key) AS attachment_file_keys,
                     ARRAY_AGG(ia.attachment_file_name) AS attachment_file_names,
                     ARRAY_AGG(ia.attachment_upload_date) AS attachment_upload_dates,
                     ARRAY_AGG(ia.instruction_attachment_name) AS instruction_attachment_names,
                     ARRAY_AGG(ia.instruction_attachment_language) AS instruction_attachment_languages
                FROM $table i
                NATURAL LEFT JOIN ${table}_attachment ia
                WHERE instruction_id = ? $andIsPublishedIfOpettaja
                GROUP BY
                    i.instruction_id, 
                    i.instruction_name_fi, 
                    i.instruction_name_sv, 
                    i.instruction_content_fi, 
                    i.instruction_content_sv, 
                    i.instruction_short_description_fi, 
                    i.instruction_short_description_sv, 
                    i.instruction_publish_state, 
                    i.instruction_author_oid;"""


        val results = jdbcTemplate.query(
            sql, mapResultSetRow(exam), id
        )

        return results.firstOrNull()
    }

    fun getInstructions(exam: Exam, filters: InstructionFilters): List<InstructionDtoOut> {
        val role = Kayttajatiedot.fromSecurityContext().role
        val table = getTableNameByExam(exam)

        val whereIsPublishedIfOpettaja =
            if (role == Role.OPETTAJA) "WHERE instruction_publish_state = 'PUBLISHED'" else ""

        val orderDirection = filters.jarjesta ?: ""

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
                $whereIsPublishedIfOpettaja
                GROUP BY
                    i.instruction_id, 
                    i.instruction_name_fi, 
                    i.instruction_name_sv, 
                    i.instruction_content_fi, 
                    i.instruction_content_sv, 
                    i.instruction_short_description_fi, 
                    i.instruction_short_description_sv, 
                    i.instruction_publish_state, 
                    i.instruction_author_oid 
                ORDER BY i.instruction_updated_at $orderDirection;"""

        return jdbcTemplate.query(
            sql, mapResultSetRow(exam)
        )
    }

    fun uploadAttachmentToInstruction(
        exam: Exam, instructionId: Int, metadata: InstructionAttachmentMetadataDtoIn, file: MultipartFile
    ): InstructionAttachmentDtoOut {
        val fileKey = newInstructionAttachmentFileKey()
        val table = getTableNameByExam(exam)

        uploadInstructionAttachmentToS3(fileKey, file)

        return insertInstructionAttachment(table, instructionId.toLong(), metadata, file.originalFilename!!, fileKey)
    }

    fun updateInstruction(
        id: Int, instruction: Instruction, attachmentsMetadata: List<InstructionAttachmentMetadataDtoIn>
    ): Int? {
        val (table, exam) = getTableNameAndExamTypeByInference(instruction)

        return transactionTemplate.execute { _ ->
            getInstructionById(exam, id) ?: throw ResponseStatusException(
                HttpStatus.NOT_FOUND, "Instruction $id not found"
            )

            val updatedRowCount = jdbcTemplate.update(
                """UPDATE $table
                    SET instruction_name_fi = ?,
                    instruction_name_sv = ?,
                    instruction_content_fi = ?,
                    instruction_content_sv = ?,
                    instruction_short_description_fi = ?,
                    instruction_short_description_sv = ?,
                    instruction_publish_state = ?::publish_state,
                    instruction_updated_at = clock_timestamp()
                    WHERE instruction_id = ?
                    """.trimIndent(),
                instruction.nameFi,
                instruction.nameSv,
                instruction.contentFi,
                instruction.contentSv,
                instruction.shortDescriptionFi,
                instruction.shortDescriptionSv,
                instruction.publishState.toString(),
                id
            )

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
                    rs.getZonedDateTime("attachment_upload_date"),
                    rs.getString("instruction_attachment_name"),
                    Language.valueOf(rs.getString("instruction_attachment_language"))
                )
            }, fileKey
        )

        return results.firstOrNull()
    }
}
