package fi.oph.ludos.assignment

enum class TestPublishState {
    DRAFT, PUBLISHED, ARCHIVED, OLEMATON
}

interface TestAssignmentIn {
    val exam: String
    val nameFi: String
    val nameSv: String
    val contentFi: String
    val contentSv: String
    val instructionFi: String
    val instructionSv: String
    val publishState: TestPublishState
}

data class TestAssignmentSukoIn(
    override val exam: String,
    override val nameFi: String,
    override val nameSv: String,
    override val contentFi: String,
    override val contentSv: String,
    override val instructionFi: String,
    override val instructionSv: String,
    override val publishState: TestPublishState,
    val assignmentTypeKoodiArvo: String,
    val oppimaaraKoodiArvo: String,
    val tavoitetasoKoodiArvo: String?,
    val aiheKoodiArvos: Array<String>,
    val laajaalainenOsaaminenKoodiArvos: Array<String>,
) : TestAssignmentIn

data class TestAssignmentLdIn(
    override val exam: String,
    override val nameFi: String,
    override val nameSv: String,
    override val contentFi: String,
    override val contentSv: String,
    override val instructionFi: String,
    override val instructionSv: String,
    override val publishState: TestPublishState,
    val laajaalainenOsaaminenKoodiArvos: Array<String>,
    val lukuvuosiKoodiArvos: Array<String>,
    val aineKoodiArvo: String
) : TestAssignmentIn

data class TestAssignmentPuhviIn(
    override val exam: String,
    override val nameFi: String,
    override val nameSv: String,
    override val contentFi: String,
    override val contentSv: String,
    override val instructionFi: String,
    override val instructionSv: String,
    override val publishState: TestPublishState,
    val assignmentTypeKoodiArvo: String,
    val laajaalainenOsaaminenKoodiArvos: Array<String>,
    val lukuvuosiKoodiArvos: Array<String>
) : TestAssignmentIn

interface TestAssignmentOut {
    val id: Int
    val nameFi: String
    val nameSv: String
    val contentFi: String
    val contentSv: String
    val instructionFi: String
    val instructionSv: String
    val publishState: TestPublishState
    val laajaalainenOsaaminenKoodiArvos: Array<String>
    val authorOid: String
    val isFavorite: Boolean
    val createdAt: String
    val updatedAt: String
}

data class TestAssignmentSukoOut(
    override val id: Int,
    override val nameFi: String,
    override val nameSv: String,
    override val contentFi: String,
    override val contentSv: String,
    override val instructionFi: String,
    override val instructionSv: String,
    override val publishState: TestPublishState,
    override val laajaalainenOsaaminenKoodiArvos: Array<String>,
    override val authorOid: String,
    override val isFavorite: Boolean,
    override val createdAt: String,
    override val updatedAt: String,
    val assignmentTypeKoodiArvo: String,
    val oppimaaraKoodiArvo: String,
    val tavoitetasoKoodiArvo: String?,
    val aiheKoodiArvos: Array<String>,
) : TestAssignmentOut

data class TestAssignmentPuhviOut(
    override val id: Int,
    override val nameFi: String,
    override val nameSv: String,
    override val contentFi: String,
    override val contentSv: String,
    override val instructionFi: String,
    override val instructionSv: String,
    override val publishState: TestPublishState,
    override val laajaalainenOsaaminenKoodiArvos: Array<String>,
    override val authorOid: String,
    override val isFavorite: Boolean,
    override val createdAt: String,
    override val updatedAt: String,
    val assignmentTypeKoodiArvo: String,
    val lukuvuosiKoodiArvos: Array<String>,
) : TestAssignmentOut

data class TestAssignmentLdOut(
    override val id: Int,
    override val nameFi: String,
    override val nameSv: String,
    override val contentFi: String,
    override val contentSv: String,
    override val instructionFi: String,
    override val instructionSv: String,
    override val publishState: TestPublishState,
    override val laajaalainenOsaaminenKoodiArvos: Array<String>,
    override val authorOid: String,
    override val isFavorite: Boolean,
    override val createdAt: String,
    override val updatedAt: String,
    val lukuvuosiKoodiArvos: Array<String>,
    val aineKoodiArvo: String
): TestAssignmentOut
