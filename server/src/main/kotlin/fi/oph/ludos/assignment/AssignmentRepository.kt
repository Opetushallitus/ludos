package fi.oph.ludos.assignment

import BaseFilters
import fi.oph.ludos.Exam
import fi.oph.ludos.PublishState
import fi.oph.ludos.auth.Kayttajatiedot
import fi.oph.ludos.auth.Role
import fi.oph.ludos.repository.getKotlinArray
import org.springframework.http.HttpStatus
import org.springframework.jdbc.core.JdbcTemplate
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate
import org.springframework.stereotype.Component
import org.springframework.transaction.support.TransactionTemplate
import org.springframework.web.server.ResponseStatusException
import java.sql.ResultSet


@Component
class AssignmentRepository(
    private val namedJdbcTemplate: NamedParameterJdbcTemplate,
    private val jdbcTemplate: JdbcTemplate,
    private val transactionTemplate: TransactionTemplate,
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
            rs.getBoolean("is_favorite"),
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
            rs.getBoolean("is_favorite"),
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
            rs.getBoolean("is_favorite"),
            rs.getKotlinArray<String>("ld_assignment_lukuvuosi_koodi_arvos"),
            rs.getString("ld_assignment_aine_koodi_arvo")
        )
    }

    fun getAssignments(assignmentFilter: BaseFilters): List<AssignmentOut> {
        val role = Kayttajatiedot.fromSecurityContext().role
        val userOid = Kayttajatiedot.fromSecurityContext().oidHenkilo
        val (query, parameters, mapper) = buildQuery(assignmentFilter, role, userOid)

        return namedJdbcTemplate.query(query, parameters, mapper)
    }

    private fun buildQuery(
        filters: BaseFilters, role: Role, userOid: String
    ): Triple<String, MapSqlParameterSource, (ResultSet, Int) -> AssignmentOut> = when (filters) {
        is SukoBaseFilters -> buildSukoQuery(filters, role, userOid)
        is PuhviBaseFilters -> buildPuhviQuery(filters, role, userOid)
        is LdBaseFilters -> buildLdQuery(filters, role, userOid)
        else -> throw UnknownError("Unknown assignment filter ${filters::class.simpleName}")
    }

    private fun initializeQuery(exam: Exam, userOid: String): Pair<String, MapSqlParameterSource> {
        val lowercaseExam = exam.toString().lowercase()

        val query = """
        SELECT ${lowercaseExam}_assignment.*, 
               CASE WHEN fav.assignment_id IS NOT NULL THEN true ELSE false END AS is_favorite
        FROM ${lowercaseExam}_assignment
        LEFT JOIN ${lowercaseExam}_assignment_favorite fav ON ${lowercaseExam}_assignment.assignment_id = fav.assignment_id AND fav.user_oid = :userOid
        WHERE true
    """.trimIndent()
        val parameters = MapSqlParameterSource()
        parameters.addValue("userOid", userOid)
        return Pair(query, parameters)
    }

    private fun addRoleBasedQuery(query: StringBuilder, role: Role) {
        if (role == Role.OPETTAJA) {
            query.append(" AND assignment_publish_state = 'PUBLISHED'")
        }
    }

    private fun addLukuvuosiQuery(
        query: StringBuilder, parameters: MapSqlParameterSource, exam: Exam, lukuvuosi: String?
    ) {
        val lowercaseExam = exam.toString().lowercase()
        if (lukuvuosi != null) {
            query.append(" AND ARRAY[:lukuvuosiKoodiArvo ]::text[] && ${lowercaseExam}_assignment_lukuvuosi_koodi_arvos")
            parameters.addValue("lukuvuosiKoodiArvo", lukuvuosi.split(","))
        }
    }

    private fun addFavoriteQuery(query: StringBuilder, favorite: Boolean?) {
        when (favorite) {
            true -> query.append(" AND fav.assignment_id IS NOT NULL")
            false -> query.append(" AND fav.assignment_id IS NULL")
            null -> {}
        }
    }

    private fun addOrderClause(query: StringBuilder, orderDirection: String?) {
        query.append(" ORDER BY assignment_created_at")
        if (orderDirection != null) {
            query.append(" $orderDirection")
        }
    }

    private fun buildSukoQuery(
        filters: SukoBaseFilters, role: Role, userOid: String
    ): Triple<String, MapSqlParameterSource, (ResultSet, Int) -> SukoAssignmentDtoOut> {
        val (query, parameters) = initializeQuery(Exam.SUKO, userOid)
        val queryBuilder = StringBuilder(query)

        if (filters.tehtavatyyppisuko != null) {
            val values = filters.tehtavatyyppisuko.split(",")

            queryBuilder.append(" AND suko_assignment_assignment_type_koodi_arvo IN (:sukoAssignmentTypeKoodiArvo)")
            parameters.addValue("sukoAssignmentTypeKoodiArvo", values)
        }

        if (filters.oppimaara != null) {
            val values = filters.oppimaara.split(",")

            queryBuilder.append(" AND suko_assignment_oppimaara_koodi_arvo IN (:oppimaaraKoodiArvo)")
            parameters.addValue("oppimaaraKoodiArvo", values)
        }

        if (filters.aihe != null) {
            queryBuilder.append(" AND ARRAY[:aiheKoodiArvo ]::text[] && suko_assignment_aihe_koodi_arvos")
            parameters.addValue("aiheKoodiArvo", filters.aihe.split(","))
        }

        if (filters.tavoitetaitotaso != null) {
            val values = filters.tavoitetaitotaso.split(",")

            queryBuilder.append(" AND suko_assignment_tavoitetaso_koodi_arvo IN (:tavoitetasoKoodiArvo)")
            parameters.addValue("tavoitetasoKoodiArvo", values)
        }

        addFavoriteQuery(queryBuilder, filters.suosikki)
        addRoleBasedQuery(queryBuilder, role)
        addOrderClause(queryBuilder, filters.jarjesta)

        return Triple(queryBuilder.toString(), parameters, mapSukoResultSet)
    }

    private fun buildPuhviQuery(
        filters: PuhviBaseFilters, role: Role, userOid: String
    ): Triple<String, MapSqlParameterSource, (ResultSet, Int) -> PuhviAssignmentDtoOut> {
        val (query, parameters) = initializeQuery(Exam.PUHVI, userOid)
        val queryBuilder = StringBuilder(query)

        if (filters.tehtavatyyppipuhvi != null) {
            val values = filters.tehtavatyyppipuhvi.split(",")

            queryBuilder.append(" AND puhvi_assignment_assignment_type_koodi_arvo IN (:puhviAssignmentTypeKoodiArvo)")
            parameters.addValue("puhviAssignmentTypeKoodiArvo", values)
        }

        addLukuvuosiQuery(queryBuilder, parameters, Exam.PUHVI, filters.lukuvuosi)
        addFavoriteQuery(queryBuilder, filters.suosikki)
        addRoleBasedQuery(queryBuilder, role)
        addOrderClause(queryBuilder, filters.jarjesta)

        return Triple(queryBuilder.toString(), parameters, mapPuhviResultSet)
    }

    private fun buildLdQuery(
        filters: LdBaseFilters, role: Role, userOid: String
    ): Triple<String, MapSqlParameterSource, (ResultSet, Int) -> LdAssignmentDtoOut> {
        val (query, parameters) = initializeQuery(Exam.LD, userOid)
        val queryBuilder = StringBuilder(query)

        if (filters.aine != null) {
            val values = filters.aine.split(",")

            queryBuilder.append(" AND ld_assignment_aine_koodi_arvo IN (:aineKoodiArvo)")
            parameters.addValue("aineKoodiArvo", values)
        }

        addLukuvuosiQuery(queryBuilder, parameters, Exam.LD, filters.lukuvuosi)
        addFavoriteQuery(queryBuilder, filters.suosikki)
        addRoleBasedQuery(queryBuilder, role)
        addOrderClause(queryBuilder, filters.jarjesta)

        return Triple(queryBuilder.toString(), parameters, mapLdResultSet)
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
                false,
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
                false,
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
                false,
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
        val userOid = Kayttajatiedot.fromSecurityContext().oidHenkilo

        val (table, mapper) = when (exam) {
            Exam.SUKO -> "suko_assignment" to mapSukoResultSet
            Exam.PUHVI -> "puhvi_assignment" to mapPuhviResultSet
            Exam.LD -> "ld_assignment" to mapLdResultSet
        }

        val andIsPublishedIfOpettaja = if (role == Role.OPETTAJA) "AND assignment_publish_state = 'PUBLISHED'" else ""

        val sql = """
            SELECT 
                a.*,
                CASE WHEN fav.assignment_id IS NOT NULL THEN true ELSE false END AS is_favorite
            FROM $table a
            LEFT JOIN ${table}_favorite fav ON a.assignment_id = fav.assignment_id AND fav.user_oid = ?
            WHERE a.assignment_id = ? $andIsPublishedIfOpettaja 
        """.trimIndent()

        return jdbcTemplate.query(sql, mapper, userOid, id).firstOrNull()
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
        // since postgres SELECT DISTINCT is slow, see https://wiki.postgresql.org/wiki/Loose_indexscan
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

    fun getFavoriteAssignmentsCount(): Int {
        val role = Kayttajatiedot.fromSecurityContext().role
        val userOid = Kayttajatiedot.fromSecurityContext().oidHenkilo

        val andIsPublishedIfOpettaja = if (role == Role.OPETTAJA) "AND assignment_publish_state = 'PUBLISHED'" else ""

        val sql = """
            SELECT count(1)
            FROM assignment
            LEFT JOIN assignment_favorite fav
                   ON assignment.assignment_id = fav.assignment_id AND fav.user_oid = ?
            WHERE fav.assignment_id IS NOT NULL $andIsPublishedIfOpettaja;
        """.trimIndent()

        return jdbcTemplate.queryForObject(sql, Int::class.java, userOid)
    }

    fun setAssignmentFavorite(exam: Exam, id: Int, isFavorite: Boolean): Int? {
        val table = when (exam) {
            Exam.SUKO -> "suko_assignment_favorite"
            Exam.PUHVI -> "puhvi_assignment_favorite"
            Exam.LD -> "ld_assignment_favorite"
        }

        return transactionTemplate.execute { _ ->
            val sql = if (isFavorite) {
                "INSERT INTO $table (assignment_id, user_oid) VALUES (?, ?) ON CONFLICT DO NOTHING"
            } else {
                "DELETE FROM $table WHERE assignment_id = ? AND user_oid = ?"
            }

            try {
                jdbcTemplate.update(sql, id, Kayttajatiedot.fromSecurityContext().oidHenkilo)
                getFavoriteAssignmentsCount()
            } catch (e: Exception) {
                throw ResponseStatusException(HttpStatus.NOT_FOUND, "Assignment not found $id")
            }
        }
    }
}