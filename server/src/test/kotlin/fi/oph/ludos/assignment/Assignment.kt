package fi.oph.ludos.assignment

enum class TestPublishState {
    DRAFT, PUBLISHED, ARCHIVED, OLEMATON
}

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
    override val exam: String,
    override val nameFi: String,
    override val nameSv: String,
    override val instructionFi: String,
    override val instructionSv: String,
    override val contentFi: Array<String>,
    override val contentSv: Array<String>,
    override val publishState: TestPublishState,
    override val laajaalainenOsaaminenKoodiArvos: Array<String>,
    val assignmentTypeKoodiArvo: String,
    val oppimaaraKoodiArvo: String,
    val tavoitetasoKoodiArvo: String?,
    val aiheKoodiArvos: Array<String>,
) : TestAssignmentIn

data class TestLdAssignmentDtoIn(
    override val exam: String,
    override val nameFi: String,
    override val nameSv: String,
    override val instructionFi: String,
    override val instructionSv: String,
    override val contentFi: Array<String>,
    override val contentSv: Array<String>,
    override val publishState: TestPublishState,
    override val laajaalainenOsaaminenKoodiArvos: Array<String>,
    val lukuvuosiKoodiArvos: Array<String>,
    val aineKoodiArvo: String
) : TestAssignmentIn

data class TestPuhviAssignmentDtoIn(
    override val exam: String,
    override val nameFi: String,
    override val nameSv: String,
    override val instructionFi: String,
    override val instructionSv: String,
    override val contentFi: Array<String>,
    override val contentSv: Array<String>,
    override val publishState: TestPublishState,
    override val laajaalainenOsaaminenKoodiArvos: Array<String>,
    val assignmentTypeKoodiArvo: String,
    val lukuvuosiKoodiArvos: Array<String>
) : TestAssignmentIn

interface TestAssignmentOut : TestAssignment {
    val id: Int
    override val nameFi: String
    override val nameSv: String
    override val instructionFi: String
    override val instructionSv: String
    override val contentFi: Array<String>
    override val contentSv: Array<String>
    override val publishState: TestPublishState
    override val laajaalainenOsaaminenKoodiArvos: Array<String>
    val authorOid: String
    val isFavorite: Boolean
    val createdAt: String
    val updatedAt: String
}

data class TestSukoAssignmentDtoOut(
    override val id: Int,
    override val nameFi: String,
    override val nameSv: String,
    override val instructionFi: String,
    override val instructionSv: String,
    override val contentFi: Array<String>,
    override val contentSv: Array<String>,
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

data class TestPuhviAssignmentDtoOut(
    override val id: Int,
    override val nameFi: String,
    override val nameSv: String,
    override val instructionFi: String,
    override val instructionSv: String,
    override val contentFi: Array<String>,
    override val contentSv: Array<String>,
    override val publishState: TestPublishState,
    override val laajaalainenOsaaminenKoodiArvos: Array<String>,
    override val authorOid: String,
    override val isFavorite: Boolean,
    override val createdAt: String,
    override val updatedAt: String,
    val assignmentTypeKoodiArvo: String,
    val lukuvuosiKoodiArvos: Array<String>,
) : TestAssignmentOut

data class TestLdAssignmentDtoOut(
    override val id: Int,
    override val nameFi: String,
    override val nameSv: String,
    override val instructionFi: String,
    override val instructionSv: String,
    override val contentFi: Array<String>,
    override val contentSv: Array<String>,
    override val publishState: TestPublishState,
    override val laajaalainenOsaaminenKoodiArvos: Array<String>,
    override val authorOid: String,
    override val isFavorite: Boolean,
    override val createdAt: String,
    override val updatedAt: String,
    val lukuvuosiKoodiArvos: Array<String>,
    val aineKoodiArvo: String
) : TestAssignmentOut