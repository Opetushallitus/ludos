package fi.oph.ludos.test

import com.fasterxml.jackson.module.kotlin.jacksonObjectMapper
import com.fasterxml.jackson.module.kotlin.readValue
import fi.oph.ludos.Constants
import fi.oph.ludos.assignment.Assignment
import fi.oph.ludos.assignment.AssignmentService
import org.springframework.beans.factory.annotation.Value
import org.springframework.context.annotation.Profile
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import javax.servlet.http.HttpServletResponse

@RestController
@RequestMapping("${Constants.API_PREFIX}/test")
@Profile("local", "local-untuvacas", "untuva")
class TestController(
    val seedAssignmentRepository: SeedAssignmentRepository,
    val assignmentService: AssignmentService,
    @Value("\${ludos.appUrl}") private val appUrl: String,
) {
    val objectMapper = jacksonObjectMapper()

    // this endpoint is used by playwright
    @GetMapping("/seed")
    fun seedDatabase(httpServletResponse: HttpServletResponse) {
        seedAssignmentRepository.seedDatabase()


        return httpServletResponse.sendRedirect(appUrl)
    }

    // this endpoint is used by api tests
    @PostMapping("/seed")
    fun seedDatabasePost(@RequestBody body: Any) = try {
        val arr: Array<Assignment> = objectMapper.readValue(body.toString())

        arr.forEach { assignmentService.createAssignment(it) }
        ResponseEntity.status(HttpStatus.OK).body("OK")
    } catch (e: Exception) {
        ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Something went wrong ${e.message}")
    }


    @GetMapping("/empty")
    fun emptyDatabase(httpServletResponse: HttpServletResponse) {
        seedAssignmentRepository.nukeAssignments()

        return httpServletResponse.sendRedirect(appUrl)
    }
}