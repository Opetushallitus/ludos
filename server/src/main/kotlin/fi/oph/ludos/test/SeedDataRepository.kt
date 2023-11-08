package fi.oph.ludos.test

import Language
import fi.oph.ludos.Exam
import fi.oph.ludos.PublishState
import fi.oph.ludos.assignment.*
import fi.oph.ludos.certificate.CertificateRepository
import fi.oph.ludos.certificate.LdCertificateDtoIn
import fi.oph.ludos.certificate.PuhviCertificateDtoIn
import fi.oph.ludos.certificate.SukoCertificateDtoIn
import fi.oph.ludos.instruction.*
import org.springframework.core.io.ClassPathResource
import org.springframework.http.MediaType
import org.springframework.jdbc.core.JdbcTemplate
import org.springframework.mock.web.MockMultipartFile
import org.springframework.stereotype.Repository

@Repository
class SeedDataRepository(
    val assignmentRepository: AssignmentRepository,
    val instructionRepository: InstructionRepository,
    val certificateRepository: CertificateRepository,
    private val jdbcTemplate: JdbcTemplate
) {

    fun seedDatabase() {
        seedAssignments()
        seedInstructions()
        seedCertificates()
    }

    val sukoAssignmentTypeKoodiArvos = arrayOf("002", "001", "003")
    val puhviAssignmentTypeKoodiArvos = arrayOf("002", "001")
    val laajaalainenOsaaminenKoodiArvos = arrayOf("04", "02", "01", "06", "05", "03")
    val taitotasoKoodiArvos = arrayOf(
        "0010", "0009", "0012", "0011", "0002", "0001", "0004", "0003", "0006", "0005", "0008", "0007"
    )
    val oppimaaras = arrayOf(
        Oppimaara("TKFIA1"),
        Oppimaara("TKFIB1"),
        Oppimaara("TKFIB3"),
        Oppimaara("TKFIAI"),
        Oppimaara("TKRUB1"),
        Oppimaara("TKRUB3"),
        Oppimaara("TKRUAI"),
        Oppimaara("VKB1", "IA"),
        Oppimaara("VKA1", "RA"),
        Oppimaara("VKA1", "SA"),
        Oppimaara("VKA1")
    )
    val aiheKoodiArvos = arrayOf("001", "003", "013", "017", "005", "007")
    val lukuvuosiKoodiArvos = arrayOf(
        "20202021", "20222023", "20212022", "20242025", "20232024"
    )
    val aineKoodiArvos = arrayOf("1", "2", "3", "4", "5", "6", "7", "8", "9")

    fun seedAssignments() {
        repeat(24) {
            val publishState = if (it > 3) PublishState.PUBLISHED else PublishState.DRAFT

            val laajaalainenOsaaminenVarying =
                Array(if (it % 2 == 0) 2 else if (it % 5 == 0) 3 else 0) { index -> laajaalainenOsaaminenKoodiArvos[(index + it) % laajaalainenOsaaminenKoodiArvos.size] }
            val lukuvuosiVarying =
                Array(if (it % 2 == 0) 1 else 2) { index -> lukuvuosiKoodiArvos[(index + it) % lukuvuosiKoodiArvos.size] }

            val sukoAssignment = SukoAssignmentDtoIn(
                nameFi = "Test name $it FI SUKO",
                nameSv = "Test name $it SV SUKO",
                instructionFi = "Test Instruction",
                instructionSv = "Test Instruction",
                contentFi = arrayOf("Test content $it FI SUKO"),
                contentSv = arrayOf("Test content $it SV SUKO"),
                publishState = publishState,
                laajaalainenOsaaminenKoodiArvos = laajaalainenOsaaminenVarying,
                assignmentTypeKoodiArvo = sukoAssignmentTypeKoodiArvos[it % sukoAssignmentTypeKoodiArvos.size],
                oppimaara = oppimaaras[it % oppimaaras.size],
                tavoitetasoKoodiArvo = taitotasoKoodiArvos[it % taitotasoKoodiArvos.size],
                aiheKoodiArvos = Array(if (it % 2 == 0) 1 else 2) { index -> aiheKoodiArvos[(index + it) % aiheKoodiArvos.size] },
            )
            assignmentRepository.saveSukoAssignment(sukoAssignment)

            val ldAssignment = LdAssignmentDtoIn(
                nameFi = "Test name $it FI LD",
                nameSv = "Test name $it SV LD",
                instructionFi = "Test Instruction LD",
                instructionSv = "Test Instruction LD",
                contentFi = (1..5).map { i -> "Test content $it FI LD part $i" }.toTypedArray(),
                contentSv = (1..5).map { i -> "Test content $it SV LD part $i" }.toTypedArray(),
                publishState = publishState,
                laajaalainenOsaaminenKoodiArvos = laajaalainenOsaaminenVarying,
                lukuvuosiKoodiArvos = lukuvuosiVarying,
                aineKoodiArvo = aineKoodiArvos[it % aineKoodiArvos.size]
            )
            assignmentRepository.saveLdAssignment(ldAssignment)

            val puhviAssignment = PuhviAssignmentDtoIn(
                nameFi = "Test name $it FI PUHVI",
                nameSv = "Test name $it SV PUHVI",
                instructionFi = "Test Instruction",
                instructionSv = "Test Instruction",
                contentFi = arrayOf("Test content $it FI PUHVI"),
                contentSv = arrayOf("Test content $it SV PUHVI"),
                publishState = publishState,
                laajaalainenOsaaminenKoodiArvos = laajaalainenOsaaminenVarying,
                assignmentTypeKoodiArvo = puhviAssignmentTypeKoodiArvos[it % puhviAssignmentTypeKoodiArvos.size],
                lukuvuosiKoodiArvos = lukuvuosiVarying,
            )
            assignmentRepository.savePuhviAssignment(puhviAssignment)
        }
    }

    fun readAttachmentFixtureFile(attachmentFixtureFileName: String): MockMultipartFile {
        val resource = ClassPathResource("fixtures/$attachmentFixtureFileName")
        val fileContents = resource.inputStream.readAllBytes()

        return MockMultipartFile(
            "attachments", attachmentFixtureFileName, MediaType.APPLICATION_PDF_VALUE, fileContents
        )
    }

    fun seedInstructions() {

        val attachments: List<InstructionAttachmentIn> = listOf(
            InstructionAttachmentIn(
                readAttachmentFixtureFile("fixture1.pdf"),
                InstructionAttachmentMetadataDtoIn(null, "Fixture1 pdf", Language.FI)
            ),
            InstructionAttachmentIn(
                readAttachmentFixtureFile("fixture2.pdf"),
                InstructionAttachmentMetadataDtoIn(null, "Fixture2 pdf", Language.SV)
            ),
            InstructionAttachmentIn(
                readAttachmentFixtureFile("fixture3.pdf"),
                InstructionAttachmentMetadataDtoIn(null, "Fixture3 pdf", Language.FI)
            ),
        )

        repeat(12) {
            val publishState = if (it > 3) PublishState.PUBLISHED else PublishState.DRAFT

            val sukoInstruction = SukoInstructionDtoIn(
                nameFi = "Test name $it FI",
                nameSv = "Test name $it SV",
                contentFi = "Test content $it FI",
                contentSv = "Test content $it SV",
                shortDescriptionFi = "Test short description $it FI",
                shortDescriptionSv = "Test short description $it SV",
                publishState = publishState,
            )

            instructionRepository.createInstruction(sukoInstruction, if (it == 0) attachments else emptyList())


            val ldInstruction = LdInstructionDtoIn(
                nameFi = "LD Test name $it FI",
                nameSv = "LD Test name $it SV",
                contentFi = "LD Test content $it FI",
                contentSv = "LD Test content $it SV",
                publishState = publishState,
                aineKoodiArvo = aineKoodiArvos[it % aineKoodiArvos.size]
            )

            instructionRepository.createInstruction(ldInstruction, emptyList())

            val puhviInstruction = PuhviInstructionDtoIn(
                nameFi = "PUHVI Test name $it FI",
                nameSv = "PUHVI Test name $it SV",
                contentFi = "PUHVI Test content $it FI",
                contentSv = "PUHVI Test content $it SV",
                shortDescriptionFi = "PUHVI Test short description $it FI",
                shortDescriptionSv = "PUHVI Test short description $it SV",
                publishState = publishState
            )

            instructionRepository.createInstruction(puhviInstruction, emptyList())
        }
    }

    fun seedCertificates() {
        repeat(4) {
            val publishState = if (it % 2 == 0) PublishState.PUBLISHED else PublishState.DRAFT

            val sukoCertificateDtoIn = SukoCertificateDtoIn(
                exam = Exam.SUKO,
                nameFi = "SUKO Test Certificate $it",
                nameSv = "",
                descriptionFi = "SUKO Test Certificate Description $it",
                descriptionSv = "",
                publishState = publishState,
            )

            val multipartFile = readAttachmentFixtureFile("fixture1.pdf")
            certificateRepository.createSukoCertificate(multipartFile, sukoCertificateDtoIn)

            val ldCertificateDtoIn = LdCertificateDtoIn(
                exam = Exam.LD,
                nameFi = "LD Test Certificate $it FI",
                nameSv = "LD Test Certificate $it SV",
                publishState = publishState,
                aineKoodiArvo = "1"
            )

            certificateRepository.createLdCertificate(multipartFile, multipartFile, ldCertificateDtoIn)

            val puhviCertificateDtoIn = PuhviCertificateDtoIn(
                exam = Exam.PUHVI,
                nameFi = "PUHVI Test Certificate $it FI",
                nameSv = "PUHVI Test Certificate $it Sv",
                descriptionFi = "PUHVI Test Certificate Description $it FI",
                descriptionSv = "PUHVI Test Certificate Description $it SV",
                publishState = publishState,
            )

            certificateRepository.createPuhviCertificate(multipartFile, multipartFile, puhviCertificateDtoIn)
        }
    }

    fun nukeAssignments() {
        jdbcTemplate.execute("TRUNCATE TABLE assignment CASCADE")
    }

    fun nukeInstructions() {
        jdbcTemplate.execute("TRUNCATE TABLE instruction CASCADE")
    }

    fun nukeCertificates() {
        jdbcTemplate.execute("TRUNCATE TABLE certificate CASCADE")
    }
}
