package fi.oph.ludos.image

import com.fasterxml.jackson.module.kotlin.jacksonObjectMapper
import fi.oph.ludos.Constants
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc
import org.springframework.http.HttpMethod
import org.springframework.mock.web.MockMultipartFile
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders

@AutoConfigureMockMvc
abstract class ImageRequests {
    @Autowired
    lateinit var mockMvc: MockMvc
    val mapper = jacksonObjectMapper()

    fun postImage(file: MockMultipartFile): MockHttpServletRequestBuilder {
        val reqBuilder =
            MockMvcRequestBuilders.multipart(HttpMethod.POST, "${Constants.API_PREFIX}/image")
        reqBuilder.file(file)

        return reqBuilder
    }

    fun getImage(url: String): MockHttpServletRequestBuilder {
        return MockMvcRequestBuilders.get(url)
    }
}