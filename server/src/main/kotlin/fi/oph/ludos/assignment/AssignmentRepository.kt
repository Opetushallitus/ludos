package fi.oph.ludos.assignment

import org.springframework.jdbc.core.JdbcTemplate
import org.springframework.stereotype.Component
import java.sql.ResultSet

@Component
class AssignmentRepository(private val jdbcTemplate: JdbcTemplate) {
    fun getSukoAssignments(): List<SukoAssignmentDtoOut> {
        return jdbcTemplate.query(
            "SELECT * FROM suko_assignment"
        ) { rs: ResultSet, _: Int ->
            SukoAssignmentDtoOut(
                rs.getInt("assignment_id"),
                rs.getString("assignment_name"),
                rs.getString("assignment_content"),
                AssignmentState.valueOf(rs.getString("assignment_state")),
                rs.getString("suko_assignment_type"),
                rs.getTimestamp("assignment_created_at"),
                rs.getTimestamp("assignment_updated_at"),
            )
        }
    }

    fun getPuhviAssignments(): List<PuhviAssignmentDtoOut> {
        return jdbcTemplate.query(
            "SELECT * FROM puhvi_assignment"
        ) { rs: ResultSet, _: Int ->
            PuhviAssignmentDtoOut(
                rs.getInt("assignment_id"),
                rs.getString("assignment_name"),
                rs.getString("assignment_content"),
                AssignmentState.valueOf(rs.getString("assignment_state")),
                rs.getTimestamp("assignment_created_at"),
                rs.getTimestamp("assignment_updated_at"),
            )
        }
    }

    fun getLdAssignments(): List<LdAssignmentDtoOut> {
        return jdbcTemplate.query(
            "SELECT * FROM ld_assignment"
        ) { rs: ResultSet, _: Int ->
            LdAssignmentDtoOut(
                rs.getInt("assignment_id"),
                rs.getString("assignment_name"),
                rs.getString("assignment_content"),
                AssignmentState.valueOf(rs.getString("assignment_state")),
                rs.getTimestamp("assignment_created_at"),
                rs.getTimestamp("assignment_updated_at"),
            )
        }
    }

    fun saveSukoAssignment(assignment: SukoAssignmentDtoIn): SukoAssignmentDtoOut {
        return jdbcTemplate.query(
            "INSERT INTO suko_assignment (assignment_name, assignment_content, suko_assignment_type, assignment_state) VALUES (?, ?, ?, ?::assignment_state) RETURNING assignment_id, assignment_created_at, assignment_updated_at",
            { rs: ResultSet, _: Int ->
                SukoAssignmentDtoOut(
                    rs.getInt("assignment_id"),
                    assignment.name,
                    assignment.content,
                    assignment.state,
                    assignment.assignmentType,
                    rs.getTimestamp("assignment_created_at"),
                    rs.getTimestamp("assignment_updated_at")
                )
            },
            assignment.name,
            assignment.content,
            assignment.assignmentType,
            assignment.state.toString()
        )[0]
    }

    fun savePuhviAssignment(assignment: PuhviAssignmentDtoIn): PuhviAssignmentDtoOut {
        return jdbcTemplate.query(
            "INSERT INTO puhvi_assignment (assignment_name, assignment_content, assignment_state) VALUES (?, ?, ?::assignment_state) RETURNING assignment_id, assignment_created_at, assignment_updated_at",
            { rs: ResultSet, _: Int ->
                PuhviAssignmentDtoOut(
                    rs.getInt("assignment_id"),
                    assignment.name,
                    assignment.content,
                    assignment.state,
                    rs.getTimestamp("assignment_created_at"),
                    rs.getTimestamp("assignment_updated_at")
                )
            },
            assignment.name,
            assignment.content,
            assignment.state.toString()
        )[0]
    }

    fun saveLdAssignment(assignment: LdAssignmentDtoIn): LdAssignmentDtoOut {
        return jdbcTemplate.query(
            "INSERT INTO ld_assignment (assignment_name, assignment_content, assignment_state) VALUES (?, ?, ?::assignment_state) RETURNING assignment_id, assignment_created_at, assignment_updated_at",
            { rs: ResultSet, _: Int ->
                LdAssignmentDtoOut(
                    rs.getInt("assignment_id"),
                    assignment.name,
                    assignment.content,
                    assignment.state,
                    rs.getTimestamp("assignment_created_at"),
                    rs.getTimestamp("assignment_updated_at")
                )
            },
            assignment.name,
            assignment.content,
            assignment.state.toString()
        )[0]
    }

    fun getSukoAssignmentById(id: Int): AssignmentOut = jdbcTemplate.query(
            "SELECT * FROM suko_assignment WHERE assignment_id = ?", { rs: ResultSet, _: Int ->
                SukoAssignmentDtoOut(
                    rs.getInt("assignment_id"),
                    rs.getString("assignment_name"),
                    rs.getString("assignment_content"),
                    AssignmentState.valueOf(rs.getString("assignment_state")),
                    rs.getString("suko_assignment_type"),
                    rs.getTimestamp("assignment_created_at"),
                    rs.getTimestamp("assignment_updated_at")
                )
            }, id
        )[0]

    fun getPuhviAssignmentById(id: Int): AssignmentOut = jdbcTemplate.query(
            "SELECT * FROM puhvi_assignment WHERE assignment_id = ?", { rs: ResultSet, _: Int ->
                PuhviAssignmentDtoOut(
                    rs.getInt("assignment_id"),
                    rs.getString("assignment_name"),
                    rs.getString("assignment_content"),
                    AssignmentState.valueOf(rs.getString("assignment_state")),
                    rs.getTimestamp("assignment_created_at"),
                    rs.getTimestamp("assignment_updated_at")
                )
            }, id
        )[0]

    fun getLdAssignmentById(id: Int): AssignmentOut = jdbcTemplate.query(
            "SELECT * FROM ld_assignment WHERE assignment_id = ?", { rs: ResultSet, _: Int ->
                LdAssignmentDtoOut(
                    rs.getInt("assignment_id"),
                    rs.getString("assignment_name"),
                    rs.getString("assignment_content"),
                    AssignmentState.valueOf(rs.getString("assignment_state")),
                    rs.getTimestamp("assignment_created_at"),
                    rs.getTimestamp("assignment_updated_at")
                )
            }, id
        )[0]
}