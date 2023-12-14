package fi.oph.ludos.certificate

import fi.oph.ludos.*
import jakarta.transaction.Transactional
import org.junit.jupiter.api.*
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.test.context.TestPropertySource
import org.springframework.test.web.servlet.result.MockMvcResultMatchers
import java.util.stream.Stream

@TestPropertySource(locations = ["classpath:application.properties"])
@SpringBootTest
@AutoConfigureMockMvc
@Transactional
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
class GetCertificatesTest : CertificateRequests() {

    @BeforeAll
    fun setup() {
        mockMvc.perform(emptyDbRequest().with(yllapitajaUser))
            .andExpect(MockMvcResultMatchers.status().is3xxRedirection)
        mockMvc.perform(seedDbWithCertificates().with(yllapitajaUser))
            .andExpect(MockMvcResultMatchers.status().is3xxRedirection)
    }

    @TestFactory
    @WithYllapitajaRole
    fun `get all certificates of each exam as yllapitaja`(): Stream<DynamicTest> = Exam.entries.stream().map { exam ->
        DynamicTest.dynamicTest("Get all certificates for $exam") {
            val certificates = getAllCertificates(exam)

            Assertions.assertEquals(4, certificates.size)

            val expectedNumbersInPage = listOf(0, 1, 2, 3)
            val actualNumbersInName = certificates.flatMap { cert ->
                Regex("\\d+").findAll(cert.nameFi).map { it.value.toInt() }.toList()
            }

            Assertions.assertEquals(expectedNumbersInPage, actualNumbersInName)
        }
    }

    @TestFactory
    @WithOpettajaRole
    fun `get all certificates of each exam as opettaja`(): Stream<DynamicTest> = Exam.entries.stream().map { exam ->
        DynamicTest.dynamicTest("$exam") {
            assertOrderedCertificateList(exam, CertificateFilters(jarjesta = "asc"), listOf(0, 2))
            assertOrderedCertificateList(exam, CertificateFilters(jarjesta = "desc"), listOf(2, 0))
        }
    }

    private fun assertOrderedCertificateList(
        exam: Exam,
        filters: CertificateFilters,
        expectedNumbersInList: List<Number>
    ): List<CertificateOut> {
        val certificates = getAllCertificates(exam, filters = filters)
        // make sure that draft certificate is not returned
        Assertions.assertEquals(2, certificates.size)

        val actualNumbersInName = certificates.flatMap { certificate ->
            Regex("\\d+").findAll(certificate.nameFi).map { it.value.toInt() }.toList()
        }

        Assertions.assertEquals(expectedNumbersInList, actualNumbersInName)
        return certificates
    }

    @TestFactory
    fun `opettaja cannot get draft certificates by id`(): Stream<DynamicTest> = Exam.entries.stream().map { exam ->
        DynamicTest.dynamicTest("$exam") {
            val certificates = getAllCertificates(exam, user = yllapitajaUser)
            Assertions.assertEquals(4, certificates.size)

            val idsOfDrafts =
                certificates.filter { it.publishState.toString() == TestPublishState.DRAFT.toString() }.map { it.id }
            Assertions.assertEquals(2, idsOfDrafts.size)

            idsOfDrafts.forEach {
                mockMvc.perform(getCertificateByIdReq(exam, it).with(opettajaUser))
                    .andExpect(MockMvcResultMatchers.status().isNotFound)
            }
        }
    }
}