package fi.oph.ludos.assignment

import fi.oph.ludos.ContentType
import fi.oph.ludos.PublishState
import org.springframework.data.crossstore.ChangeSetPersister.NotFoundException
import org.springframework.jdbc.core.JdbcTemplate
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate
import org.springframework.stereotype.Component
import java.sql.ResultSet
import javax.sql.DataSource


@Component
class AssignmentRepository(
    private val namedJdbcTemplate: NamedParameterJdbcTemplate,
    private val jdbcTemplate: JdbcTemplate,
    private val dataSource: DataSource
) {
    private inline fun <reified T> ResultSet.getKotlinArray(columnLabel: String): Array<T> {
        val array = this.getArray(columnLabel)?.array ?: return emptyArray()

        @Suppress("UNCHECKED_CAST") return array as Array<T>
    }

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
            ContentType.ASSIGNMENTS,
            rs.getTimestamp("assignment_created_at"),
            rs.getTimestamp("assignment_updated_at"),
            rs.getKotlinArray<String>("laajaalainen_osaaminen_koodi_arvos"),
            rs.getString("suko_assignment_type_koodi_arvo"),
            rs.getString("suko_oppimaara_koodi_arvo"),
            rs.getString("suko_tavoitetaso_koodi_arvo"),
            rs.getKotlinArray<String>("suko_aihe_koodi_arvos")
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
            ContentType.ASSIGNMENTS,
            rs.getTimestamp("assignment_created_at"),
            rs.getTimestamp("assignment_updated_at"),
            rs.getKotlinArray<String>("laajaalainen_osaaminen_koodi_arvos"),
            rs.getString("puhvi_assignment_type_koodi_arvo"),
            rs.getKotlinArray<String>("puhvi_lukuvuosi_koodi_arvos"),
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
            ContentType.ASSIGNMENTS,
            rs.getTimestamp("assignment_created_at"),
            rs.getTimestamp("assignment_updated_at"),
            rs.getKotlinArray<String>("laajaalainen_osaaminen_koodi_arvos"),
            rs.getKotlinArray<String>("ld_lukuvuosi_koodi_arvos"),
            rs.getString("ld_aine_koodi_arvo")
        )
    }

    fun getAssignments(assignmentFilter: AssignmentFilter): List<AssignmentOut> {
        val queryAndArgs = buildQuery(assignmentFilter)

        return namedJdbcTemplate.query(queryAndArgs.first, queryAndArgs.second, queryAndArgs.third)
    }

    private fun buildQuery(
        filters: AssignmentFilter
    ): Triple<String, MapSqlParameterSource, (ResultSet, Int) -> AssignmentOut> = when (filters) {
        is SukoAssignmentFilter -> buildSukoQuery(filters)
        is PuhviAssignmentFilter -> buildPuhviQuery(filters)
        is LdAssignmentFilter -> buildLdQuery(filters)
        else -> throw UnknownError("Unknown assignment filter ${filters::class.simpleName}")
    }

    private fun buildSukoQuery(filters: SukoAssignmentFilter): Triple<String, MapSqlParameterSource, (ResultSet, Int) -> SukoAssignmentDtoOut> {
        val parameters = MapSqlParameterSource()

        var query = "SELECT * FROM suko_assignment WHERE true"

        if (filters.tehtavatyyppisuko != null) {
            val values = filters.tehtavatyyppisuko.split(",")

            query += " AND suko_assignment_type_koodi_arvo IN (:sukoAssignmentTypeKoodiArvo)"
            parameters.addValue("sukoAssignmentTypeKoodiArvo", values)
        }

        if (filters.oppimaara != null) {
            val values = filters.oppimaara.split(",")

            query += " AND suko_oppimaara_koodi_arvo IN (:oppimaaraKoodiArvo)"
            parameters.addValue("oppimaaraKoodiArvo", values)
        }

        if (filters.aihe != null) {
            query += " AND ARRAY[:aiheKoodiArvo ] && suko_aihe_koodi_arvos"
            val arr = dataSource.connection.createArrayOf("text", filters.aihe.split(",").toTypedArray())
            parameters.addValue("aiheKoodiArvo", arr)
        }

        if (filters.tavoitetaitotaso != null) {
            val values = filters.tavoitetaitotaso.split(",")

            query += " AND suko_tavoitetaso_koodi_arvo IN (:tavoitetasoKoodiArvo)"
            parameters.addValue("tavoitetasoKoodiArvo", values)
        }

        query += " ORDER BY assignment_created_at"

        if (filters.orderDirection != null) {
            query += " ${filters.orderDirection}"
        }

        return Triple(query, parameters, mapSukoResultSet)
    }

    private fun buildPuhviQuery(filters: PuhviAssignmentFilter): Triple<String, MapSqlParameterSource, (ResultSet, Int) -> PuhviAssignmentDtoOut> {
        val parameters = MapSqlParameterSource()

        var query = "SELECT * FROM puhvi_assignment WHERE true"

        if (filters.tehtavatyyppipuhvi != null) {
            val values = filters.tehtavatyyppipuhvi.split(",")

            query += " AND puhvi_assignment_type_koodi_arvo IN (:puhviAssignmentTypeKoodiArvo)"
            parameters.addValue("puhviAssignmentTypeKoodiArvo", values)
        }

        if (filters.lukuvuosi != null) {
            query += " AND ARRAY[:lukuvuosiKoodiArvo ] && puhvi_lukuvuosi_koodi_arvos"
            val arr = dataSource.connection.createArrayOf("text", filters.lukuvuosi.split(",").toTypedArray())
            parameters.addValue("lukuvuosiKoodiArvo", arr)
        }

        query += " ORDER BY assignment_created_at"

        if (filters.orderDirection != null) {
            query += " ${filters.orderDirection}"
        }

        return Triple(query, parameters, mapPuhviResultSet)
    }

    private fun buildLdQuery(filters: LdAssignmentFilter): Triple<String, MapSqlParameterSource, (ResultSet, Int) -> LdAssignmentDtoOut> {
        val parameters = MapSqlParameterSource()

        var query = "SELECT * FROM ld_assignment WHERE true"

        if (filters.lukuvuosi != null) {
            query += " AND ARRAY[:lukuvuosiKoodiArvo ] && ld_lukuvuosi_koodi_arvos"
            val arr = dataSource.connection.createArrayOf("text", filters.lukuvuosi.split(",").toTypedArray())
            parameters.addValue("lukuvuosiKoodiArvo", arr)
        }

        if (filters.aine != null) {
            val values = filters.aine.split(",")

            query += " AND ld_aine_koodi_arvo IN (:aineKoodiArvo)"
            parameters.addValue("aineKoodiArvo", values)
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
            |suko_aihe_koodi_arvos, 
            |suko_assignment_type_koodi_arvo, 
            |suko_oppimaara_koodi_arvo, 
            |suko_tavoitetaso_koodi_arvo,
            |laajaalainen_osaaminen_koodi_arvos) 
            |VALUES (?, ?, ?, ?, ?, ?, ?::publish_state, ?, ?, ?, ?, ?) 
            |RETURNING assignment_id, assignment_created_at, assignment_updated_at""".trimMargin(),
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
                assignment.contentType,
                rs.getTimestamp("assignment_created_at"),
                rs.getTimestamp("assignment_updated_at"),
                assignment.laajaalainenOsaaminenKoodiArvos,
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
        assignment.laajaalainenOsaaminenKoodiArvos
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
            |laajaalainen_osaaminen_koodi_arvos,
            |puhvi_assignment_type_koodi_arvo,
            |puhvi_lukuvuosi_koodi_arvos
            |) 
            |VALUES (?, ?, ?, ?, ?, ?, ?::publish_state, ?, ?, ?) 
            |RETURNING assignment_id, assignment_created_at, assignment_updated_at""".trimMargin(),
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
                assignment.contentType,
                rs.getTimestamp("assignment_created_at"),
                rs.getTimestamp("assignment_updated_at"),
                assignment.laajaalainenOsaaminenKoodiArvos,
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
            |laajaalainen_osaaminen_koodi_arvos,
            |ld_lukuvuosi_koodi_arvos,
            |ld_aine_koodi_arvo
            |) 
            |VALUES (?, ?, ?, ?, ?, ?, ?::publish_state, ?, ?, ?) 
            |RETURNING assignment_id, assignment_created_at, assignment_updated_at""".trimMargin(),
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
                assignment.contentType,
                rs.getTimestamp("assignment_created_at"),
                rs.getTimestamp("assignment_updated_at"),
                assignment.laajaalainenOsaaminenKoodiArvos,
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
        assignment.lukuvuosiKoodiArvos,
        assignment.aineKoodiArvo
    )[0]

    fun getSukoAssignmentById(id: Int): AssignmentOut = try {
        val results = jdbcTemplate.query("SELECT * FROM suko_assignment WHERE assignment_id = ?", mapSukoResultSet, id)

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

    fun updateSukoAssignment(assignment: SukoAssignmentDtoIn, id: Int): Int = try {
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
                |suko_aihe_koodi_arvos = ?,
                |laajaalainen_osaaminen_koodi_arvos = ?,
                |suko_assignment_type_koodi_arvo = ?,
                |suko_oppimaara_koodi_arvo = ?,
                |suko_tavoitetaso_koodi_arvo = ?,
                |assignment_updated_at = now()
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

        if (results.isEmpty()) {
            throw NotFoundException()
        }

        results[0]
    } catch (e: NotFoundException) {
        throw NotFoundException()
    }


    fun updatePuhviAssignment(assignment: PuhviAssignmentDtoIn, id: Int): Int = try {
        val results = jdbcTemplate.query(
            """UPDATE puhvi_assignment 
                |SET assignment_name_fi = ?, 
                |assignment_name_sv = ?, 
                |assignment_content_fi = ?, 
                |assignment_content_sv = ?,
                |assignment_instruction_fi = ?,
                |assignment_instruction_sv = ?,
                |assignment_publish_state = ?::publish_state, 
                |assignment_updated_at = now(),
                |laajaalainen_osaaminen_koodi_arvos = ?,
                |puhvi_assignment_type_koodi_arvo = ?,
                |puhvi_lukuvuosi_koodi_arvos = ?
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

        if (results.isEmpty()) {
            throw NotFoundException()
        }

        results[0]
    } catch (e: NotFoundException) {
        throw NotFoundException()
    }

    fun updateLdAssignment(assignment: LdAssignmentDtoIn, id: Int): Int = try {
        val results = jdbcTemplate.query(
            """UPDATE ld_assignment 
                |SET assignment_name_fi = ?, 
                |assignment_name_sv = ?, 
                |assignment_content_fi = ?, 
                |assignment_content_sv = ?,
                |assignment_instruction_fi = ?,
                |assignment_instruction_sv = ?,
                |assignment_publish_state = ?::publish_state, 
                |assignment_updated_at = now(),
                |laajaalainen_osaaminen_koodi_arvos = ?,
                |ld_lukuvuosi_koodi_arvos = ?,
                |ld_aine_koodi_arvo = ?
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

        if (results.isEmpty()) {
            throw NotFoundException()
        }

        results[0]
    } catch (e: NotFoundException) {
        throw NotFoundException()
    }

    fun getOppimaarasInUse(): List<String> = jdbcTemplate.query(
        // The same as `SELECT DISTINCT suko_oppimaara_koodi_arvo FROM suko_assignment` but 10x faster
        // since postgres SELECT DISINCT is slow, see https://wiki.postgresql.org/wiki/Loose_indexscan
        """
        WITH RECURSIVE t AS (
           (SELECT suko_oppimaara_koodi_arvo FROM suko_assignment ORDER BY suko_oppimaara_koodi_arvo LIMIT 1)
           UNION ALL
           SELECT (SELECT suko_oppimaara_koodi_arvo FROM suko_assignment WHERE suko_oppimaara_koodi_arvo > t.suko_oppimaara_koodi_arvo ORDER BY suko_oppimaara_koodi_arvo LIMIT 1)
           FROM t
           WHERE t.suko_oppimaara_koodi_arvo IS NOT NULL
           )
        SELECT suko_oppimaara_koodi_arvo FROM t WHERE suko_oppimaara_koodi_arvo IS NOT NULL;
        """.trimIndent()
    ) { rs: ResultSet, _: Int ->
        rs.getString("suko_oppimaara_koodi_arvo")
    }
}