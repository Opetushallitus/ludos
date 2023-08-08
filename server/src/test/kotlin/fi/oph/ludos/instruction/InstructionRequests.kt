package fi.oph.ludos.instruction

import fi.oph.ludos.Constants
import fi.oph.ludos.Exam
import org.springframework.http.MediaType
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders


fun postInstruction(body: String) =
    MockMvcRequestBuilders.post("${Constants.API_PREFIX}/instruction").contentType(MediaType.APPLICATION_JSON)
        .content(body)

fun getInstructionById(exam: Exam, id: Int) =
    MockMvcRequestBuilders.get("${Constants.API_PREFIX}/instruction/$exam/$id").contentType(MediaType.APPLICATION_JSON)

fun updateInstruction(id: Int, body: String) =
    MockMvcRequestBuilders.put("${Constants.API_PREFIX}/instruction/$id").contentType(MediaType.APPLICATION_JSON)
        .content(body)
