package fi.oph.ludos

import org.springframework.http.MediaType
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders

fun seedDbWithCustomAssignments(data: String): MockHttpServletRequestBuilder =
    MockMvcRequestBuilders.post("${Constants.API_PREFIX}/test/seed").contentType(MediaType.APPLICATION_JSON)
        .content(data)

fun seedDb(): MockHttpServletRequestBuilder =
    MockMvcRequestBuilders.get("${Constants.API_PREFIX}/test/seed").contentType(MediaType.APPLICATION_JSON)

fun seedDbWithAssignments(): MockHttpServletRequestBuilder =
    MockMvcRequestBuilders.get("${Constants.API_PREFIX}/test/seedAssignments").contentType(MediaType.APPLICATION_JSON)

fun seedDbWithInstructions(): MockHttpServletRequestBuilder =
    MockMvcRequestBuilders.get("${Constants.API_PREFIX}/test/seedInstructions").contentType(MediaType.APPLICATION_JSON)

fun seedDbWithCertificates(): MockHttpServletRequestBuilder =
    MockMvcRequestBuilders.get("${Constants.API_PREFIX}/test/seedCertificates").contentType(MediaType.APPLICATION_JSON)

fun emptyDb() = MockMvcRequestBuilders.get("${Constants.API_PREFIX}/test/empty").contentType(MediaType.APPLICATION_JSON)
