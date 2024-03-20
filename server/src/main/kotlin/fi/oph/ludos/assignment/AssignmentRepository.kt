package fi.oph.ludos.assignment

import fi.oph.ludos.*
import fi.oph.ludos.auth.Kayttajatiedot
import fi.oph.ludos.auth.Role
import fi.oph.ludos.koodisto.KoodistoName
import fi.oph.ludos.koodisto.KoodistoService
import fi.oph.ludos.repository.getKotlinList
import org.slf4j.LoggerFactory
import org.springframework.dao.DataIntegrityViolationException
import org.springframework.dao.EmptyResultDataAccessException
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
import java.sql.SQLException
import java.sql.Timestamp

data class AssignmentListMetadata(
    val assignmentFilterOptions: AssignmentFilterOptionsDtoOut,
    val totalCount: Int
)

const val ROOT_FOLDER_ID = 0
const val ROOT_FOLDER_NAME = "root"

@Component
class AssignmentRepository(
    private val namedJdbcTemplate: NamedParameterJdbcTemplate,
    private val jdbcTemplate: JdbcTemplate,
    private val transactionTemplate: TransactionTemplate,
    private val koodistoService: KoodistoService,
) {
    private val logger = LoggerFactory.getLogger(javaClass)

    private fun publishStateFilter(role: Role) = when (role) {
        Role.OPETTAJA -> " AND a.assignment_publish_state = '${PublishState.PUBLISHED}'"
        else -> " AND a.assignment_publish_state in ('${PublishState.PUBLISHED}', '${PublishState.DRAFT}')"
    }

    val mapSukoListResultSet: (ResultSet, Int) -> SukoAssignmentDtoOut = { rs: ResultSet, _: Int ->
        SukoAssignmentDtoOut(
            id = rs.getInt("assignment_id"),
            nameFi = rs.getString("assignment_name_fi"),
            nameSv = rs.getString("assignment_name_sv"),
            instructionFi = rs.getString("assignment_instruction_fi"),
            instructionSv = rs.getString("assignment_instruction_sv"),
            contentFi = rs.getKotlinList("assignment_content_fi"),
            contentSv = rs.getKotlinList("assignment_content_sv"),
            publishState = PublishState.valueOf(rs.getString("assignment_publish_state")),
            createdAt = rs.getTimestamp("assignment_created_at"),
            updatedAt = rs.getTimestamp("assignment_updated_at"),
            laajaalainenOsaaminenKoodiArvos = rs.getKotlinList<String>("assignment_laajaalainen_osaaminen_koodi_arvos"),
            authorOid = rs.getString("assignment_author_oid"),
            updaterOid = rs.getString("assignment_updater_oid"),
            updaterName = null,
            version = rs.getInt("assignment_version"),
            assignmentTypeKoodiArvo = rs.getString("suko_assignment_assignment_type_koodi_arvo"),
            oppimaara = Oppimaara(
                rs.getString("suko_assignment_oppimaara_koodi_arvo"),
                rs.getString("suko_assignment_oppimaara_kielitarjonta_koodi_arvo")
            ),
            tavoitetasoKoodiArvo = rs.getString("suko_assignment_tavoitetaso_koodi_arvo"),
            aiheKoodiArvos = rs.getKotlinList<String>("suko_assignment_aihe_koodi_arvos")
        )
    }

    val mapSukoMinimumListResultSet: (ResultSet, Int) -> SukoAssignmentCardDtoOut = { rs: ResultSet, _: Int ->
        SukoAssignmentCardDtoOut(
            id = rs.getInt("assignment_id"),
            publishState = PublishState.valueOf(rs.getString("assignment_publish_state")),
            nameFi = rs.getString("assignment_name_fi"),
            nameSv = rs.getString("assignment_name_sv"),
            createdAt = rs.getTimestamp("assignment_created_at"),
            updaterOid = rs.getString("assignment_updater_oid"),
            updatedAt = rs.getTimestamp("assignment_updated_at"),
            updaterName = null,
            authorOid = rs.getString("assignment_author_oid"),
            version = rs.getInt("assignment_version"),
            assignmentTypeKoodiArvo = rs.getString("suko_assignment_assignment_type_koodi_arvo"),
            oppimaara = Oppimaara(
                rs.getString("suko_assignment_oppimaara_koodi_arvo"),
                rs.getString("suko_assignment_oppimaara_kielitarjonta_koodi_arvo")
            ),
            tavoitetasoKoodiArvo = rs.getString("suko_assignment_tavoitetaso_koodi_arvo"),
            aiheKoodiArvos = rs.getKotlinList<String>("suko_assignment_aihe_koodi_arvos")
        )
    }

    val mapLdResultSet: (ResultSet, Int) -> LdAssignmentDtoOut = { rs: ResultSet, _: Int ->
        LdAssignmentDtoOut(
            id = rs.getInt("assignment_id"),
            nameFi = rs.getString("assignment_name_fi"),
            nameSv = rs.getString("assignment_name_sv"),
            instructionFi = rs.getString("assignment_instruction_fi"),
            instructionSv = rs.getString("assignment_instruction_sv"),
            contentFi = rs.getKotlinList("assignment_content_fi"),
            contentSv = rs.getKotlinList("assignment_content_sv"),
            publishState = PublishState.valueOf(rs.getString("assignment_publish_state")),
            createdAt = rs.getTimestamp("assignment_created_at"),
            updatedAt = rs.getTimestamp("assignment_updated_at"),
            laajaalainenOsaaminenKoodiArvos = rs.getKotlinList<String>("assignment_laajaalainen_osaaminen_koodi_arvos"),
            authorOid = rs.getString("assignment_author_oid"),
            updaterOid = rs.getString("assignment_updater_oid"),
            updaterName = null,
            version = rs.getInt("assignment_version"),
            lukuvuosiKoodiArvos = rs.getKotlinList<String>("ld_assignment_lukuvuosi_koodi_arvos"),
            aineKoodiArvo = rs.getString("ld_assignment_aine_koodi_arvo")
        )
    }

    val mapLdMinimumResultSet: (ResultSet, Int) -> LdAssignmentCardDtoOut = { rs: ResultSet, _: Int ->
        LdAssignmentCardDtoOut(
            id = rs.getInt("assignment_id"),
            publishState = PublishState.valueOf(rs.getString("assignment_publish_state")),
            nameFi = rs.getString("assignment_name_fi"),
            nameSv = rs.getString("assignment_name_sv"),
            createdAt = rs.getTimestamp("assignment_created_at"),
            updaterOid = rs.getString("assignment_updater_oid"),
            updatedAt = rs.getTimestamp("assignment_updated_at"),
            updaterName = null,
            authorOid = rs.getString("assignment_author_oid"),
            version = rs.getInt("assignment_version"),
            lukuvuosiKoodiArvos = rs.getKotlinList<String>("ld_assignment_lukuvuosi_koodi_arvos"),
            aineKoodiArvo = rs.getString("ld_assignment_aine_koodi_arvo")
        )
    }

    val mapPuhviResultSet: (ResultSet, Int) -> PuhviAssignmentDtoOut = { rs: ResultSet, _: Int ->
        PuhviAssignmentDtoOut(
            id = rs.getInt("assignment_id"),
            nameFi = rs.getString("assignment_name_fi"),
            nameSv = rs.getString("assignment_name_sv"),
            instructionFi = rs.getString("assignment_instruction_fi"),
            instructionSv = rs.getString("assignment_instruction_sv"),
            contentFi = rs.getKotlinList("assignment_content_fi"),
            contentSv = rs.getKotlinList("assignment_content_sv"),
            publishState = PublishState.valueOf(rs.getString("assignment_publish_state")),
            createdAt = rs.getTimestamp("assignment_created_at"),
            updatedAt = rs.getTimestamp("assignment_updated_at"),
            laajaalainenOsaaminenKoodiArvos = rs.getKotlinList<String>("assignment_laajaalainen_osaaminen_koodi_arvos"),
            authorOid = rs.getString("assignment_author_oid"),
            updaterOid = rs.getString("assignment_updater_oid"),
            updaterName = null,
            version = rs.getInt("assignment_version"),
            assignmentTypeKoodiArvo = rs.getString("puhvi_assignment_assignment_type_koodi_arvo"),
            lukuvuosiKoodiArvos = rs.getKotlinList<String>("puhvi_assignment_lukuvuosi_koodi_arvos"),
        )
    }

    val mapPuhviMinimumResultSet: (ResultSet, Int) -> PuhviAssignmentCardDtoOut = { rs: ResultSet, _: Int ->
        PuhviAssignmentCardDtoOut(
            id = rs.getInt("assignment_id"),
            publishState = PublishState.valueOf(rs.getString("assignment_publish_state")),
            nameFi = rs.getString("assignment_name_fi"),
            nameSv = rs.getString("assignment_name_sv"),
            createdAt = rs.getTimestamp("assignment_created_at"),
            updaterOid = rs.getString("assignment_updater_oid"),
            updatedAt = rs.getTimestamp("assignment_updated_at"),
            updaterName = null,
            authorOid = rs.getString("assignment_author_oid"),
            version = rs.getInt("assignment_version"),
            assignmentTypeKoodiArvo = rs.getString("puhvi_assignment_assignment_type_koodi_arvo"),
            lukuvuosiKoodiArvos = rs.getKotlinList<String>("puhvi_assignment_lukuvuosi_koodi_arvos")
        )
    }

    private fun tableNameByExam(exam: Exam) = when (exam) {
        Exam.SUKO -> "suko_assignment"
        Exam.PUHVI -> "puhvi_assignment"
        Exam.LD -> "ld_assignment"
    }

    private fun getLatestAssignmentDataForNewVersion(id: Int, exam: Exam): Triple<Int, String, Timestamp>? = try {
        jdbcTemplate.queryForObject(
            """
            SELECT assignment_version, assignment_author_oid, assignment_created_at
            FROM ${tableNameByExam(exam)}
            WHERE assignment_id = ? AND assignment_version = (
                SELECT MAX(assignment_version) 
                FROM ${tableNameByExam(exam)} 
                WHERE assignment_id = ?
            ) 
            FOR UPDATE;""".trimIndent(),
            { rs, _ ->
                Triple(
                    rs.getInt("assignment_version"),
                    rs.getString("assignment_author_oid"),
                    rs.getTimestamp("assignment_created_at")
                )
            },
            id, id
        )
    } catch (e: EmptyResultDataAccessException) {
        null
    }

    fun getAssignments(assignmentFilter: AssignmentBaseFilters): AssignmentListDtoOut {
        val role = Kayttajatiedot.fromSecurityContext().role

        // NOTE: both metadata and data can be fetched relatively easily in a single query if required: https://opetushallitus.slack.com/archives/D04TDKGKMK9/p1697460263573769
        val (metadataQuery, metadataParameters, metadataExtractor) = buildListMetadataQuery(
            assignmentFilter,
            role
        )
        val metadata = namedJdbcTemplate.query(metadataQuery, metadataParameters, metadataExtractor)

        val (listQuery, listParameters, listMapper) = buildListQuery(assignmentFilter, role)
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
        filters: BaseFilters, role: Role
    ): Triple<String, MapSqlParameterSource, (ResultSet) -> AssignmentListMetadata> = when (filters) {
        is SukoFilters -> buildSukoListMetadataQuery(filters, role)
        is PuhviFilters -> buildPuhviListMetadataQuery(filters, role)
        is LdFilters -> buildLdListMetadataQuery(filters, role)
        else -> throw UnknownError("Unknown assignment filter ${filters::class.simpleName}")
    }

    private fun buildListQuery(
        filters: BaseFilters, role: Role, noLimit: Boolean = false
    ): Triple<String, MapSqlParameterSource, (ResultSet, Int) -> AssignmentCardOut> = when (filters) {
        is SukoFilters -> buildSukoListQuery(filters, role, noLimit)
        is PuhviFilters -> buildPuhviListQuery(filters, role, noLimit)
        is LdFilters -> buildLdListQuery(filters, role, noLimit)
        else -> throw UnknownError("Unknown assignment filter ${filters::class.simpleName}")
    }

    private val baseAssignmentSelectQuery = """
            SELECT a.*,
                   ARRAY_AGG(content.assignment_content_content ORDER BY content.assignment_content_order_index) FILTER (WHERE content.assignment_content_language = '${Language.FI}') AS assignment_content_fi,
                   ARRAY_AGG(content.assignment_content_content ORDER BY content.assignment_content_order_index) FILTER (WHERE content.assignment_content_language = '${Language.SV}') AS assignment_content_sv
        """.trimIndent()

    private fun baseAssignmentListQuery(exam: Exam): Pair<StringBuilder, MapSqlParameterSource> {
        val table = tableNameByExam(exam)

        val query = """
            $baseAssignmentSelectQuery
            FROM $table a
                INNER JOIN (SELECT assignment_id, MAX(assignment_version) AS max_version
                         FROM $table
                         GROUP BY assignment_id) latest_version ON a.assignment_id = latest_version.assignment_id AND
                                                                   a.assignment_version = latest_version.max_version
                LEFT JOIN ${table}_content content ON a.assignment_id = content.assignment_id AND a.assignment_version = content.assignment_version
            WHERE true
        """.trimIndent()

        val parameters = MapSqlParameterSource()
        return Pair(StringBuilder(query), parameters)
    }

    private fun lukuvuosiFilter(
        exam: Exam, lukuvuosi: String?
    ): Pair<String, MapSqlParameterSource> {
        val query = StringBuilder()
        val parameters = MapSqlParameterSource()
        val lowercaseExam = exam.toString().lowercase()
        if (lukuvuosi != null) {
            query.append(" AND ARRAY[:lukuvuosiKoodiArvo ]::text[] && ${lowercaseExam}_assignment_lukuvuosi_koodi_arvos")
            parameters.addValue("lukuvuosiKoodiArvo", lukuvuosi.split(","))
        }
        return Pair(query.toString(), parameters)
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
        query.append(publishStateFilter(role))
        query.append(" GROUP BY a.assignment_id, a.assignment_version")
        addOrderClause(query, filters.jarjesta)
        if (!noLimit) {
            addPageLimitAndOffset(query, parameters, filters.sivu)
        }
    }

    private fun sukoFilters(filters: SukoFilters): Pair<String, MapSqlParameterSource> {
        val parameters = MapSqlParameterSource()
        val queryBuilder = StringBuilder()
        if (filters.tehtavatyyppisuko != null) {
            val values = filters.tehtavatyyppisuko.split(",")

            queryBuilder.append(" AND suko_assignment_assignment_type_koodi_arvo IN (:sukoAssignmentTypeKoodiArvo)")
            parameters.addValue("sukoAssignmentTypeKoodiArvo", values)
        }

        if (filters.oppimaara != null) {
            val oppimaaras = filters.oppimaara.split(",").map(Oppimaara::fromString)

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
                    Language.FI,
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

        return Pair(queryBuilder.toString(), parameters)
    }

    private fun buildSukoListQuery(
        filters: SukoFilters, role: Role, noLimit: Boolean
    ): Triple<String, MapSqlParameterSource, (ResultSet, Int) -> SukoAssignmentCardDtoOut> {
        val (queryBuilder, parameters) = baseAssignmentListQuery(Exam.SUKO)

        val (sukoFilterString, sukoFilterParameters) = sukoFilters(filters)
        parameters.addValues(sukoFilterParameters.values)
        queryBuilder.append(sukoFilterString)

        commonQueryFilters(filters, role, queryBuilder, parameters, noLimit)

        return Triple(queryBuilder.toString(), parameters, mapSukoMinimumListResultSet)
    }

    private val sukoListMetadataResultSetExtractor: (ResultSet) -> AssignmentListMetadata = { rs: ResultSet ->
        rs.next()
        val oppimaaraPairs = rs.getKotlinList<Array<String?>>("oppimaara_array")
        AssignmentListMetadata(
            assignmentFilterOptions = AssignmentFilterOptionsDtoOut(
                oppimaara = oppimaaraPairs.map { Oppimaara(it[0]!!, it[1]) }.sorted(),
                tehtavatyyppi = rs.getKotlinList("assignment_type_array"),
                aihe = rs.getKotlinList("aihe_array"),
                tavoitetaitotaso = rs.getKotlinList("tavoitetaso_array")
            ),
            totalCount = rs.getInt("filtered_assignment_count")
        )
    }

    private fun buildSukoListMetadataQuery(
        filters: SukoFilters,
        role: Role
    ): Triple<String, MapSqlParameterSource, (ResultSet) -> AssignmentListMetadata> {
        val parameters = MapSqlParameterSource()

        fun buildFilters(filters: SukoFilters): String {
            val (sukoFilterString, sukoFilterParameters) = sukoFilters(filters)
            parameters.addValues(sukoFilterParameters.values)
            return "$sukoFilterString ${publishStateFilter(role)}"
        }

        val query =
            """
    SELECT
        (SELECT count(1) FROM suko_assignment a WHERE TRUE ${buildFilters(filters)}) AS filtered_assignment_count,
        ARRAY(SELECT DISTINCT ARRAY[suko_assignment_oppimaara_koodi_arvo, suko_assignment_oppimaara_kielitarjonta_koodi_arvo] as oppimaara_pairs
              FROM suko_assignment a WHERE TRUE ${buildFilters(filters.copy(oppimaara = null))}
              ORDER BY oppimaara_pairs) AS oppimaara_array,
        ARRAY(SELECT DISTINCT suko_assignment_assignment_type_koodi_arvo
              FROM suko_assignment a WHERE TRUE ${buildFilters(filters.copy(tehtavatyyppisuko = null))}
              ORDER BY suko_assignment_assignment_type_koodi_arvo) AS assignment_type_array,
        ARRAY(SELECT DISTINCT unnest(suko_assignment_aihe_koodi_arvos) as aihe_koodi_arvo
              FROM suko_assignment a WHERE TRUE ${buildFilters(filters.copy(aihe = null))}
              ORDER BY aihe_koodi_arvo) AS aihe_array,
        ARRAY(SELECT DISTINCT suko_assignment_tavoitetaso_koodi_arvo
              FROM suko_assignment a WHERE TRUE ${buildFilters(filters.copy(tavoitetaitotaso = null))}
              ORDER BY suko_assignment_tavoitetaso_koodi_arvo) AS tavoitetaso_array
     """.trimIndent()

        return Triple(query, parameters, sukoListMetadataResultSetExtractor)
    }

    private val ldListMetadataResultSetExtractor: (ResultSet) -> AssignmentListMetadata = { rs: ResultSet ->
        rs.next()
        AssignmentListMetadata(
            assignmentFilterOptions = AssignmentFilterOptionsDtoOut(
                lukuvuosi = rs.getKotlinList("lukuvuosi_array"),
                aine = rs.getKotlinList("aine_array"),
            ),
            totalCount = rs.getInt("filtered_assignment_count")
        )
    }

    private fun buildLdListMetadataQuery(
        filters: LdFilters,
        role: Role
    ): Triple<String, MapSqlParameterSource, (ResultSet) -> AssignmentListMetadata> {
        val parameters = MapSqlParameterSource()

        fun buildFilters(filters: LdFilters): String {
            val (ldFilterString, ldFilterParameters) = ldFilters(filters)
            parameters.addValues(ldFilterParameters.values)
            return "$ldFilterString ${publishStateFilter(role)}"
        }

        val query =
            """
    SELECT
        (SELECT count(1) FROM ld_assignment a WHERE TRUE ${buildFilters(filters)}) AS filtered_assignment_count,
        ARRAY(SELECT DISTINCT ld_assignment_aine_koodi_arvo
              FROM ld_assignment a WHERE TRUE ${buildFilters(filters.copy(aine = null))}
              ORDER BY ld_assignment_aine_koodi_arvo) AS aine_array,
        ARRAY(SELECT DISTINCT UNNEST(ld_assignment_lukuvuosi_koodi_arvos) as lukuvuosi
              FROM ld_assignment a WHERE TRUE ${buildFilters(filters.copy(lukuvuosi = null))}
              ORDER BY lukuvuosi) AS lukuvuosi_array
         """.trimIndent()

        return Triple(query, parameters, ldListMetadataResultSetExtractor)
    }

    private fun ldFilters(filters: LdFilters): Pair<String, MapSqlParameterSource> {
        val queryBuilder = StringBuilder()
        val parameters = MapSqlParameterSource()

        if (filters.aine != null) {
            val values = filters.aine.split(",")

            queryBuilder.append(" AND ld_assignment_aine_koodi_arvo IN (:aineKoodiArvo)")
            parameters.addValue("aineKoodiArvo", values)
        }

        val (lukuvuosiFilterQuery, lukuvuosiFilterParameters) = lukuvuosiFilter(Exam.LD, filters.lukuvuosi)
        queryBuilder.append(lukuvuosiFilterQuery)
        parameters.addValues(lukuvuosiFilterParameters.values)

        return Pair(queryBuilder.toString(), parameters)
    }

    private fun buildLdListQuery(
        filters: LdFilters, role: Role, noLimit: Boolean = false
    ): Triple<String, MapSqlParameterSource, (ResultSet, Int) -> LdAssignmentCardDtoOut> {
        val (query, parameters) = baseAssignmentListQuery(Exam.LD)
        val queryBuilder = StringBuilder(query)

        val (ldFilterQuery, ldFilterParameters) = ldFilters(filters)
        queryBuilder.append(ldFilterQuery)
        parameters.addValues(ldFilterParameters.values)

        commonQueryFilters(filters, role, queryBuilder, parameters, noLimit)

        return Triple(queryBuilder.toString(), parameters, mapLdMinimumResultSet)
    }

    private val puhviListMetadataResultSetExtractor: (ResultSet) -> AssignmentListMetadata = { rs: ResultSet ->
        rs.next()
        AssignmentListMetadata(
            assignmentFilterOptions = AssignmentFilterOptionsDtoOut(
                tehtavatyyppi = rs.getKotlinList("assignment_type_array"),
                lukuvuosi = rs.getKotlinList("lukuvuosi_array"),
            ),
            totalCount = rs.getInt("filtered_assignment_count")
        )
    }

    private fun buildPuhviListMetadataQuery(
        filters: PuhviFilters,
        role: Role
    ): Triple<String, MapSqlParameterSource, (ResultSet) -> AssignmentListMetadata> {
        val parameters = MapSqlParameterSource()

        fun buildFilters(filters: PuhviFilters): String {
            val (puhviFilterString, puhviFilterParameters) = puhviFilters(filters)
            parameters.addValues(puhviFilterParameters.values)
            return "$puhviFilterString ${publishStateFilter(role)}"
        }

        val query = """
    SELECT
        (SELECT COUNT(1) FROM puhvi_assignment a WHERE TRUE ${buildFilters(filters)}) AS filtered_assignment_count,
        ARRAY(SELECT DISTINCT puhvi_assignment_assignment_type_koodi_arvo
              FROM puhvi_assignment a WHERE TRUE ${buildFilters(filters.copy(tehtavatyyppipuhvi = null))}
              ORDER BY puhvi_assignment_assignment_type_koodi_arvo) AS assignment_type_array,
        ARRAY(SELECT DISTINCT UNNEST(puhvi_assignment_lukuvuosi_koodi_arvos) as lukuvuosi
              FROM puhvi_assignment a WHERE TRUE ${buildFilters(filters.copy(lukuvuosi = null))}
              ORDER BY lukuvuosi) AS lukuvuosi_array
     """.trimIndent()

        return Triple(query, parameters, puhviListMetadataResultSetExtractor)
    }

    private fun puhviFilters(filters: PuhviFilters): Pair<String, MapSqlParameterSource> {
        val queryBuilder = StringBuilder()
        val parameters = MapSqlParameterSource()
        if (filters.tehtavatyyppipuhvi != null) {
            val values = filters.tehtavatyyppipuhvi.split(",")

            queryBuilder.append(" AND puhvi_assignment_assignment_type_koodi_arvo IN (:puhviAssignmentTypeKoodiArvo)")
            parameters.addValue("puhviAssignmentTypeKoodiArvo", values)
        }

        val (lukuvuosiFilterQuery, lukuvuosiFilterParameters) = lukuvuosiFilter(Exam.PUHVI, filters.lukuvuosi)
        queryBuilder.append(lukuvuosiFilterQuery)
        parameters.addValues(lukuvuosiFilterParameters.values)

        return Pair(queryBuilder.toString(), parameters)
    }


    private fun buildPuhviListQuery(
        filters: PuhviFilters, role: Role, noLimit: Boolean
    ): Triple<String, MapSqlParameterSource, (ResultSet, Int) -> PuhviAssignmentCardDtoOut> {
        val (queryBuilder, parameters) = baseAssignmentListQuery(Exam.PUHVI)

        val (puhviFilterQuery, puhviFilterParameters) = puhviFilters(filters)
        queryBuilder.append(puhviFilterQuery)
        parameters.addValues(puhviFilterParameters.values)

        commonQueryFilters(filters, role, queryBuilder, parameters, noLimit)

        return Triple(queryBuilder.toString(), parameters, mapPuhviMinimumResultSet)
    }

    private fun insertAssignmentContent(
        exam: Exam,
        assignmentId: Int,
        contentFi: List<String>,
        contentSv: List<String>,
        assignmentVersion: Int
    ) {
        val table = tableNameByExam(exam)

        val insertContentSql = """
                    INSERT INTO ${table}_content (
                        assignment_id,
                        assignment_content_language, 
                        assignment_content_order_index,
                        assignment_content_content,
                        assignment_version
                        ) 
                    VALUES (?, ?::language, ?, ?, ?)
                """.trimIndent()

        contentFi.forEachIndexed { index, content ->
            jdbcTemplate.update(
                insertContentSql, assignmentId, Language.FI.toString(), index, content, assignmentVersion
            )
        }
        contentSv.forEachIndexed { index, content ->
            jdbcTemplate.update(
                insertContentSql, assignmentId, Language.SV.toString(), index, content, assignmentVersion
            )
        }
    }

    val assignmentOutFields =
        "assignment_id, assignment_author_oid, assignment_updater_oid, assignment_created_at, assignment_updated_at, assignment_version"

    fun contentOutFields(keyHolder: GeneratedKeyHolder) = ContentOutFieldsImpl(
        id = keyHolder.keys?.get("assignment_id") as Int,
        createdAt = keyHolder.keys?.get("assignment_created_at") as java.sql.Timestamp,
        updatedAt = keyHolder.keys?.get("assignment_updated_at") as java.sql.Timestamp,
        authorOid = keyHolder.keys?.get("assignment_author_oid") as String,
        updaterOid = keyHolder.keys?.get("assignment_updater_oid") as String,
        updaterName = null,
        version = keyHolder.keys?.get("assignment_version") as Int,
    )

    fun saveSukoAssignment(assignment: SukoAssignmentDtoIn): SukoAssignmentDtoOut =
        transactionTemplate.execute { _ ->
            val version = INITIAL_VERSION_NUMBER
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
                            assignment_author_oid,
                            assignment_updater_oid,
                            assignment_version) 
                            VALUES (?, ?, ?, ?, ?::publish_state, ?, ?, ?, ?, ?, ?, ?, ?, ?) 
                            RETURNING $assignmentOutFields""".trimIndent(),
                    arrayOf("assignment_id")
                )
                ps.setString(1, assignment.nameFi)
                ps.setString(2, assignment.nameSv)
                ps.setString(3, assignment.instructionFi)
                ps.setString(4, assignment.instructionSv)
                ps.setString(5, assignment.publishState.toString())
                ps.setArray(6, con.createArrayOf("text", assignment.aiheKoodiArvos.toTypedArray()))
                ps.setString(7, assignment.assignmentTypeKoodiArvo)
                ps.setString(8, assignment.oppimaara.oppimaaraKoodiArvo)
                ps.setString(9, assignment.oppimaara.kielitarjontaKoodiArvo)
                ps.setString(10, assignment.tavoitetasoKoodiArvo)
                ps.setArray(11, con.createArrayOf("text", assignment.laajaalainenOsaaminenKoodiArvos.toTypedArray()))
                ps.setString(12, Kayttajatiedot.fromSecurityContext().oidHenkilo)
                ps.setString(13, Kayttajatiedot.fromSecurityContext().oidHenkilo)
                ps.setInt(14, version)
                ps
            }, keyHolder)

            val assignmentId = keyHolder.keys?.get("assignment_id") as Int

            insertAssignmentContent(Exam.SUKO, assignmentId, assignment.contentFi, assignment.contentSv, version)

            SukoAssignmentDtoOut(assignment, contentOutFields(keyHolder))
        }!!

    fun saveLdAssignment(assignment: LdAssignmentDtoIn): LdAssignmentDtoOut = transactionTemplate.execute { _ ->
        val version = INITIAL_VERSION_NUMBER
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
                            assignment_updater_oid,
                            assignment_version,
                            ld_assignment_lukuvuosi_koodi_arvos,
                            ld_assignment_aine_koodi_arvo
                        ) VALUES (?, ?, ?, ?, ?::publish_state, ?, ?, ?, ?, ?, ?)
                        RETURNING $assignmentOutFields""",
                arrayOf("assignment_id")
            )
            ps.setString(1, assignment.nameFi)
            ps.setString(2, assignment.nameSv)
            ps.setString(3, assignment.instructionFi)
            ps.setString(4, assignment.instructionSv)
            ps.setString(5, assignment.publishState.toString())
            ps.setArray(6, con.createArrayOf("text", assignment.laajaalainenOsaaminenKoodiArvos.toTypedArray()))
            ps.setString(7, Kayttajatiedot.fromSecurityContext().oidHenkilo)
            ps.setString(8, Kayttajatiedot.fromSecurityContext().oidHenkilo)
            ps.setInt(9, version)
            ps.setArray(10, con.createArrayOf("text", assignment.lukuvuosiKoodiArvos.toTypedArray()))
            ps.setString(11, assignment.aineKoodiArvo)
            ps
        }, keyHolder)

        val assignmentId = keyHolder.keys?.get("assignment_id") as Int

        insertAssignmentContent(Exam.LD, assignmentId, assignment.contentFi, assignment.contentSv, version)

        LdAssignmentDtoOut(assignment, contentOutFields(keyHolder))
    }!!

    fun savePuhviAssignment(assignment: PuhviAssignmentDtoIn): PuhviAssignmentDtoOut =
        transactionTemplate.execute { _ ->
            val version = INITIAL_VERSION_NUMBER
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
                            assignment_updater_oid,
                            assignment_version,
                            puhvi_assignment_assignment_type_koodi_arvo,
                            puhvi_assignment_lukuvuosi_koodi_arvos
                        ) VALUES (?, ?, ?, ?, ?::publish_state, ?, ?, ?, ?, ?, ?)
                        RETURNING $assignmentOutFields""",
                    arrayOf("assignment_id")
                )
                ps.setString(1, assignment.nameFi)
                ps.setString(2, assignment.nameSv)
                ps.setString(3, assignment.instructionFi)
                ps.setString(4, assignment.instructionSv)
                ps.setString(5, assignment.publishState.toString())
                ps.setArray(6, con.createArrayOf("text", assignment.laajaalainenOsaaminenKoodiArvos.toTypedArray()))
                ps.setString(7, Kayttajatiedot.fromSecurityContext().oidHenkilo)
                ps.setString(8, Kayttajatiedot.fromSecurityContext().oidHenkilo)
                ps.setInt(9, version)
                ps.setString(10, assignment.assignmentTypeKoodiArvo)
                ps.setArray(11, con.createArrayOf("text", assignment.lukuvuosiKoodiArvos.toTypedArray()))
                ps
            }, keyHolder)

            val assignmentId = keyHolder.keys?.get("assignment_id") as Int

            insertAssignmentContent(Exam.PUHVI, assignmentId, assignment.contentFi, assignment.contentSv, version)

            PuhviAssignmentDtoOut(
                id = assignmentId,
                nameFi = assignment.nameFi,
                nameSv = assignment.nameSv,
                instructionFi = assignment.instructionFi,
                instructionSv = assignment.instructionSv,
                contentFi = assignment.contentFi,
                contentSv = assignment.contentSv,
                publishState = assignment.publishState,
                createdAt = keyHolder.keys?.get("assignment_created_at") as java.sql.Timestamp,
                updatedAt = keyHolder.keys?.get("assignment_updated_at") as java.sql.Timestamp,
                laajaalainenOsaaminenKoodiArvos = assignment.laajaalainenOsaaminenKoodiArvos,
                authorOid = keyHolder.keys?.get("assignment_author_oid") as String,
                updaterOid = keyHolder.keys?.get("assignment_updater_oid") as String,
                updaterName = null,
                version = version,
                assignmentTypeKoodiArvo = assignment.assignmentTypeKoodiArvo,
                lukuvuosiKoodiArvos = assignment.lukuvuosiKoodiArvos
            )
        }!!


    fun getAssignmentsByIds(exam: Exam, ids: List<Int>, version: Int?): List<AssignmentOut> {
        if (version != null && ids.size != 1) {
            throw IllegalArgumentException("Version may only be provided with exactly one id in ids list")
        }
        if (ids.isEmpty()) {
            return emptyList()
        }

        val role = Kayttajatiedot.fromSecurityContext().role

        val (table, mapper) = when (exam) {
            Exam.SUKO -> "suko_assignment" to mapSukoListResultSet
            Exam.PUHVI -> "puhvi_assignment" to mapPuhviResultSet
            Exam.LD -> "ld_assignment" to mapLdResultSet
        }

        val versionCondition = version?.let { "AND a.assignment_version = $version" } ?: ""

        val maxVersionJoin = if (version == null) """
            INNER JOIN (SELECT assignment_id, MAX(assignment_version) AS max_version
                        FROM $table
                        GROUP BY assignment_id) latest_version ON a.assignment_id = latest_version.assignment_id AND
                                                                  a.assignment_version = latest_version.max_version
            """.trimIndent() else ""

        val query = """
            $baseAssignmentSelectQuery
            FROM $table a
            $maxVersionJoin
            LEFT JOIN ${table}_content content ON a.assignment_id = content.assignment_id AND a.assignment_version = content.assignment_version
            WHERE a.assignment_id in (:idList) $versionCondition ${publishStateFilter(role)}
            GROUP BY a.assignment_id, a.assignment_version;
         """.trimIndent()

        val parameters = MapSqlParameterSource()
        parameters.addValue("idList", ids)

        return namedJdbcTemplate.query(query, parameters, mapper)
    }

    fun getAllVersionsOfAssignment(id: Int, exam: Exam): List<AssignmentOut> {
        val (table, mapper) = when (exam) {
            Exam.SUKO -> "suko_assignment" to mapSukoListResultSet
            Exam.PUHVI -> "puhvi_assignment" to mapPuhviResultSet
            Exam.LD -> "ld_assignment" to mapLdResultSet
        }

        val query = """
            $baseAssignmentSelectQuery
            FROM $table a
            LEFT JOIN ${table}_content content ON a.assignment_id = content.assignment_id AND a.assignment_version = content.assignment_version
            WHERE a.assignment_id = ?
            GROUP BY a.assignment_id, a.assignment_version
            ORDER BY a.assignment_version;
         """

        return jdbcTemplate.query(query, mapper, id)
    }

    fun createNewVersionOfSukoAssignment(id: Int, assignment: SukoAssignmentDtoIn): SukoAssignmentDtoOut? =
        transactionTemplate.execute { _ ->
            val (currentLatestVersion, authorOid, originalCreatedAt) = getLatestAssignmentDataForNewVersion(
                id,
                assignment.exam
            )
                ?: return@execute null

            val version = currentLatestVersion + 1
            val keyHolder = GeneratedKeyHolder()
            jdbcTemplate.update({ con ->
                val ps = con.prepareStatement(
                    """INSERT INTO suko_assignment (
                        assignment_id,
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
                        assignment_author_oid,
                        assignment_updater_oid,
                        assignment_version,
                        assignment_created_at) 
                       VALUES (?, ?, ?, ?, ?, ?::publish_state, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                       RETURNING $assignmentOutFields""".trimIndent(),
                    arrayOf("assignment_id")
                )
                ps.setInt(1, id)
                ps.setString(2, assignment.nameFi)
                ps.setString(3, assignment.nameSv)
                ps.setString(4, assignment.instructionFi)
                ps.setString(5, assignment.instructionSv)
                ps.setString(6, assignment.publishState.toString())
                ps.setArray(7, con.createArrayOf("text", assignment.aiheKoodiArvos.toTypedArray()))
                ps.setString(8, assignment.assignmentTypeKoodiArvo)
                ps.setString(9, assignment.oppimaara.oppimaaraKoodiArvo)
                ps.setString(10, assignment.oppimaara.kielitarjontaKoodiArvo)
                ps.setString(11, assignment.tavoitetasoKoodiArvo)
                ps.setArray(12, con.createArrayOf("text", assignment.laajaalainenOsaaminenKoodiArvos.toTypedArray()))
                ps.setString(13, authorOid)
                ps.setString(14, Kayttajatiedot.fromSecurityContext().oidHenkilo)
                ps.setInt(15, version)
                ps.setTimestamp(16, originalCreatedAt)
                ps
            }, keyHolder)

            insertAssignmentContent(Exam.SUKO, id, assignment.contentFi, assignment.contentSv, version)

            SukoAssignmentDtoOut(assignment, contentOutFields(keyHolder))
        }

    fun createNewVersionOfLdAssignment(id: Int, assignment: LdAssignmentDtoIn): LdAssignmentDtoOut? =
        transactionTemplate.execute { _ ->
            val (currentLatestVersion, authorOid, originalCreatedAt) = getLatestAssignmentDataForNewVersion(
                id,
                assignment.exam
            )
                ?: return@execute null

            val version = currentLatestVersion + 1
            val keyHolder = GeneratedKeyHolder()
            jdbcTemplate.update({ con ->
                val ps = con.prepareStatement(
                    """INSERT INTO ld_assignment (
                        assignment_id,
                        assignment_name_fi,
                        assignment_name_sv,
                        assignment_instruction_fi,
                        assignment_instruction_sv,
                        assignment_publish_state,
                        assignment_author_oid,
                        assignment_updated_at,
                        assignment_updater_oid,
                        assignment_laajaalainen_osaaminen_koodi_arvos,
                        ld_assignment_lukuvuosi_koodi_arvos,
                        ld_assignment_aine_koodi_arvo,
                        assignment_version,
                        assignment_created_at)
                       VALUES (?, ?, ?, ?, ?, ?::publish_state, ?, clock_timestamp(), ?, ?, ?, ?, ?, ?)
                       RETURNING $assignmentOutFields""".trimIndent(),
                    arrayOf("assignment_id")
                )
                ps.setInt(1, id)
                ps.setString(2, assignment.nameFi)
                ps.setString(3, assignment.nameSv)
                ps.setString(4, assignment.instructionFi)
                ps.setString(5, assignment.instructionSv)
                ps.setString(6, assignment.publishState.toString())
                ps.setString(7, authorOid)
                ps.setString(8, Kayttajatiedot.fromSecurityContext().oidHenkilo)
                ps.setArray(9, con.createArrayOf("text", assignment.laajaalainenOsaaminenKoodiArvos.toTypedArray()))
                ps.setArray(10, con.createArrayOf("text", assignment.lukuvuosiKoodiArvos.toTypedArray()))
                ps.setString(11, assignment.aineKoodiArvo)
                ps.setInt(12, version)
                ps.setTimestamp(13, originalCreatedAt)
                ps
            }, keyHolder)

            insertAssignmentContent(Exam.LD, id, assignment.contentFi, assignment.contentSv, version)

            LdAssignmentDtoOut(assignment, contentOutFields(keyHolder))
        }

    fun createNewVersionOfPuhviAssignment(id: Int, assignment: PuhviAssignmentDtoIn): PuhviAssignmentDtoOut? =
        transactionTemplate.execute { _ ->
            val (currentLatestVersion, authorOid, originalCreatedAt) = getLatestAssignmentDataForNewVersion(
                id,
                assignment.exam
            )
                ?: return@execute null

            val version = currentLatestVersion + 1
            val keyHolder = GeneratedKeyHolder()
            jdbcTemplate.update({ con ->
                val ps = con.prepareStatement(
                    """INSERT INTO puhvi_assignment (
                        assignment_id,
                        assignment_name_fi,
                        assignment_name_sv,
                        assignment_instruction_fi,
                        assignment_instruction_sv,
                        assignment_publish_state,
                        assignment_author_oid,
                        assignment_updated_at,
                        assignment_updater_oid,
                        assignment_laajaalainen_osaaminen_koodi_arvos,
                        puhvi_assignment_assignment_type_koodi_arvo,
                        puhvi_assignment_lukuvuosi_koodi_arvos,
                        assignment_version,
                        assignment_created_at)
                       VALUES (?, ?, ?, ?, ?, ?::publish_state, ?, clock_timestamp(), ?, ?, ?, ?, ?, ?)
                       RETURNING $assignmentOutFields""".trimIndent(),
                    arrayOf("assignment_id")
                )
                ps.setInt(1, id)
                ps.setString(2, assignment.nameFi)
                ps.setString(3, assignment.nameSv)
                ps.setString(4, assignment.instructionFi)
                ps.setString(5, assignment.instructionSv)
                ps.setString(6, assignment.publishState.toString())
                ps.setString(7, authorOid)
                ps.setString(8, Kayttajatiedot.fromSecurityContext().oidHenkilo)
                ps.setArray(9, con.createArrayOf("text", assignment.laajaalainenOsaaminenKoodiArvos.toTypedArray()))
                ps.setString(10, assignment.assignmentTypeKoodiArvo)
                ps.setArray(11, con.createArrayOf("text", assignment.lukuvuosiKoodiArvos.toTypedArray()))
                ps.setInt(12, version)
                ps.setTimestamp(13, originalCreatedAt)
                ps
            }, keyHolder)

            insertAssignmentContent(Exam.PUHVI, id, assignment.contentFi, assignment.contentSv, version)

            PuhviAssignmentDtoOut(assignment, contentOutFields(keyHolder))
        }


    fun getFavoriteAssignmentsCount(): Int {
        val role = Kayttajatiedot.fromSecurityContext().role
        val userOid = Kayttajatiedot.fromSecurityContext().oidHenkilo

        val andIsPublishedIfOpettaja = if (role == Role.OPETTAJA) "AND assignment_publish_state = 'PUBLISHED'" else ""

        val sql = """
            SELECT count(1)
            FROM assignment a
            INNER JOIN (SELECT assignment_id, MAX(assignment_version) AS max_version
                     FROM assignment
                     GROUP BY assignment_id) latest_version ON a.assignment_id = latest_version.assignment_id AND
                                                               a.assignment_version = latest_version.max_version
            LEFT JOIN assignment_favorite fav
                   ON a.assignment_id = fav.assignment_id AND fav.assignment_favorite_user_oid = ?
            WHERE a.assignment_publish_state <> 'DELETED' AND fav.assignment_id IS NOT NULL $andIsPublishedIfOpettaja;
        """.trimIndent()

        return jdbcTemplate.queryForObject(sql, Int::class.java, userOid)
    }

    fun favoriteTableNamesByExam(exam: Exam) = when (exam) {
        Exam.SUKO -> "suko_assignment_favorite" to "suko_assignment_favorite_folder"
        Exam.LD -> "ld_assignment_favorite" to "ld_assignment_favorite_folder"
        Exam.PUHVI -> "puhvi_assignment_favorite" to "puhvi_assignment_favorite_folder"
    }

    fun ensureRootFavoriteFolderExists(exam: Exam) {
        val (_, folderTableName) = favoriteTableNamesByExam(exam)
        jdbcTemplate.update(
            """
                    INSERT INTO $folderTableName (
                        assignment_favorite_folder_id, 
                        assignment_favorite_folder_user_oid, 
                        assignment_favorite_folder_parent_id, 
                        assignment_favorite_folder_name) 
                    VALUES (0, ?, null, ?) 
                    ON CONFLICT DO NOTHING;""".trimIndent(),
            Kayttajatiedot.fromSecurityContext().oidHenkilo,
            ROOT_FOLDER_NAME
        )
    }

    fun setAssignmentFavoriteFolders(exam: Exam, assignmentId: Int, folderIds: List<Int>): Int? {
        val userOid = Kayttajatiedot.fromSecurityContext().oidHenkilo
        val (favoriteTableName, folderTableName) = favoriteTableNamesByExam(exam)

        val result = transactionTemplate.execute { _ ->
            jdbcTemplate.update(
                "DELETE FROM $favoriteTableName WHERE assignment_id = ? AND assignment_favorite_user_oid = ?",
                assignmentId,
                userOid
            )

            if (folderIds.contains(ROOT_FOLDER_ID)) {
                ensureRootFavoriteFolderExists(exam)
            }

            val sql =
                "INSERT INTO $favoriteTableName (assignment_id, assignment_favorite_user_oid, assignment_version, assignment_favorite_folder_id) VALUES (?, ?, 1, ?)"

            val rowsToInsert: List<Array<Any>> = folderIds.map { arrayOf(assignmentId, userOid, it) }

            try {
                jdbcTemplate.batchUpdate(sql, rowsToInsert)
                getFavoriteAssignmentsCount()
            } catch (e: DataIntegrityViolationException) {
                if (isForeignKeyViolationException(e)) {
                    if (e.message?.contains("is not present in table \"${tableNameByExam(exam)}\"") == true) {
                        throw ResponseStatusException(
                            HttpStatus.NOT_FOUND,
                            "Assignment $assignmentId ($exam) not found"
                        )
                    } else if (e.message?.contains("is not present in table \"$folderTableName\"") == true) {
                        throw ResponseStatusException(
                            HttpStatus.BAD_REQUEST,
                            "At least one of the folder ids $folderIds does not exist for user $userOid"
                        )
                    } else {
                        val errorMessage = "Unexpected foreign key violation when setting favorite folders"
                        logger.error(errorMessage, e)
                        throw ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, errorMessage)
                    }
                } else {
                    val errorMessage = "Unexpected DataIntegrityViolationException setting favorite folders"
                    logger.error(errorMessage, e)
                    throw ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, errorMessage)
                }
            }
        }


        return result
    }

    data class FavoriteFolderRow(
        val id: Int,
        val parentId: Int?,
        val name: String,
    )

    data class AssignmentFavoriteRow(
        val assignmentId: Int,
        val folderId: Int
    )

    fun constructFavoriteCardFolder(
        rootFolderRow: FavoriteFolderRow,
        folderRows: List<FavoriteFolderRow>,
        assignmentFavoriteRows: List<AssignmentFavoriteRow>,
        assignmentsById: Map<Int, AssignmentCardOut>
    ): FavoriteCardFolderDtoOut {
        val (favoriteRowsInThisFolder, otherFavoriteRows) = assignmentFavoriteRows.partition { it.folderId == rootFolderRow.id }
        val (subfolderRows, otherFolderRows) = folderRows.partition { it.parentId == rootFolderRow.id }

        return FavoriteCardFolderDtoOut(
            id = rootFolderRow.id,
            name = rootFolderRow.name,
            assignmentCards = favoriteRowsInThisFolder.mapNotNull { assignmentsById[it.assignmentId] },
            subfolders = subfolderRows.map {
                constructFavoriteCardFolder(
                    it,
                    otherFolderRows,
                    otherFavoriteRows,
                    assignmentsById
                )
            }
        )
    }

    private fun getFavoriteFolderAndSubfolderRowsInDescendantOrder(
        exam: Exam,
        folderId: Int
    ): List<FavoriteFolderRow> {
        val userOid = Kayttajatiedot.fromSecurityContext().oidHenkilo
        val (_, folderTableName) = favoriteTableNamesByExam(exam)
        return jdbcTemplate.query(
            """
            WITH RECURSIVE sub_tree AS (
              SELECT assignment_favorite_folder_id, assignment_favorite_folder_parent_id, assignment_favorite_folder_name
              FROM $folderTableName
              WHERE assignment_favorite_folder_id = ? AND assignment_favorite_folder_user_oid = ?
              UNION ALL
              SELECT aff.assignment_favorite_folder_id, aff.assignment_favorite_folder_parent_id, aff.assignment_favorite_folder_name
              FROM $folderTableName aff
              INNER JOIN sub_tree st ON st.assignment_favorite_folder_id = aff.assignment_favorite_folder_parent_id AND assignment_favorite_folder_user_oid = ?
            )
            SELECT * FROM sub_tree""".trimIndent(),
            { rs, _ ->
                FavoriteFolderRow(
                    id = rs.getInt("assignment_favorite_folder_id"),
                    parentId = rs.getInt("assignment_favorite_folder_parent_id"),
                    name = rs.getString("assignment_favorite_folder_name")
                )
            },
            folderId,
            userOid,
            userOid
        )
    }


    private fun getAssignmentFavoriteRowsByExam(exam: Exam, assignmentId: Int?): List<AssignmentFavoriteRow> {
        val userOid = Kayttajatiedot.fromSecurityContext().oidHenkilo
        val (assignmentFavoriteTableName, _) = favoriteTableNamesByExam(exam)
        val assignmentIdFilter = if (assignmentId != null) "AND assignment_id = $assignmentId" else ""
        return jdbcTemplate.query(
            """
            SELECT assignment_id, assignment_favorite_folder_id
            FROM $assignmentFavoriteTableName
            WHERE assignment_favorite_user_oid = ? $assignmentIdFilter""".trimIndent(),
            { rs, _ ->
                AssignmentFavoriteRow(
                    assignmentId = rs.getInt("assignment_id"),
                    folderId = rs.getInt("assignment_favorite_folder_id")
                )
            },
            userOid
        )
    }


    fun getFavoritesCardFolders(exam: Exam): FavoriteCardFolderDtoOut =
        transactionTemplate.execute { _ ->
            val folderRows = getFavoriteFolderAndSubfolderRowsInDescendantOrder(exam, ROOT_FOLDER_ID)

            val (rootFolderRows, otherFolderRows) = folderRows.partition { it.id == ROOT_FOLDER_ID }
            if (rootFolderRows.isEmpty()) {
                // Suosikkitehtäviä ei ole eikä juurikansiota ole vielä luotu
                return@execute FavoriteCardFolderDtoOut(ROOT_FOLDER_ID, ROOT_FOLDER_NAME, emptyList(), emptyList())
            }

            val assignmentFavoriteRows: List<AssignmentFavoriteRow> = getAssignmentFavoriteRowsByExam(exam, null)
            val assignmentsById =
                getAssignmentsByIds(
                    exam,
                    assignmentFavoriteRows.map { it.assignmentId },
                    null
                ).map(AssignmentCardOut::fromAssignmentOut).associateBy { it.id }

            return@execute constructFavoriteCardFolder(
                rootFolderRows.first(),
                otherFolderRows,
                assignmentFavoriteRows,
                assignmentsById
            )
        }!!

    fun constructFavoriteFolder(
        rootFolderRow: FavoriteFolderRow,
        folderRows: List<FavoriteFolderRow>
    ): FavoriteFolderDtoOut {
        val (subfolderRows, otherFolderRows) = folderRows.partition { it.parentId == rootFolderRow.id }

        return FavoriteFolderDtoOut(
            id = rootFolderRow.id,
            name = rootFolderRow.name,
            subfolders = subfolderRows.map {
                constructFavoriteFolder(
                    it,
                    otherFolderRows
                )
            }
        )
    }

    fun constructFolderIdsByAssignmentId(
        assignmentFavoriteRows: List<AssignmentFavoriteRow>,
    ): Map<Int, List<Int>> =
        assignmentFavoriteRows.fold<AssignmentFavoriteRow, MutableMap<Int, MutableList<Int>>>(
            mutableMapOf()
        ) { map, row ->
            if (!map.containsKey(row.assignmentId)) {
                map[row.assignmentId] = mutableListOf()
            }
            map[row.assignmentId]!!.add(row.folderId)
            map
        }

    fun getFavorites(exam: Exam, assignmentId: Int?): FavoriteIdsDtoOut =
        transactionTemplate.execute { _ ->
            val folderRows = getFavoriteFolderAndSubfolderRowsInDescendantOrder(exam, ROOT_FOLDER_ID)

            val (rootFolderRows, otherFolderRows) = folderRows.partition { it.id == ROOT_FOLDER_ID }
            if (rootFolderRows.isEmpty()) {
                // Suosikkitehtäviä ei ole eikä juurikansiota ole vielä luotu
                return@execute FavoriteIdsDtoOut(
                    rootFolder = FavoriteFolderDtoOut(ROOT_FOLDER_ID, ROOT_FOLDER_NAME, emptyList()),
                    folderIdsByAssignmentId = emptyMap()
                )
            }

            val assignmentFavoriteRows: List<AssignmentFavoriteRow> =
                getAssignmentFavoriteRowsByExam(exam, assignmentId)

            return@execute FavoriteIdsDtoOut(
                rootFolder = constructFavoriteFolder(rootFolderRows.first(), otherFolderRows),
                folderIdsByAssignmentId = constructFolderIdsByAssignmentId(assignmentFavoriteRows)
            )
        }!!

    fun createNewFavoriteFolder(exam: Exam, folder: FavoriteFolderDtoIn): Int {
        val userOid = Kayttajatiedot.fromSecurityContext().oidHenkilo
        val (_, folderTableName) = favoriteTableNamesByExam(exam)
        return transactionTemplate.execute { _ ->
            if (folder.parentId == ROOT_FOLDER_ID) {
                ensureRootFavoriteFolderExists(exam)
            }

            try {
                return@execute jdbcTemplate.queryForObject(
                    """INSERT INTO $folderTableName (
                           assignment_favorite_folder_user_oid,
                           assignment_favorite_folder_parent_id,
                           assignment_favorite_folder_name
                       ) VALUES (?, ?, ?) RETURNING assignment_favorite_folder_id""".trimIndent(),
                    Int::class.java,
                    userOid,
                    folder.parentId,
                    folder.name
                )
            } catch (e: DataIntegrityViolationException) {
                if (isForeignKeyViolationException(e)) {
                    throw ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Parent folder ${folder.parentId} not found for user $userOid"
                    )
                } else {
                    throw e
                }
            }
        }!!
    }


    fun updateFavoriteFolder(exam: Exam, folderId: Int, updatedFolder: FavoriteFolderDtoIn) {
        if (folderId == ROOT_FOLDER_ID) {
            throw ResponseStatusException(HttpStatus.BAD_REQUEST, "Root folder cannot be updated")
        }

        transactionTemplate.execute { _ ->
            val folderAndSubfolderRows = getFavoriteFolderAndSubfolderRowsInDescendantOrder(exam, folderId)

            if (folderAndSubfolderRows.map { it.id }.contains(updatedFolder.parentId)) {
                throw ResponseStatusException(HttpStatus.BAD_REQUEST, "Cannot move folder under itself")
            }

            val userOid = Kayttajatiedot.fromSecurityContext().oidHenkilo
            val (_, folderTableName) = favoriteTableNamesByExam(exam)
            try {
                val updatedRowCount = jdbcTemplate.update(
                    """UPDATE $folderTableName
                       SET assignment_favorite_folder_parent_id = ?, assignment_favorite_folder_name = ?
                       WHERE assignment_favorite_folder_id = ? AND assignment_favorite_folder_user_oid = ?""".trimIndent(),
                    updatedFolder.parentId,
                    updatedFolder.name,
                    folderId,
                    userOid
                )
                if (updatedRowCount == 0) {
                    throw ResponseStatusException(HttpStatus.NOT_FOUND, "Folder $folderId not found for user $userOid")
                }
            } catch (e: DataIntegrityViolationException) {
                if (isForeignKeyViolationException(e)) {
                    throw ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Parent folder ${updatedFolder.parentId} not found for user $userOid"
                    )
                } else {
                    throw e
                }
            }
        }
    }

    private fun isForeignKeyViolationException(
        e: DataIntegrityViolationException,
    ): Boolean {
        val cause = e.cause
        return cause is SQLException && cause.sqlState == "23503"
    }

    fun deleteFavoriteFolder(exam: Exam, folderId: Int): Int {
        if (folderId == ROOT_FOLDER_ID) {
            throw ResponseStatusException(HttpStatus.BAD_REQUEST, "Root folder cannot be deleted")
        }

        val userOid = Kayttajatiedot.fromSecurityContext().oidHenkilo
        val (_, folderTableName) = favoriteTableNamesByExam(exam)
        return jdbcTemplate.update(
            """DELETE FROM $folderTableName WHERE
                assignment_favorite_folder_id = ? AND
                assignment_favorite_folder_user_oid = ?
                """.trimIndent(),
            folderId,
            userOid
        )
    }
}