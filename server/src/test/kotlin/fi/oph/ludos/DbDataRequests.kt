package fi.oph.ludos

import com.fasterxml.jackson.module.kotlin.jacksonObjectMapper
import fi.oph.ludos.assignment.Assignment
import org.springframework.http.MediaType
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders

val mapper = jacksonObjectMapper()

fun seedDbWithCustomAssignmentsRequest(data: String): MockHttpServletRequestBuilder =
    MockMvcRequestBuilders.post("${Constants.API_PREFIX}/test/seedAssignments").contentType(MediaType.APPLICATION_JSON)
        .content(data)

fun seedDbWithCustomAssignments(mockMvc: MockMvc, assignments: List<Assignment>) {
    val result = mockMvc.perform(
        seedDbWithCustomAssignmentsRequest(mapper.writeValueAsString(assignments)).with(
            yllapitajaUser
        )
    ).andReturn()

    if (result.response.status != 200) {
        throw RuntimeException("Error seeding data, response status ${result.response.status}: ${result.response.contentAsString}")
    }
}

fun seedDb(): MockHttpServletRequestBuilder =
    MockMvcRequestBuilders.get("${Constants.API_PREFIX}/test/seed").contentType(MediaType.APPLICATION_JSON)

fun seedDbWithAssignments(): MockHttpServletRequestBuilder =
    MockMvcRequestBuilders.get("${Constants.API_PREFIX}/test/seedAssignments").contentType(MediaType.APPLICATION_JSON)

fun seedDbWithInstructions(): MockHttpServletRequestBuilder =
    MockMvcRequestBuilders.get("${Constants.API_PREFIX}/test/seedInstructions").contentType(MediaType.APPLICATION_JSON)

fun seedDbWithCertificates(): MockHttpServletRequestBuilder =
    MockMvcRequestBuilders.get("${Constants.API_PREFIX}/test/seedCertificates").contentType(MediaType.APPLICATION_JSON)

fun emptyDbRequest() =
    MockMvcRequestBuilders.get("${Constants.API_PREFIX}/test/empty").contentType(MediaType.APPLICATION_JSON)
