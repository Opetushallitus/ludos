package fi.oph.ludos.assignment

import com.fasterxml.jackson.module.kotlin.jacksonObjectMapper
import fi.oph.ludos.*
import fi.oph.ludos.test.CreateDataForAssignmentFilterTest
import jakarta.transaction.Transactional
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.*
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertTrue
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.test.context.TestPropertySource
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.result.MockMvcResultMatchers

@TestPropertySource(locations = ["classpath:application.properties"])
@SpringBootTest
@AutoConfigureMockMvc
@Transactional
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
class AssignmentFiltersTest(@Autowired val mockMvc: MockMvc) {
    val objectMapper = jacksonObjectMapper()

    @BeforeAll
    fun setup() {
        authenticateAsYllapitaja()
        mockMvc.perform(emptyDb())
        val testData = CreateDataForAssignmentFilterTest().prepareTestData()
        mockMvc.perform(seedDbWithCustomAssignments(testData))
    }

    @Test
    @WithYllapitajaRole
    fun testSukoFilters() {
        // No filters applied
        testSukoFilterOptions(null, null, null, null, listOf(0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11))
        // Filter by Suomi, A-oppimäärä
        testSukoFilterOptions("TKFIA1", null, null, null, listOf(0, 11))
        // Filter by tehtavatyyppisuko "002"
        testSukoFilterOptions(null, "002", null, null, listOf(0, 3, 6, 9))
        // Filter by aihe "001"
        testSukoFilterOptions(null, null, "001", null, listOf(0, 5, 6, 11))
        testSukoFilterOptions(null, null, "001,007", null, listOf(0, 5, 6, 11))
        // Filter by tavoitetaitotaso "0010"
        testSukoFilterOptions(null, null, null, "0010", listOf(0))

        testSukoFilterOptions("TKFIA1", "002", "001", null, listOf(0))
        testSukoFilterOptions(
            "TKFIA1,TKFIB1,TKFIB3,TKFIAI,TKRUB1,TKRUB3,TKRUAI,TKFI,VKB2,VKAAA1,VKB3",
            null,
            null,
            null,
            listOf(0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11)
        )
        testSukoFilterOptions(
            "TKFIA1,TKFIB1,TKFIB3,TKFIAI,TKRUB1,TKRUB3,TKRUAI,TKFI,VKB2,VKAAA1,VKB3",
            "001",
            null,
            null,
            listOf(1, 4, 7, 10)
        )
        testSukoFilterOptions(null, "001", null, null, listOf(1, 4, 7, 10))
        testSukoFilterOptions(
            "TKFIA1,TKFIB1,TKFIB3,TKFIAI,TKRUB1,TKRUB3,TKRUAI,TKFI,VKB2,VKAAA1,VKB3",
            null,
            null,
            "0003,0005,0006",
            listOf(7, 8, 9)
        )
    }

    @Test
    @WithYllapitajaRole
    fun testLdFilters() {
        testLdFilterOptions(null, null, listOf(0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11))
        testLdFilterOptions("1", null, listOf(0, 9))
        testLdFilterOptions(null, "20202021", listOf(0, 5, 9, 10))
        testLdFilterOptions("3", "20202021,20212022", listOf(2, 11))
    }

    @Test
    @WithYllapitajaRole
    fun testPuhviFilters() {
        testPuhviFilterOptions(null, null, listOf(0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11))
        testPuhviFilterOptions("001", null, listOf(1, 3, 5, 7, 9, 11))
        testPuhviFilterOptions(null, "20202021", listOf(0, 5, 9, 10))
        testPuhviFilterOptions("002", "20202021,20212022", listOf(0, 2, 10))
    }

    @Test
    @WithYllapitajaRole
    fun sukoFiltersWithNonExistingValues() {
        testSukoFilterOptions(null, "999", null, null, emptyList())
        testSukoFilterOptions(null, null, "999", null, emptyList())
        testSukoFilterOptions(null, null, null, "9999", emptyList())
    }

    @Test
    @WithYllapitajaRole
    fun ldFiltersWithNonExistingValues() {
        testLdFilterOptions("999", null, emptyList())
        testLdFilterOptions(null, "99999999", emptyList())
    }

    @Test
    @WithYllapitajaRole
    fun puhviFiltersWithNonExistingValues() {
        testPuhviFilterOptions("999", null, emptyList())
        testPuhviFilterOptions(null, "99999999", emptyList())
    }

    private fun testSukoFilterOptions(
        oppimaara: String?,
        tehtavatyyppisuko: String?,
        aihe: String?,
        tavoitetaitotaso: String?,
        expectedNumbersInName: List<Int>
    ) {
        val sukoFilters = SukoBaseFilters(
            orderDirection = "desc",
            isFavorite = null,
            oppimaara = oppimaara,
            tehtavatyyppisuko = tehtavatyyppisuko,
            aihe = aihe,
            tavoitetaitotaso = tavoitetaitotaso
        )

        val assignments = mockMvc.perform(getSukoAssignments(Exam.SUKO, sukoFilters)).andExpect(
            MockMvcResultMatchers.status().isOk()
        ).andReturn().response.contentAsString


        val assignmentsOut = objectMapper.readValue(assignments, Array<TestAssignmentSukoOut>::class.java)

        assignmentsOut.forEach {
            if (oppimaara != null) {
                assertTrue(
                    oppimaara.split(",").contains(it.oppimaaraKoodiArvo),
                    "oppimaara $oppimaara does not contain oppimaaraKoodiArvo ${it.oppimaaraKoodiArvo}"
                )
            }
            if (tehtavatyyppisuko != null) {
                assertTrue(
                    tehtavatyyppisuko.split(",").contains(it.assignmentTypeKoodiArvo),
                    "tehtavatyyppisuko $tehtavatyyppisuko does not contain assignmentTypeKoodiArvo ${it.assignmentTypeKoodiArvo}"
                )
            }
            if (aihe != null) {
                val sameVals = aihe.split(",").intersect(it.aiheKoodiArvos.toSet())

                assertTrue(sameVals.isNotEmpty(), "aihe $aihe does not contain aiheKoodiArvos ${it.aiheKoodiArvos}")
            }
            if (tavoitetaitotaso != null && it.tavoitetasoKoodiArvo != null) {
                assertTrue(
                    tavoitetaitotaso.split(",").contains(it.tavoitetasoKoodiArvo),
                    "tavoitetaitotaso $tavoitetaitotaso does not contain tavoitetasoKoodiArvo ${it.tavoitetasoKoodiArvo}"
                )
            }
        }

        val actualNumbersInName = assignmentsOut.flatMap { assignment ->
            Regex("\\d+").findAll(assignment.nameFi).map { it.value.toInt() }.toList()
        }

        assertEquals(expectedNumbersInName.sorted(), actualNumbersInName.sorted())
    }

    private fun testPuhviFilterOptions(
        tehtavatyyppipuhvi: String?, lukuvuosi: String?, expectedNumbersInName: List<Int>
    ) {
        val puhviFilters = PuhviBaseFilters(
            orderDirection = "desc", isFavorite = null, tehtavatyyppipuhvi = tehtavatyyppipuhvi, lukuvuosi = lukuvuosi
        )

        val assignments = mockMvc.perform(getPuhviAssignments(Exam.PUHVI, puhviFilters)).andExpect(
            MockMvcResultMatchers.status().isOk()
        ).andReturn().response.contentAsString

        val assignmentsOut = objectMapper.readValue(assignments, Array<TestAssignmentPuhviOut>::class.java)

        val actualNumbersInName = assignmentsOut.flatMap { assignment ->
            Regex("\\d+").findAll(assignment.nameFi).map { it.value.toInt() }.toList()
        }

        assertEquals(expectedNumbersInName.sorted(), actualNumbersInName.sorted())
    }

    private fun testLdFilterOptions(
        aine: String?, lukuvuosi: String?, expectedNumbersInName: List<Int>
    ) {
        val ldFilters = LdBaseFilters(
            orderDirection = "desc", isFavorite = null, aine = aine, lukuvuosi = lukuvuosi
        )

        val assignments = mockMvc.perform(getLdAssignments(Exam.LD, ldFilters)).andExpect(
            MockMvcResultMatchers.status().isOk()
        ).andReturn().response.contentAsString

        val assignmentsOut = objectMapper.readValue(assignments, Array<TestAssignmentLdOut>::class.java)

        val actualNumbersInName = assignmentsOut.flatMap { assignment ->
            Regex("\\d+").findAll(assignment.nameFi).map { it.value.toInt() }.toList()
        }

        assertEquals(expectedNumbersInName.sorted(), actualNumbersInName.sorted())
    }

    @Test
    @WithYllapitajaRole
    fun testFiltersWithNonAllowedValues() {
        // suko
        testNonAllowedFilterOptions(
            Exam.SUKO,
            "?orderDirection=desc&oppimaara=!&tehtavatyyppisuko=001",
            "oppimaara: must match \"^[a-zA-Z0-9,]+\$\""
        )
        testNonAllowedFilterOptions(
            Exam.SUKO, "?orderDirection=desc&tehtavatyyppisuko=a", "tehtavatyyppisuko: must match \"^[0-9,]+\$\""
        )
        testNonAllowedFilterOptions(
            Exam.SUKO,
            "?oppimaara=TKFIA1,TKRUAI,TKFIB3&tavoitetaitotaso=sdas,0008,0009&orderDirection=desc",
            "tavoitetaitotaso: must match \"^[0-9,]+\$\""
        )
        testNonAllowedFilterOptions(Exam.SUKO, "?aihe=asd&orderDirection=desc", "aihe: must match \"^[0-9,]+\$\"")
        testNonAllowedFilterOptions(
            Exam.SUKO, "?aihe=015,002,00A&orderDirection=desc", "aihe: must match \"^[0-9,]+\$\""
        )
        // puhvi
        testNonAllowedFilterOptions(
            Exam.PUHVI, "?orderDirection=desc&lukuvuosi=20212022,20202021A", "lukuvuosi: must match \"^[0-9,]+\$\""
        )
        testNonAllowedFilterOptions(
            Exam.PUHVI, "?tehtavatyyppipuhvi=aASs", "tehtavatyyppipuhvi: must match \"^[0-9,]+\$\""
        )
        // ld
        testNonAllowedFilterOptions(Exam.LD, "?aine=aASs", "aine: must match \"^[0-9,]+\$\"")
        testNonAllowedFilterOptions(Exam.LD, "?aine=", "aine: must match \"^[0-9,]+\$\"")
    }

    private fun testNonAllowedFilterOptions(exam: Exam, filterStr: String, expectedErrorString: String) {
        val errorStr = mockMvc.perform(getAssignmentsWithAnyFilter(exam, filterStr))
            .andExpect(MockMvcResultMatchers.status().isBadRequest).andReturn().response.contentAsString

        assertEquals(expectedErrorString, errorStr)
    }

    @Test
    @WithOpettajaRole
    fun `test filtering for favorite assignments`() {
        val assignments = mockMvc.perform(
            getSukoAssignments(
                Exam.SUKO, SukoBaseFilters(
                    orderDirection = "desc",
                    isFavorite = null,
                    oppimaara = null,
                    tehtavatyyppisuko = null,
                    aihe = null,
                    tavoitetaitotaso = null
                )
            )
        ).andExpect(
            MockMvcResultMatchers.status().isOk()
        ).andReturn().response.contentAsString

        val assignmentsOut = objectMapper.readValue(assignments, Array<TestAssignmentSukoOut>::class.java)
        // from assignmentsOut list get assignments to favorite
        val favoriteAssignments = assignmentsOut.slice(1..3)
        favoriteAssignments.forEach {
            mockMvc.perform(
                markAssignmentAsFavorite(
                    Exam.SUKO, it.id, true
                )
            ).andExpect(MockMvcResultMatchers.status().isOk)
        }
        // filter for favorites
        val filteredAssignments = mockMvc.perform(
            getSukoAssignments(
                Exam.SUKO, SukoBaseFilters(
                    orderDirection = "desc",
                    isFavorite = true,
                    oppimaara = null,
                    tehtavatyyppisuko = null,
                    aihe = null,
                    tavoitetaitotaso = null
                )
            )
        ).andExpect(
            MockMvcResultMatchers.status().isOk()
        ).andReturn().response.contentAsString

        val filteredAssignmentsOut =
            objectMapper.readValue(filteredAssignments, Array<TestAssignmentSukoOut>::class.java)
        // check that we get only assignments that were favored
        assertThat(filteredAssignmentsOut.map { it.id }).containsExactlyInAnyOrder(*(favoriteAssignments.map { it.id }.toTypedArray()))
        filteredAssignmentsOut.forEach {
            assertTrue(it.isFavorite, "Assignment ${it.id} should be favorite")
        }
        // filter for non-favorites
        val nonFilteredAssignments = mockMvc.perform(
            getSukoAssignments(
                Exam.SUKO, SukoBaseFilters(
                    orderDirection = "desc",
                    isFavorite = false,
                    oppimaara = null,
                    tehtavatyyppisuko = null,
                    aihe = null,
                    tavoitetaitotaso = null
                )
            )
        ).andExpect(
            MockMvcResultMatchers.status().isOk()
        ).andReturn().response.contentAsString

        val nonFilteredAssignmentsOut =
            objectMapper.readValue(nonFilteredAssignments, Array<TestAssignmentSukoOut>::class.java)
        // check that we get only assignments that were not favored
        val expectedNonFavoriteIds = assignmentsOut.map { it.id } - favoriteAssignments.map { it.id }.toSet()
        assertThat(nonFilteredAssignmentsOut.map { it.id }).containsExactlyInAnyOrder(*expectedNonFavoriteIds.toTypedArray())

        nonFilteredAssignmentsOut.forEach {
            assertTrue(!it.isFavorite, "Assignment ${it.id} should not be favorite")
        }

        // filter for all assignments
        val allAssignments = mockMvc.perform(
            getSukoAssignments(
                Exam.SUKO, SukoBaseFilters(
                    orderDirection = "desc",
                    isFavorite = null,
                    oppimaara = null,
                    tehtavatyyppisuko = null,
                    aihe = null,
                    tavoitetaitotaso = null
                )
            )
        ).andExpect(
            MockMvcResultMatchers.status().isOk()
        ).andReturn().response.contentAsString

        val allAssignmentsOut = objectMapper.readValue(allAssignments, Array<TestAssignmentSukoOut>::class.java)
        // check that we get all assignments
        assertThat(assignmentsOut.map { it.id }).containsExactlyInAnyOrder(*(allAssignmentsOut.map { it.id }.toTypedArray()))
    }
}