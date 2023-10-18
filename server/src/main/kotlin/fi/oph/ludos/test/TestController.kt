package fi.oph.ludos.test

import fi.oph.ludos.Constants
import fi.oph.ludos.LudosApplication
import fi.oph.ludos.assignment.Assignment
import fi.oph.ludos.assignment.AssignmentService
import fi.oph.ludos.auth.*
import jakarta.annotation.PostConstruct
import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import jakarta.validation.Valid
import org.slf4j.Logger
import org.slf4j.LoggerFactory
import org.springframework.boot.SpringApplication
import org.springframework.context.ApplicationContext
import org.springframework.context.annotation.Profile
import org.springframework.core.env.Environment
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.jdbc.core.JdbcTemplate
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.security.web.context.HttpSessionSecurityContextRepository
import org.springframework.web.bind.annotation.*
import java.net.URI
import java.sql.Timestamp
import kotlin.system.exitProcess

@RestController
@RequestMapping("${Constants.API_PREFIX}/test")
@Profile("local", "untuva")
@RequireAtLeastYllapitajaRole
class TestController(
    val seedDataRepository: SeedDataRepository,
    val assignmentService: AssignmentService,
    private val environment: Environment,
    private val applicationContext: ApplicationContext,
    private val jdbcTemplate: JdbcTemplate,
) {
    private val logger: Logger = LoggerFactory.getLogger(javaClass)
    private val securityContextRepository = HttpSessionSecurityContextRepository()

    companion object {
        fun isEnabled(): Boolean {
            val testControllerProfileAnnotation: Profile =
                TestController::class.annotations.find { it.annotationClass == Profile::class } as Profile?
                    ?: throw AssertionError("@Profile annotation missing from TestController")
            val activeProfiles = LudosApplication.activeProfiles().toSet()
            val testControllerEnabledForProfiles = testControllerProfileAnnotation.value.toSet()
            return testControllerEnabledForProfiles.intersect(activeProfiles).isNotEmpty()
        }
    }

    private val redirectToRoot: ResponseEntity<Unit> =
        ResponseEntity.status(HttpStatus.FOUND).location(URI.create("/")).build()

    @PostConstruct
    fun init() {
        if (environment.activeProfiles.any { it == "qa" || it.lowercase().contains("prod") }) {
            logger.error("Fatal error: TestController loaded in a prod-like environment")
            exitProcess(SpringApplication.exit(applicationContext))
        }
    }

    // this endpoint is used by playwright
    @GetMapping("/seed")
    @RequireAtLeastYllapitajaRole
    fun seedDatabase(httpServletResponse: HttpServletResponse): ResponseEntity<Unit> {
        seedDataRepository.seedDatabase()
        return redirectToRoot
    }

    @GetMapping("/seedAssignments")
    @RequireAtLeastYllapitajaRole
    fun seedDatabaseWithAssignments(httpServletResponse: HttpServletResponse): ResponseEntity<Unit> {
        seedDataRepository.seedAssignments()
        return redirectToRoot
    }

    @GetMapping("/seedAssignmentsForFilterTest")
    @RequireAtLeastYllapitajaRole
    fun seedDatabaseWithAssignmentsForFilterTest(httpServletResponse: HttpServletResponse): ResponseEntity<Unit> {
        val assignments = AssignmentFiltersTestData.assignmentsForFilterTest()
        assignments.forEach { assignmentService.createAssignment(it) }
        return redirectToRoot
    }

    // this endpoint is used by api tests
    @PostMapping("/seedAssignments")
    @RequireAtLeastYllapitajaRole
    fun seedDatabaseWithCustomAssignments(@RequestBody assignments: Array<Assignment>) = try {
        assignments.forEach { assignmentService.createAssignment(it) }
        ResponseEntity.status(HttpStatus.OK).body("OK")
    } catch (e: Exception) {
        ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Something went wrong ${e.message}")
    }

    @GetMapping("/seedInstructions")
    @RequireAtLeastYllapitajaRole
    fun seedDatabaseWithInstructions(httpServletResponse: HttpServletResponse): ResponseEntity<Unit> {
        seedDataRepository.seedInstructions()
        return redirectToRoot
    }

    @GetMapping("/seedCertificates")
    @RequireAtLeastYllapitajaRole
    fun seedDatabaseWithCertificates(httpServletResponse: HttpServletResponse): ResponseEntity<Unit> {
        seedDataRepository.seedCertificates()
        return redirectToRoot
    }

    @GetMapping("/empty")
    @RequireAtLeastYllapitajaRole
    fun emptyDatabase(httpServletResponse: HttpServletResponse): ResponseEntity<Unit> {
        seedDataRepository.nukeAssignments()
        seedDataRepository.nukeCertificates()
        seedDataRepository.nukeInstructions()

        return redirectToRoot
    }

    @GetMapping("/now")
    @RequireAtLeastOpettajaRole
    fun now(httpServletResponse: HttpServletResponse): Timestamp =
        jdbcTemplate.query("SELECT clock_timestamp()") { rs, _ -> rs.getTimestamp("clock_timestamp") }[0]

    @GetMapping("/mocklogin/{role}")
    @PreAuthorize("permitAll()")
    fun mockLogin(
        @Valid @PathVariable("role") role: Role,
        request: HttpServletRequest,
        response: HttpServletResponse
    ): ResponseEntity<Unit> {
        val userDetails = Kayttajatiedot(
            "1.2.246.562.24.10000000001",
            "ValeKayttaja",
            "VIRKAILIJA",
            listOf(Organisaatio("123", listOf(Kayttooikeus.ludosOikeus(role.oikeus)))),
            "Vale",
            "Käyttäjä",
            null
        )
        val authentication = UsernamePasswordAuthenticationToken(userDetails, null, userDetails.authorities)

        SecurityContextHolder.getContext().authentication = authentication
        securityContextRepository.saveContext(SecurityContextHolder.getContext(), request, response)
        return redirectToRoot
    }

    @GetMapping("/testOpettajaRequired")
    @RequireAtLeastOpettajaRole
    fun testOpettajaRequired(): ResponseEntity<Unit> {
        return ResponseEntity.status(HttpStatus.OK).body(Unit)
    }

    @GetMapping("/testLaatijaRequired")
    @RequireAtLeastLaatijaRole
    fun testLaatijaRequired(): ResponseEntity<Unit> {
        return ResponseEntity.status(HttpStatus.OK).body(Unit)
    }

    @GetMapping("/testYllapitajaRequired")
    @RequireAtLeastYllapitajaRole
    fun testYllapitajaRequired(): ResponseEntity<Unit> {
        return ResponseEntity.status(HttpStatus.OK).body(Unit)
    }

    @GetMapping("/testYllapitajaRequiredByDefault")
    fun testYllapitajaRequiredByDefault(): ResponseEntity<Unit> {
        return ResponseEntity.status(HttpStatus.OK).body(Unit)
    }
}