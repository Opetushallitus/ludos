package fi.oph.ludos.assignment

import org.springframework.data.crossstore.ChangeSetPersister.NotFoundException
import org.springframework.jdbc.core.JdbcTemplate
import org.springframework.stereotype.Component
import java.sql.ResultSet

@Component
class AssignmentRepository(private val jdbcTemplate: JdbcTemplate) {

    val mapSukoResultSet: (ResultSet, Int) -> SukoAssignmentDtoOut? = { rs: ResultSet, _: Int ->
        SukoAssignmentDtoOut(
            rs.getInt("assignment_id"),
            rs.getString("assignment_name"),
            rs.getString("assignment_content"),
            AssignmentState.valueOf(rs.getString("assignment_state")),
            ExamType.valueOf(rs.getString("assignment_exam_type")),
            rs.getString("suko_assignment_type"),
            rs.getTimestamp("assignment_created_at"),
            rs.getTimestamp("assignment_updated_at")
        )
    }

    fun getSukoAssignments(examType: ExamType?, filters: AssignmentFilter?): List<SukoAssignmentDtoOut> {
        var query = if (examType != null) {
            "SELECT * FROM suko_assignment WHERE assignment_exam_type = ?::assignment_exam_type"
        } else {
            "SELECT * FROM suko_assignment"
        }

        val args = mutableListOf<Any>()
        args.add(examType.toString())

        if (filters != null) {
            if (filters.course != null) {
                query += " AND course = ?"
                args.add(filters.course)
            }
            if (filters.assignmentType != null) {
                query += " AND suko_assignment_type = ?"
                args.add(filters.assignmentType)
            }
            if (filters.title != null) {
                query += " AND assignment_name LIKE ?"
                args.add("%${filters.title}%")
            }
            if (filters.language != null) {
                query += " AND language = ?"
                args.add(filters.language)
            }
            if (filters.orderBy != null) {
                query += " ORDER BY ${filters.orderBy}"
                if (filters.orderDirection != null) {
                    query += " ${filters.orderDirection}"
                }
            }
        }

        return if (examType != null) {
            if (filters != null) {
                jdbcTemplate.query(
                    query, mapSukoResultSet, *args.toTypedArray() // spread the args
                )
            } else {
                jdbcTemplate.query(
                    query, mapSukoResultSet, examType.toString()
                )
            }
        } else {
            if (filters != null) {
                jdbcTemplate.query(
                    query, mapSukoResultSet, filters.course, filters.assignmentType, "%${filters.title}%", filters.language
                )
            } else {
                jdbcTemplate.query(
                    query, mapSukoResultSet
                )
            }
        }
    }

    fun getPuhviAssignments(examType: ExamType?, filters: AssignmentFilter?): List<PuhviAssignmentDtoOut> {
        return jdbcTemplate.query(
            "SELECT * FROM puhvi_assignment"
        ) { rs: ResultSet, _: Int ->
            PuhviAssignmentDtoOut(
                rs.getInt("assignment_id"),
                rs.getString("assignment_name"),
                rs.getString("assignment_content"),
                AssignmentState.valueOf(rs.getString("assignment_state")),
                ExamType.valueOf(rs.getString("assignment_exam_type")),
                rs.getTimestamp("assignment_created_at"),
                rs.getTimestamp("assignment_updated_at"),
            )
        }
    }

    fun getLdAssignments(examType: ExamType?, filters: AssignmentFilter?): List<LdAssignmentDtoOut> {
        return jdbcTemplate.query(
            "SELECT * FROM ld_assignment"
        ) { rs: ResultSet, _: Int ->
            LdAssignmentDtoOut(
                rs.getInt("assignment_id"),
                rs.getString("assignment_name"),
                rs.getString("assignment_content"),
                AssignmentState.valueOf(rs.getString("assignment_state")),
                ExamType.valueOf(rs.getString("assignment_exam_type")),
                rs.getTimestamp("assignment_created_at"),
                rs.getTimestamp("assignment_updated_at"),
            )
        }
    }

    fun saveSukoAssignment(assignment: SukoAssignmentDtoIn): SukoAssignmentDtoOut {
        return jdbcTemplate.query(
            "INSERT INTO suko_assignment (assignment_name, assignment_content, suko_assignment_type, assignment_state, assignment_exam_type) " + "VALUES (?, ?, ?, ?::assignment_state, ?::assignment_exam_type) RETURNING assignment_id, assignment_created_at, assignment_updated_at",
            { rs: ResultSet, _: Int ->
                SukoAssignmentDtoOut(
                    rs.getInt("assignment_id"),
                    assignment.name,
                    assignment.content,
                    assignment.state,
                    assignment.examType,
                    assignment.assignmentType,
                    rs.getTimestamp("assignment_created_at"),
                    rs.getTimestamp("assignment_updated_at")
                )
            },
            assignment.name,
            assignment.content,
            assignment.assignmentType,
            assignment.state.toString(),
            assignment.examType.toString()
        )[0]
    }

    fun savePuhviAssignment(assignment: PuhviAssignmentDtoIn): PuhviAssignmentDtoOut {
        return jdbcTemplate.query(
            "INSERT INTO puhvi_assignment (assignment_name, assignment_content, assignment_state, assignment_exam_type) " + "VALUES (?, ?, ?::assignment_state, ?::assignment_exam_type) RETURNING assignment_id, assignment_created_at, assignment_updated_at",
            { rs: ResultSet, _: Int ->
                PuhviAssignmentDtoOut(
                    rs.getInt("assignment_id"),
                    assignment.name,
                    assignment.content,
                    assignment.state,
                    assignment.examType,
                    rs.getTimestamp("assignment_created_at"),
                    rs.getTimestamp("assignment_updated_at")
                )
            },
            assignment.name,
            assignment.content,
            assignment.state.toString(),
            assignment.examType.toString()
        )[0]
    }

    fun saveLdAssignment(assignment: LdAssignmentDtoIn): LdAssignmentDtoOut {
        return jdbcTemplate.query(
            "INSERT INTO ld_assignment (assignment_name, assignment_content, assignment_state, assignment_exam_type) " + "VALUES (?, ?, ?::assignment_state, ?::assignment_exam_type) RETURNING assignment_id, assignment_created_at, assignment_updated_at",
            { rs: ResultSet, _: Int ->
                LdAssignmentDtoOut(
                    rs.getInt("assignment_id"),
                    assignment.name,
                    assignment.content,
                    assignment.state,
                    assignment.examType,
                    rs.getTimestamp("assignment_created_at"),
                    rs.getTimestamp("assignment_updated_at")
                )
            },
            assignment.name,
            assignment.content,
            assignment.state.toString(),
            assignment.examType.toString()
        )[0]
    }

    fun getSukoAssignmentById(id: Int): AssignmentOut {
        return try {
            val results =
                jdbcTemplate.query("SELECT * FROM suko_assignment WHERE assignment_id = ?", mapSukoResultSet, id)

            if (results.isEmpty()) {
                throw NotFoundException()
            }

            results[0]
        } catch (e: NotFoundException) {
            throw NotFoundException()
        }
    }


    fun getPuhviAssignmentById(id: Int): AssignmentOut {
        return try {
            val results = jdbcTemplate.query(
                "SELECT * FROM puhvi_assignment WHERE assignment_id = ?", { rs: ResultSet, _: Int ->
                    PuhviAssignmentDtoOut(
                        rs.getInt("assignment_id"),
                        rs.getString("assignment_name"),
                        rs.getString("assignment_content"),
                        AssignmentState.valueOf(rs.getString("assignment_state")),
                        ExamType.valueOf(rs.getString("assignment_exam_type")),
                        rs.getTimestamp("assignment_created_at"),
                        rs.getTimestamp("assignment_updated_at")
                    )
                }, id
            )

            if (results.isEmpty()) {
                throw NotFoundException()
            }

            results[0]
        } catch (e: NotFoundException) {
            throw NotFoundException()
        }
    }

    fun getLdAssignmentById(id: Int): AssignmentOut {
        return try {
            val results = jdbcTemplate.query(
                "SELECT * FROM ld_assignment WHERE assignment_id = ?", { rs: ResultSet, _: Int ->
                    LdAssignmentDtoOut(
                        rs.getInt("assignment_id"),
                        rs.getString("assignment_name"),
                        rs.getString("assignment_content"),
                        AssignmentState.valueOf(rs.getString("assignment_state")),
                        ExamType.valueOf(rs.getString("assignment_exam_type")),
                        rs.getTimestamp("assignment_created_at"),
                        rs.getTimestamp("assignment_updated_at")
                    )
                }, id
            )

            if (results.isEmpty()) {
                throw NotFoundException()
            }

            results[0]
        } catch (e: NotFoundException) {
            throw NotFoundException()
        }
    }

    fun updateSukoAssignment(assignment: SukoUpdateAssignmentDtoIn, id: Int): Int {
        return try {
            val results = jdbcTemplate.query(
                "UPDATE suko_assignment SET assignment_name = ?, assignment_content = ?, suko_assignment_type = ?, assignment_state = ?::assignment_state, assignment_exam_type = ?::assignment_exam_type, assignment_updated_at = now() " + "WHERE assignment_id = ? RETURNING assignment_id",
                { rs: ResultSet, _: Int ->
                    rs.getInt("assignment_id")
                },
                assignment.name,
                assignment.content,
                assignment.assignmentType,
                assignment.state.toString(),
                assignment.examType.toString(),
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


    fun updatePuhviAssignment(assignment: PuhviUpdateAssignmentDtoIn, id: Int): Int {
        return try {
            val results = jdbcTemplate.query(
                "UPDATE puhvi_assignment SET assignment_name = ?, assignment_content = ?, assignment_state = ?::assignment_state, assignment_updated_at = now() WHERE assignment_id = ? RETURNING assignment_id",
                { rs: ResultSet, _: Int ->
                    rs.getInt("assignment_id")
                },
                assignment.name,
                assignment.content,
                assignment.state.toString(),
                assignment.examType.toString(),
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

    fun updateLdAssignment(assignment: LdUpdateAssignmentDtoIn, id: Int): Int {
        return try {
            val results = jdbcTemplate.query(
                "UPDATE ld_assignment SET assignment_name = ?, assignment_content = ?, assignment_state = ?::assignment_state, assignment_updated_at = now() WHERE assignment_id = ? RETURNING assignment_id",
                { rs: ResultSet, _: Int ->
                    rs.getInt("assignment_id")
                },
                assignment.name,
                assignment.content,
                assignment.state.toString(),
                assignment.examType.toString(),
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
}