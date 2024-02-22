package fi.oph.ludos.assignment

import fi.oph.ludos.Exam
import fi.oph.ludos.TestPublishState

interface TestAssignment {
    val nameFi: String
    val nameSv: String
    val instructionFi: String
    val instructionSv: String
    val contentFi: List<String>
    val contentSv: List<String>
    val publishState: TestPublishState
    val laajaalainenOsaaminenKoodiArvos: List<String>
}

interface TestAssignmentIn : TestAssignment {
    val exam: String
    override val nameFi: String
    override val nameSv: String
    override val instructionFi: String
    override val instructionSv: String
    override val contentFi: List<String>
    override val contentSv: List<String>
    override val publishState: TestPublishState
    override val laajaalainenOsaaminenKoodiArvos: List<String>
}

data class TestSukoAssignmentDtoIn(
    override val nameFi: String,
    override val nameSv: String,
    override val instructionFi: String,
    override val instructionSv: String,
    override val contentFi: List<String>,
    override val contentSv: List<String>,
    override val publishState: TestPublishState,
    override val laajaalainenOsaaminenKoodiArvos: List<String>,
    val assignmentTypeKoodiArvo: String,
    val oppimaara: Oppimaara,
    val tavoitetasoKoodiArvo: String?,
    val aiheKoodiArvos: List<String>,
    override val exam: String = Exam.SUKO.toString(),
) : TestAssignmentIn {
    constructor(dtoIn: SukoAssignmentDtoIn) : this(
        dtoIn.nameFi,
        dtoIn.nameSv,
        dtoIn.instructionFi,
        dtoIn.instructionSv,
        dtoIn.contentFi,
        dtoIn.contentSv,
        TestPublishState.fromPublishState(dtoIn.publishState),
        dtoIn.laajaalainenOsaaminenKoodiArvos,
        dtoIn.assignmentTypeKoodiArvo,
        dtoIn.oppimaara,
        dtoIn.tavoitetasoKoodiArvo,
        dtoIn.aiheKoodiArvos
    )
}

data class TestLdAssignmentDtoIn(
    override val nameFi: String,
    override val nameSv: String,
    override val instructionFi: String,
    override val instructionSv: String,
    override val contentFi: List<String>,
    override val contentSv: List<String>,
    override val publishState: TestPublishState,
    override val laajaalainenOsaaminenKoodiArvos: List<String>,
    val lukuvuosiKoodiArvos: List<String>,
    val aineKoodiArvo: String,
    override val exam: String = Exam.LD.toString()
) : TestAssignmentIn

data class TestPuhviAssignmentDtoIn(
    override val nameFi: String,
    override val nameSv: String,
    override val instructionFi: String,
    override val instructionSv: String,
    override val contentFi: List<String>,
    override val contentSv: List<String>,
    override val publishState: TestPublishState,
    override val laajaalainenOsaaminenKoodiArvos: List<String>,
    val assignmentTypeKoodiArvo: String,
    val lukuvuosiKoodiArvos: List<String>,
    override val exam: String = Exam.PUHVI.toString()
) : TestAssignmentIn

data class TestAssignmentsOut<T : AssignmentCardOut>(
    val content: List<T>,
    val totalPages: Int,
    val currentPage: Int,
    val assignmentFilterOptions: AssignmentFilterOptionsDtoOut
)