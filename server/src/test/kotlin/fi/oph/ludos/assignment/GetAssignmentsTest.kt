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
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.status

@TestPropertySource(locations = ["classpath:application.properties"])
@SpringBootTest
@Transactional
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
class GetAssignmentsTest : AssignmentRequests() {

    @BeforeAll
    fun setup() {
        mockMvc.perform(emptyDbRequest().with(yllapitajaUser)).andExpect(status().is3xxRedirection)
        val testData = AssignmentFiltersTestData.assignmentsForFilterTest()
        seedDbWithCustomAssignments(mockMvc, testData)
    }

    @Test
    fun getAssignmentsWithNoRole() {
        mockMvc.perform(getAllAssignmentsReq(Exam.SUKO)).andExpect(status().is3xxRedirection())
    }

    @Test
    @WithOpettajaRole
    fun getAssignmentsAsOpettaja() {
        val assignments = getAllAssignmentsForExam<SukoAssignmentDtoOut>().content
        assertTrue(
            assignments.none { it.publishState == PublishState.DRAFT }, "Opettaja should not see draft assignments"
        )
        assertEquals(20, assignments.size)
    }

    private fun emptyAndSeedNSukoAssignments(n: Int) {
        mockMvc.perform(emptyDbRequest())
        seedDbWithCustomAssignments(mockMvc, AssignmentFiltersTestData.sukoAssignments(n))
    }

    private fun testPaging(
        numberOfAssignments: Int,
        expectedNumbersInPages: List<List<Int>>,
        expectedTotalPages: Int = expectedNumbersInPages.size
    ) {
        emptyAndSeedNSukoAssignments(numberOfAssignments)
        testSukoFilterOptions(null, null, null, null, "desc", expectedNumbersInPages, expectedTotalPages)
    }

    @Test
    @WithYllapitajaRole
    fun `paging with 0 suko assignments`() = testPaging(0, listOf(listOf()))

    @Test
    @WithYllapitajaRole
    fun `getting a non-existing page returns an empty array`() =
        testPaging(0, listOf(listOf(), listOf()), expectedTotalPages = 1)

    @Test
    @WithYllapitajaRole
    fun `paging with ASSIGNMENT_PAGE_SIZE suko assignments`() =
        testPaging(ASSIGNMENT_PAGE_SIZE, listOf(20.downTo(1).toList()))

    @Test
    @WithYllapitajaRole
    fun `paging with ASSIGNMENT_PAGE_SIZE+1 suko assignments`() =
        testPaging(
            ASSIGNMENT_PAGE_SIZE + 1,
            listOf(
                21.downTo(2).toList(),
                listOf(1)
            )
        )

    @Test
    @WithYllapitajaRole
    fun `paging with ASSIGNMENT_PAGE_SIZE x 2 + 1 suko assignments`() =
        testPaging(
            ASSIGNMENT_PAGE_SIZE * 2 + 1,
            listOf(
                41.downTo(22).toList(),
                21.downTo(2).toList(),
                listOf(1)
            )
        )

    @Test
    @WithOpettajaRole
    fun testSukoFilters() {
        // Filter by Suomi, A-oppimäärä
        testSukoFilterOptions("TKFIA1", null, null, null, "asc", listOf(listOf(11, 22)))
        testSukoFilterOptions("TKRUAI", null, null, null, "asc", listOf(listOf(6, 17)))
        testSukoFilterOptions("VKA1", null, null, null, "asc", listOf(listOf(8, 9, 19, 20)))
        testSukoFilterOptions("VKA1,TKRUAI", null, null, null, "asc", listOf(listOf(6, 8, 9, 17, 19, 20)))
        testSukoFilterOptions("VKA1.RA", null, null, null, "asc", listOf(listOf(8, 19)))
        testSukoFilterOptions("VKA1.RA,TKRUAI", null, null, null, "asc", listOf(listOf(6, 8, 17, 19)))
        // Filter by tehtavatyyppisuko "002"
        testSukoFilterOptions(null, "002", null, null, "asc", listOf(listOf(3, 6, 9, 12, 15, 18, 21, 24)))
        // Filter by aihe "001"
        testSukoFilterOptions(null, null, "001", null, "asc", listOf(listOf(5, 6, 11, 12, 17, 18, 23, 24)))
        testSukoFilterOptions(null, null, "001,007", null, "asc", listOf(listOf(5, 6, 11, 12, 17, 18, 23, 24)))
        // Filter by tavoitetaitotaso "0010"
        testSukoFilterOptions(null, null, null, "0010", "asc", listOf(listOf(12, 24)))

        testSukoFilterOptions("TKFIA1", "002", "001", null, "asc", listOf(listOf()))
        testSukoFilterOptions(
            // Kaikki oppimäärät, jotka testidatasta löytyy
            "TKFIA1,TKFIB1,TKFIB3,TKFIAI,TKRUB1,TKRUB3,TKRUAI,VKB1,VKA1.RA,VKA1.SA,VKENA1",
            null,
            null,
            null,
            "desc",
            listOf(
                24.downTo(5).toList(),
                4.downTo(1).toList()
            )
        )

        testSukoFilterOptions(
            "TKFIA1,TKFIB1,TKFIB3,TKFIAI,TKRUB1,TKRUB3,TKRUAI,VKB1,VKA1.RA,VKA1.SA,VKENA1",
            "001",
            null,
            null,
            "asc",
            listOf(listOf(1, 4, 7, 10, 13, 16, 19, 22))
        )
        testSukoFilterOptions(
            "TKFIA1,TKFIB1,TKFIB3,TKFIAI,TKRUB1,TKRUB3,TKRUAI,VKB1,VKA1.RA,VKA1.SA,VKENA1",
            "001",
            null,
            null,
            "desc",
            listOf(listOf(1, 4, 7, 10, 13, 16, 19, 22).reversed())
        )

        testSukoFilterOptions(null, "001", null, null, "asc", listOf(listOf(1, 4, 7, 10, 13, 16, 19, 22)))
        testSukoFilterOptions(
            "TKFIA1,TKFIB1,TKFIB3,TKFIAI,TKRUB1,TKRUB3,TKRUAI,VKB1,VKA1.RA,VKA1.SA,VKENA1",
            null,
            null,
            "0003,0005,0006", "asc",
            listOf(listOf(7, 8, 9, 19, 20, 21))
        )
    }

    @Test
    @WithYllapitajaRole
    fun testLdFilters() {
        testLdFilterOptions(
            null,
            null,
            "asc",
            listOf((1..20).toList(), (21..24).toList())
        )
        testLdFilterOptions("1", null, "asc", listOf(listOf(9, 18)))
        testLdFilterOptions(null, "20202021", "asc", listOf(listOf(5, 9, 10, 15, 19, 20)))
        testLdFilterOptions(null, "20202021", "desc", listOf(listOf(5, 9, 10, 15, 19, 20).reversed()))
        testLdFilterOptions("3", "20202021,20212022", "asc", listOf(listOf(2, 11, 20)))
    }

    @Test
    @WithYllapitajaRole
    fun testPuhviFilters() {
        testPuhviFilterOptions(
            null,
            null,
            "asc",
            listOf((1..20).toList(), (21..24).toList())
        )
        testPuhviFilterOptions("001", null, "asc", listOf(listOf(1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21, 23)))
        testPuhviFilterOptions(null, "20202021", "asc", listOf(listOf(5, 9, 10, 15, 19, 20)))
        testPuhviFilterOptions("002", "20202021,20212022", "asc", listOf(listOf(2, 10, 12, 20, 22)))
    }

    @Test
    @WithYllapitajaRole
    fun sukoFiltersWithNonExistingValues() {
        testSukoFilterOptions(null, "999", null, null, "desc", emptyList())
        testSukoFilterOptions(null, null, "999", null, "desc", emptyList())
        testSukoFilterOptions(null, null, null, "9999", "desc", emptyList())
    }

    @Test
    @WithYllapitajaRole
    fun ldFiltersWithNonExistingValues() {
        testLdFilterOptions("999", null, "desc", emptyList())
        testLdFilterOptions(null, "99999999", "desc", emptyList())
    }

    @Test
    @WithYllapitajaRole
    fun puhviFiltersWithNonExistingValues() {
        testPuhviFilterOptions("999", null, "asc", emptyList())
        testPuhviFilterOptions(null, "99999999", "asc", emptyList())
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
        orderDirection: String?,
        expectedNumbersInPages: List<List<Int>>,
        expectedTotalPages: Int = expectedNumbersInPages.size
    ) {
        expectedNumbersInPages.mapIndexed { i, expectedNumbersInPage ->
            val page = i + 1
            val sukoFilters = SukoFilters(
                orderDirection, null, oppimaara, tehtavatyyppisuko, aihe, tavoitetaitotaso, page
            )

            val content = getSukoAssignments(sukoFilters)
            testPageNumber(content, page, expectedTotalPages)
            val assignments = content.content

            val actualNumbersInName = assignments.flatMap { assignment ->
                Regex("\\d+").findAll(assignment.nameFi).map { it.value.toInt() }.toList()
            }

            assertEquals(expectedNumbersInPage, actualNumbersInName)
        }
    }

    private fun testPuhviFilterOptions(
        tehtavatyyppipuhvi: String?,
        lukuvuosi: String?,
        orderDirection: String?,
        expectedNumbersInPages: List<List<Int>>,
        expectedTotalPages: Int = expectedNumbersInPages.size
    ) {
        expectedNumbersInPages.mapIndexed { i, expectedNumbersInPage ->
            val page = i + 1
            val puhviFilters = PuhviFilters(
                orderDirection, null, tehtavatyyppipuhvi, lukuvuosi, page
            )

            val content = getPuhviAssignments(puhviFilters)
            testPageNumber(content, page, expectedTotalPages)

            val assignments = content.content

            val actualNumbersInName = assignments.flatMap { assignment ->
                Regex("\\d+").findAll(assignment.nameFi).map { it.value.toInt() }.toList()
            }

            assertEquals(expectedNumbersInPage.sorted(), actualNumbersInName.sorted())
        }
    }

    private fun testLdFilterOptions(
        aine: String?,
        lukuvuosi: String?,
        orderDirection: String?,
        expectedNumbersInPages: List<List<Int>>,
        expectedTotalPages: Int = expectedNumbersInPages.size
    ) {
        expectedNumbersInPages.mapIndexed { i, expectedNumbersInPage ->
            val page = i + 1
            val ldFilters = LdFilters(orderDirection, null, lukuvuosi, aine, page)
            val content = getLdAssignments(ldFilters)
            testPageNumber(content, page, expectedTotalPages)

            val assignments = content.content

            val actualNumbersInName = assignments.flatMap { assignment ->
                Regex("\\d+").findAll(assignment.nameFi).map { it.value.toInt() }.toList()
            }

            assertEquals(expectedNumbersInPage, actualNumbersInName)
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
            .andExpect(status().isBadRequest).andReturn().response.contentAsString

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
            setAssignmentIsFavorite(Exam.SUKO, it.id, true, opettajaUser)
        }

        val filteredFavoriteAssignments =
            getSukoAssignments(emptySukoFilters.copy(suosikki = true)).content
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