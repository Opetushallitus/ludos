package fi.oph.ludos

import com.fasterxml.jackson.module.kotlin.jacksonObjectMapper
import fi.oph.ludos.assignment.Assignment
import org.springframework.http.MediaType
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.status

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

fun seedDbWithAssignments(mockMvc: MockMvc) {
    val req = MockMvcRequestBuilders.get("${Constants.API_PREFIX}/test/seedAssignments").with(yllapitajaUser)
    mockMvc.perform(req).andExpect(status().isFound)
}

fun seedDbWithInstructions(mockMvc: MockMvc) {
    val req = MockMvcRequestBuilders.get("${Constants.API_PREFIX}/test/seedInstructions").with(yllapitajaUser)
    mockMvc.perform(req).andExpect(status().isFound)
}

fun seedDbWithCertificates(mockMvc: MockMvc) {
    val req = MockMvcRequestBuilders.get("${Constants.API_PREFIX}/test/seedCertificates").with(yllapitajaUser)
    mockMvc.perform(req).andExpect(status().isFound)
}

fun emptyDb(mockMvc: MockMvc) {
    val req = MockMvcRequestBuilders.get("${Constants.API_PREFIX}/test/empty").with(yllapitajaUser)
    mockMvc.perform(req).andExpect(status().isFound)
}
