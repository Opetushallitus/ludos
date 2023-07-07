package fi.oph.ludos.test

import fi.oph.ludos.Constants
import fi.oph.ludos.LudosApplication
import fi.oph.ludos.assignment.Assignment
import fi.oph.ludos.assignment.AssignmentService
import fi.oph.ludos.auth.Kayttajatiedot
import fi.oph.ludos.auth.Kayttooikeus
import fi.oph.ludos.auth.Organisaatio
import fi.oph.ludos.auth.Role
import org.slf4j.Logger
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Value
import org.springframework.boot.SpringApplication
import org.springframework.context.ApplicationContext
import org.springframework.context.annotation.Profile
import org.springframework.core.env.Environment
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.web.bind.annotation.*
import java.net.URI
import javax.annotation.PostConstruct
import javax.servlet.http.HttpServletResponse
import javax.swing.Spring
import javax.validation.Valid
import kotlin.system.exitProcess

@RestController
@RequestMapping("${Constants.API_PREFIX}/test")
@Profile("local", "local-untuvacas", "untuva")
class TestController(
    val seedAssignmentRepository: SeedAssignmentRepository,
    val assignmentService: AssignmentService,
    @Value("\${ludos.appUrl}") private val appUrl: String,
    private val environment: Environment,
    private val applicationContext: ApplicationContext
) {
    private val logger: Logger = LoggerFactory.getLogger(javaClass)

    companion object {
        fun isEnabled(): Boolean {
            val testControllerProfileAnnotation: Profile = TestController::class.annotations.find { it.annotationClass == Profile::class } as Profile?
                ?: throw AssertionError("@Profile annotation missing from TestController")
            val activeProfiles = LudosApplication.activeProfiles().toSet()
            val testControllerEnabledForProfiles = testControllerProfileAnnotation.value.toSet()
            return testControllerEnabledForProfiles.intersect(activeProfiles).isNotEmpty()
        }
    }

    @PostConstruct
    fun init() {
        if (environment.activeProfiles.any { it == "qa" || it.lowercase().contains("prod") }) {
            logger.error("Fatal error: TestController loaded in a prod-like environment")
            exitProcess(SpringApplication.exit(applicationContext))
        }
    }

    // this endpoint is used by playwright
    @GetMapping("/seed")
    fun seedDatabase(httpServletResponse: HttpServletResponse) {
        seedAssignmentRepository.seedDatabase()

        return httpServletResponse.sendRedirect(appUrl)
    }

    // this endpoint is used by api tests
    @PostMapping("/seed")
    fun seedDatabasePost(@RequestBody assignments: Array<Assignment>) = try {
        assignments.forEach { assignmentService.createAssignment(it) }
        ResponseEntity.status(HttpStatus.OK).body("OK")
    } catch (e: Exception) {
        ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Something went wrong ${e.message}")
    }

    @GetMapping("/empty")
    fun emptyDatabase(httpServletResponse: HttpServletResponse) {
        seedAssignmentRepository.nukeAssignments()

        return httpServletResponse.sendRedirect(appUrl)
    }

    @GetMapping("/mocklogin/{role}")
    fun mockLogin(@Valid @PathVariable("role") role: Role): ResponseEntity<Unit> {
        val userDetails = Kayttajatiedot(
            "1.2.246.562.24.10000000001",
            "ValeKayttaja",
            "VIRKAILIJA",
            listOf(Organisaatio("123", listOf(Kayttooikeus("LUDOS", role.oikeus)))),
            "Vale",
            "Käyttäjä",
            null
        )
        val authentication = UsernamePasswordAuthenticationToken(userDetails, null, userDetails.authorities)
        SecurityContextHolder.getContext().authentication = authentication
        return ResponseEntity.status(HttpStatus.FOUND).location(URI.create("/")).build()
    }
}