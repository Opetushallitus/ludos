package fi.oph.ludos.assignment

import BaseFilters
import fi.oph.ludos.Exam
import fi.oph.ludos.PublishState
import fi.oph.ludos.auth.Kayttajatiedot
import fi.oph.ludos.auth.Role
import fi.oph.ludos.repository.getKotlinArray
import org.springframework.jdbc.core.JdbcTemplate
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate
import org.springframework.stereotype.Component
import java.sql.ResultSet


@Component
class AssignmentRepository(
    private val namedJdbcTemplate: NamedParameterJdbcTemplate,
    private val jdbcTemplate: JdbcTemplate,
) {

    val mapSukoResultSet: (ResultSet, Int) -> SukoAssignmentDtoOut = { rs: ResultSet, _: Int ->
        SukoAssignmentDtoOut(
            rs.getInt("assignment_id"),
            rs.getString("assignment_name_fi"),
            rs.getString("assignment_name_sv"),
            rs.getString("assignment_content_fi"),
            rs.getString("assignment_content_sv"),
            rs.getString("assignment_instruction_fi"),
            rs.getString("assignment_instruction_sv"),
            PublishState.valueOf(rs.getString("assignment_publish_state")),
            rs.getTimestamp("assignment_created_at"),
            rs.getTimestamp("assignment_updated_at"),
            rs.getKotlinArray<String>("assignment_laajaalainen_osaaminen_koodi_arvos"),
            rs.getString("assignment_author_oid"),
            rs.getString("suko_assignment_assignment_type_koodi_arvo"),
            rs.getString("suko_assignment_oppimaara_koodi_arvo"),
            rs.getString("suko_assignment_tavoitetaso_koodi_arvo"),
            rs.getKotlinArray<String>("suko_assignment_aihe_koodi_arvos")
        )
    }

    val mapPuhviResultSet: (ResultSet, Int) -> PuhviAssignmentDtoOut = { rs: ResultSet, _: Int ->
        PuhviAssignmentDtoOut(
            rs.getInt("assignment_id"),
            rs.getString("assignment_name_fi"),
            rs.getString("assignment_name_sv"),
            rs.getString("assignment_content_fi"),
            rs.getString("assignment_content_sv"),
            rs.getString("assignment_instruction_fi"),
            rs.getString("assignment_instruction_sv"),
            PublishState.valueOf(rs.getString("assignment_publish_state")),
            rs.getTimestamp("assignment_created_at"),
            rs.getTimestamp("assignment_updated_at"),
            rs.getKotlinArray<String>("assignment_laajaalainen_osaaminen_koodi_arvos"),
            rs.getString("assignment_author_oid"),
            rs.getString("puhvi_assignment_assignment_type_koodi_arvo"),
            rs.getKotlinArray<String>("puhvi_assignment_lukuvuosi_koodi_arvos"),
        )
    }

    val mapLdResultSet: (ResultSet, Int) -> LdAssignmentDtoOut = { rs: ResultSet, _: Int ->
        LdAssignmentDtoOut(
            rs.getInt("assignment_id"),
            rs.getString("assignment_name_fi"),
            rs.getString("assignment_name_sv"),
            rs.getString("assignment_content_fi"),
            rs.getString("assignment_content_sv"),
            rs.getString("assignment_instruction_fi"),
            rs.getString("assignment_instruction_sv"),
            PublishState.valueOf(rs.getString("assignment_publish_state")),
            rs.getTimestamp("assignment_created_at"),
            rs.getTimestamp("assignment_updated_at"),
            rs.getKotlinArray<String>("assignment_laajaalainen_osaaminen_koodi_arvos"),
            rs.getString("assignment_author_oid"),
            rs.getKotlinArray<String>("ld_assignment_lukuvuosi_koodi_arvos"),
            rs.getString("ld_assignment_aine_koodi_arvo")
        )
    }

    fun getAssignments(assignmentFilter: BaseFilters): List<AssignmentOut> {
        val role = Kayttajatiedot.fromSecurityContext().role
        val (query, parameters, mapper) = buildQuery(assignmentFilter, role)

        return namedJdbcTemplate.query(query, parameters, mapper)
    }

    private fun buildQuery(
        filters: BaseFilters, role: Role
    ): Triple<String, MapSqlParameterSource, (ResultSet, Int) -> AssignmentOut> = when (filters) {
        is SukoBaseFilters -> buildSukoQuery(filters, role)
        is PuhviBaseFilters -> buildPuhviQuery(filters, role)
        is LdBaseFilters -> buildLdQuery(filters, role)
        else -> throw UnknownError("Unknown assignment filter ${filters::class.simpleName}")
    }

    private fun buildSukoQuery(
        filters: SukoBaseFilters, role: Role
    ): Triple<String, MapSqlParameterSource, (ResultSet, Int) -> SukoAssignmentDtoOut> {
        val parameters = MapSqlParameterSource()

        var query = "SELECT * FROM suko_assignment WHERE true"

        if (filters.tehtavatyyppisuko != null) {
            val values = filters.tehtavatyyppisuko.split(",")

            query += " AND suko_assignment_assignment_type_koodi_arvo IN (:sukoAssignmentTypeKoodiArvo)"
            parameters.addValue("sukoAssignmentTypeKoodiArvo", values)
        }

        if (filters.oppimaara != null) {
            val values = filters.oppimaara.split(",")

            query += " AND suko_assignment_oppimaara_koodi_arvo IN (:oppimaaraKoodiArvo)"
            parameters.addValue("oppimaaraKoodiArvo", values)
        }

        if (filters.aihe != null) {
            query += " AND ARRAY[:aiheKoodiArvo ]::text[] && suko_assignment_aihe_koodi_arvos"

            parameters.addValue("aiheKoodiArvo", filters.aihe.split(","))
        }

        if (filters.tavoitetaitotaso != null) {
            val values = filters.tavoitetaitotaso.split(",")

            query += " AND suko_assignment_tavoitetaso_koodi_arvo IN (:tavoitetasoKoodiArvo)"
            parameters.addValue("tavoitetasoKoodiArvo", values)
        }

        if (role == Role.OPETTAJA) {
            query += " AND assignment_publish_state = 'PUBLISHED'"
        }

        query += " ORDER BY assignment_created_at"

        if (filters.orderDirection != null) {
            query += " ${filters.orderDirection}"
        }

        return Triple(query, parameters, mapSukoResultSet)
    }

    private fun buildPuhviQuery(
        filters: PuhviBaseFilters, role: Role
    ): Triple<String, MapSqlParameterSource, (ResultSet, Int) -> PuhviAssignmentDtoOut> {
        val parameters = MapSqlParameterSource()

        var query = "SELECT * FROM puhvi_assignment WHERE true"

        if (filters.tehtavatyyppipuhvi != null) {
            val values = filters.tehtavatyyppipuhvi.split(",")

            query += " AND puhvi_assignment_assignment_type_koodi_arvo IN (:puhviAssignmentTypeKoodiArvo)"
            parameters.addValue("puhviAssignmentTypeKoodiArvo", values)
        }

        if (filters.lukuvuosi != null) {
            query += " AND ARRAY[:lukuvuosiKoodiArvo ]::text[] && puhvi_assignment_lukuvuosi_koodi_arvos"
            parameters.addValue("lukuvuosiKoodiArvo", filters.lukuvuosi.split(","))
        }

        if (role == Role.OPETTAJA) {
            query += " AND assignment_publish_state = 'PUBLISHED'"
        }

        query += " ORDER BY assignment_created_at"

        if (filters.orderDirection != null) {
            query += " ${filters.orderDirection}"
        }

        return Triple(query, parameters, mapPuhviResultSet)
    }

    private fun buildLdQuery(
        filters: LdBaseFilters, role: Role
    ): Triple<String, MapSqlParameterSource, (ResultSet, Int) -> LdAssignmentDtoOut> {
        val parameters = MapSqlParameterSource()

        var query = "SELECT * FROM ld_assignment WHERE true"

        if (filters.lukuvuosi != null) {
            query += " AND ARRAY[:lukuvuosiKoodiArvo ]::text[] && ld_assignment_lukuvuosi_koodi_arvos"
            parameters.addValue("lukuvuosiKoodiArvo", filters.lukuvuosi.split(","))
        }

        if (filters.aine != null) {
            val values = filters.aine.split(",")

            query += " AND ld_assignment_aine_koodi_arvo IN (:aineKoodiArvo)"
            parameters.addValue("aineKoodiArvo", values)
        }

        if (role == Role.OPETTAJA) {
            query += " AND assignment_publish_state = 'PUBLISHED'"
        }

        query += " ORDER BY assignment_created_at"

        if (filters.orderDirection != null) {
            query += " ${filters.orderDirection}"
        }

        return Triple(query, parameters, mapLdResultSet)
    }


    fun saveSukoAssignment(assignment: SukoAssignmentDtoIn): SukoAssignmentDtoOut = jdbcTemplate.query(
        """INSERT INTO suko_assignment (
            |assignment_name_fi,
            |assignment_name_sv,
            |assignment_content_fi,
            |assignment_content_sv,
            |assignment_instruction_fi,
            |assignment_instruction_sv,
            |assignment_publish_state,
            |suko_assignment_aihe_koodi_arvos, 
            |suko_assignment_assignment_type_koodi_arvo, 
            |suko_assignment_oppimaara_koodi_arvo, 
            |suko_assignment_tavoitetaso_koodi_arvo,
            |assignment_laajaalainen_osaaminen_koodi_arvos,
            |assignment_author_oid) 
            |VALUES (?, ?, ?, ?, ?, ?, ?::publish_state, ?, ?, ?, ?, ?, ?) 
            |RETURNING assignment_id, assignment_author_oid, assignment_created_at, assignment_updated_at""".trimMargin(),
        { rs: ResultSet, _: Int ->
            SukoAssignmentDtoOut(
                rs.getInt("assignment_id"),
                assignment.nameFi,
                assignment.nameSv,
                assignment.contentFi,
                assignment.contentSv,
                assignment.instructionFi,
                assignment.instructionSv,
                assignment.publishState,
                rs.getTimestamp("assignment_created_at"),
                rs.getTimestamp("assignment_updated_at"),
                assignment.laajaalainenOsaaminenKoodiArvos,
                rs.getString("assignment_author_oid"),
                assignment.assignmentTypeKoodiArvo,
                assignment.oppimaaraKoodiArvo,
                assignment.tavoitetasoKoodiArvo,
                assignment.aiheKoodiArvos,
            )
        },
        assignment.nameFi,
        assignment.nameSv,
        assignment.contentFi,
        assignment.contentSv,
        assignment.instructionFi,
        assignment.instructionSv,
        assignment.publishState.toString(),
        assignment.aiheKoodiArvos,
        assignment.assignmentTypeKoodiArvo,
        assignment.oppimaaraKoodiArvo,
        assignment.tavoitetasoKoodiArvo,
        assignment.laajaalainenOsaaminenKoodiArvos,
        Kayttajatiedot.fromSecurityContext().oidHenkilo,
    )[0]

    fun savePuhviAssignment(assignment: PuhviAssignmentDtoIn): PuhviAssignmentDtoOut = jdbcTemplate.query(
        """INSERT INTO puhvi_assignment (
            |assignment_name_fi, 
            |assignment_name_sv, 
            |assignment_content_fi, 
            |assignment_content_sv, 
            |assignment_instruction_fi,
            |assignment_instruction_sv,
            |assignment_publish_state,
            |assignment_laajaalainen_osaaminen_koodi_arvos,
            |assignment_author_oid,
            |puhvi_assignment_assignment_type_koodi_arvo,
            |puhvi_assignment_lukuvuosi_koodi_arvos
            |) 
            |VALUES (?, ?, ?, ?, ?, ?, ?::publish_state, ?, ?, ?, ?) 
            |RETURNING assignment_id, assignment_author_oid, assignment_created_at, assignment_updated_at""".trimMargin(),
        { rs: ResultSet, _: Int ->
            PuhviAssignmentDtoOut(
                rs.getInt("assignment_id"),
                assignment.nameFi,
                assignment.nameSv,
                assignment.contentFi,
                assignment.contentSv,
                assignment.instructionFi,
                assignment.instructionSv,
                assignment.publishState,
                rs.getTimestamp("assignment_created_at"),
                rs.getTimestamp("assignment_updated_at"),
                assignment.laajaalainenOsaaminenKoodiArvos,
                rs.getString("assignment_author_oid"),
                assignment.assignmentTypeKoodiArvo,
                assignment.lukuvuosiKoodiArvos
            )
        },
        assignment.nameFi,
        assignment.nameSv,
        assignment.contentFi,
        assignment.contentSv,
        assignment.instructionFi,
        assignment.instructionSv,
        assignment.publishState.toString(),
        assignment.laajaalainenOsaaminenKoodiArvos,
        Kayttajatiedot.fromSecurityContext().oidHenkilo,
        assignment.assignmentTypeKoodiArvo,
        assignment.lukuvuosiKoodiArvos
    )[0]

    fun saveLdAssignment(assignment: LdAssignmentDtoIn): LdAssignmentDtoOut = jdbcTemplate.query(
        """INSERT INTO ld_assignment (
            |assignment_name_fi, 
            |assignment_name_sv, 
            |assignment_content_fi, 
            |assignment_content_sv, 
            |assignment_instruction_fi,
            |assignment_instruction_sv,
            |assignment_publish_state,
            |assignment_laajaalainen_osaaminen_koodi_arvos,
            |assignment_author_oid,
            |ld_assignment_lukuvuosi_koodi_arvos,
            |ld_assignment_aine_koodi_arvo
            |) 
            |VALUES (?, ?, ?, ?, ?, ?, ?::publish_state, ?, ?, ?, ?) 
            |RETURNING assignment_id, assignment_author_oid, assignment_created_at, assignment_updated_at""".trimMargin(),
        { rs: ResultSet, _: Int ->
            LdAssignmentDtoOut(
                rs.getInt("assignment_id"),
                assignment.nameFi,
                assignment.nameSv,
                assignment.contentFi,
                assignment.contentSv,
                assignment.instructionFi,
                assignment.instructionSv,
                assignment.publishState,
                rs.getTimestamp("assignment_created_at"),
                rs.getTimestamp("assignment_updated_at"),
                assignment.laajaalainenOsaaminenKoodiArvos,
                rs.getString("assignment_author_oid"),
                assignment.lukuvuosiKoodiArvos,
                assignment.aineKoodiArvo
            )
        },
        assignment.nameFi,
        assignment.nameSv,
        assignment.contentFi,
        assignment.contentSv,
        assignment.instructionFi,
        assignment.instructionSv,
        assignment.publishState.toString(),
        assignment.laajaalainenOsaaminenKoodiArvos,
        Kayttajatiedot.fromSecurityContext().oidHenkilo,
        assignment.lukuvuosiKoodiArvos,
        assignment.aineKoodiArvo
    )[0]

    fun getAssignmentById(id: Int, exam: Exam): AssignmentOut? {
        val role = Kayttajatiedot.fromSecurityContext().role

        val tableAndMapper = when (exam) {
            Exam.SUKO -> "suko_assignment" to mapSukoResultSet
            Exam.PUHVI -> "puhvi_assignment" to mapPuhviResultSet
            Exam.LD -> "ld_assignment" to mapLdResultSet
        }

        val table = tableAndMapper.first
        val mapper = tableAndMapper.second

        return if (role == Role.OPETTAJA) {
            jdbcTemplate.query(
                "SELECT * FROM $table WHERE assignment_id = ? AND assignment_publish_state = 'PUBLISHED'", mapper, id
            )
        } else {
            jdbcTemplate.query("SELECT * FROM $table WHERE assignment_id = ?", mapper, id)
        }.firstOrNull()
    }

    fun updateSukoAssignment(assignment: SukoAssignmentDtoIn, id: Int): Int? {
        val results = jdbcTemplate.query(
            """UPDATE suko_assignment 
                |SET 
                |assignment_name_fi = ?, 
                |assignment_name_sv = ?, 
                |assignment_content_fi = ?, 
                |assignment_content_sv = ?, 
                |assignment_instruction_fi = ?,
                |assignment_instruction_sv = ?,
                |assignment_publish_state = ?::publish_state,
                |suko_assignment_aihe_koodi_arvos = ?,
                |assignment_laajaalainen_osaaminen_koodi_arvos = ?,
                |suko_assignment_assignment_type_koodi_arvo = ?,
                |suko_assignment_oppimaara_koodi_arvo = ?,
                |suko_assignment_tavoitetaso_koodi_arvo = ?,
                |assignment_updated_at = clock_timestamp()
                |WHERE assignment_id = ?
                |RETURNING assignment_id""".trimMargin(),
            { rs: ResultSet, _: Int ->
                rs.getInt("assignment_id")
            },
            assignment.nameFi,
            assignment.nameSv,
            assignment.contentFi,
            assignment.contentSv,
            assignment.instructionFi,
            assignment.instructionSv,
            assignment.publishState.toString(),
            assignment.aiheKoodiArvos,
            assignment.laajaalainenOsaaminenKoodiArvos,
            assignment.assignmentTypeKoodiArvo,
            assignment.oppimaaraKoodiArvo,
            assignment.tavoitetasoKoodiArvo,
            id
        )

        return results.firstOrNull()
    }


    fun updatePuhviAssignment(assignment: PuhviAssignmentDtoIn, id: Int): Int? {
        val results = jdbcTemplate.query(
            """UPDATE puhvi_assignment 
                |SET assignment_name_fi = ?, 
                |assignment_name_sv = ?, 
                |assignment_content_fi = ?, 
                |assignment_content_sv = ?,
                |assignment_instruction_fi = ?,
                |assignment_instruction_sv = ?,
                |assignment_publish_state = ?::publish_state, 
                |assignment_updated_at = clock_timestamp(),
                |assignment_laajaalainen_osaaminen_koodi_arvos = ?,
                |puhvi_assignment_assignment_type_koodi_arvo = ?,
                |puhvi_assignment_lukuvuosi_koodi_arvos = ?
                |WHERE assignment_id = ? 
                |RETURNING assignment_id""".trimMargin(),
            { rs: ResultSet, _: Int ->
                rs.getInt("assignment_id")
            },
            assignment.nameFi,
            assignment.nameSv,
            assignment.contentFi,
            assignment.contentSv,
            assignment.instructionFi,
            assignment.instructionSv,
            assignment.publishState.toString(),
            assignment.laajaalainenOsaaminenKoodiArvos,
            assignment.assignmentTypeKoodiArvo,
            assignment.lukuvuosiKoodiArvos,
            id
        )

        return results.firstOrNull()
    }

    fun updateLdAssignment(assignment: LdAssignmentDtoIn, id: Int): Int? {
        val results = jdbcTemplate.query(
            """UPDATE ld_assignment 
                |SET assignment_name_fi = ?, 
                |assignment_name_sv = ?, 
                |assignment_content_fi = ?, 
                |assignment_content_sv = ?,
                |assignment_instruction_fi = ?,
                |assignment_instruction_sv = ?,
                |assignment_publish_state = ?::publish_state, 
                |assignment_updated_at = clock_timestamp(),
                |assignment_laajaalainen_osaaminen_koodi_arvos = ?,
                |ld_assignment_lukuvuosi_koodi_arvos = ?,
                |ld_assignment_aine_koodi_arvo = ?
                |WHERE assignment_id = ? 
                |RETURNING assignment_id""".trimMargin(),
            { rs: ResultSet, _: Int ->
                rs.getInt("assignment_id")
            },
            assignment.nameFi,
            assignment.nameSv,
            assignment.contentFi,
            assignment.contentSv,
            assignment.instructionFi,
            assignment.instructionSv,
            assignment.publishState.toString(),
            assignment.laajaalainenOsaaminenKoodiArvos,
            assignment.lukuvuosiKoodiArvos,
            assignment.aineKoodiArvo,
            id
        )

        return results.firstOrNull()
    }

    fun getOppimaarasInUse(): List<String> = jdbcTemplate.query(
        // The same as `SELECT DISTINCT suko_assignment_oppimaara_koodi_arvo FROM suko_assignment` but 10x faster
        // since postgres SELECT DISINCT is slow, see https://wiki.postgresql.org/wiki/Loose_indexscan
        """
        WITH RECURSIVE t AS (
           (SELECT suko_assignment_oppimaara_koodi_arvo FROM suko_assignment ORDER BY suko_assignment_oppimaara_koodi_arvo LIMIT 1)
           UNION ALL
           SELECT (SELECT suko_assignment_oppimaara_koodi_arvo FROM suko_assignment WHERE suko_assignment_oppimaara_koodi_arvo > t.suko_assignment_oppimaara_koodi_arvo ORDER BY suko_assignment_oppimaara_koodi_arvo LIMIT 1)
           FROM t
           WHERE t.suko_assignment_oppimaara_koodi_arvo IS NOT NULL
           )
        SELECT suko_assignment_oppimaara_koodi_arvo FROM t WHERE suko_assignment_oppimaara_koodi_arvo IS NOT NULL;
        """.trimIndent()
    ) { rs: ResultSet, _: Int ->
        rs.getString("suko_assignment_oppimaara_koodi_arvo")
    }
}