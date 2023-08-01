package fi.oph.ludos.test

import fi.oph.ludos.PublishState

class CreateDataForAssignmentFilterTest {
    private val sukoAssignmentTypeKoodiArvos = arrayOf("002", "001", "003")
    private val puhviAssignmentTypeKoodiArvos = arrayOf("002", "001")
    private val laajaalainenOsaaminenKoodiArvos = arrayOf("04", "02", "01", "06", "05", "03")
    private val taitotasoKoodiArvos = arrayOf(
        "0010", "0009", "0012", "0011", "0002", "0001", "0004", "0003", "0006", "0005", "0008", "0007"
    )
    private val oppimaaraKoodiArvos = arrayOf(
        "TKFIA1", "TKFIB1", "TKFIB3", "TKFIAI", "TKRUB1", "TKRUB3", "TKRUAI", "TKFI", "VKB2", "VKB3", "VKAAA1"
    )
    private val aiheKoodiArvos = arrayOf("001", "003", "013", "017", "005", "007")
    private val lukuvuosiKoodiArvos = arrayOf(
        "20202021", "20222023", "20212022", "20242025", "20232024"
    )
    private val aineKoodiArvos = arrayOf("1", "2", "3", "4", "5", "6", "7", "8", "9")

    fun prepareTestData(): String {
        val assignmentList = mutableListOf<String>()

        repeat(12) { i ->
            val laajaalainenOsaaminenVarying =
                Array(if (i % 2 == 0) 2 else if (i % 5 == 0) 3 else 0) { index -> laajaalainenOsaaminenKoodiArvos[(index + i) % laajaalainenOsaaminenKoodiArvos.size] }

            val lukuvuosiVarying =
                Array(if (i % 2 == 0) 1 else 2) { index -> lukuvuosiKoodiArvos[(index + i) % lukuvuosiKoodiArvos.size] }

            val aiheKoodiArvosArr = Array(if (i % 2 == 0) 1 else 2) { index -> aiheKoodiArvos[(index + i) % aiheKoodiArvos.size] }

            val sukoAssignment = """{
                "exam": "SUKO",
                "nameFi": "Test name $i FI",
                "nameSv": "Test name $i SV",
                "contentFi": "Test content $i FI",
                "contentSv": "Test content $i SV",
                "instructionFi": "Test Instruction",
                "instructionSv": "Test Instruction",
                "publishState": "${PublishState.PUBLISHED}",
                "assignmentTypeKoodiArvo": "${sukoAssignmentTypeKoodiArvos[i % sukoAssignmentTypeKoodiArvos.size]}",
                "laajaalainenOsaaminenKoodiArvos": ${laajaalainenOsaaminenVarying.map { "\"$it\"" }},
                "tavoitetasoKoodiArvo": "${taitotasoKoodiArvos[i % taitotasoKoodiArvos.size]}",
                "oppimaaraKoodiArvo": "${oppimaaraKoodiArvos[i % oppimaaraKoodiArvos.size]}",
                "aiheKoodiArvos": ${aiheKoodiArvosArr.map { "\"$it\"" }}
           }""".trimIndent()
            assignmentList.add(sukoAssignment)

            val ldAineKoodiArvo = aineKoodiArvos[i % aineKoodiArvos.size]
            val ldAssignment = """{
                "exam": "LD",
                "nameFi": "Test Name $i FI",
                "nameSv": "Test Name $i SV",
                "contentFi": "Test Content $i FI",
                "contentSv": "Test Content $i SV",
                "instructionFi": "Test Instruction",
                "instructionSv": "Test Instruction",
                "publishState": "${PublishState.PUBLISHED}",
                "laajaalainenOsaaminenKoodiArvos": ${laajaalainenOsaaminenVarying.map { "\"$it\"" }},
                "lukuvuosiKoodiArvos": ${lukuvuosiVarying.map { "\"$it\"" }},
                "aineKoodiArvo": "$ldAineKoodiArvo"
            }""".trimIndent()
            assignmentList.add(ldAssignment)

            val puhviAssignmentType = puhviAssignmentTypeKoodiArvos[i % puhviAssignmentTypeKoodiArvos.size]
            val puhviAssignment = """{
                "exam": "PUHVI",
                "nameFi": "Test Name $i FI",
                "nameSv": "Test Name $i SV",
                "contentFi": "Test Content $i FI",
                "contentSv": "Test Content $i SV",
                "instructionFi": "Test Instruction",
                "instructionSv": "Test Instruction",
                "publishState": "${PublishState.PUBLISHED}",
                "laajaalainenOsaaminenKoodiArvos": ${laajaalainenOsaaminenVarying.map { "\"$it\"" }},
                "assignmentTypeKoodiArvo": "$puhviAssignmentType",
                "lukuvuosiKoodiArvos": ${lukuvuosiVarying.map { "\"$it\"" }}
            }""".trimIndent()
            assignmentList.add(puhviAssignment)
        }

        return assignmentList.joinToString(",", "[", "]")
    }
}
