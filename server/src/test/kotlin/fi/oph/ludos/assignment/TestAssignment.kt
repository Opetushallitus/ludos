package fi.oph.ludos.assignment

import fi.oph.ludos.Exam
import fi.oph.ludos.TestPublishState

interface TestAssignment {
    val nameFi: String
    val nameSv: String
    val instructionFi: String
    val instructionSv: String
    val contentFi: Array<String>
    val contentSv: Array<String>
    val publishState: TestPublishState
    val laajaalainenOsaaminenKoodiArvos: Array<String>
}

interface TestAssignmentIn : TestAssignment {
    val exam: String
    override val nameFi: String
    override val nameSv: String
    override val instructionFi: String
    override val instructionSv: String
    override val contentFi: Array<String>
    override val contentSv: Array<String>
    override val publishState: TestPublishState
    override val laajaalainenOsaaminenKoodiArvos: Array<String>
}

data class TestSukoAssignmentDtoIn(
    override val nameFi: String,
    override val nameSv: String,
    override val instructionFi: String,
    override val instructionSv: String,
    override val contentFi: Array<String>,
    override val contentSv: Array<String>,
    override val publishState: TestPublishState,
    override val laajaalainenOsaaminenKoodiArvos: Array<String>,
    val assignmentTypeKoodiArvo: String,
    val oppimaara: Oppimaara,
    val tavoitetasoKoodiArvo: String?,
    val aiheKoodiArvos: Array<String>,
    override val exam: String = Exam.SUKO.toString(),
) : TestAssignmentIn

data class TestLdAssignmentDtoIn(
    override val nameFi: String,
    override val nameSv: String,
    override val instructionFi: String,
    override val instructionSv: String,
    override val contentFi: Array<String>,
    override val contentSv: Array<String>,
    override val publishState: TestPublishState,
    override val laajaalainenOsaaminenKoodiArvos: Array<String>,
    val lukuvuosiKoodiArvos: Array<String>,
    val aineKoodiArvo: String,
    override val exam: String = Exam.LD.toString()
) : TestAssignmentIn

data class TestPuhviAssignmentDtoIn(
    override val nameFi: String,
    override val nameSv: String,
    override val instructionFi: String,
    override val instructionSv: String,
    override val contentFi: Array<String>,
    override val contentSv: Array<String>,
    override val publishState: TestPublishState,
    override val laajaalainenOsaaminenKoodiArvos: Array<String>,
    val assignmentTypeKoodiArvo: String,
    val lukuvuosiKoodiArvos: Array<String>,
    override val exam: String = Exam.PUHVI.toString()
) : TestAssignmentIn

data class TestAssignmentsOut<T : AssignmentOut>(
    val content: List<T>,
    val totalPages: Int,
    val currentPage: Int,
    val assignmentFilterOptions: AssignmentFilterOptionsDtoOut
)