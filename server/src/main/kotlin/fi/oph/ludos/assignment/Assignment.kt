package fi.oph.ludos.assignment

import com.fasterxml.jackson.annotation.JsonProperty
import com.fasterxml.jackson.annotation.JsonSubTypes
import com.fasterxml.jackson.annotation.JsonTypeInfo
import com.fasterxml.jackson.annotation.JsonTypeName
import fi.oph.ludos.*
import fi.oph.ludos.koodisto.KoodistoName
import fi.oph.ludos.koodisto.ValidKoodiArvo
import fi.oph.ludos.koodisto.ValidKoodiArvos
import fi.oph.ludos.koodisto.ValidOppimaara
import jakarta.validation.*
import jakarta.validation.constraints.Min
import jakarta.validation.constraints.Pattern
import java.sql.Timestamp
import kotlin.reflect.KClass

@ValidOppimaara
data class Oppimaara(
    val oppimaaraKoodiArvo: String,
    val kielitarjontaKoodiArvo: String? = null
) : Comparable<Oppimaara> {
    override fun compareTo(other: Oppimaara): Int {
        val oppimaaraOrder = oppimaaraKoodiArvo.compareTo(other.oppimaaraKoodiArvo)
        return if (oppimaaraOrder != 0) {
            oppimaaraOrder
        } else if (kielitarjontaKoodiArvo == null && other.kielitarjontaKoodiArvo == null) {
            0
        } else if (kielitarjontaKoodiArvo == null || other.kielitarjontaKoodiArvo == null) {
            if (kielitarjontaKoodiArvo == null) -1 else 1 // sort parent before child
        } else {
            kielitarjontaKoodiArvo.compareTo(other.kielitarjontaKoodiArvo)
        }

    }
}

@JsonTypeInfo(use = JsonTypeInfo.Id.NAME, include = JsonTypeInfo.As.EXISTING_PROPERTY, property = "exam")
@JsonSubTypes(
    JsonSubTypes.Type(value = SukoAssignmentDtoIn::class, name = "SUKO"),
    JsonSubTypes.Type(value = PuhviAssignmentDtoIn::class, name = "PUHVI"),
    JsonSubTypes.Type(value = LdAssignmentDtoIn::class, name = "LD")
)
@AtLeastOneAssignmentNameIsNotBlank
interface Assignment : ContentBase {
    @get:ValidContentDescription
    val instructionFi: String

    @get:ValidContentDescription
    val instructionSv: String

    @get:ValidHtmlContentList
    val contentFi: List<String>

    @get:ValidHtmlContentList
    val contentSv: List<String>

    @get:ValidKoodiArvos(koodisto = KoodistoName.LAAJA_ALAINEN_OSAAMINEN_LOPS2021)
    val laajaalainenOsaaminenKoodiArvos: List<String>

    @get:JsonProperty(access = JsonProperty.Access.READ_ONLY)
    override val contentType: ContentType
        get() = ContentType.ASSIGNMENT
}

interface SukoAssignmentMetadata {
    val assignmentTypeKoodiArvo: String
    val oppimaara: Oppimaara
    val tavoitetasoKoodiArvo: String?
    val aiheKoodiArvos: List<String>
}

@JsonTypeName("SUKO")
data class SukoAssignmentDtoIn(
    override val nameFi: String,
    override val nameSv: String,
    override val instructionFi: String,
    override val instructionSv: String,
    override val contentFi: List<String>,
    override val contentSv: List<String>,
    override val publishState: PublishState,
    override val laajaalainenOsaaminenKoodiArvos: List<String>,
    @field:ValidKoodiArvo(koodisto = KoodistoName.TEHTAVATYYPPI_SUKO)
    override val assignmentTypeKoodiArvo: String,
    @field:Valid
    override val oppimaara: Oppimaara,
    @field:ValidKoodiArvo(koodisto = KoodistoName.TAITOTASO)
    @JsonProperty(required = true)
    override val tavoitetasoKoodiArvo: String?,
    @field:ValidKoodiArvos(koodisto = KoodistoName.AIHE_SUKO)
    override val aiheKoodiArvos: List<String>,
    override val exam: Exam = Exam.SUKO,
) : Assignment, SukoAssignmentMetadata {
    constructor(dtoOut: SukoAssignmentDtoOut) : this(
        nameFi = dtoOut.nameFi,
        nameSv = dtoOut.nameSv,
        instructionFi = dtoOut.instructionFi,
        instructionSv = dtoOut.instructionSv,
        contentFi = dtoOut.contentFi,
        contentSv = dtoOut.contentSv,
        publishState = dtoOut.publishState,
        laajaalainenOsaaminenKoodiArvos = dtoOut.laajaalainenOsaaminenKoodiArvos,
        assignmentTypeKoodiArvo = dtoOut.assignmentTypeKoodiArvo,
        oppimaara = dtoOut.oppimaara,
        tavoitetasoKoodiArvo = dtoOut.tavoitetasoKoodiArvo,
        aiheKoodiArvos = dtoOut.aiheKoodiArvos
    )
}

interface LdAssignmentMetadata {
    val lukuvuosiKoodiArvos: List<String>
    val aineKoodiArvo: String
}

@JsonTypeName("LD")
data class LdAssignmentDtoIn(
    override val nameFi: String,
    override val nameSv: String,
    override val instructionFi: String,
    override val instructionSv: String,
    override val contentFi: List<String>,
    override val contentSv: List<String>,
    override val publishState: PublishState,
    override val laajaalainenOsaaminenKoodiArvos: List<String>,
    @field:ValidKoodiArvos(koodisto = KoodistoName.LUDOS_LUKUVUOSI)
    override val lukuvuosiKoodiArvos: List<String>,
    @field:ValidKoodiArvo(koodisto = KoodistoName.LUDOS_LUKIODIPLOMI_AINE)
    override val aineKoodiArvo: String,
    override val exam: Exam = Exam.LD,
) : Assignment, LdAssignmentMetadata

interface PuhviAssignmentMetadata {
    val assignmentTypeKoodiArvo: String
    val lukuvuosiKoodiArvos: List<String>
}

@JsonTypeName("PUHVI")
data class PuhviAssignmentDtoIn(
    override val nameFi: String,
    override val nameSv: String,
    override val instructionFi: String,
    override val instructionSv: String,
    override val contentFi: List<String>,
    override val contentSv: List<String>,
    override val publishState: PublishState,
    override val laajaalainenOsaaminenKoodiArvos: List<String>,
    @field:ValidKoodiArvo(koodisto = KoodistoName.TEHTAVATYYPPI_PUHVI)
    override val assignmentTypeKoodiArvo: String,
    @field:ValidKoodiArvos(koodisto = KoodistoName.LUDOS_LUKUVUOSI)
    override val lukuvuosiKoodiArvos: List<String>,
    override val exam: Exam = Exam.PUHVI,
) : Assignment, PuhviAssignmentMetadata

@JsonTypeInfo(use = JsonTypeInfo.Id.NAME, include = JsonTypeInfo.As.EXISTING_PROPERTY, property = "exam")
@JsonSubTypes(
    JsonSubTypes.Type(value = SukoAssignmentDtoOut::class, name = "SUKO"),
    JsonSubTypes.Type(value = PuhviAssignmentDtoOut::class, name = "PUHVI"),
    JsonSubTypes.Type(value = LdAssignmentDtoOut::class, name = "LD")
)
sealed interface AssignmentOut : ContentBaseOut, Assignment

@JsonTypeName("SUKO")
data class SukoAssignmentDtoOut(
    override val id: Int,
    override val nameFi: String,
    override val nameSv: String,
    override val instructionFi: String,
    override val instructionSv: String,
    override val contentFi: List<String>,
    override val contentSv: List<String>,
    override val publishState: PublishState,
    override val createdAt: Timestamp,
    override val updatedAt: Timestamp,
    override val laajaalainenOsaaminenKoodiArvos: List<String>,
    override val authorOid: String,
    override val updaterOid: String,
    override val updaterName: String?,
    override val version: Int,
    override val assignmentTypeKoodiArvo: String,
    override val oppimaara: Oppimaara,
    override val tavoitetasoKoodiArvo: String?,
    override val aiheKoodiArvos: List<String>,
    override val exam: Exam = Exam.SUKO
) : AssignmentOut, SukoAssignmentMetadata

@JsonTypeName("PUHVI")
data class PuhviAssignmentDtoOut(
    override val id: Int,
    override val nameFi: String,
    override val nameSv: String,
    override val instructionFi: String,
    override val instructionSv: String,
    override val contentFi: List<String>,
    override val contentSv: List<String>,
    override val publishState: PublishState,
    override val createdAt: Timestamp,
    override val updatedAt: Timestamp,
    override val laajaalainenOsaaminenKoodiArvos: List<String>,
    override val authorOid: String,
    override val updaterOid: String,
    override val updaterName: String?,
    override val version: Int,
    override val assignmentTypeKoodiArvo: String,
    override val lukuvuosiKoodiArvos: List<String>,
    override val exam: Exam = Exam.PUHVI
) : AssignmentOut, PuhviAssignmentMetadata

@JsonTypeName("LD")
data class LdAssignmentDtoOut(
    override val id: Int,
    override val nameFi: String,
    override val nameSv: String,
    override val instructionFi: String,
    override val instructionSv: String,
    override val contentFi: List<String>,
    override val contentSv: List<String>,
    override val publishState: PublishState,
    override val createdAt: Timestamp,
    override val updatedAt: Timestamp,
    override val laajaalainenOsaaminenKoodiArvos: List<String>,
    override val authorOid: String,
    override val updaterOid: String,
    override val updaterName: String?,
    override val version: Int,
    override val lukuvuosiKoodiArvos: List<String>,
    override val aineKoodiArvo: String,
    override val exam: Exam = Exam.LD
) : AssignmentOut, LdAssignmentMetadata

@JsonTypeInfo(use = JsonTypeInfo.Id.NAME, include = JsonTypeInfo.As.EXISTING_PROPERTY, property = "exam")
@JsonSubTypes(
    JsonSubTypes.Type(value = SukoAssignmentCardDtoOut::class, name = "SUKO"),
    JsonSubTypes.Type(value = PuhviAssignmentCardDtoOut::class, name = "PUHVI"),
    JsonSubTypes.Type(value = LdAssignmentCardDtoOut::class, name = "LD")
)
sealed interface AssignmentCardOut : ContentBaseOut {
    companion object {
        fun fromAssignmentOut(dto: AssignmentOut): AssignmentCardOut = when (dto) {
            is SukoAssignmentDtoOut -> SukoAssignmentCardDtoOut(dto)
            is LdAssignmentDtoOut -> LdAssignmentCardDtoOut(dto)
            is PuhviAssignmentDtoOut -> PuhviAssignmentCardDtoOut(dto)
        }
    }

    @get:JsonProperty(access = JsonProperty.Access.READ_ONLY)
    override val contentType: ContentType
        get() = ContentType.ASSIGNMENT
}

@JsonTypeName("SUKO")
data class SukoAssignmentCardDtoOut(
    override val id: Int,
    override val publishState: PublishState,
    override val nameFi: String,
    override val nameSv: String,
    override val createdAt: Timestamp,
    override val updaterOid: String,
    override val updatedAt: Timestamp,
    override val updaterName: String?,
    override val authorOid: String,
    override val version: Int,
    override val assignmentTypeKoodiArvo: String,
    override val oppimaara: Oppimaara,
    override val tavoitetasoKoodiArvo: String?,
    override val aiheKoodiArvos: List<String>,
    override val exam: Exam = Exam.SUKO
) : AssignmentCardOut, SukoAssignmentMetadata {
    constructor(sukoAssignmentDtoOut: SukoAssignmentDtoOut) : this(
        id = sukoAssignmentDtoOut.id,
        publishState = sukoAssignmentDtoOut.publishState,
        nameFi = sukoAssignmentDtoOut.nameFi,
        nameSv = sukoAssignmentDtoOut.nameSv,
        createdAt = sukoAssignmentDtoOut.createdAt,
        updaterOid = sukoAssignmentDtoOut.updaterOid,
        updatedAt = sukoAssignmentDtoOut.updatedAt,
        updaterName = sukoAssignmentDtoOut.updaterName,
        authorOid = sukoAssignmentDtoOut.authorOid,
        version = sukoAssignmentDtoOut.version,
        assignmentTypeKoodiArvo = sukoAssignmentDtoOut.assignmentTypeKoodiArvo,
        oppimaara = sukoAssignmentDtoOut.oppimaara,
        tavoitetasoKoodiArvo = sukoAssignmentDtoOut.tavoitetasoKoodiArvo,
        aiheKoodiArvos = sukoAssignmentDtoOut.aiheKoodiArvos,
        exam = sukoAssignmentDtoOut.exam
    )
}

@JsonTypeName("LD")
data class LdAssignmentCardDtoOut(
    override val id: Int,
    override val publishState: PublishState,
    override val nameFi: String,
    override val nameSv: String,
    override val createdAt: Timestamp,
    override val updaterOid: String,
    override val updatedAt: Timestamp,
    override val updaterName: String?,
    override val authorOid: String,
    override val version: Int,
    override val lukuvuosiKoodiArvos: List<String>,
    override val aineKoodiArvo: String,
    override val exam: Exam = Exam.LD
) : AssignmentCardOut, LdAssignmentMetadata {
    constructor(ldAssignmentDtoOut: LdAssignmentDtoOut) : this(
        id = ldAssignmentDtoOut.id,
        publishState = ldAssignmentDtoOut.publishState,
        nameFi = ldAssignmentDtoOut.nameFi,
        nameSv = ldAssignmentDtoOut.nameSv,
        createdAt = ldAssignmentDtoOut.createdAt,
        updaterOid = ldAssignmentDtoOut.updaterOid,
        updatedAt = ldAssignmentDtoOut.updatedAt,
        updaterName = ldAssignmentDtoOut.updaterName,
        authorOid = ldAssignmentDtoOut.authorOid,
        version = ldAssignmentDtoOut.version,
        lukuvuosiKoodiArvos = ldAssignmentDtoOut.lukuvuosiKoodiArvos,
        aineKoodiArvo = ldAssignmentDtoOut.aineKoodiArvo,
        exam = ldAssignmentDtoOut.exam
    )
}

@JsonTypeName("PUHVI")
data class PuhviAssignmentCardDtoOut(
    override val id: Int,
    override val publishState: PublishState,
    override val nameFi: String,
    override val nameSv: String,
    override val createdAt: Timestamp,
    override val updaterOid: String,
    override val updatedAt: Timestamp,
    override val updaterName: String?,
    override val authorOid: String,
    override val version: Int,
    override val assignmentTypeKoodiArvo: String,
    override val lukuvuosiKoodiArvos: List<String>,
    override val exam: Exam = Exam.PUHVI
) : AssignmentCardOut, PuhviAssignmentMetadata {
    constructor(puhviAssignmentDtoOut: PuhviAssignmentDtoOut) : this(
        id = puhviAssignmentDtoOut.id,
        publishState = puhviAssignmentDtoOut.publishState,
        nameFi = puhviAssignmentDtoOut.nameFi,
        nameSv = puhviAssignmentDtoOut.nameSv,
        createdAt = puhviAssignmentDtoOut.createdAt,
        updaterOid = puhviAssignmentDtoOut.updaterOid,
        updatedAt = puhviAssignmentDtoOut.updatedAt,
        updaterName = puhviAssignmentDtoOut.updaterName,
        authorOid = puhviAssignmentDtoOut.authorOid,
        version = puhviAssignmentDtoOut.version,
        assignmentTypeKoodiArvo = puhviAssignmentDtoOut.assignmentTypeKoodiArvo,
        lukuvuosiKoodiArvos = puhviAssignmentDtoOut.lukuvuosiKoodiArvos,
        exam = puhviAssignmentDtoOut.exam
    )
}


interface AssignmentBaseFilters : BaseFilters {
    override val jarjesta: String?

    @get:Min(1)
    val sivu: Int
}

data class SukoFilters(
    override val jarjesta: String?,
    @field:Pattern(regexp = "^([A-Z0-9]+(\\.[A-Z0-9]+)?)(,[A-Z0-9]+(\\.[A-Z0-9]+)?)*\$")
    val oppimaara: String?,
    // format OPPIMAARAKOODIARVO or OPPIMAARAKOODIARVO.KIELITARJONTAKOODIARVO
    @field:Pattern(regexp = "^[0-9,]+\$")
    val tehtavatyyppisuko: String?,
    @field:Pattern(regexp = "^[0-9,]+\$")
    val aihe: String?,
    @field:Pattern(regexp = "^[0-9,]+\$")
    val tavoitetaitotaso: String?,
    override val sivu: Int = 1
) : AssignmentBaseFilters

data class LdFilters(
    override val jarjesta: String?,
    @field:Pattern(regexp = "^[0-9,]+\$")
    val lukuvuosi: String?,
    @field:Pattern(regexp = "^[0-9,]+\$")
    val aine: String?,
    override val sivu: Int = 1
) : AssignmentBaseFilters

data class PuhviFilters(
    override val jarjesta: String?,
    @field:Pattern(regexp = "^[0-9,]+\$")
    val tehtavatyyppipuhvi: String?,
    @field:Pattern(regexp = "^[0-9,]+\$")
    val lukuvuosi: String?,
    override val sivu: Int = 1
) : AssignmentBaseFilters

@Target(AnnotationTarget.CLASS)
@Retention(AnnotationRetention.RUNTIME)
@Constraint(validatedBy = [AtLeastOneAssignmentNameIsNotEmptyValidator::class])
annotation class AtLeastOneAssignmentNameIsNotBlank(
    val message: String = "At least one of the name fields must be non-empty",
    val groups: Array<KClass<*>> = [],
    val payload: Array<KClass<out Payload>> = []
)

class AtLeastOneAssignmentNameIsNotEmptyValidator :
    ConstraintValidator<AtLeastOneAssignmentNameIsNotBlank, Assignment> {
    override fun isValid(value: Assignment, context: ConstraintValidatorContext?): Boolean {
        return value.nameFi.isNotEmpty() || value.nameSv.isNotEmpty()
    }
}

data class AssignmentFilterOptionsDtoOut(
    val oppimaara: List<Oppimaara>? = null,
    val tehtavatyyppi: List<String>? = null,
    val aihe: List<String>? = null,
    val tavoitetaitotaso: List<String>? = null,
    val lukuvuosi: List<String>? = null,
    val aine: List<String>? = null,
)

data class AssignmentListDtoOut(
    val content: List<AssignmentCardOut>,
    val totalPages: Int,
    val currentPage: Int,
    val assignmentFilterOptions: AssignmentFilterOptionsDtoOut
)

const val ASSIGNMENT_PAGE_SIZE = 20

interface FavoriteFolder {
    val name: String
    val subfolders: List<FavoriteFolder>

    fun recursiveFolderNames(): List<String> = subfolders.flatMap { it.recursiveFolderNames() } + name
}

data class FavoriteFolderWithoutId(
    override val name: String,
    override val subfolders: List<FavoriteFolderWithoutId>
) : FavoriteFolder

interface FavoriteFolderOut : FavoriteFolder {
    val id: Int
    override val subfolders: List<FavoriteFolderOut>

    fun asFavoriteFolderWithoutId(): FavoriteFolderWithoutId =
        FavoriteFolderWithoutId(name, subfolders.map { it.asFavoriteFolderWithoutId() })
}

interface FavoriteCardFolder : FavoriteFolder {
    val assignmentCards: List<AssignmentCardOut>
}

data class FavoriteCardFolderWithoutId(
    override val name: String,
    override val subfolders: List<FavoriteCardFolderWithoutId>,
    override val assignmentCards: List<AssignmentCardOut>,
) : FavoriteCardFolder

data class FavoriteCardFolderDtoOut(
    override val id: Int,
    override val name: String,
    override val subfolders: List<FavoriteCardFolderDtoOut>,
    override val assignmentCards: List<AssignmentCardOut>,
) : FavoriteCardFolder, FavoriteFolderOut {
    fun asFavoriteCardFolderWithoutId(): FavoriteCardFolderWithoutId =
        FavoriteCardFolderWithoutId(name, subfolders.map { it.asFavoriteCardFolderWithoutId() }, assignmentCards)

    fun asFavoriteFolderDtoOut(): FavoriteFolderDtoOut =
        FavoriteFolderDtoOut(id, name, subfolders.map { it.asFavoriteFolderDtoOut() })
}

data class FavoriteFolderDtoOut(
    override val id: Int,
    override val name: String,
    override val subfolders: List<FavoriteFolderDtoOut>
) : FavoriteFolderOut

data class FavoriteIdsDtoOut(
    val rootFolder: FavoriteFolderDtoOut,
    val folderIdsByAssignmentId: Map<Int, List<Int>>
)

data class FavoriteFolderDtoIn(
    @ValidFavoriteFolderName
    val name: String,
    val parentId: Int
)
