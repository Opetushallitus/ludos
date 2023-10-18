package fi.oph.ludos.assignment

import BaseFilters
import Language
import fi.oph.ludos.Exam
import fi.oph.ludos.PublishState
import fi.oph.ludos.auth.Kayttajatiedot
import fi.oph.ludos.auth.Role
import fi.oph.ludos.koodisto.KoodistoLanguage
import fi.oph.ludos.koodisto.KoodistoName
import fi.oph.ludos.koodisto.KoodistoService
import fi.oph.ludos.repository.getKotlinArray
import org.springframework.http.HttpStatus
import org.springframework.jdbc.core.JdbcTemplate
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate
import org.springframework.jdbc.support.GeneratedKeyHolder
import org.springframework.stereotype.Component
import org.springframework.transaction.support.TransactionTemplate
import org.springframework.web.server.ResponseStatusException
import java.sql.Connection
import java.sql.ResultSet
import java.util.*

data class AssignmentListMetadata(
    val assignmentFilterOptions: AssignmentFilterOptionsDtoOut,
    val totalCount: Int
)

@Component
class AssignmentRepository(
    private val namedJdbcTemplate: NamedParameterJdbcTemplate,
    private val jdbcTemplate: JdbcTemplate,
    private val transactionTemplate: TransactionTemplate,
    private val koodistoService: KoodistoService,
) {

    val mapSukoListResultSet: (ResultSet, Int) -> SukoAssignmentDtoOut = { rs: ResultSet, _: Int ->
        SukoAssignmentDtoOut(
            rs.getInt("assignment_id"),
            rs.getString("assignment_name_fi"),
            rs.getString("assignment_name_sv"),
            rs.getString("assignment_instruction_fi"),
            rs.getString("assignment_instruction_sv"),
            rs.getKotlinArray("assignment_content_fi"),
            rs.getKotlinArray("assignment_content_sv"),
            PublishState.valueOf(rs.getString("assignment_publish_state")),
            rs.getTimestamp("assignment_created_at"),
            rs.getTimestamp("assignment_updated_at"),
            rs.getKotlinArray<String>("assignment_laajaalainen_osaaminen_koodi_arvos"),
            rs.getString("assignment_author_oid"),
            rs.getBoolean("is_favorite"),
            rs.getString("suko_assignment_assignment_type_koodi_arvo"),
            Oppimaara(
                rs.getString("suko_assignment_oppimaara_koodi_arvo"),
                rs.getString("suko_assignment_oppimaara_kielitarjonta_koodi_arvo")
            ),
            rs.getString("suko_assignment_tavoitetaso_koodi_arvo"),
            rs.getKotlinArray<String>("suko_assignment_aihe_koodi_arvos")
        )
    }

    val mapLdResultSet: (ResultSet, Int) -> LdAssignmentDtoOut = { rs: ResultSet, _: Int ->
        LdAssignmentDtoOut(
            rs.getInt("assignment_id"),
            rs.getString("assignment_name_fi"),
            rs.getString("assignment_name_sv"),
            rs.getString("assignment_instruction_fi"),
            rs.getString("assignment_instruction_sv"),
            rs.getKotlinArray("assignment_content_fi"),
            rs.getKotlinArray("assignment_content_sv"),
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

    val mapPuhviResultSet: (ResultSet, Int) -> PuhviAssignmentDtoOut = { rs: ResultSet, _: Int ->
        PuhviAssignmentDtoOut(
            rs.getInt("assignment_id"),
            rs.getString("assignment_name_fi"),
            rs.getString("assignment_name_sv"),
            rs.getString("assignment_instruction_fi"),
            rs.getString("assignment_instruction_sv"),
            rs.getKotlinArray("assignment_content_fi"),
            rs.getKotlinArray("assignment_content_sv"),
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


    private fun getTableNameFromExam(exam: Exam) = when (exam) {
        Exam.SUKO -> "suko_assignment"
        Exam.PUHVI -> "puhvi_assignment"
        Exam.LD -> "ld_assignment"
    }

    fun getAssignments(assignmentFilter: BaseFilters): AssignmentListDtoOut {
        val role = Kayttajatiedot.fromSecurityContext().role
        val userOid = Kayttajatiedot.fromSecurityContext().oidHenkilo

        // NOTE: both metadata and data can be fetched relatively easily in a single query if required: https://opetushallitus.slack.com/archives/D04TDKGKMK9/p1697460263573769
        val (metadataQuery, metadataParameters, metadataExtractor) = buildListMetadataQuery(
            assignmentFilter,
            role,
            userOid
        )
        val metadata = namedJdbcTemplate.query(metadataQuery, metadataParameters, metadataExtractor)

        val (listQuery, listParameters, listMapper) = buildListQuery(assignmentFilter, role, userOid)
        val assignments = namedJdbcTemplate.query(listQuery, listParameters, listMapper)

        val totalCount = metadata!!.totalCount
        val totalPages = if (totalCount == 0) 1 else (totalCount + ASSIGNMENT_PAGE_SIZE - 1) / ASSIGNMENT_PAGE_SIZE

        return AssignmentListDtoOut(
            assignments,
            totalPages,
            assignmentFilter.sivu,
            metadata.assignmentFilterOptions
        )
    }

    private fun buildListMetadataQuery(
        filters: BaseFilters, role: Role, userOid: String
    ): Triple<String, MapSqlParameterSource, (ResultSet) -> AssignmentListMetadata> = when (filters) {
        is SukoFilters -> buildSukoListMetadataQuery(filters, role, userOid)
        is PuhviFilters -> buildPuhviListMetadataQuery(filters, role, userOid)
        is LdFilters -> buildLdListMetadataQuery(filters, role, userOid)
        else -> throw UnknownError("Unknown assignment filter ${filters::class.simpleName}")
    }

    private fun buildListQuery(
        filters: BaseFilters, role: Role, userOid: String, noLimit: Boolean = false
    ): Triple<String, MapSqlParameterSource, (ResultSet, Int) -> AssignmentOut> = when (filters) {
        is SukoFilters -> buildSukoListQuery(filters, role, userOid, noLimit)
        is PuhviFilters -> buildPuhviListQuery(filters, role, userOid, noLimit)
        is LdFilters -> buildLdListQuery(filters, role, userOid, noLimit)
        else -> throw UnknownError("Unknown assignment filter ${filters::class.simpleName}")
    }

    private fun baseAssignmentListQuery(exam: Exam, userOid: String): Pair<StringBuilder, MapSqlParameterSource> {
        val table = getTableNameFromExam(exam)

        val query = """
        SELECT a.*, 
               ARRAY_AGG(content.assignment_content_content ORDER BY content.assignment_content_order_index) FILTER (WHERE content.assignment_content_language = '${Language.FI}') AS assignment_content_fi,
               ARRAY_AGG(content.assignment_content_content ORDER BY content.assignment_content_order_index) FILTER (WHERE content.assignment_content_language = '${Language.SV}') AS assignment_content_sv,
               MAX(CASE WHEN fav.assignment_id IS NOT NULL THEN 1 ELSE 0 END)::boolean AS is_favorite
        FROM $table a
        LEFT JOIN ${table}_content content ON a.assignment_id = content.assignment_id
        LEFT JOIN ${table}_favorite fav ON a.assignment_id = fav.assignment_id AND fav.user_oid = :userOid
        WHERE true
    """.trimIndent()
        val parameters = MapSqlParameterSource()
        parameters.addValue("userOid", userOid)
        return Pair(StringBuilder(query), parameters)
    }

    private fun addRoleBasedFilter(query: StringBuilder, role: Role) {
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

    private fun addFavoriteFilter(query: StringBuilder, favorite: Boolean?) {
        when (favorite) {
            true -> query.append(" AND fav.assignment_id IS NOT NULL")
            false -> query.append(" AND fav.assignment_id IS NULL")
            null -> {}
        }
    }

    private fun addOrderClause(query: StringBuilder, orderDirection: String?) {
        query.append(" ORDER BY assignment_created_at ${orderDirection ?: "DESC"}")
    }

    private fun addPageLimitAndOffset(
        query: StringBuilder,
        parameters: MapSqlParameterSource,
        page: Int
    ) {
        query.append(" LIMIT :limit OFFSET :offset")
        parameters.addValue("limit", ASSIGNMENT_PAGE_SIZE)
        parameters.addValue("offset", (page - 1) * ASSIGNMENT_PAGE_SIZE)
    }

    private fun commonQueryFilters(
        filters: AssignmentBaseFilters,
        role: Role,
        query: StringBuilder,
        parameters: MapSqlParameterSource,
        noLimit: Boolean
    ) {
        addFavoriteFilter(query, filters.suosikki)
        addRoleBasedFilter(query, role)
        query.append(" GROUP BY a.assignment_id")
        addOrderClause(query, filters.jarjesta)
        if (!noLimit) {
            addPageLimitAndOffset(query, parameters, filters.sivu)
        }
    }

    private fun addSukoFilters(queryBuilder: StringBuilder, parameters: MapSqlParameterSource, filters: SukoFilters) {
        if (filters.tehtavatyyppisuko != null) {
            val values = filters.tehtavatyyppisuko.split(",")

            queryBuilder.append(" AND suko_assignment_assignment_type_koodi_arvo IN (:sukoAssignmentTypeKoodiArvo)")
            parameters.addValue("sukoAssignmentTypeKoodiArvo", values)
        }

        if (filters.oppimaara != null) {
            val oppimaaras = filters.oppimaara.split(",").map {
                val parts = it.split(".")
                Oppimaara(parts[0], parts.elementAtOrNull(1))
            }

            // Oppimääriä on kolmea eri tyyppiä
            // 1) Oppimäärät, joille ei voi antaa tarkennetta
            //    => palautetaan tehtävät, joiden (oppimääräkoodiarvo,kielitarkennekoodiarvo)-pari mätsää (kielitarkennekoodiarvo==null)
            // 2) Oppimäärät, joille voi antaa tarkenteen, ja tarkenne on annettu
            //    => palautetaan tehtävät, joiden (oppimääräkoodiarvo,kielitarkennekoodiarvo)-pari mätsää (kielitarkennekoodiarvo!=null)
            // 3) Oppimäärät, joille voi antaa tarkenteen, mutta sitä ei ole annettu
            //    => palautetaan tehtävät, joiden oppimääräkoodiarvo mätsää riippumatta tarkenteesta

            val (tarkennettavatOppimaaratIlmanTarkennetta, restOfOppimaaras) = oppimaaras.partition {
                (koodistoService.getKoodi(
                    KoodistoName.OPPIAINEET_JA_OPPIMAARAT_LOPS2021,
                    KoodistoLanguage.FI,
                    it.oppimaaraKoodiArvo
                )?.tarkenteet?.size ?: 0) > 0 && it.kielitarjontaKoodiArvo == null
            }

            queryBuilder.append(" AND (")
            if (restOfOppimaaras.isNotEmpty()) {
                queryBuilder.append("ARRAY[suko_assignment_oppimaara_koodi_arvo, suko_assignment_oppimaara_kielitarjonta_koodi_arvo] IN (:oppimaaras)")
                val oppimaaraArrays = jdbcTemplate.execute { connection: Connection ->
                    restOfOppimaaras.map {
                        connection.createArrayOf(
                            "text",
                            arrayOf(it.oppimaaraKoodiArvo, it.kielitarjontaKoodiArvo)
                        )
                    }
                }
                parameters.addValue("oppimaaras", oppimaaraArrays)
            }
            if (restOfOppimaaras.isNotEmpty() && tarkennettavatOppimaaratIlmanTarkennetta.isNotEmpty()) {
                queryBuilder.append(" OR ")
            }
            if (tarkennettavatOppimaaratIlmanTarkennetta.isNotEmpty()) {
                queryBuilder.append("suko_assignment_oppimaara_koodi_arvo IN (:tarkennettavatOppimaaratIlmanTarkennetta)")
                parameters.addValue(
                    "tarkennettavatOppimaaratIlmanTarkennetta",
                    tarkennettavatOppimaaratIlmanTarkennetta.map { it.oppimaaraKoodiArvo })
            }
            queryBuilder.append(")")
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
    }

    private fun buildSukoListQuery(
        filters: SukoFilters, role: Role, userOid: String, noLimit: Boolean
    ): Triple<String, MapSqlParameterSource, (ResultSet, Int) -> SukoAssignmentDtoOut> {
        val (queryBuilder, parameters) = baseAssignmentListQuery(Exam.SUKO, userOid)

        addSukoFilters(queryBuilder, parameters, filters)
        commonQueryFilters(filters, role, queryBuilder, parameters, noLimit)

        return Triple(queryBuilder.toString(), parameters, mapSukoListResultSet)
    }

    private val sukoListMetadataResultSetExtractor: (ResultSet) -> AssignmentListMetadata = { rs: ResultSet ->
        val oppimaaraOptions: SortedSet<Oppimaara> = sortedSetOf()
        val tehtavatyyppiOptions: SortedSet<String> = sortedSetOf()
        val aiheOptions: SortedSet<String> = sortedSetOf()
        val tavoitetaitotasoOptions: SortedSet<String> = sortedSetOf()
        var totalCount = 0

        while (rs.next()) {
            totalCount++
            oppimaaraOptions.add(
                Oppimaara(
                    rs.getString("suko_assignment_oppimaara_koodi_arvo"),
                    rs.getString("suko_assignment_oppimaara_kielitarjonta_koodi_arvo")
                )
            )
            tehtavatyyppiOptions.add(rs.getString("suko_assignment_assignment_type_koodi_arvo"))
            rs.getKotlinArray<String>("suko_assignment_aihe_koodi_arvos").forEach { aiheOptions.add(it) }
            rs.getString("suko_assignment_tavoitetaso_koodi_arvo")?.let { tavoitetaitotasoOptions.add(it) }
        }

        AssignmentListMetadata(
            assignmentFilterOptions = AssignmentFilterOptionsDtoOut(
                oppimaara = oppimaaraOptions.toList(),
                tehtavatyyppi = tehtavatyyppiOptions.toList(),
                aihe = aiheOptions.toList(),
                tavoitetaitotaso = tavoitetaitotasoOptions.toList(),
            ),
            totalCount = totalCount
        )
    }

    private fun buildSukoListMetadataQuery(
        filters: SukoFilters,
        role: Role,
        userOid: String
    ): Triple<String, MapSqlParameterSource, (ResultSet) -> AssignmentListMetadata> {
        val queryBuilder = StringBuilder(
            """
            SELECT
                a.suko_assignment_aihe_koodi_arvos,
                a.suko_assignment_assignment_type_koodi_arvo,
                a.suko_assignment_oppimaara_koodi_arvo,
                a.suko_assignment_oppimaara_kielitarjonta_koodi_arvo,
                a.suko_assignment_tavoitetaso_koodi_arvo
            FROM suko_assignment a
            LEFT JOIN suko_assignment_favorite fav ON a.assignment_id = fav.assignment_id AND fav.user_oid = :userOid
            WHERE true
         """.trimIndent()
        )

        val parameters = MapSqlParameterSource()
        parameters.addValue("userOid", userOid)

        addSukoFilters(queryBuilder, parameters, filters)
        addFavoriteFilter(queryBuilder, filters.suosikki)
        addRoleBasedFilter(queryBuilder, role)

        return Triple(queryBuilder.toString(), parameters, sukoListMetadataResultSetExtractor)
    }

    private val puhviListMetadataResultSetExtractor: (ResultSet) -> AssignmentListMetadata = { rs: ResultSet ->
        val lukuvuosiOptions: SortedSet<String> = sortedSetOf()
        val tehtavatyyppiOptions: SortedSet<String> = sortedSetOf()
        var totalCount = 0

        while (rs.next()) {
            totalCount++
            tehtavatyyppiOptions.add(rs.getString("puhvi_assignment_assignment_type_koodi_arvo"))
            rs.getKotlinArray<String>("puhvi_assignment_lukuvuosi_koodi_arvos").forEach { lukuvuosiOptions.add(it) }
        }

        AssignmentListMetadata(
            assignmentFilterOptions = AssignmentFilterOptionsDtoOut(
                lukuvuosi = lukuvuosiOptions.toList(),
                tehtavatyyppi = tehtavatyyppiOptions.toList()
            ),
            totalCount = totalCount
        )
    }

    private fun buildPuhviListMetadataQuery(
        filters: PuhviFilters,
        role: Role,
        userOid: String
    ): Triple<String, MapSqlParameterSource, (ResultSet) -> AssignmentListMetadata> {
        val queryBuilder = StringBuilder(
            """
            SELECT
                a.assignment_laajaalainen_osaaminen_koodi_arvos,
                a.puhvi_assignment_lukuvuosi_koodi_arvos,
                a.puhvi_assignment_assignment_type_koodi_arvo
            FROM puhvi_assignment a
            LEFT JOIN puhvi_assignment_favorite fav ON a.assignment_id = fav.assignment_id AND fav.user_oid = :userOid
            WHERE true
         """.trimIndent()
        )

        val parameters = MapSqlParameterSource()
        parameters.addValue("userOid", userOid)

        addPuhviFilters(queryBuilder, parameters, filters)
        addFavoriteFilter(queryBuilder, filters.suosikki)
        addRoleBasedFilter(queryBuilder, role)

        return Triple(queryBuilder.toString(), parameters, puhviListMetadataResultSetExtractor)
    }

    private fun addPuhviFilters(queryBuilder: StringBuilder, parameters: MapSqlParameterSource, filters: PuhviFilters) {
        if (filters.tehtavatyyppipuhvi != null) {
            val values = filters.tehtavatyyppipuhvi.split(",")

            queryBuilder.append(" AND puhvi_assignment_assignment_type_koodi_arvo IN (:puhviAssignmentTypeKoodiArvo)")
            parameters.addValue("puhviAssignmentTypeKoodiArvo", values)
        }

        addLukuvuosiQuery(queryBuilder, parameters, Exam.PUHVI, filters.lukuvuosi)
    }


    private fun buildPuhviListQuery(
        filters: PuhviFilters, role: Role, userOid: String, noLimit: Boolean
    ): Triple<String, MapSqlParameterSource, (ResultSet, Int) -> PuhviAssignmentDtoOut> {
        val (queryBuilder, parameters) = baseAssignmentListQuery(Exam.PUHVI, userOid)

        addPuhviFilters(queryBuilder, parameters, filters)
        commonQueryFilters(filters, role, queryBuilder, parameters, noLimit)

        return Triple(queryBuilder.toString(), parameters, mapPuhviResultSet)
    }

    private val ldListMetadataResultSetExtractor: (ResultSet) -> AssignmentListMetadata = { rs: ResultSet ->
        val lukuvuosiOptions: SortedSet<String> = sortedSetOf()
        val aineOptions: SortedSet<String> = sortedSetOf()
        var totalCount = 0

        while (rs.next()) {
            totalCount++
            rs.getKotlinArray<String>("ld_assignment_lukuvuosi_koodi_arvos").forEach { lukuvuosiOptions.add(it) }
            aineOptions.add(rs.getString("ld_assignment_aine_koodi_arvo"))
        }

        AssignmentListMetadata(
            assignmentFilterOptions = AssignmentFilterOptionsDtoOut(
                lukuvuosi = lukuvuosiOptions.toList(),
                aine = aineOptions.toList(),
            ),
            totalCount = totalCount
        )
    }

    private fun buildLdListMetadataQuery(
        filters: LdFilters,
        role: Role,
        userOid: String
    ): Triple<String, MapSqlParameterSource, (ResultSet) -> AssignmentListMetadata> {
        val queryBuilder = StringBuilder(
            """
            SELECT
                a.assignment_laajaalainen_osaaminen_koodi_arvos,
                a.ld_assignment_lukuvuosi_koodi_arvos,
                a.ld_assignment_aine_koodi_arvo
            FROM ld_assignment a
            LEFT JOIN ld_assignment_favorite fav ON a.assignment_id = fav.assignment_id AND fav.user_oid = :userOid
            WHERE true
         """.trimIndent()
        )

        val parameters = MapSqlParameterSource()
        parameters.addValue("userOid", userOid)

        addLdFilters(queryBuilder, parameters, filters)
        addFavoriteFilter(queryBuilder, filters.suosikki)
        addRoleBasedFilter(queryBuilder, role)

        return Triple(queryBuilder.toString(), parameters, ldListMetadataResultSetExtractor)
    }

    private fun addLdFilters(queryBuilder: StringBuilder, parameters: MapSqlParameterSource, filters: LdFilters) {
        if (filters.aine != null) {
            val values = filters.aine.split(",")

            queryBuilder.append(" AND ld_assignment_aine_koodi_arvo IN (:aineKoodiArvo)")
            parameters.addValue("aineKoodiArvo", values)
        }

        addLukuvuosiQuery(queryBuilder, parameters, Exam.LD, filters.lukuvuosi)
    }

    private fun buildLdListQuery(
        filters: LdFilters, role: Role, userOid: String, noLimit: Boolean = false
    ): Triple<String, MapSqlParameterSource, (ResultSet, Int) -> LdAssignmentDtoOut> {
        val (query, parameters) = baseAssignmentListQuery(Exam.LD, userOid)
        val queryBuilder = StringBuilder(query)

        addLdFilters(queryBuilder, parameters, filters)
        commonQueryFilters(filters, role, queryBuilder, parameters, noLimit)

        return Triple(queryBuilder.toString(), parameters, mapLdResultSet)
    }

    private fun insertAssignmentContent(
        exam: Exam,
        assignmentId: Int,
        contentFi: Array<String>,
        contentSv: Array<String>,
        deleteOld: Boolean? = false
    ) {
        val table = getTableNameFromExam(exam)

        if (deleteOld == true) jdbcTemplate.update(
            "DELETE FROM ${table}_content WHERE assignment_id = ?", assignmentId
        )

        val insertContentSql = """
                    INSERT INTO ${table}_content (
                        assignment_id,
                        assignment_content_language, 
                        assignment_content_order_index,
                        assignment_content_content 
                        ) 
                    VALUES (?, ?::language, ?, ?)
                """.trimIndent()

        contentFi.forEachIndexed { index, content ->
            jdbcTemplate.update(
                insertContentSql, assignmentId, Language.FI.toString(), index, content
            )
        }
        contentSv.forEachIndexed { index, content ->
            jdbcTemplate.update(
                insertContentSql, assignmentId, Language.SV.toString(), index, content
            )
        }
    }


    fun saveSukoAssignment(assignment: SukoAssignmentDtoIn): SukoAssignmentDtoOut =
        transactionTemplate.execute { _ ->
            val keyHolder = GeneratedKeyHolder()
            jdbcTemplate.update({ con ->
                val ps = con.prepareStatement(
                    """INSERT INTO suko_assignment (
                            assignment_name_fi,
                            assignment_name_sv,
                            assignment_instruction_fi,
                            assignment_instruction_sv,
                            assignment_publish_state,
                            suko_assignment_aihe_koodi_arvos, 
                            suko_assignment_assignment_type_koodi_arvo, 
                            suko_assignment_oppimaara_koodi_arvo, 
                            suko_assignment_oppimaara_kielitarjonta_koodi_arvo, 
                            suko_assignment_tavoitetaso_koodi_arvo,
                            assignment_laajaalainen_osaaminen_koodi_arvos,
                            assignment_author_oid) 
                            VALUES (?, ?, ?, ?, ?::publish_state, ?, ?, ?, ?, ?, ?, ?) 
                            RETURNING assignment_id, assignment_author_oid, assignment_created_at, assignment_updated_at""".trimIndent(),
                    arrayOf("assignment_id")
                )
                ps.setString(1, assignment.nameFi)
                ps.setString(2, assignment.nameSv)
                ps.setString(3, assignment.instructionFi)
                ps.setString(4, assignment.instructionSv)
                ps.setString(5, assignment.publishState.toString())
                ps.setArray(6, con.createArrayOf("text", assignment.aiheKoodiArvos))
                ps.setString(7, assignment.assignmentTypeKoodiArvo)
                ps.setString(8, assignment.oppimaara.oppimaaraKoodiArvo)
                ps.setString(9, assignment.oppimaara.kielitarjontaKoodiArvo)
                ps.setString(10, assignment.tavoitetasoKoodiArvo)
                ps.setArray(11, con.createArrayOf("text", assignment.laajaalainenOsaaminenKoodiArvos))
                ps.setString(12, Kayttajatiedot.fromSecurityContext().oidHenkilo)
                ps
            }, keyHolder)

            val assignmentId = keyHolder.keys?.get("assignment_id") as Int

            insertAssignmentContent(Exam.SUKO, assignmentId, assignment.contentFi, assignment.contentSv)

            SukoAssignmentDtoOut(
                assignmentId,
                assignment.nameFi,
                assignment.nameSv,
                assignment.instructionFi,
                assignment.instructionSv,
                assignment.contentFi,
                assignment.contentSv,
                assignment.publishState,
                keyHolder.keys?.get("assignment_created_at") as java.sql.Timestamp,
                keyHolder.keys?.get("assignment_updated_at") as java.sql.Timestamp,
                assignment.laajaalainenOsaaminenKoodiArvos,
                keyHolder.keys?.get("assignment_author_oid") as String,
                false,
                assignment.assignmentTypeKoodiArvo,
                Oppimaara(assignment.oppimaara.oppimaaraKoodiArvo, assignment.oppimaara.kielitarjontaKoodiArvo),
                assignment.tavoitetasoKoodiArvo,
                assignment.aiheKoodiArvos,
            )
        }!!

    fun savePuhviAssignment(assignment: PuhviAssignmentDtoIn): PuhviAssignmentDtoOut =
        transactionTemplate.execute { _ ->
            val keyHolder = GeneratedKeyHolder()
            jdbcTemplate.update({ con ->
                val ps = con.prepareStatement(
                    """INSERT INTO puhvi_assignment (
                            assignment_name_fi, 
                            assignment_name_sv, 
                            assignment_instruction_fi,
                            assignment_instruction_sv,
                            assignment_publish_state,
                            assignment_laajaalainen_osaaminen_koodi_arvos,
                            assignment_author_oid,
                            puhvi_assignment_assignment_type_koodi_arvo,
                            puhvi_assignment_lukuvuosi_koodi_arvos
                        ) VALUES (?, ?, ?, ?, ?::publish_state, ?, ?, ?, ?)
                        RETURNING assignment_id, assignment_author_oid, assignment_created_at, assignment_updated_at""",
                    arrayOf("assignment_id")
                )
                ps.setString(1, assignment.nameFi)
                ps.setString(2, assignment.nameSv)
                ps.setString(3, assignment.instructionFi)
                ps.setString(4, assignment.instructionSv)
                ps.setString(5, assignment.publishState.toString())
                ps.setArray(6, con.createArrayOf("text", assignment.laajaalainenOsaaminenKoodiArvos))
                ps.setString(7, Kayttajatiedot.fromSecurityContext().oidHenkilo)
                ps.setString(8, assignment.assignmentTypeKoodiArvo)
                ps.setArray(9, con.createArrayOf("text", assignment.lukuvuosiKoodiArvos))
                ps
            }, keyHolder)

            val assignmentId = keyHolder.keys?.get("assignment_id") as Int

            insertAssignmentContent(Exam.PUHVI, assignmentId, assignment.contentFi, assignment.contentSv)

            PuhviAssignmentDtoOut(
                assignmentId,
                assignment.nameFi,
                assignment.nameSv,
                assignment.instructionFi,
                assignment.instructionSv,
                assignment.contentFi,
                assignment.contentSv,
                assignment.publishState,
                keyHolder.keys?.get("assignment_created_at") as java.sql.Timestamp,
                keyHolder.keys?.get("assignment_updated_at") as java.sql.Timestamp,
                assignment.laajaalainenOsaaminenKoodiArvos,
                keyHolder.keys?.get("assignment_author_oid") as String,
                false,
                assignment.assignmentTypeKoodiArvo,
                assignment.lukuvuosiKoodiArvos
            )
        }!!

    fun saveLdAssignment(assignment: LdAssignmentDtoIn): LdAssignmentDtoOut = transactionTemplate.execute { _ ->
        val keyHolder = GeneratedKeyHolder()
        jdbcTemplate.update({ con ->
            val ps = con.prepareStatement(
                """INSERT INTO ld_assignment (
                            assignment_name_fi, 
                            assignment_name_sv, 
                            assignment_instruction_fi,
                            assignment_instruction_sv,
                            assignment_publish_state,
                            assignment_laajaalainen_osaaminen_koodi_arvos,
                            assignment_author_oid,
                            ld_assignment_lukuvuosi_koodi_arvos,
                            ld_assignment_aine_koodi_arvo
                        ) VALUES (?, ?, ?, ?, ?::publish_state, ?, ?, ?, ?)
                        RETURNING assignment_id, assignment_author_oid, assignment_created_at, assignment_updated_at""",
                arrayOf("assignment_id")
            )
            ps.setString(1, assignment.nameFi)
            ps.setString(2, assignment.nameSv)
            ps.setString(3, assignment.instructionFi)
            ps.setString(4, assignment.instructionSv)
            ps.setString(5, assignment.publishState.toString())
            ps.setArray(6, con.createArrayOf("text", assignment.laajaalainenOsaaminenKoodiArvos))
            ps.setString(7, Kayttajatiedot.fromSecurityContext().oidHenkilo)
            ps.setArray(8, con.createArrayOf("text", assignment.lukuvuosiKoodiArvos))
            ps.setString(9, assignment.aineKoodiArvo)
            ps
        }, keyHolder)

        val assignmentId = keyHolder.keys?.get("assignment_id") as Int

        insertAssignmentContent(Exam.LD, assignmentId, assignment.contentFi, assignment.contentSv)

        LdAssignmentDtoOut(
            assignmentId,
            assignment.nameFi,
            assignment.nameSv,
            assignment.instructionFi,
            assignment.instructionSv,
            assignment.contentFi,
            assignment.contentSv,
            assignment.publishState,
            keyHolder.keys?.get("assignment_created_at") as java.sql.Timestamp,
            keyHolder.keys?.get("assignment_updated_at") as java.sql.Timestamp,
            assignment.laajaalainenOsaaminenKoodiArvos,
            keyHolder.keys?.get("assignment_author_oid") as String,
            false,
            assignment.lukuvuosiKoodiArvos,
            assignment.aineKoodiArvo
        )
    }!!

    fun getAssignmentById(id: Int, exam: Exam): AssignmentOut? {
        val role = Kayttajatiedot.fromSecurityContext().role
        val userOid = Kayttajatiedot.fromSecurityContext().oidHenkilo

        val (table, mapper) = when (exam) {
            Exam.SUKO -> "suko_assignment" to mapSukoListResultSet
            Exam.PUHVI -> "puhvi_assignment" to mapPuhviResultSet
            Exam.LD -> "ld_assignment" to mapLdResultSet
        }

        val andIsPublishedIfOpettaja = if (role == Role.OPETTAJA) "AND assignment_publish_state = 'PUBLISHED'" else ""

        val query = """
            SELECT 
                a.*,
                ARRAY_AGG(content.assignment_content_content ORDER BY content.assignment_content_order_index) FILTER (WHERE content.assignment_content_language = '${Language.FI}') AS assignment_content_fi,
                ARRAY_AGG(content.assignment_content_content ORDER BY content.assignment_content_order_index) FILTER (WHERE content.assignment_content_language = '${Language.SV}') AS assignment_content_sv,
                MAX(CASE WHEN fav.assignment_id IS NOT NULL THEN 1 ELSE 0 END)::boolean AS is_favorite
            FROM $table a
            LEFT JOIN ${table}_content content ON a.assignment_id = content.assignment_id
            LEFT JOIN ${table}_favorite fav ON a.assignment_id = fav.assignment_id AND fav.user_oid = ?
            WHERE a.assignment_id = ? $andIsPublishedIfOpettaja
            GROUP BY a.assignment_id;
            """

        return jdbcTemplate.query(query, mapper, userOid, id).firstOrNull()
    }

    fun updateSukoAssignment(assignment: SukoAssignmentDtoIn, id: Int): Int? = transactionTemplate.execute { _ ->
        val updatedRows = jdbcTemplate.update(
            """UPDATE suko_assignment 
               SET 
                   assignment_name_fi = ?, 
                   assignment_name_sv = ?, 
                   assignment_instruction_fi = ?,
                   assignment_instruction_sv = ?,
                   assignment_publish_state = ?::publish_state,
                   suko_assignment_aihe_koodi_arvos = ?,
                   assignment_laajaalainen_osaaminen_koodi_arvos = ?,
                   suko_assignment_assignment_type_koodi_arvo = ?,
                   suko_assignment_oppimaara_koodi_arvo = ?,
                   suko_assignment_oppimaara_kielitarjonta_koodi_arvo = ?,
                   suko_assignment_tavoitetaso_koodi_arvo = ?,
                   assignment_updated_at = clock_timestamp()
               WHERE assignment_id = ?""".trimIndent(),
            assignment.nameFi,
            assignment.nameSv,
            assignment.instructionFi,
            assignment.instructionSv,
            assignment.publishState.toString(),
            assignment.aiheKoodiArvos,
            assignment.laajaalainenOsaaminenKoodiArvos,
            assignment.assignmentTypeKoodiArvo,
            assignment.oppimaara.oppimaaraKoodiArvo,
            assignment.oppimaara.kielitarjontaKoodiArvo,
            assignment.tavoitetasoKoodiArvo,
            id
        )

        val assignmentFound = updatedRows != 0
        if (!assignmentFound) {
            return@execute null
        }

        insertAssignmentContent(Exam.SUKO, id, assignment.contentFi, assignment.contentSv, true)

        return@execute id
    }


    fun updatePuhviAssignment(assignment: PuhviAssignmentDtoIn, id: Int): Int? = transactionTemplate.execute { _ ->
        val updatedRows = jdbcTemplate.update(
            """UPDATE puhvi_assignment 
               SET
                   assignment_name_fi = ?, 
                   assignment_name_sv = ?, 
                   assignment_instruction_fi = ?,
                   assignment_instruction_sv = ?,
                   assignment_publish_state = ?::publish_state, 
                   assignment_updated_at = clock_timestamp(),
                   assignment_laajaalainen_osaaminen_koodi_arvos = ?,
                   puhvi_assignment_assignment_type_koodi_arvo = ?,
                   puhvi_assignment_lukuvuosi_koodi_arvos = ?
               WHERE assignment_id = ? """.trimIndent(),
            assignment.nameFi,
            assignment.nameSv,
            assignment.instructionFi,
            assignment.instructionSv,
            assignment.publishState.toString(),
            assignment.laajaalainenOsaaminenKoodiArvos,
            assignment.assignmentTypeKoodiArvo,
            assignment.lukuvuosiKoodiArvos,
            id
        )

        val assignmentFound = updatedRows != 0
        if (!assignmentFound) {
            return@execute null
        }

        insertAssignmentContent(Exam.PUHVI, id, assignment.contentFi, assignment.contentSv, true)

        return@execute id
    }

    fun updateLdAssignment(assignment: LdAssignmentDtoIn, id: Int): Int? = transactionTemplate.execute { _ ->
        val updatedRows = jdbcTemplate.update(
            """UPDATE ld_assignment 
               SET
                   assignment_name_fi = ?, 
                   assignment_name_sv = ?, 
                   assignment_instruction_fi = ?,
                   assignment_instruction_sv = ?,
                   assignment_publish_state = ?::publish_state, 
                   assignment_updated_at = clock_timestamp(),
                   assignment_laajaalainen_osaaminen_koodi_arvos = ?,
                   ld_assignment_lukuvuosi_koodi_arvos = ?,
                   ld_assignment_aine_koodi_arvo = ?
               WHERE assignment_id = ?""",
            assignment.nameFi,
            assignment.nameSv,
            assignment.instructionFi,
            assignment.instructionSv,
            assignment.publishState.toString(),
            assignment.laajaalainenOsaaminenKoodiArvos,
            assignment.lukuvuosiKoodiArvos,
            assignment.aineKoodiArvo,
            id
        )

        val assignmentFound = updatedRows != 0
        if (!assignmentFound) {
            return@execute null
        }

        insertAssignmentContent(Exam.LD, id, assignment.contentFi, assignment.contentSv, true)

        return@execute id
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