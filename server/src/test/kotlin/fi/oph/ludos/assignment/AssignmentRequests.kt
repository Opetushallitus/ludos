package fi.oph.ludos.assignment

import fi.oph.ludos.Constants
import fi.oph.ludos.Exam
import org.springframework.http.MediaType
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders
import org.springframework.web.util.UriComponentsBuilder

fun postAssignment(body: String) =
    MockMvcRequestBuilders.post("${Constants.API_PREFIX}/assignment").contentType(MediaType.APPLICATION_JSON)
        .content(body)

fun getAssignmentsWithAnyFilter(exam: Exam, str: String) =
    MockMvcRequestBuilders.get("${Constants.API_PREFIX}/assignment/$exam$str").contentType(MediaType.APPLICATION_JSON)

fun getAssignment(exam: Exam, id: Int) =
    MockMvcRequestBuilders.get("${Constants.API_PREFIX}/assignment/$exam/$id").contentType(MediaType.APPLICATION_JSON)

fun updateAssignment(id: Int, body: String) =
    MockMvcRequestBuilders.put("${Constants.API_PREFIX}/assignment/$id").contentType(MediaType.APPLICATION_JSON)
        .content(body)

fun getAllAssignments(exam: Exam) =
    MockMvcRequestBuilders.get("${Constants.API_PREFIX}/assignment/$exam").contentType(MediaType.APPLICATION_JSON)

fun getSukoAssignments(exam: Exam, filter: SukoBaseFilters): MockHttpServletRequestBuilder {
    val uriBuilder = UriComponentsBuilder.fromPath("${Constants.API_PREFIX}/assignment/$exam")

    filter.orderDirection?.let { uriBuilder.queryParam("orderDirection", it) }
    filter.oppimaara?.let { uriBuilder.queryParam("oppimaara", it) }
    filter.tehtavatyyppisuko?.let { uriBuilder.queryParam("tehtavatyyppisuko", it) }
    filter.aihe?.let { uriBuilder.queryParam("aihe", it) }
    filter.tavoitetaitotaso?.let { uriBuilder.queryParam("tavoitetaitotaso", it) }

    return MockMvcRequestBuilders.get(uriBuilder.toUriString()).contentType(MediaType.APPLICATION_JSON)
}

fun getPuhviAssignments(exam: Exam, filter: PuhviBaseFilters): MockHttpServletRequestBuilder {
    val uriBuilder = UriComponentsBuilder.fromPath("${Constants.API_PREFIX}/assignment/$exam")

    filter.orderDirection?.let { uriBuilder.queryParam("orderDirection", it) }
    filter.tehtavatyyppipuhvi?.let { uriBuilder.queryParam("tehtavatyyppipuhvi", it) }
    filter.lukuvuosi?.let { uriBuilder.queryParam("lukuvuosi", it) }

    return MockMvcRequestBuilders.get(uriBuilder.toUriString()).contentType(MediaType.APPLICATION_JSON)
}

fun getLdAssignments(exam: Exam, filter: LdBaseFilters): MockHttpServletRequestBuilder {
    val uriBuilder = UriComponentsBuilder.fromPath("${Constants.API_PREFIX}/assignment/$exam")

    filter.orderDirection?.let { uriBuilder.queryParam("orderDirection", it) }
    filter.aine?.let { uriBuilder.queryParam("aine", it) }
    filter.lukuvuosi?.let { uriBuilder.queryParam("lukuvuosi", it) }

    return MockMvcRequestBuilders.get(uriBuilder.toUriString()).contentType(MediaType.APPLICATION_JSON)
}
