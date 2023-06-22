package fi.oph.ludos.assignment

import fi.oph.ludos.Constants
import fi.oph.ludos.Exam
import fi.oph.ludos.PublishState
import org.springframework.http.MediaType
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders
import org.springframework.web.util.UriComponentsBuilder
import java.sql.Timestamp

data class TestSukoOut(
    val id: Int,
    val nameFi: String,
    val nameSv: String,
    val contentFi: String,
    val contentSv: String,
    val instructionFi: String,
    val instructionSv: String,
    val publishState: PublishState,
    val assignmentTypeKoodiArvo: String,
    val oppimaaraKoodiArvo: String,
    val tavoitetasoKoodiArvo: String,
    val aiheKoodiArvos: Array<String>,
    val laajaalainenOsaaminenKoodiArvos: Array<String>,
    val createdAt: Timestamp,
    val updatedAt: Timestamp
)

data class TestPuhviOut(
    val id: Int,
    val nameFi: String,
    val nameSv: String,
    val contentFi: String,
    val contentSv: String,
    val instructionFi: String,
    val instructionSv: String,
    val publishState: PublishState,
    val laajaalainenOsaaminenKoodiArvos: Array<String>,
    val assignmentTypeKoodiArvo: String,
    val lukuvuosiKoodiArvos: Array<String>,
    val createdAt: Timestamp,
    val updatedAt: Timestamp
)

data class TestLdOut(
    val id: Int,
    val nameFi: String,
    val nameSv: String,
    val contentFi: String,
    val contentSv: String,
    val instructionFi: String,
    val instructionSv: String,
    val publishState: PublishState,
    val createdAt: Timestamp,
    val updatedAt: Timestamp,
    val laajaalainenOsaaminenKoodiArvos: Array<String>,
    val lukuvuosiKoodiArvos: Array<String>,
    val aineKoodiArvo: String
)


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

fun getAllInstructions(exam: Exam) =
    MockMvcRequestBuilders.get("${Constants.API_PREFIX}/instructions/$exam").contentType(MediaType.APPLICATION_JSON)

// filter test utils
fun getSukoAssignments(exam: Exam, filter: SukoAssignmentFilter): MockHttpServletRequestBuilder {
    val uriBuilder = UriComponentsBuilder.fromPath("${Constants.API_PREFIX}/assignment/$exam")

    filter.orderDirection?.let { uriBuilder.queryParam("orderDirection", it) }
    filter.oppimaara?.let { uriBuilder.queryParam("oppimaara", it) }
    filter.tehtavatyyppisuko?.let { uriBuilder.queryParam("tehtavatyyppisuko", it) }
    filter.aihe?.let { uriBuilder.queryParam("aihe", it) }
    filter.tavoitetaitotaso?.let { uriBuilder.queryParam("tavoitetaitotaso", it) }

    return MockMvcRequestBuilders.get(uriBuilder.toUriString()).contentType(MediaType.APPLICATION_JSON)
}

fun getPuhviAssignments(exam: Exam, filter: PuhviAssignmentFilter): MockHttpServletRequestBuilder {
    val uriBuilder = UriComponentsBuilder.fromPath("${Constants.API_PREFIX}/assignment/$exam")

    filter.orderDirection?.let { uriBuilder.queryParam("orderDirection", it) }
    filter.tehtavatyyppipuhvi?.let { uriBuilder.queryParam("tehtavatyyppipuhvi", it) }
    filter.lukuvuosi?.let { uriBuilder.queryParam("lukuvuosi", it) }

    return MockMvcRequestBuilders.get(uriBuilder.toUriString()).contentType(MediaType.APPLICATION_JSON)
}

fun getLdAssignments(exam: Exam, filter: LdAssignmentFilter): MockHttpServletRequestBuilder {
    val uriBuilder = UriComponentsBuilder.fromPath("${Constants.API_PREFIX}/assignment/$exam")

    filter.orderDirection?.let { uriBuilder.queryParam("orderDirection", it) }
    filter.aine?.let { uriBuilder.queryParam("aine", it) }
    filter.lukuvuosi?.let { uriBuilder.queryParam("lukuvuosi", it) }

    return MockMvcRequestBuilders.get(uriBuilder.toUriString()).contentType(MediaType.APPLICATION_JSON)
}

fun seedDb(data: String): MockHttpServletRequestBuilder =
    MockMvcRequestBuilders.post("${Constants.API_PREFIX}/test/seed").contentType(MediaType.APPLICATION_JSON)
        .content(data)

fun emptyDb() = MockMvcRequestBuilders.get("${Constants.API_PREFIX}/test/empty").contentType(MediaType.APPLICATION_JSON)
