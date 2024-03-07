package fi.oph.ludos.test

import fi.oph.ludos.PublishState
import fi.oph.ludos.assignment.*

const val DEFAULT_NUMBER_OF_ASSIGNMENTS = 24

object AssignmentFiltersTestData {
    private val sukoAssignmentTypeKoodiArvos = arrayOf("002", "001", "003")
    private val puhviAssignmentTypeKoodiArvos = arrayOf("002", "001")
    private val laajaalainenOsaaminenKoodiArvos = arrayOf("04", "02", "01", "06", "05", "03")
    private val taitotasoKoodiArvos = arrayOf(
        "0010", "0009", "0012", "0011", "0002", "0001", "0004", "0003", "0006", "0005", "0008", "0007"
    )
    private val oppimaaras = arrayOf(
        Oppimaara("TKFIA1"),
        Oppimaara("TKFIB1"),
        Oppimaara("TKFIB3"),
        Oppimaara("TKFIAI"),
        Oppimaara("TKRUB1"),
        Oppimaara("TKRUB3"),
        Oppimaara("TKRUAI"),
        Oppimaara("VKB1"),
        Oppimaara("VKA1", "RA"),
        Oppimaara("VKA1", "SA"),
        Oppimaara("VKENA1"),
    )
    private val aiheKoodiArvos = arrayOf("001", "003", "013", "017", "005", "007")
    private val lukuvuosiKoodiArvos = arrayOf(
        "20202021", "20222023", "20212022", "20242025", "20232024"
    )
    private val aineKoodiArvos = arrayOf("1", "2", "3", "4", "5", "6", "7", "8", "9")

    private fun laajaalainenOsaaminenVarying(i: Int) =
        List(if (i % 2 == 0) 2 else if (i % 5 == 0) 3 else 0) { index -> laajaalainenOsaaminenKoodiArvos[(index + i) % laajaalainenOsaaminenKoodiArvos.size] }

    private fun aiheKoodiArvosArr(i: Int) =
        List(if (i % 2 == 0) 1 else 2) { index -> aiheKoodiArvos[(index + i) % aiheKoodiArvos.size] }

    private fun lukuvuosiVarying(i: Int) =
        List(if (i % 2 == 0) 1 else 2) { index -> lukuvuosiKoodiArvos[(index + i) % lukuvuosiKoodiArvos.size] }


    fun sukoAssignments(n: Int): List<SukoAssignmentDtoIn> =
        (1..n).map { i ->
            SukoAssignmentDtoIn(
                nameFi = "Filter test name $i FI SUKO",
                nameSv = "Filter test name $i SV SUKO",
                instructionFi = "Test Instruction",
                instructionSv = "Test Instruction",
                contentFi = listOf("Test content $i FI"),
                contentSv = listOf("Test content $i SV"),
                publishState = PublishState.PUBLISHED,
                laajaalainenOsaaminenKoodiArvos = laajaalainenOsaaminenVarying(i),
                assignmentTypeKoodiArvo = sukoAssignmentTypeKoodiArvos[i % sukoAssignmentTypeKoodiArvos.size],
                oppimaara = oppimaaras[i % oppimaaras.size],
                tavoitetasoKoodiArvo = taitotasoKoodiArvos[i % taitotasoKoodiArvos.size],
                aiheKoodiArvos = aiheKoodiArvosArr(i),
            )
        }

    private fun ldAssignments(n: Int): List<LdAssignmentDtoIn> =
        (1..n).map { i ->
            LdAssignmentDtoIn(
                nameFi = "Filter test name $i FI LD",
                nameSv = "Filter test name $i SV LD",
                contentFi = listOf("Test Content $i FI"),
                contentSv = listOf("Test Content $i SV"),
                instructionFi = "Test Instruction",
                instructionSv = "Test Instruction",
                publishState = PublishState.PUBLISHED,
                laajaalainenOsaaminenKoodiArvos = laajaalainenOsaaminenVarying(i),
                lukuvuosiKoodiArvos = lukuvuosiVarying(i),
                aineKoodiArvo = aineKoodiArvos[i % aineKoodiArvos.size]
            )
        }

    private fun puhviAssignments(n: Int): List<PuhviAssignmentDtoIn> =
        (1..n).map { i ->
            PuhviAssignmentDtoIn(
                nameFi = "Filter test name $i FI PUHVI",
                nameSv = "Filter test name $i SV PUHVI",
                contentFi = listOf("Test Content $i FI"),
                contentSv = listOf("Test Content $i SV"),
                instructionFi = "Test Instruction",
                instructionSv = "Test Instruction",
                publishState = PublishState.PUBLISHED,
                laajaalainenOsaaminenKoodiArvos = laajaalainenOsaaminenVarying(i),
                assignmentTypeKoodiArvo = puhviAssignmentTypeKoodiArvos[i % puhviAssignmentTypeKoodiArvos.size],
                lukuvuosiKoodiArvos = lukuvuosiVarying(i)
            )
        }


    fun assignmentsForFilterTest(): List<AssignmentIn> =
        sukoAssignments(DEFAULT_NUMBER_OF_ASSIGNMENTS) +
                ldAssignments(DEFAULT_NUMBER_OF_ASSIGNMENTS) +
                puhviAssignments(DEFAULT_NUMBER_OF_ASSIGNMENTS)
}
