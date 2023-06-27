package fi.oph.ludos.instruction

import fi.oph.ludos.Exam
import fi.oph.ludos.PublishState
import org.springframework.jdbc.core.JdbcTemplate
import org.springframework.stereotype.Component
import java.sql.ResultSet

@Component
class InstructionRepository(private val jdbcTemplate: JdbcTemplate) {
    fun createInstruction(instruction: Instruction): InstructionOut {
        val table = when (instruction) {
            is SukoInstructionDtoIn -> "suko_instruction"
            is PuhviInstructionDtoIn -> "puhvi_instruction"
            is LdInstructionDtoIn -> "ld_instruction"
            else -> throw UnknownError("Unreachable, no instruction type found")
        }

        return jdbcTemplate.query(
            "INSERT INTO $table (instruction_name_fi, instruction_name_sv, instruction_content_fi, instruction_content_sv, instruction_publish_state) VALUES (?, ?, ?, ?, ?::publish_state) RETURNING instruction_id, instruction_created_at, instruction_updated_at",
            { rs: ResultSet, _: Int ->
                InstructionDtoOut(
                    rs.getInt("instruction_id"),
                    instruction.nameFi,
                    instruction.nameSv,
                    instruction.contentFi,
                    instruction.contentSv,
                    instruction.publishState,
                    rs.getTimestamp("instruction_created_at"),
                    rs.getTimestamp("instruction_updated_at")
                )
            },
            instruction.nameFi,
            instruction.nameSv,
            instruction.contentFi,
            instruction.contentSv,
            instruction.publishState.toString(),
        )[0]
    }

    val mapResultSet: (ResultSet, Int) -> InstructionDtoOut? = { rs: ResultSet, _: Int ->
        InstructionDtoOut(
            rs.getInt("instruction_id"),
            rs.getString("instruction_name_fi"),
            rs.getString("instruction_name_sv"),
            rs.getString("instruction_content_fi"),
            rs.getString("instruction_content_sv"),
            PublishState.valueOf(rs.getString("instruction_publish_state")),
            rs.getTimestamp("instruction_created_at"),
            rs.getTimestamp("instruction_updated_at")
        )
    }

    fun getInstructionById(exam: Exam, id: Int): InstructionDtoOut? {
        val table = when (exam) {
            Exam.SUKO -> "suko_instruction"
            Exam.PUHVI -> "puhvi_instruction"
            Exam.LD -> "ld_instruction"
        }

        val results = jdbcTemplate.query(
            "SELECT * FROM $table WHERE instruction_id = ?", mapResultSet, id
        )

        return results.firstOrNull()
    }

    fun getInstructions(exam: Exam): List<InstructionDtoOut> {
        val table = when (exam) {
            Exam.SUKO -> "suko_instruction"
            Exam.PUHVI -> "puhvi_instruction"
            Exam.LD -> "ld_instruction"
        }

        return jdbcTemplate.query(
            "SELECT * FROM $table", mapResultSet
        )
    }

    fun updateInstruction(id: Int, instruction: Instruction): Int? {
        val table = when (instruction) {
            is SukoInstructionDtoIn -> "suko_instruction"
            is PuhviInstructionDtoIn -> "puhvi_instruction"
            is LdInstructionDtoIn -> "ld_instruction"
            else -> throw UnknownError("Unreachable, no instruction type found")
        }

        val results = jdbcTemplate.query(
            "UPDATE $table SET instruction_name_fi = ?, instruction_name_sv = ?, instruction_content_fi = ?, instruction_content_sv = ?, instruction_publish_state = ?::publish_state, instruction_updated_at = now() WHERE instruction_id = ? RETURNING instruction_id",
            { rs: ResultSet, _: Int ->
                rs.getInt("instruction_id")
            },
            instruction.nameFi,
            instruction.nameSv,
            instruction.contentFi,
            instruction.contentSv,
            instruction.publishState.toString(),
            id
        )

        return results.firstOrNull()
    }
}
