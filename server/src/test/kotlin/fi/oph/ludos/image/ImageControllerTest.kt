package fi.oph.ludos.image

import com.fasterxml.jackson.module.kotlin.readValue
import fi.oph.ludos.WithOpettajaRole
import fi.oph.ludos.WithYllapitajaRole
import jakarta.transaction.Transactional
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.DynamicTest
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.TestFactory
import org.junit.jupiter.api.TestInstance
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.http.MediaType
import org.springframework.mock.web.MockMultipartFile
import org.springframework.test.context.TestPropertySource
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.status
import java.nio.file.Files
import java.nio.file.Path
import java.nio.file.Paths

@TestPropertySource(locations = ["classpath:application.properties"])
@SpringBootTest
@AutoConfigureMockMvc
@Transactional
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
class ImageControllerTest : ImageRequests() {
    val fileKeyRegex = "^image_[0-9a-fA-F]{8}-([0-9a-fA-F]{4}-){3}[0-9a-fA-F]{12}$".toRegex()

    private final val filePathToPdf: Path = Paths.get("src/main/resources/fixtures/fixture1.pdf")
    private final val filePathToPng: Path = Paths.get("src/main/resources/fixtures/test-image.png")

    private fun validateImageKey(fileKey: String) =
        assertTrue(fileKey.matches(fileKeyRegex), "Invalid fileKey: $fileKey")

    val supportedFiles = listOf(
        MockMultipartFile("file", "test-image.png", MediaType.IMAGE_PNG_VALUE, Files.readAllBytes(filePathToPng)),
        MockMultipartFile("file", "test-image.jpg", MediaType.IMAGE_PNG_VALUE, Files.readAllBytes(filePathToPng)),
        MockMultipartFile("file", "test-image.svg", MediaType.IMAGE_PNG_VALUE, Files.readAllBytes(filePathToPng)),
        MockMultipartFile("file", "test-image.gif", MediaType.IMAGE_PNG_VALUE, Files.readAllBytes(filePathToPng))
    )

    @TestFactory
    @WithYllapitajaRole
    fun postImageTest(): Collection<DynamicTest> = supportedFiles.map { file ->
        DynamicTest.dynamicTest("Testing upload for file: ${file.originalFilename}") {
            val uploadedImage = mockMvc.perform(postImage(file))
                .andExpect(status().isOk)
                .andReturn().response.contentAsString

            val imageDtoOut = mapper.readValue<ImageDtoOut>(uploadedImage)
            assertEquals(file.originalFilename, imageDtoOut.fileName)
            validateImageKey(imageDtoOut.url.removePrefix("/api/image/"))

            val imageBytes = mockMvc.perform(getImage(imageDtoOut.url))
                .andExpect(status().isOk)
                .andReturn().response.contentAsByteArray

            assertEquals(file.size.toInt(), imageBytes.size)
            assertThat(file.bytes).isEqualTo(imageBytes)
        }
    }

    @Test
    @WithOpettajaRole
    fun `get image with non-existing key`() {
        mockMvc.perform(getImage("/api/image/non-existing-key"))
            .andExpect(status().isNotFound)
    }

    val nonSupportedFiles = listOf(
        MockMultipartFile(
            "file",
            "fixture1.pdf",
            MediaType.APPLICATION_PDF_VALUE,
            Files.readAllBytes(filePathToPdf)
        ),
        MockMultipartFile(
            "file",
            "test.txt",
            MediaType.TEXT_PLAIN_VALUE,
            "Test content".toByteArray()
        ),
    )

    @TestFactory
    @WithYllapitajaRole
    fun `test upload with wrong mimeTypes`(): Collection<DynamicTest> = nonSupportedFiles.map { file ->
        DynamicTest.dynamicTest("Testing upload for file: ${file.originalFilename}") {
            mockMvc.perform(postImage(file)).andExpect(status().isBadRequest)
        }
    }
}