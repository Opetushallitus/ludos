package fi.oph.ludos.instruction

import fi.oph.ludos.State
import fi.oph.ludos.assignment.ExamType
import org.springframework.data.crossstore.ChangeSetPersister.NotFoundException
import org.springframework.jdbc.core.JdbcTemplate
import org.springframework.stereotype.Component
import java.sql.ResultSet

@Component
class InstructionRepository(private val jdbcTemplate: JdbcTemplate) {
    fun saveSukoInstruction(instruction: SukoInstructionDtoIn): SukoInstructionDtoOut = jdbcTemplate.query(
        "INSERT INTO suko_instruction (instruction_name_fi, instruction_name_sv, instruction_content_fi, instruction_content_sv, instruction_state, instruction_exam_type) VALUES (?, ?, ?, ?, ?::state, ?::exam_type) RETURNING instruction_id, instruction_created_at, instruction_updated_at",
        { rs: ResultSet, _: Int ->
            SukoInstructionDtoOut(
                rs.getInt("instruction_id"),
                instruction.nameFi,
                instruction.nameSv,
                instruction.contentFi,
                instruction.contentSv,
                instruction.state,
                instruction.examType,
                rs.getTimestamp("instruction_created_at"),
                rs.getTimestamp("instruction_updated_at")
            )
        },
        instruction.nameFi,
        instruction.nameSv,
        instruction.contentFi,
        instruction.contentSv,
        instruction.state.toString(),
        instruction.examType.toString()
    )[0]

    fun savePuhviInstruction(instruction: PuhviInstructionDtoIn): PuhviInstructionDtoOut = jdbcTemplate.query(
        "INSERT INTO puhvi_instruction (instruction_name_fi, instruction_name_sv, instruction_content_fi, instruction_content_sv, instruction_state, instruction_exam_type) VALUES (?, ?, ?, ?, ?::state, ?::exam_type) RETURNING instruction_id, instruction_created_at, instruction_updated_at",
        { rs: ResultSet, _: Int ->
            PuhviInstructionDtoOut(
                rs.getInt("instruction_id"),
                instruction.nameFi,
                instruction.nameSv,
                instruction.contentFi,
                instruction.contentSv,
                instruction.state,
                instruction.examType,
                rs.getTimestamp("instruction_created_at"),
                rs.getTimestamp("instruction_updated_at")
            )
        },
        instruction.nameFi,
        instruction.nameSv,
        instruction.contentFi,
        instruction.contentSv,
        instruction.state.toString(),
        instruction.examType.toString()
    )[0]

    fun saveLdInstruction(instruction: LdInstructionDtoIn): LdInstructionDtoOut = jdbcTemplate.query(
        "INSERT INTO ld_instruction (instruction_name_fi, instruction_name_sv, instruction_content_fi, instruction_content_sv, instruction_state, instruction_exam_type) VALUES (?, ?, ?, ?, ?::state, ?::exam_type) RETURNING instruction_id, instruction_created_at, instruction_updated_at",
        { rs: ResultSet, _: Int ->
            LdInstructionDtoOut(
                rs.getInt("instruction_id"),
                instruction.nameFi,
                instruction.nameSv,
                instruction.contentFi,
                instruction.contentSv,
                instruction.state,
                instruction.examType,
                rs.getTimestamp("instruction_created_at"),
                rs.getTimestamp("instruction_updated_at")
            )
        },
        instruction.nameFi,
        instruction.nameSv,
        instruction.contentFi,
        instruction.contentSv,
        instruction.state.toString(),
        instruction.examType.toString()
    )[0]

    val mapSukoResultSet: (ResultSet, Int) -> SukoInstructionDtoOut? = { rs: ResultSet, _: Int ->
        SukoInstructionDtoOut(
            rs.getInt("instruction_id"),
            rs.getString("instruction_name_fi"),
            rs.getString("instruction_name_sv"),
            rs.getString("instruction_content_fi"),
            rs.getString("instruction_content_sv"),
            State.valueOf(rs.getString("instruction_state")),
            ExamType.valueOf(rs.getString("instruction_exam_type")),
            rs.getTimestamp("instruction_created_at"),
            rs.getTimestamp("instruction_updated_at")
        )
    }

    val mapPuhviResultSet: (ResultSet, Int) -> PuhviInstructionDtoOut? = { rs: ResultSet, _: Int ->
        PuhviInstructionDtoOut(
            rs.getInt("instruction_id"),
            rs.getString("instruction_name_fi"),
            rs.getString("instruction_name_sv"),
            rs.getString("instruction_content_fi"),
            rs.getString("instruction_content_sv"),
            State.valueOf(rs.getString("instruction_state")),
            ExamType.valueOf(rs.getString("instruction_exam_type")),
            rs.getTimestamp("instruction_created_at"),
            rs.getTimestamp("instruction_updated_at")
        )
    }

    val mapLdResultSet: (ResultSet, Int) -> LdInstructionDtoOut? = { rs: ResultSet, _: Int ->
        LdInstructionDtoOut(
            rs.getInt("instruction_id"),
            rs.getString("instruction_name_fi"),
            rs.getString("instruction_name_sv"),
            rs.getString("instruction_content_fi"),
            rs.getString("instruction_content_sv"),
            State.valueOf(rs.getString("instruction_state")),
            ExamType.valueOf(rs.getString("instruction_exam_type")),
            rs.getTimestamp("instruction_created_at"),
            rs.getTimestamp("instruction_updated_at")
        )
    }

    fun getSukoInstructionById(id: Int): SukoInstructionDtoOut = try {
        val results = jdbcTemplate.query(
            "SELECT * FROM suko_instruction WHERE instruction_id = ?", mapSukoResultSet, id
        )

        if (results.isEmpty()) {
            throw NotFoundException()
        }

        results[0]
    } catch (e: NotFoundException) {
        throw NotFoundException()
    }

    fun getPuhviInstructionById(id: Int): PuhviInstructionDtoOut = try {
        val results = jdbcTemplate.query(
            "SELECT * FROM puhvi_instruction WHERE instruction_id = ?", mapPuhviResultSet, id
        )

        if (results.isEmpty()) {
            throw NotFoundException()
        }

        results[0]
    } catch (e: NotFoundException) {
        throw NotFoundException()
    }

    fun getLdInstructionById(id: Int): LdInstructionDtoOut = try {
        val results = jdbcTemplate.query(
            "SELECT * FROM ld_instruction WHERE instruction_id = ?", mapLdResultSet, id
        )

        if (results.isEmpty()) {
            throw NotFoundException()
        }

        results[0]
    } catch (e: NotFoundException) {
        throw NotFoundException()
    }

    fun getSukoInstructions(examType: ExamType): List<SukoInstructionDtoOut> = try {
        jdbcTemplate.query(
            "SELECT * FROM suko_instruction WHERE instruction_exam_type = ?::exam_type",
            mapSukoResultSet,
            examType.toString()
        )
    } catch (e: NotFoundException) {
        throw NotFoundException()
    }

    fun getPuhviInstructions(examType: ExamType): List<PuhviInstructionDtoOut> = try {
        jdbcTemplate.query(
            "SELECT * FROM puhvi_instruction WHERE instruction_exam_type = ?::exam_type",
            mapPuhviResultSet,
            examType.toString()
        )
    } catch (e: NotFoundException) {
        throw NotFoundException()
    }

    fun getLdInstructions(examType: ExamType): List<LdInstructionDtoOut> = try {
        jdbcTemplate.query(
            "SELECT * FROM ld_instruction WHERE instruction_exam_type = ?::exam_type",
            mapLdResultSet,
            examType.toString()
        )
    } catch (e: NotFoundException) {
        throw NotFoundException()
    }

    fun updateSukoInstruction(id: Int, instruction: UpdateInstructionDtoIn): Int = try {
        val results = jdbcTemplate.query(
            "UPDATE suko_instruction SET instruction_name_fi = ?, instruction_name_sv = ?, instruction_content_fi = ?, instruction_content_sv = ?, instruction_state = ?::state, instruction_exam_type = ?::exam_type, instruction_updated_at = now() WHERE instruction_id = ? RETURNING instruction_id",
            { rs: ResultSet, _: Int ->
                rs.getInt("instruction_id")
            },
            instruction.nameFi,
            instruction.nameSv,
            instruction.contentFi,
            instruction.contentSv,
            instruction.state.toString(),
            instruction.examType.toString(),
            id
        )

        if (results.isEmpty()) {
            throw NotFoundException()
        }

        results[0]
    } catch (e: NotFoundException) {
        throw NotFoundException()
    }

    fun updatePuhviInstruction(id: Int, instruction: UpdateInstructionDtoIn): Int = try {
        val results = jdbcTemplate.query(
            "UPDATE puhvi_instruction SET instruction_name_fi = ?, instruction_name_sv = ?, instruction_content_fi = ?, instruction_content_sv = ?, instruction_state = ?::state, instruction_exam_type = ?::exam_type, instruction_updated_at = now() WHERE instruction_id = ? RETURNING instruction_id",
            { rs: ResultSet, _: Int ->
                rs.getInt("instruction_id")
            },
            instruction.nameFi,
            instruction.nameSv,
            instruction.contentFi,
            instruction.contentSv,
            instruction.state.toString(),
            instruction.examType.toString(),
            id
        )

        if (results.isEmpty()) {
            throw NotFoundException()
        }

        results[0]
    } catch (e: NotFoundException) {
        throw NotFoundException()
    }

    fun updateLdInstruction(id: Int, instruction: UpdateInstructionDtoIn): Int = try {
        val results = jdbcTemplate.query(
            "UPDATE ld_instruction SET instruction_name_fi = ?, instruction_name_sv = ?, instruction_content_fi = ?, instruction_content_sv = ?, instruction_state = ?::state, instruction_exam_type = ?::exam_type, instruction_updated_at = now() WHERE instruction_id = ? RETURNING instruction_id",
            { rs: ResultSet, _: Int ->
                rs.getInt("instruction_id")
            },
            instruction.nameFi,
            instruction.nameSv,
            instruction.contentFi,
            instruction.contentSv,
            instruction.state.toString(),
            instruction.examType.toString(),
            id
        )

        if (results.isEmpty()) {
            throw NotFoundException()
        }

        results[0]
    } catch (e: NotFoundException) {
        throw NotFoundException()
    }
}
