package fi.oph.ludos.test

import fi.oph.ludos.Exam
import fi.oph.ludos.Language
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

fun complexAssignmentContent(title: String) = """
    <h1 class="tiptap-text-h1">$title</h1>
    <h2 class="tiptap-text-h2">Vain hölmö ostaa lapselle älypuhelimen</h2>
    <p>Yli puolella esikouluikäisistä on jo nykyisin oma 
        <a target="_blank" rel="noopener noreferrer nofollow" class="tiptap-link" href="https://oph.fi">
            <strong> kännykkä</strong>
        </a>, koulunaloittajista lähes kaikilla.
    </p>
    <p></p>
    <p>
        <a target="_blank" rel="noopener noreferrer nofollow" class="tiptap-link" href="https://oph.fi">
            Puhelinkauppiaat
        </a> kertovat, että nykyään hankitaan pienemmillekin lapsille yhä monipuolisempia puhelimia, kuten älykännyköitä. 
        Nämä älypuhelimet antavat lapsille nopean, helpon ja valvomattoman pääsyn <em>Internetiin</em>. 
        Tämä onkin aiheuttanut paljon ongelmia, ja palvelulinjoille tulee yhä useammin soittoja lapsilta, jotka ovat järkyttyneet törmättyään netissä vaikeisiin, ahdistaviin tai pelottaviin asioihin.
    </p>
    <p></p>
    <blockquote class="tiptap-blockquote">
        <p>
            Hyvä suositus on, että ostaa lapselle tai nuorelle älykännykän vasta siinä vaiheessa, kun pystyy luottamaan siihen, 
            että hän osaa käsitellä verkosta löytämäänsä tietoa.
        </p>
    </blockquote>
    <p></p>
    <p>Kysymyksiä:</p>
    <ul class="tiptap-bullet-list">
        <li>
            <p>Milloin sait ensimmäisen kännykkäsi? Minkälainen se oli?</p>
        </li>
        <li>
            <p>Onko sinulla älypuhelinta? Jos on, <strong><em>miksi</em></strong> olet ostanut sellaisen?</p>
        </li>
        <li>
            <p>Miten käytät puhelintasi?</p>
            <ul class="tiptap-bullet-list">
                <li><p>sormilla?</p></li>
                <li><p>suulla?</p></li>
                <li>
                    <p>valitse yksi:</p>
                    <ol class="tiptap-numbered-list">
                        <li><p>etusormi</p></li>
                        <li><p>keskisormi</p></li>
                    </ol>
                </li>
            </ul>
        </li>
        <li>
            <p>Kuinka suuri on puhelinlaskusi ja kuka 
                <a target="_blank" rel="noopener noreferrer nofollow" class="tiptap-link" href="https://oph.fi">
                    <em>maksaa</em>
                </a> sen?
            </p>
        </li>
        <li>
            <p>Milloin lapselle pitäisi sinun mielestäsi ostaa oma puhelin?</p>
        </li>
        <li>
            <p>Mitä huonoja puolia on siinä, että pienellä lapsella on oma puhelin?</p>
        </li>
    </ul>
    <p></p>
""".replace("\\s*\\n\\s*".toRegex(), "")

fun instructionContent(title: String) = """
    <h1 class="tiptap-text-h1">$title</h1>
    <h2 class="tiptap-text-h2">Ohjeet 2023</h2>
    <p></p>
    <p>Opetushallitus antaa erilliset ohjeet, jotka koskevat lukio-opintonsa aloittaneita opiskelijoita.</p>
    <p></p>
    <p>Lisätietoja ohjeesta saa tarvittaessa <a target="_blank" rel="noopener noreferrer nofollow" class="tiptap-link" href="https://oph.fi">Opetushallituksesta</a>.</p>
""".replace("\\s*\\n\\s*".toRegex(), "")

fun assignmentInstructionContent(title: String) = """
    <h4 class="tiptap-text-h1">$title</h1>
    <p>Ohje</p>
    <p></p>
    <ul class="tiptap-bullet-list">
           <li><p>abc</p></li>
            <li><p>abc</p></li>
    </ul>
""".replace("\\s*\\n\\s*".toRegex(), "")


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
        Oppimaara("VKENA1"),
        Oppimaara("VKA1", "RA"),
        Oppimaara("VKA1", "SA"),
        Oppimaara("VKA1")
    )
    val aiheKoodiArvos = arrayOf("001", "003", "013", "017", "005", "007")
    val lukuvuosiKoodiArvos = arrayOf(
        "20202021", "20222023", "20212022", "20242025", "20232024"
    )
    val aineKoodiArvos = arrayOf("1", "2", "3", "4", "5", "6", "7", "8", "9")
    val favoriteFolderIdIndices = arrayOf(
        // Viittaa createFavoriteFoldersin palauttaman folderId-arrayn indekseihin
        listOf(3),
        listOf(),
        listOf(),
        listOf(),
        listOf(2, 4),
        listOf(),
        listOf(),
        listOf(),
        listOf(0, 1, 2, 3, 4, 5),
        listOf(),
        listOf(),
        listOf(),
    )

    fun createFavoriteFolders(exam: Exam): IntArray {
        fun createFolder(name: String, parentId: Int) =
            assignmentRepository.createNewFavoriteFolder(exam, FavoriteFolderDtoIn(name, parentId))

        val kansio1 = createFolder("Kansio 1", ROOT_FOLDER_ID)
        val kansion1Alikansio1 = createFolder("Kansion 1 alikansio 1", kansio1)
        val kansion1Alikansio2 = createFolder("Kansion 1 alikansio 2", kansio1)
        val kansion1Alikansion2Alikansio1 = createFolder("Kansion 1 alikansion 2 alikansio 1", kansion1Alikansio2)
        val kansio2 = createFolder("Kansio 2", ROOT_FOLDER_ID)

        return intArrayOf(
            ROOT_FOLDER_ID,
            kansio1,
            kansion1Alikansio1,
            kansion1Alikansio2,
            kansion1Alikansion2Alikansio1,
            kansio2
        )
    }

    fun seedAssignments() {
        val folderIdsByExam = Exam.entries.associateWith { createFavoriteFolders(it) }
        fun addAssignmentToFavoriteFolders(exam: Exam, assignmentId: Int, index: Int) {
            val favoriteFolderIds = folderIdsByExam[exam]!!
                .slice(favoriteFolderIdIndices[index % favoriteFolderIdIndices.size])
            assignmentRepository.setAssignmentFavoriteFolders(exam, assignmentId, favoriteFolderIds)
        }

        repeat(24) {
            val publishState = if (it > 3) PublishState.PUBLISHED else PublishState.DRAFT

            val laajaalainenOsaaminenVarying =
                List(if (it % 2 == 0) 2 else if (it % 5 == 0) 3 else 0) { index -> laajaalainenOsaaminenKoodiArvos[(index + it) % laajaalainenOsaaminenKoodiArvos.size] }
            val lukuvuosiVarying =
                List(if (it % 2 == 0) 1 else 2) { index -> lukuvuosiKoodiArvos[(index + it) % lukuvuosiKoodiArvos.size] }

            val sukoAssignmentIn = SukoAssignmentDtoIn(
                nameFi = "Test name $it FI SUKO",
                nameSv = "",
                instructionFi = assignmentInstructionContent("Test Instruction $it FI SUKO"),
                instructionSv = "",
                contentFi = listOf(complexAssignmentContent("Test content $it FI SUKO")),
                contentSv = listOf(),
                publishState = publishState,
                laajaalainenOsaaminenKoodiArvos = laajaalainenOsaaminenVarying,
                assignmentTypeKoodiArvo = sukoAssignmentTypeKoodiArvos[it % sukoAssignmentTypeKoodiArvos.size],
                oppimaara = oppimaaras[it % oppimaaras.size],
                tavoitetasoKoodiArvo = taitotasoKoodiArvos[it % taitotasoKoodiArvos.size],
                aiheKoodiArvos = List(if (it % 2 == 0) 1 else 2) { index -> aiheKoodiArvos[(index + it) % aiheKoodiArvos.size] },
            )
            val sukoAssignmentOut = assignmentRepository.saveSukoAssignment(sukoAssignmentIn)
            addAssignmentToFavoriteFolders(Exam.SUKO, sukoAssignmentOut.id, it)

            val ldAssignmentIn = LdAssignmentDtoIn(
                nameFi = "Test name $it FI LD",
                nameSv = "Test name $it SV LD",
                instructionFi = assignmentInstructionContent("Test Instruction $it FI LD"),
                instructionSv = assignmentInstructionContent("Test Instruction $it SV LD"),
                contentFi = (1..5).map { i -> complexAssignmentContent("Test content $it FI LD part $i") },
                contentSv = (1..5).map { i -> complexAssignmentContent("Test content $it SV LD part $i") },
                publishState = publishState,
                laajaalainenOsaaminenKoodiArvos = laajaalainenOsaaminenVarying,
                lukuvuosiKoodiArvos = lukuvuosiVarying,
                aineKoodiArvo = aineKoodiArvos[it % aineKoodiArvos.size]
            )
            val ldAssignmentOut = assignmentRepository.saveLdAssignment(ldAssignmentIn)
            addAssignmentToFavoriteFolders(Exam.LD, ldAssignmentOut.id, it)

            val puhviAssignmentIn = PuhviAssignmentDtoIn(
                nameFi = "Test name $it FI PUHVI",
                nameSv = "Test name $it SV PUHVI",
                instructionFi = assignmentInstructionContent("Test Instruction $it FI PUHVI"),
                instructionSv = assignmentInstructionContent("Test Instruction $it SV PUHVI"),
                contentFi = listOf(complexAssignmentContent("Test content $it FI PUHVI")),
                contentSv = listOf(complexAssignmentContent("Test content $it SV PUHVI")),
                publishState = publishState,
                laajaalainenOsaaminenKoodiArvos = laajaalainenOsaaminenVarying,
                assignmentTypeKoodiArvo = puhviAssignmentTypeKoodiArvos[it % puhviAssignmentTypeKoodiArvos.size],
                lukuvuosiKoodiArvos = lukuvuosiVarying,
            )
            val puhviAssignmentOut = assignmentRepository.savePuhviAssignment(puhviAssignmentIn)
            addAssignmentToFavoriteFolders(Exam.PUHVI, puhviAssignmentOut.id, it)
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
                InstructionAttachmentMetadataDtoIn(null, "Fixture1 pdf", Language.FI, 1)
            ),
            InstructionAttachmentIn(
                readAttachmentFixtureFile("fixture2.pdf"),
                InstructionAttachmentMetadataDtoIn(null, "Fixture2 pdf", Language.SV, 1)
            ),
            InstructionAttachmentIn(
                readAttachmentFixtureFile("fixture3.pdf"),
                InstructionAttachmentMetadataDtoIn(null, "Fixture3 pdf", Language.FI, 1)
            ),
        )

        repeat(12) {
            val publishState = if (it > 3) PublishState.PUBLISHED else PublishState.DRAFT

            val sukoInstruction = SukoInstructionDtoIn(
                nameFi = "Test name $it FI",
                nameSv = "Test name $it SV",
                contentFi = instructionContent("${Exam.SUKO} Test content $it FI"),
                contentSv = instructionContent("${Exam.SUKO} Test content $it SV"),
                shortDescriptionFi = "Test short description $it FI",
                shortDescriptionSv = "Test short description $it SV",
                publishState = publishState,
            )

            instructionRepository.createInstruction(sukoInstruction, if (it == 0) attachments else emptyList())


            val ldInstruction = LdInstructionDtoIn(
                nameFi = "LD Test name $it FI",
                nameSv = "LD Test name $it SV",
                contentFi = instructionContent("${Exam.LD} Test content $it FI"),
                contentSv = instructionContent("${Exam.LD} Test content $it SV"),
                publishState = publishState,
                aineKoodiArvo = aineKoodiArvos[it % aineKoodiArvos.size]
            )

            instructionRepository.createInstruction(ldInstruction, emptyList())

            val puhviInstruction = PuhviInstructionDtoIn(
                nameFi = "PUHVI Test name $it FI",
                nameSv = "PUHVI Test name $it SV",
                contentFi = instructionContent("${Exam.PUHVI} Test content $it FI"),
                contentSv = instructionContent("${Exam.PUHVI} Test content $it SV"),
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
        jdbcTemplate.execute("TRUNCATE TABLE assignment_favorite_folder CASCADE")
    }

    fun nukeInstructions() {
        jdbcTemplate.execute("TRUNCATE TABLE instruction CASCADE")
    }

    fun nukeCertificates() {
        jdbcTemplate.execute("TRUNCATE TABLE certificate CASCADE")
    }
}
