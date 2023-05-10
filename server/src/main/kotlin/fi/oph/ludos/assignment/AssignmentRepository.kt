package fi.oph.ludos.assignment

import fi.oph.ludos.ContentType
import fi.oph.ludos.Exam
import fi.oph.ludos.PublishState
import org.springframework.data.crossstore.ChangeSetPersister.NotFoundException
import org.springframework.jdbc.core.JdbcTemplate
import org.springframework.stereotype.Component
import java.sql.ResultSet

@Component
class AssignmentRepository(private val jdbcTemplate: JdbcTemplate) {
    val mapSukoResultSet: (ResultSet, Int) -> SukoAssignmentDtoOut? = { rs: ResultSet, _: Int ->
        SukoAssignmentDtoOut(
            rs.getInt("assignment_id"),
            rs.getString("assignment_name_fi"),
            rs.getString("assignment_name_sv"),
            rs.getString("assignment_content_fi"),
            rs.getString("assignment_content_sv"),
            PublishState.valueOf(rs.getString("assignment_publish_state")),
            ContentType.ASSIGNMENTS,
            rs.getString("suko_assignment_type_koodi_arvo"),
            rs.getTimestamp("assignment_created_at"),
            rs.getTimestamp("assignment_updated_at")
        )
    }

    fun getSukoAssignments(filters: AssignmentFilter?): List<SukoAssignmentDtoOut> {
        var query = "SELECT * FROM suko_assignment"
        val args = mutableListOf<Any>()

        query = buildQuery(filters, Exam.SUKO, query, args)

        return jdbcTemplate.query(query, mapSukoResultSet, *args.toTypedArray())
    }

    val mapPuhviResultSet: (ResultSet, Int) -> PuhviAssignmentDtoOut? = { rs: ResultSet, _: Int ->
        PuhviAssignmentDtoOut(
            rs.getInt("assignment_id"),
            rs.getString("assignment_name_fi"),
            rs.getString("assignment_name_sv"),
            rs.getString("assignment_content_fi"),
            rs.getString("assignment_content_sv"),
            PublishState.valueOf(rs.getString("assignment_publish_state")),
            ContentType.ASSIGNMENTS,
            rs.getTimestamp("assignment_created_at"),
            rs.getTimestamp("assignment_updated_at"),
        )
    }

    fun getPuhviAssignments(filters: AssignmentFilter?): List<PuhviAssignmentDtoOut> {
        var query = "SELECT * FROM puhvi_assignment"
        val args = mutableListOf<Any>()

        query = buildQuery(filters, Exam.PUHVI, query, args)

        return jdbcTemplate.query(query, mapPuhviResultSet, *args.toTypedArray())
    }

    val mapLdResultSet: (ResultSet, Int) -> LdAssignmentDtoOut? = { rs: ResultSet, _: Int ->
        LdAssignmentDtoOut(
            rs.getInt("assignment_id"),
            rs.getString("assignment_name_fi"),
            rs.getString("assignment_name_sv"),
            rs.getString("assignment_content_fi"),
            rs.getString("assignment_content_sv"),
            PublishState.valueOf(rs.getString("assignment_publish_state")),
            ContentType.ASSIGNMENTS,
            rs.getTimestamp("assignment_created_at"),
            rs.getTimestamp("assignment_updated_at"),
        )
    }

    fun getLdAssignments(filters: AssignmentFilter?): List<LdAssignmentDtoOut> {
        var query = "SELECT * FROM ld_assignment"
        val args = mutableListOf<Any>()

        query = buildQuery(filters, Exam.LD, query, args)

        return jdbcTemplate.query(query, mapLdResultSet, *args.toTypedArray())
    }

    private fun buildQuery(
        filters: AssignmentFilter?, exam: Exam, query: String, args: MutableList<Any>
    ): String {
        var query1 = query
        if (filters != null) {
            //             if (filters.course != null) {
            //             query += " AND course = ?"
            //             args.add(filters.course)
            //             }
            if (exam == Exam.SUKO && filters.assignmentTypeKoodiArvo != null) {
                query1 += " WHERE suko_assignment_type_koodi_arvo = ?"
                args.add(filters.assignmentTypeKoodiArvo)
            }
            //            if (filters.topic != null) {
            //                query += " AND assignment_topic ?"
            //                args.add("%${filters.topic}%")
            //            }
            if (filters.language != null) {
                query1 += " AND language = ?"
                args.add(filters.language)
            }
            if (filters.orderBy != null) {
                query1 += " ORDER BY ${filters.orderBy}"
                if (filters.orderDirection != null) {
                    query1 += " ${filters.orderDirection}"
                }
            }
        }
        return query1
    }

    fun saveSukoAssignment(assignment: SukoAssignmentDtoIn): SukoAssignmentDtoOut = jdbcTemplate.query(
        "INSERT INTO suko_assignment (assignment_name_fi, assignment_name_sv, assignment_content_fi, assignment_content_sv, suko_assignment_type_koodi_arvo, assignment_publish_state) VALUES (?, ?, ?, ?, ?, ?::publish_state) RETURNING assignment_id, assignment_created_at, assignment_updated_at",
        { rs: ResultSet, _: Int ->
            SukoAssignmentDtoOut(
                rs.getInt("assignment_id"),
                assignment.nameFi,
                assignment.nameSv,
                assignment.contentFi,
                assignment.contentSv,
                assignment.publishState,
                assignment.contentType,
                assignment.assignmentTypeKoodiArvo,
                rs.getTimestamp("assignment_created_at"),
                rs.getTimestamp("assignment_updated_at")
            )
        },
        assignment.nameFi,
        assignment.nameSv,
        assignment.contentFi,
        assignment.contentSv,
        assignment.assignmentTypeKoodiArvo,
        assignment.publishState.toString(),
    )[0]

    fun savePuhviAssignment(assignment: PuhviAssignmentDtoIn): PuhviAssignmentDtoOut = jdbcTemplate.query(
        "INSERT INTO puhvi_assignment (assignment_name_fi, assignment_name_sv, assignment_content_fi, assignment_content_sv, assignment_publish_state) VALUES (?, ?, ?, ?, ?::publish_state) RETURNING assignment_id, assignment_created_at, assignment_updated_at",
        { rs: ResultSet, _: Int ->
            PuhviAssignmentDtoOut(
                rs.getInt("assignment_id"),
                assignment.nameFi,
                assignment.nameSv,
                assignment.contentFi,
                assignment.contentSv,
                assignment.publishState,
                assignment.contentType,
                rs.getTimestamp("assignment_created_at"),
                rs.getTimestamp("assignment_updated_at")
            )
        },
        assignment.nameFi,
        assignment.nameSv,
        assignment.contentFi,
        assignment.contentSv,
        assignment.publishState.toString(),
    )[0]

    fun saveLdAssignment(assignment: LdAssignmentDtoIn): LdAssignmentDtoOut = jdbcTemplate.query(
        "INSERT INTO ld_assignment (assignment_name_fi, assignment_name_sv, assignment_content_fi, assignment_content_sv, assignment_publish_state) VALUES (?, ?, ?, ?, ?::publish_state) RETURNING assignment_id, assignment_created_at, assignment_updated_at",
        { rs: ResultSet, _: Int ->
            LdAssignmentDtoOut(
                rs.getInt("assignment_id"),
                assignment.nameFi,
                assignment.nameSv,
                assignment.contentFi,
                assignment.contentSv,
                assignment.publishState,
                assignment.contentType,
                rs.getTimestamp("assignment_created_at"),
                rs.getTimestamp("assignment_updated_at")
            )
        },
        assignment.nameFi,
        assignment.nameSv,
        assignment.contentFi,
        assignment.contentSv,
        assignment.publishState.toString(),
    )[0]

    fun getSukoAssignmentById(id: Int): AssignmentOut = try {
        val results =
            jdbcTemplate.query("SELECT * FROM suko_assignment WHERE assignment_id = ?", mapSukoResultSet, id)

        if (results.isEmpty()) {
            throw NotFoundException()
        }

        results[0]
    } catch (e: NotFoundException) {
        throw NotFoundException()
    }


    fun getPuhviAssignmentById(id: Int): AssignmentOut = try {
        val results = jdbcTemplate.query(
            "SELECT * FROM puhvi_assignment WHERE assignment_id = ?", mapPuhviResultSet, id
        )

        if (results.isEmpty()) {
            throw NotFoundException()
        }

        results[0]
    } catch (e: NotFoundException) {
        throw NotFoundException()
    }

    fun getLdAssignmentById(id: Int): AssignmentOut = try {
        val results = jdbcTemplate.query(
            "SELECT * FROM ld_assignment WHERE assignment_id = ?", mapLdResultSet, id
        )

        if (results.isEmpty()) {
            throw NotFoundException()
        }

        results[0]
    } catch (e: NotFoundException) {
        throw NotFoundException()
    }

    fun updateSukoAssignment(assignment: SukoUpdateAssignmentDtoIn, id: Int): Int = try {
        val results = jdbcTemplate.query(
            "UPDATE suko_assignment SET assignment_name_fi = ?, assignment_name_sv = ?, assignment_content_fi = ?, assignment_content_sv = ?, suko_assignment_type_koodi_arvo = ?, assignment_publish_state = ?::publish_state, assignment_updated_at = now() WHERE assignment_id = ? RETURNING assignment_id",
            { rs: ResultSet, _: Int ->
                rs.getInt("assignment_id")
            },
            assignment.nameFi,
            assignment.nameSv,
            assignment.contentFi,
            assignment.contentSv,
            assignment.assignmentTypeKoodiArvo,
            assignment.publishState.toString(),
            id
        )

        if (results.isEmpty()) {
            throw NotFoundException()
        }

        results[0]
    } catch (e: NotFoundException) {
        throw NotFoundException()
    }


    fun updatePuhviAssignment(assignment: PuhviUpdateAssignmentDtoIn, id: Int): Int = try {
        val results = jdbcTemplate.query(
            "UPDATE puhvi_assignment SET assignment_name_fi = ?, assignment_name_sv = ?, assignment_content_fi = ?, assignment_content_sv = ?, assignment_publish_state = ?::publish_state, assignment_updated_at = now() WHERE assignment_id = ? RETURNING assignment_id",
            { rs: ResultSet, _: Int ->
                rs.getInt("assignment_id")
            },
            assignment.nameFi,
            assignment.nameSv,
            assignment.contentFi,
            assignment.contentSv,
            assignment.publishState.toString(),
            id
        )

        if (results.isEmpty()) {
            throw NotFoundException()
        }

        results[0]
    } catch (e: NotFoundException) {
        throw NotFoundException()
    }

    fun updateLdAssignment(assignment: LdUpdateAssignmentDtoIn, id: Int): Int = try {
        val results = jdbcTemplate.query(
            "UPDATE ld_assignment SET assignment_name_fi = ?, assignment_name_sv = ?, assignment_content_fi = ?, assignment_content_sv = ?, assignment_publish_state = ?::publish_state, assignment_updated_at = now() WHERE assignment_id = ? RETURNING assignment_id",
            { rs: ResultSet, _: Int ->
                rs.getInt("assignment_id")
            },
            assignment.nameFi,
            assignment.nameSv,
            assignment.contentFi,
            assignment.contentSv,
            assignment.publishState.toString(),
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