package fi.oph.ludos.assignment

import fi.oph.ludos.*
import fi.oph.ludos.test.AssignmentFiltersTestData
import jakarta.transaction.Transactional
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.BeforeAll
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.TestInstance
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.test.context.TestPropertySource
import org.springframework.test.web.servlet.result.MockMvcResultMatchers

@TestPropertySource(locations = ["classpath:application.properties"])
@SpringBootTest
@Transactional
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
class AssignmentFiltersTest : AssignmentRequests() {

    @BeforeAll
    fun setup() {
        authenticateAsYllapitaja()
        mockMvc.perform(emptyDb())
        val testData = AssignmentFiltersTestData.assignmentsForFilterTest()
        seedDbWithCustomAssignments(mockMvc, testData)
    }

    @Test
    @WithYllapitajaRole
    fun testSukoFilters() {
        // No filters applied
        testSukoFilterOptions(
            null,
            null,
            null,
            null,
            listOf(4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23),
            2,
            listOf(0, 1, 2, 3)
        )
        // Filter by Suomi, A-oppimäärä
        testSukoFilterOptions("TKFIA1", null, null, null, listOf(0, 11, 22))
        testSukoFilterOptions("TKRUAI", null, null, null, listOf(6, 17))
        testSukoFilterOptions("VKA1", null, null, null, listOf(8, 9, 10, 19, 20, 21))
        testSukoFilterOptions("VKA1,TKRUAI", null, null, null, listOf(6, 8, 9, 10, 17, 19, 20, 21))
        testSukoFilterOptions("VKA1.RA", null, null, null, listOf(8, 19))
        testSukoFilterOptions("VKA1.RA,TKRUAI", null, null, null, listOf(6, 8, 17, 19))
        // Filter by tehtavatyyppisuko "002"
        testSukoFilterOptions(null, "002", null, null, listOf(0, 3, 6, 9, 12, 15, 18, 21))
        // Filter by aihe "001"
        testSukoFilterOptions(null, null, "001", null, listOf(0, 5, 6, 11, 12, 17, 18, 23))
        testSukoFilterOptions(null, null, "001,007", null, listOf(0, 5, 6, 11, 12, 17, 18, 23))
        // Filter by tavoitetaitotaso "0010"
        testSukoFilterOptions(null, null, null, "0010", listOf(0, 12))

        testSukoFilterOptions("TKFIA1", "002", "001", null, listOf(0))
        testSukoFilterOptions(
            "TKFIA1,TKFIB1,TKFIB3,TKFIAI,TKRUB1,TKRUB3,TKRUAI,VKA1,VKA1.RA,VKB1,VKB1.SA",
            null,
            null,
            null,
            listOf(4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23),
            2,
            listOf(0, 1, 2, 3)
        )
        testSukoFilterOptions(
            "TKFIA1,TKFIB1,TKFIB3,TKFIAI,TKRUB1,TKRUB3,TKRUAI,VKA1,VKA1.RA,VKB1,VKB1.SA",
            "001",
            null,
            null,
            listOf(1, 4, 7, 10, 13, 16, 19, 22)
        )
        testSukoFilterOptions(null, "001", null, null, listOf(1, 4, 7, 10, 13, 16, 19, 22))
        testSukoFilterOptions(
            "TKFIA1,TKFIB1,TKFIB3,TKFIAI,TKRUB1,TKRUB3,TKRUAI,VKA1,VKA1.RA,VKB1,VKB1.SA",
            null,
            null,
            "0003,0005,0006",
            listOf(7, 8, 9, 19, 20, 21)
        )

        // try to get non-existing page
        testSukoFilterOptions(
            null,
            null,
            null,
            null,
            listOf(),
            1,
            null,
            5000
        )
    }

    @Test
    @WithYllapitajaRole
    fun testLdFilters() {
        testLdFilterOptions(
            null,
            null,
            listOf(4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23),
            2,
            listOf(0, 1, 2, 3)
        )
        testLdFilterOptions("1", null, listOf(0, 9, 18))
        testLdFilterOptions(null, "20202021", listOf(0, 5, 9, 10, 15, 19, 20))
        testLdFilterOptions("3", "20202021,20212022", listOf(2, 11, 20))
    }

    @Test
    @WithYllapitajaRole
    fun testPuhviFilters() {
        testPuhviFilterOptions(
            null,
            null,
            listOf(4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23),
            2,
            listOf(0, 1, 2, 3)
        )
        testPuhviFilterOptions("001", null, listOf(1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21, 23))
        testPuhviFilterOptions(null, "20202021", listOf(0, 5, 9, 10, 15, 19, 20))
        testPuhviFilterOptions("002", "20202021,20212022", listOf(0, 2, 10, 12, 20, 22))
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

    private fun <T : AssignmentOut> testPageNumber(
        content: TestAssignmentsOut<T>,
        expectedPageNumber: Int,
        expectedTotalPages: Int = 1
    ) {
        assertEquals(expectedPageNumber, content.currentPage)
        assertEquals(expectedTotalPages, content.totalPages)
    }

    private fun testSukoFilterOptions(
        oppimaara: String?,
        tehtavatyyppisuko: String?,
        aihe: String?,
        tavoitetaitotaso: String?,
        expectedNumbersInNameFirstPage: List<Int>,
        expectedTotalPages: Int = 1,
        expectedNumbersInNameSecondPage: List<Int>? = null,
        sivu: Int? = 1
    ) {
        val sukoFilters = SukoFilters(
            "desc", null, oppimaara, tehtavatyyppisuko, aihe, tavoitetaitotaso, sivu ?: 1
        )

        val content = getSukoAssignments(sukoFilters)
        testPageNumber(content, sivu ?: 1, expectedTotalPages)
        val assignments = content.content

        val actualNumbersInName = assignments.flatMap { assignment ->
            Regex("\\d+").findAll(assignment.nameFi).map { it.value.toInt() }.toList()
        }

        assertEquals(expectedNumbersInNameFirstPage.sorted(), actualNumbersInName.sorted())

        if (expectedNumbersInNameSecondPage != null) {
            val sukoFiltersSecondPage = SukoFilters(
                "desc", null, oppimaara, tehtavatyyppisuko, aihe, tavoitetaitotaso, 2
            )

            val contentSecondPage = getSukoAssignments(sukoFiltersSecondPage)
            testPageNumber(contentSecondPage, 2, expectedTotalPages)
            val assignmentsSecondPage = contentSecondPage.content

            val actualNumbersInNameSecondPage = assignmentsSecondPage.flatMap { assignment ->
                Regex("\\d+").findAll(assignment.nameFi).map { it.value.toInt() }.toList()
            }

            assertEquals(expectedNumbersInNameSecondPage.sorted(), actualNumbersInNameSecondPage.sorted())
        }
    }

    private fun testPuhviFilterOptions(
        tehtavatyyppipuhvi: String?,
        lukuvuosi: String?,
        expectedNumbersInName: List<Int>,
        expectedTotalPages: Int = 1,
        expectedNumbersInNameSecondPage: List<Int>? = null,

        ) {
        val puhviFilters = PuhviFilters(
            "desc", null, tehtavatyyppipuhvi, lukuvuosi,
        )

        val content = getPuhviAssignments(puhviFilters)
        testPageNumber(content, 1, expectedTotalPages)

        val assignments = content.content

        val actualNumbersInName = assignments.flatMap { assignment ->
            Regex("\\d+").findAll(assignment.nameFi).map { it.value.toInt() }.toList()
        }

        assertEquals(expectedNumbersInName.sorted(), actualNumbersInName.sorted())

        if (expectedNumbersInNameSecondPage != null) {
            val puhviFiltersSecondPage = PuhviFilters(
                "desc", null, tehtavatyyppipuhvi, lukuvuosi, 2
            )

            val contentSecondPage = getPuhviAssignments(puhviFiltersSecondPage)
            testPageNumber(contentSecondPage, 2, expectedTotalPages)
            val assignmentsSecondPage = contentSecondPage.content

            val actualNumbersInNameSecondPage = assignmentsSecondPage.flatMap { assignment ->
                Regex("\\d+").findAll(assignment.nameFi).map { it.value.toInt() }.toList()
            }

            assertEquals(expectedNumbersInNameSecondPage.sorted(), actualNumbersInNameSecondPage.sorted())
        }
    }

    private fun testLdFilterOptions(
        aine: String?,
        lukuvuosi: String?,
        expectedNumbersInName: List<Int>,
        expectedTotalPages: Int = 1,
        expectedNumbersInNameSecondPage: List<Int>? = null
    ) {
        val ldFilters = LdFilters("desc", null, lukuvuosi, aine)

        val content = getLdAssignments(ldFilters)
        testPageNumber(content, 1, expectedTotalPages)

        val assignments = content.content

        val actualNumbersInName = assignments.flatMap { assignment ->
            Regex("\\d+").findAll(assignment.nameFi).map { it.value.toInt() }.toList()
        }

        assertEquals(expectedNumbersInName.sorted(), actualNumbersInName.sorted())

        if (expectedNumbersInNameSecondPage != null) {
            val ldFiltersSecondPage = LdFilters("desc", null, lukuvuosi, aine, 2)

            val contentSecondPage = getLdAssignments(ldFiltersSecondPage)
            testPageNumber(contentSecondPage, 2, expectedTotalPages)
            val assignmentsSecondPage = contentSecondPage.content

            val actualNumbersInNameSecondPage = assignmentsSecondPage.flatMap { assignment ->
                Regex("\\d+").findAll(assignment.nameFi).map { it.value.toInt() }.toList()
            }

            assertEquals(expectedNumbersInNameSecondPage.sorted(), actualNumbersInNameSecondPage.sorted())
        }
    }

    @Test
    @WithYllapitajaRole
    fun testFiltersWithNonAllowedValues() {
        // suko
        testNonAllowedFilterOptions(
            Exam.SUKO,
            "?orderDirection=desc&oppimaara=!&tehtavatyyppisuko=001",
            "oppimaara: must match \"^([A-Z0-9]+(\\.[A-Z0-9]+)?)(,[A-Z0-9]+(\\.[A-Z0-9]+)?)*\$\""
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

        testNonAllowedFilterOptions(
            Exam.LD,
            "?sivu=abc",
            "sivu: Failed to convert value of type 'java.lang.String' to required type 'int'; For input string: \"abc\""
        )
    }

    private fun testNonAllowedFilterOptions(exam: Exam, filterStr: String, expectedErrorString: String) {
        val errorStr = mockMvc.perform(getAssignmentsWithAnyFilterReq(exam, filterStr))
            .andExpect(MockMvcResultMatchers.status().isBadRequest).andReturn().response.contentAsString

        assertEquals(expectedErrorString, errorStr)
    }

    val emptySukoFilters = SukoFilters(
        jarjesta = "desc",
        suosikki = null,
        oppimaara = null,
        tehtavatyyppisuko = null,
        aihe = null,
        tavoitetaitotaso = null,
        sivu = 1
    )

    @Test
    @WithOpettajaRole
    fun `test filtering for favorite assignments`() {
        val allAssignments: List<SukoAssignmentDtoOut> = getAllAssignmentsForExam<SukoAssignmentDtoOut>().content
        val favoriteAssignments = allAssignments.slice(1..3)
        favoriteAssignments.forEach {
            setAssignmentIsFavorite(Exam.SUKO, it.id, true)
        }

        val filteredFavoriteAssignments = getSukoAssignments(emptySukoFilters.copy(suosikki = true)).content
        // check that we get only assignments that were favored
        assertThat(filteredFavoriteAssignments.map { it.id })
            .containsExactlyInAnyOrder(*(favoriteAssignments.map { it.id }.toTypedArray()))
        filteredFavoriteAssignments.forEach {
            assertTrue(it.isFavorite, "Assignment ${it.id} should be favorite")
        }

        val filteredNonFavoriteAssignments =
            getSukoAssignments(emptySukoFilters.copy(suosikki = false)).content
        // check that we get only assignments that were not favored
        val expectedNonFavoriteIds = allAssignments.map { it.id } - favoriteAssignments.map { it.id }.toSet()

        // remove last three items from the list, as they aren't on the first page
        assertThat(filteredNonFavoriteAssignments.map { it.id }
            .dropLast(3)).containsExactlyInAnyOrder(*expectedNonFavoriteIds.toTypedArray())

        filteredNonFavoriteAssignments.forEach {
            assertTrue(!it.isFavorite, "Assignment ${it.id} should not be favorite")
        }

        val assignmentsWithEmptyFilter = getSukoAssignments(emptySukoFilters).content
        assertThat(allAssignments.map { it.id })
            .containsExactlyInAnyOrder(*(assignmentsWithEmptyFilter.map { it.id }.toTypedArray()))
    }
}